import { Resend } from "resend";
import {
  formatBudgetRange,
  formatDeadlineCountdown,
  formatDeadlineDateLine,
  getRawTextPreview,
} from "@/lib/opportunities/format";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AlertUser, SendAlertResult } from "@/lib/alerts/types";
import type { Opportunity } from "@/lib/sources/types";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function getRawTextExcerpt(rawText: string | null, limit = 300): string {
  const preview = getRawTextPreview(rawText, limit);
  return preview.replace(/…$/, "").trim() || "No description available.";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildAlertEmailHtml(
  opportunity: Opportunity,
  opportunityUrl: string
): string {
  const title = escapeHtml(opportunity.title ?? "Untitled tender");
  const buyer = escapeHtml(opportunity.buyer_name ?? "Unknown buyer");
  const country = escapeHtml(opportunity.country ?? "Unknown");
  const score = opportunity.match_score ?? 0;
  const budget = escapeHtml(
    formatBudgetRange(opportunity.budget_min, opportunity.budget_max)
  );
  const deadlineCountdown = formatDeadlineCountdown(opportunity.deadline);
  const deadlineDate = formatDeadlineDateLine(opportunity.deadline);
  const deadline = escapeHtml(
    deadlineDate ? `${deadlineCountdown} (${deadlineDate})` : deadlineCountdown
  );
  const excerpt = escapeHtml(getRawTextExcerpt(opportunity.raw_text));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New tender match</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;">
              <div style="display:inline-flex;align-items:center;gap:8px;">
                <div style="width:32px;height:32px;border-radius:8px;background:#4f46e5;color:#fff;font-size:14px;font-weight:700;line-height:32px;text-align:center;">T</div>
                <span style="font-size:16px;font-weight:600;color:#0f172a;">TenderAI</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 28px 20px;">
              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#0f172a;">We found a strong match for you</h1>
              <h2 style="margin:0 0 16px;font-size:20px;line-height:1.4;color:#1e293b;">${title}</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:20px;">
                <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Buyer</td><td style="padding:6px 0;font-size:14px;color:#0f172a;text-align:right;">${buyer}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Country</td><td style="padding:6px 0;font-size:14px;color:#0f172a;text-align:right;">${country}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Match</td><td style="padding:6px 0;font-size:14px;font-weight:600;color:#059669;text-align:right;">${score} / 100 match</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Budget</td><td style="padding:6px 0;font-size:14px;color:#0f172a;text-align:right;">${budget}</td></tr>
                <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Deadline</td><td style="padding:6px 0;font-size:14px;color:#0f172a;text-align:right;">${deadline}</td></tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;background:#f8fafc;border-radius:8px;padding:14px;">${excerpt}</p>
              <a href="${opportunityUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px;">View Opportunity</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">You&apos;re receiving this because you have alerts enabled. Manage your preferences in Settings.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function shouldSendAlert(opportunity: Opportunity): string | null {
  const score = opportunity.match_score;

  if (score == null) {
    return "Opportunity has no match score";
  }

  if (score < 60) {
    return "Score below 60";
  }

  if (score < 80) {
    return "Score 60–79 (digest not enabled yet)";
  }

  if (opportunity.eligibility_result === "not_eligible") {
    return "Marked not eligible";
  }

  return null;
}

async function alertAlreadySent(
  userId: string,
  opportunityId: string
): Promise<boolean> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("alert_logs")
    .select("id")
    .eq("user_id", userId)
    .eq("opportunity_id", opportunityId)
    .eq("channel", "email")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check alert log: ${error.message}`);
  }

  return !!data;
}

async function logAlertSent(
  userId: string,
  opportunity: Opportunity
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("alert_logs").insert({
    user_id: userId,
    opportunity_id: opportunity.id,
    match_score: opportunity.match_score!,
    channel: "email",
  });

  if (error) {
    throw new Error(`Failed to log alert: ${error.message}`);
  }
}

export async function sendAlertEmail(
  user: AlertUser,
  opportunity: Opportunity
): Promise<SendAlertResult> {
  const skipReason = shouldSendAlert(opportunity);
  if (skipReason) {
    return { sent: false, skippedReason: skipReason };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    return {
      sent: false,
      error: "RESEND_API_KEY or RESEND_FROM_EMAIL is not configured",
    };
  }

  try {
    if (await alertAlreadySent(user.id, opportunity.id)) {
      return { sent: false, skippedReason: "Alert already sent" };
    }

    const opportunityUrl = `${getSiteUrl()}/opportunities/${opportunity.id}`;
    const subject = `New tender match: ${opportunity.title ?? "Untitled tender"}`;
    const html = buildAlertEmailHtml(opportunity, opportunityUrl);

    const resend = new Resend(apiKey);
    const { error: sendError } = await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject,
      html,
    });

    if (sendError) {
      return {
        sent: false,
        error: sendError.message,
      };
    }

    await logAlertSent(user.id, opportunity);

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : "Unknown alert error",
    };
  }
}
