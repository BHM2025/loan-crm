import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const db = await initDb();
  const result = await db.execute({
    sql: "SELECT id, name, email FROM users WHERE email = ? AND is_active = 1",
    args: [email],
  });

  // Always return success to prevent email enumeration
  if (result.rows.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const user = result.rows[0];
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  // Invalidate any existing tokens for this user
  await db.execute({
    sql: "UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?",
    args: [user.id],
  });

  await db.execute({
    sql: "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    args: [user.id, token, expiresAt],
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://loan-crm-two.vercel.app";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;">
      <div style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);padding:24px 32px;">
          <div style="font-size:20px;font-weight:800;color:#fff;">Maple X Business Funding</div>
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Password Reset Request</div>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#334155;margin:0 0 16px;">Hi ${user.name},</p>
          <p style="font-size:14px;color:#475569;margin:0 0 24px;">We received a request to reset your password. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Reset My Password →</a>
          <p style="font-size:12px;color:#94a3b8;margin:0;">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${user.name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, ignore this email.\n\n— Maple X Business Funding`;

  await sendEmail({
    to: user.email as string,
    subject: "Reset your Maple X CRM password",
    html,
    text,
  });

  return NextResponse.json({ ok: true });
}
