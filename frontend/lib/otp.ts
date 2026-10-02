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
  return `<!doctype html><html><body style="margin:0;background:#FFF8EC;font-family:Nunito,'Segoe UI',Arial,sans-serif;color:#1F2650">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0"><tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;padding:32px">
        <tr><td style="font-family:Rockwell,Arvo,Georgia,serif;font-size:24px;color:#354275">Jack &amp; Jill</td></tr>
        <tr><td style="padding-top:8px;font-size:18px;color:#354275">${heading}</td></tr>
        <tr><td style="padding-top:8px;color:#5B6280;font-size:14px">Enter this 6-digit code to continue. Expires in 5 minutes.</td></tr>
        <tr><td align="center" style="padding:24px 0"><div style="display:inline-block;background:#FFF8EC;border:1px solid #B9923F;color:#354275;font-family:Rockwell,Arvo,Georgia,serif;font-size:32px;letter-spacing:12px;padding:16px 32px;border-radius:12px">${code}</div></td></tr>
        <tr><td style="color:#5B6280;font-size:12px;padding-top:8px">Never share this code. Jack &amp; Jill will never ask for it over phone or WhatsApp.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}
