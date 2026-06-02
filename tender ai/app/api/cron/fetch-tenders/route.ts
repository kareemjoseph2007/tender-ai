import { NextRequest, NextResponse } from "next/server";
import { fetchTEDOpportunities } from "@/lib/sources/ted-europa";
import { fetchUKTenders } from "@/lib/sources/uk-find-a-tender";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [ted, uk] = await Promise.all([
    fetchTEDOpportunities(),
    fetchUKTenders(),
  ]);

  return NextResponse.json({ ted, uk });
}
