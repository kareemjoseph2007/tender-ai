import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude/client";
import { requireProposalContext } from "@/lib/proposals/api-auth";
import { buildGenerationUserMessage } from "@/lib/proposals/context";
import { updateProposalSection } from "@/lib/proposals/draft-store";
import type { TenderAnalysis } from "@/lib/proposals/types";
import type { ProposalSectionKey } from "@/lib/proposals/types";
import {
  SECTION_INSTRUCTIONS,
  WRITER_SYSTEM_PROMPT,
} from "@/lib/proposals/prompts";
import type { PastProject, TeamMember } from "@/lib/types";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      opportunityId: string;
      draftId: string;
      sectionKey: ProposalSectionKey;
      preGenerationAnswers: Record<string, string>;
      confirmedProjectIds: string[];
      confirmedTeamMemberIds: string[];
      analysis: TenderAnalysis;
    };

    if (body.sectionKey === "pricing") {
      return NextResponse.json(
        { error: "Pricing section cannot be rewritten by AI" },
        { status: 400 }
      );
    }

    const ctx = await requireProposalContext(body.opportunityId);
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const confirmedProjects = ctx.projects.filter((p) =>
      body.confirmedProjectIds.includes(p.id)
    ) as PastProject[];

    const confirmedTeam = ctx.teamMembers.filter((m) =>
      body.confirmedTeamMemberIds.includes(m.id)
    ) as TeamMember[];

    const instruction =
      SECTION_INSTRUCTIONS[body.sectionKey] ??
      `Rewrite the ${body.sectionKey.replace(/_/g, " ")} section.`;

    const userMessage = buildGenerationUserMessage({
      opportunity: ctx.opportunity,
      profile: ctx.profile,
      projects: confirmedProjects,
      teamMembers: confirmedTeam,
      preGenerationAnswers: body.preGenerationAnswers,
      analysis: body.analysis,
      sectionInstruction: instruction,
      noTeamMembers:
        body.sectionKey === "team_structure" && confirmedTeam.length === 0,
    });

    const content = await callClaude(WRITER_SYSTEM_PROMPT, userMessage);
    const now = new Date().toISOString();

    await updateProposalSection(
      ctx.supabase,
      body.draftId,
      ctx.user.id,
      body.sectionKey,
      { content, status: "draft", last_edited: now }
    );

    return NextResponse.json({ content, status: "draft", last_edited: now });
  } catch (error) {
    console.error("Rewrite section error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to rewrite section",
      },
      { status: 500 }
    );
  }
}
