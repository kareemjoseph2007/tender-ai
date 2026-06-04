import { NextResponse } from "next/server";
import { callClaude } from "@/lib/claude/client";
import { requireProposalContext } from "@/lib/proposals/api-auth";
import { buildAnalysisUserMessage } from "@/lib/proposals/context";
import { parseTenderAnalysis } from "@/lib/proposals/parse-json";
import { ANALYSIS_SYSTEM_PROMPT } from "@/lib/proposals/prompts";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const { opportunityId } = (await request.json()) as {
      opportunityId?: string;
    };

    if (!opportunityId) {
      return NextResponse.json(
        { error: "opportunityId is required" },
        { status: 400 }
      );
    }

    const ctx = await requireProposalContext(opportunityId);
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: 401 });
    }

    const userMessage = buildAnalysisUserMessage(
      ctx.opportunity,
      ctx.profile,
      ctx.projects,
      ctx.teamMembers
    );

    const raw = await callClaude(ANALYSIS_SYSTEM_PROMPT, userMessage, 8192);
    const analysis = parseTenderAnalysis(raw);

    return NextResponse.json({
      analysis,
      profile: ctx.profile,
      projects: ctx.projects,
      teamMembers: ctx.teamMembers,
      opportunity: {
        id: ctx.opportunity.id,
        title: ctx.opportunity.title,
        buyer_name: ctx.opportunity.buyer_name,
      },
    });
  } catch (error) {
    console.error("Proposal analyze error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze tender",
      },
      { status: 500 }
    );
  }
}
