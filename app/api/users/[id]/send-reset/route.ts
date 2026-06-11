import { NextRequest, NextResponse } from "next/server";
import { initDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { randomBytes } from "crypto";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await initDb();

  const result = await db.execute({
    sql: "SELECT id, name, email FROM users WHERE id = ? AND is_active = 1",
    args: [id],
  });

  if (result.rows.length === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const user = result.rows[0];
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

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
          <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px;">Your account is ready</div>
        </div>
        <div style="padding:32px;">
          <p style="font-size:15px;color:#334155;margin:0 0 16px;">Hi ${user.name},</p>
          <p style="font-size:14px;color:#475569;margin:0 0 24px;">Your admin has set up your Maple X CRM account. Click below to set your password and get started. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;font-size:14px;font-weight:700;padding:13px 28px;border-radius:10px;text-decoration:none;margin-bottom:24px;">Set My Password →</a>
          <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">Your login email: <strong>${user.email}</strong></p>
          <p style="font-size:12px;color:#94a3b8;margin:0;">CRM URL: <a href="${baseUrl}" style="color:#3b82f6;">${baseUrl}</a></p>
        </div>
      </div>
    </div>
  `;

  const text = `Hi ${user.name},\n\nSet your Maple X CRM password:\n${resetUrl}\n\nLogin email: ${user.email}\nCRM: ${baseUrl}\n\nLink expires in 1 hour.\n\n— Maple X Business Funding`;

  await sendEmail({
    to: user.email as string,
    subject: "Set your Maple X CRM password",
    html,
    text,
  });

  return NextResponse.json({ ok: true });
}
