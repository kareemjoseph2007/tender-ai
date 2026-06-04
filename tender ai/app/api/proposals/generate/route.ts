import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude/client";
import { requireProposalContext } from "@/lib/proposals/api-auth";
import { buildGenerationUserMessage } from "@/lib/proposals/context";
import { upsertProposalDraft, updateProposalSection } from "@/lib/proposals/draft-store";
import {
  createEmptySections,
  normalizeRequiredSections,
} from "@/lib/proposals/sections";
import type { TenderAnalysis } from "@/lib/proposals/types";
import {
  GENERATION_SECTION_ORDER,
  type ProposalSectionKey,
} from "@/lib/proposals/types";
import {
  SECTION_INSTRUCTIONS,
  WRITER_SYSTEM_PROMPT,
} from "@/lib/proposals/prompts";
import type { PastProject, TeamMember } from "@/lib/types";

export const maxDuration = 300;

const PRICING_PLACEHOLDER =
  "[Complete your pricing here — this section cannot be generated automatically]";

interface GenerateBody {
  opportunityId: string;
  preGenerationAnswers: Record<string, string>;
  confirmedProjectIds: string[];
  confirmedTeamMemberIds: string[];
  analysis: TenderAnalysis;
}

function encodeEvent(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: Request) {
  let body: GenerateBody;

  try {
    body = (await request.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ctx = await requireProposalContext(body.opportunityId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }

  if (!body.confirmedProjectIds?.length) {
    return NextResponse.json(
      { error: "At least one past project must be confirmed" },
      { status: 400 }
    );
  }

  const confirmedProjects = ctx.projects.filter((p) =>
    body.confirmedProjectIds.includes(p.id)
  ) as PastProject[];

  const confirmedTeam = ctx.teamMembers.filter((m) =>
    body.confirmedTeamMemberIds.includes(m.id)
  ) as TeamMember[];

  const sectionsToGenerate = normalizeRequiredSections(
    body.analysis.required_sections
  ).filter((key) => GENERATION_SECTION_ORDER.includes(key));

  const orderedSections = GENERATION_SECTION_ORDER.filter((key) =>
    sectionsToGenerate.includes(key)
  );

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(encodeEvent(payload)));
      };

      try {
        const draft = await upsertProposalDraft(ctx.supabase, {
          userId: ctx.user.id,
          companyId: ctx.profile.id,
          opportunityId: body.opportunityId,
          savedOpportunityId: ctx.savedOpportunityId,
          preGenerationAnswers: body.preGenerationAnswers ?? {},
          confirmedProjects: body.confirmedProjectIds,
          confirmedTeamMembers: body.confirmedTeamMemberIds,
          sections: createEmptySections(),
        });

        send({ type: "started", draftId: draft.id });

        for (const sectionKey of orderedSections) {
          send({ type: "progress", section: sectionKey, status: "writing" });

          const now = new Date().toISOString();

          try {
            let content: string;
            let status: "draft" | "user_fill" = "draft";

            if (sectionKey === "pricing") {
              content = PRICING_PLACEHOLDER;
              status = "user_fill";
            } else {
              const instruction =
                SECTION_INSTRUCTIONS[sectionKey] ??
                `Write the ${sectionKey.replace(/_/g, " ")} section.`;

              const userMessage = buildGenerationUserMessage({
                opportunity: ctx.opportunity,
                profile: ctx.profile,
                projects: confirmedProjects,
                teamMembers: confirmedTeam,
                preGenerationAnswers: body.preGenerationAnswers ?? {},
                analysis: body.analysis,
                sectionInstruction: instruction,
                noTeamMembers:
                  sectionKey === "team_structure" && confirmedTeam.length === 0,
              });

              content = await callClaude(WRITER_SYSTEM_PROMPT, userMessage);
            }

            const section = {
              content,
              status,
              last_edited: now,
            };

            await updateProposalSection(
              ctx.supabase,
              draft.id,
              ctx.user.id,
              sectionKey as ProposalSectionKey,
              section
            );

            send({
              type: "section",
              section: sectionKey,
              content,
              status,
            });
          } catch (sectionError) {
            const message =
              sectionError instanceof Error
                ? sectionError.message
                : "Generation failed";

            const errorSection = {
              content: "",
              status: "error" as const,
              last_edited: now,
              error: message,
            };

            await updateProposalSection(
              ctx.supabase,
              draft.id,
              ctx.user.id,
              sectionKey as ProposalSectionKey,
              errorSection
            );

            send({
              type: "section_error",
              section: sectionKey,
              error: message,
            });
          }
        }

        send({ type: "done", draftId: draft.id });
      } catch (error) {
        send({
          type: "fatal",
          error:
            error instanceof Error ? error.message : "Proposal generation failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
