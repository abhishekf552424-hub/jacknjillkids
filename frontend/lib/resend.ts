import { Resend } from "resend";

let client: Resend | null = null;
function getResend() {
  if (!client && process.env.RESEND_API_KEY) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const r = getResend();
  if (!r) {
    console.warn("[resend] RESEND_API_KEY missing — skipping send");
    return { ok: false, id: null };
  }
  try {
    const from = process.env.MAIL_FROM || "onboarding@resend.dev";
    const res = await r.emails.send({
      from: `Jack & Jill <${from}>`,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    return { ok: true, id: res.data?.id ?? null };
  } catch (e: any) {
    console.error("[resend] send failed:", e?.message ?? e);
    return { ok: false, id: null };
  }
}

export function orderConfirmationTemplate(order: {
  order_number: string;
  customer_name: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
  tracking_url: string;
}) {
  const rows = order.items
    .map(
      (it) =>
        `<tr><td style="padding:8px 0;font-size:14px;color:#1A1A1A">${it.name} × ${it.qty}</td><td align="right" style="padding:8px 0;font-size:14px;color:#1A1A1A">₹${it.price * it.qty}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#FFF9F2;font-family:'DM Sans',Arial,sans-serif;color:#1A1A1A">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9F2;padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px">
          <tr><td style="font-family:'Fraunces',Georgia,serif;font-size:24px;color:#1E2A4A">Jack &amp; Jill</td></tr>
          <tr><td style="padding-top:12px;font-size:20px;color:#1E2A4A">Thank you, ${order.customer_name || "there"}!</td></tr>
          <tr><td style="padding-top:8px;color:#6B7280">Your order <strong style="color:#1E2A4A">${order.order_number}</strong> is confirmed.</td></tr>
          <tr><td style="padding-top:20px"><hr style="border:none;border-top:1px solid #eee"/></td></tr>
          <tr><td><table role="presentation" width="100%">${rows}</table></td></tr>
          <tr><td style="padding-top:12px"><hr style="border:none;border-top:1px solid #eee"/></td></tr>
          <tr><td align="right" style="padding-top:12px;font-size:16px;color:#1E2A4A"><strong>Total: ₹${order.total}</strong></td></tr>
          <tr><td align="center" style="padding-top:24px">
            <a href="${order.tracking_url}" style="background:#1E2A4A;color:#fff;text-decoration:none;border-radius:12px;padding:12px 24px;display:inline-block">Track your order</a>
          </td></tr>
          <tr><td style="padding-top:24px;color:#6B7280;font-size:12px" align="center">Kolhapur's trusted kids brand since 2003</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

export function orderStatusTemplate(order: {
  order_number: string;
  status_label: string;
  tracking_url: string;
}) {
  return `<!doctype html><html><body style="margin:0;background:#FFF9F2;font-family:'DM Sans',Arial,sans-serif;color:#1A1A1A">
    <table role="presentation" width="100%" style="padding:24px 0"><tr><td align="center">
      <table role="presentation" width="560" style="background:#fff;border-radius:16px;padding:32px">
        <tr><td style="font-family:'Fraunces',Georgia,serif;font-size:24px;color:#1E2A4A">Jack &amp; Jill</td></tr>
        <tr><td style="padding-top:12px;font-size:20px;color:#1E2A4A">Order Update</td></tr>
        <tr><td style="padding-top:8px;color:#6B7280">Your order <strong style="color:#1E2A4A">${order.order_number}</strong> is now <strong>${order.status_label}</strong>.</td></tr>
        <tr><td align="center" style="padding-top:24px"><a href="${order.tracking_url}" style="background:#1E2A4A;color:#fff;text-decoration:none;border-radius:12px;padding:12px 24px;display:inline-block">Track</a></td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
