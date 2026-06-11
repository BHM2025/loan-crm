const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL ?? "Maple X Business Funding <notifications@mapleXfunding.com>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — email skipped");
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", body);
    }
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

export function statusChangeEmail(ownerName: string, businessName: string, status: string, appId: string) {
  const messages: Record<string, string> = {
    New: "Your application has been received and is currently under initial review.",
    Underwriting: "Your application is now in underwriting. Our team is actively reviewing your documents and financials.",
    Approved: "Great news! Your application has been approved. Our team will be in touch shortly with next steps.",
    Funded: "Congratulations! Your funding has been disbursed. Welcome to the Maple X family!",
    Declined: "After careful review, we are unable to approve your application at this time. Please contact our team for more information.",
  };

  const statusColors: Record<string, string> = {
    New: "#3b82f6",
    Underwriting: "#f59e0b",
    Approved: "#10b981",
    Funded: "#8b5cf6",
    Declined: "#ef4444",
  };

  const color = statusColors[status] ?? "#3b82f6";
  const message = messages[status] ?? "";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
      <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#fff;">Maple X Business Funding</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Application Status Update</div>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi ${ownerName},</p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;">Your application for <strong>${businessName}</strong> has been updated.</p>
          <div style="background:#f8fafc;border-left:4px solid ${color};border-radius:8px;padding:16px 20px;margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">New Status</div>
            <div style="font-size:20px;font-weight:800;color:${color};">${status}</div>
          </div>
          <p style="font-size:14px;color:#475569;margin:0 0 24px;">${message}</p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">Application ID: #${appId}</p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">Questions? Reply to this email or contact your Maple X representative.</p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${ownerName},\n\nYour application for ${businessName} has been updated.\n\nNew Status: ${status}\n\n${message}\n\nApplication ID: #${appId}\n\n— Maple X Business Funding`;

  return { html, text };
}

export function noteAddedEmail(ownerName: string, businessName: string, noteContent: string, appId: string) {
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
      <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#fff;">Maple X Business Funding</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Action Required — Application Update</div>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#334155;margin:0 0 20px;">Hi ${ownerName},</p>
          <p style="font-size:15px;color:#334155;margin:0 0 24px;">Our team has left a message regarding your application for <strong>${businessName}</strong>.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px;margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">📋 Message from your agent</div>
            <p style="font-size:14px;color:#334155;margin:0;line-height:1.6;">${noteContent}</p>
          </div>
          <p style="font-size:14px;color:#475569;margin:0 0 8px;">Please respond or provide any requested documents as soon as possible to keep your application moving forward.</p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">Application ID: #${appId}</p>
        </div>
        <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">Questions? Reply to this email or contact your Maple X representative.</p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${ownerName},\n\nOur team has left a message regarding your application for ${businessName}:\n\n"${noteContent}"\n\nPlease respond or provide any requested documents as soon as possible.\n\nApplication ID: #${appId}\n\n— Maple X Business Funding`;

  return { html, text };
}
