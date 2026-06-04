import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProposalSections } from "@/lib/proposals/types";
import { saveAllSections } from "@/lib/proposals/draft-store";

export async function POST(request: Request) {
  try {
    const { draftId, sections } = (await request.json()) as {
      draftId: string;
      sections: ProposalSections;
    };

    if (!draftId || !sections) {
      return NextResponse.json({ error: "Missing draftId or sections" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await saveAllSections(supabase, draftId, user.id, sections);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save draft",
      },
      { status: 500 }
    );
  }
}
