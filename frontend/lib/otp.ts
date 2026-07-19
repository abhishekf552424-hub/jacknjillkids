// OTP + hashing helpers used by admin auth and COD checkout.
import { randomInt, createHash } from "node:crypto";

export function generateOtp(length = 6): string {
  let s = "";
  for (let i = 0; i < length; i++) s += String(randomInt(0, 10));
  return s;
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function otpEmailHtml(code: string, purpose: string) {
  const heading =
    purpose === "admin_login"
      ? "Admin login verification"
      : purpose === "cod_checkout"
        ? "Confirm your COD order"
        : "Verification code";
  return `<!doctype html><html><body style="margin:0;background:#FFF9F2;font-family:'DM Sans',Arial,sans-serif;color:#1A1A1A">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px">
        <tr><td style="font-family:'Fraunces',Georgia,serif;font-size:24px;color:#1E2A4A">Jack &amp; Jill</td></tr>
        <tr><td style="padding-top:8px;font-size:18px;color:#1E2A4A">${heading}</td></tr>
        <tr><td style="padding-top:8px;color:#6B7280;font-size:14px">Enter this 6-digit code to continue. Expires in 5 minutes.</td></tr>
        <tr><td align="center" style="padding:24px 0"><div style="display:inline-block;background:#FFF9F2;border:1px solid #C9992E;color:#1E2A4A;font-family:'Fraunces',Georgia,serif;font-size:32px;letter-spacing:12px;padding:16px 32px;border-radius:12px">${code}</div></td></tr>
        <tr><td style="color:#6B7280;font-size:12px;padding-top:8px">Never share this code. Jack &amp; Jill will never ask for it over phone or WhatsApp.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
