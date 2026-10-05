import { Resend } from "resend";
import { esc } from "@/lib/html";

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
    const rawFrom = (process.env.MAIL_FROM || "onboarding@resend.dev").trim();
    // If MAIL_FROM already includes an email inside angle brackets (e.g. `Jack & Jill <foo@bar>`),
    // use it as-is. Otherwise treat it as a bare address and prepend the brand name.
    const from = /<[^>]+@[^>]+>/.test(rawFrom) ? rawFrom : `Jack & Jill <${rawFrom}>`;
    const res = await r.emails.send({
      from,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    });
    if ((res as any).error) {
      console.error("[resend] send failed:", (res as any).error);
      logCodeIfAllowed(opts);
      return { ok: false, id: null };
    }
    return { ok: true, id: res.data?.id ?? null };
  } catch (e: any) {
    console.error("[resend] send failed:", e?.message ?? e);
    logCodeIfAllowed(opts);
    return { ok: false, id: null };
  }
}

/**
 * Emergency only: if email sending is broken, the developer can set
 * ALLOW_OTP_LOG=1 on the server for a few minutes to read login codes from the
 * logs. Off by default — otherwise anyone with log access could pass 2-step login.
 */
function logCodeIfAllowed(opts: { to: string | string[]; html: string }) {
  if (process.env.ALLOW_OTP_LOG !== "1") return;
  const m = opts.html.match(/>(\d{6})</);
  if (m) console.warn(`[OTP LOG] ${Array.isArray(opts.to) ? opts.to.join(",") : opts.to}: ${m[1]}`);
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
        `<tr><td style="padding:8px 0;font-size:14px;color:#1F2650">${esc(it.name)} × ${Number(it.qty)}</td><td align="right" style="padding:8px 0;font-size:14px;color:#1F2650">₹${(Number(it.price) * Number(it.qty)).toLocaleString("en-IN")}</td></tr>`,
    )
    .join("");
  return `<!doctype html><html><body style="margin:0;background:#FFF8EC;font-family:Nunito,'Segoe UI',Arial,sans-serif;color:#1F2650">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EC;padding:24px 0">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px">
          <tr><td style="font-family:Fredoka,'Arial Rounded MT Bold',Arial,sans-serif;font-size:24px;color:#354275">Jack &amp; Jill</td></tr>
          <tr><td style="padding-top:12px;font-size:20px;color:#354275">Thank you, ${esc(order.customer_name || "there")}!</td></tr>
          <tr><td style="padding-top:8px;color:#5B6280">Your order <strong style="color:#354275">${esc(order.order_number)}</strong> is confirmed.</td></tr>
          <tr><td style="padding-top:20px"><hr style="border:none;border-top:1px solid #eee"/></td></tr>
          <tr><td><table role="presentation" width="100%">${rows}</table></td></tr>
          <tr><td style="padding-top:12px"><hr style="border:none;border-top:1px solid #eee"/></td></tr>
          <tr><td align="right" style="padding-top:12px;font-size:16px;color:#354275"><strong>Total: ₹${Number(order.total).toLocaleString("en-IN")}</strong></td></tr>
          <tr><td align="center" style="padding-top:24px">
            <a href="${esc(order.tracking_url)}" style="background:#354275;color:#fff;text-decoration:none;border-radius:12px;padding:12px 24px;display:inline-block">Track your order</a>
          </td></tr>
          <tr><td style="padding-top:24px;color:#5B6280;font-size:12px" align="center">Kolhapur's trusted kids brand since 2003</td></tr>
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
  return `<!doctype html><html><body style="margin:0;background:#FFF8EC;font-family:Nunito,'Segoe UI',Arial,sans-serif;color:#1F2650">
    <table role="presentation" width="100%" style="padding:24px 0"><tr><td align="center">
      <table role="presentation" width="560" style="background:#fff;border-radius:16px;padding:32px">
        <tr><td style="font-family:Fredoka,'Arial Rounded MT Bold',Arial,sans-serif;font-size:24px;color:#354275">Jack &amp; Jill</td></tr>
        <tr><td style="padding-top:12px;font-size:20px;color:#354275">Order Update</td></tr>
        <tr><td style="padding-top:8px;color:#5B6280">Your order <strong style="color:#354275">${esc(order.order_number)}</strong> is now <strong>${esc(order.status_label)}</strong>.</td></tr>
        <tr><td align="center" style="padding-top:24px"><a href="${esc(order.tracking_url)}" style="background:#354275;color:#fff;text-decoration:none;border-radius:12px;padding:12px 24px;display:inline-block">Track</a></td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
