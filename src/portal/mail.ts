// Versturen van de magic-link mail. Gebruikt Resend (resend.com) als RESEND_API_KEY
// is gezet. Zonder key wordt de link naar de console gelogd (zichtbaar via
// `npx wrangler tail`). De link wordt ALLEEN lokaal (DEV_MODE) op het scherm
// getoond; op productie nooit, zodat niemand zonder mailbox kan inloggen.

import type { Env } from "../airtable";

export interface MailResult {
  sent: boolean;
  devLink?: string; // alleen gevuld in DEV_MODE, voor lokaal testen
}

export async function sendMagicLink(
  env: Env,
  email: string,
  link: string,
): Promise<MailResult> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM) {
    console.log(`[portaal] magic-link voor ${email}: ${link}`);
    // Link alleen tonen tijdens lokale ontwikkeling, nooit op productie.
    return { sent: false, devLink: env.DEV_MODE === "true" ? link : undefined };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM,
      to: [email],
      subject: "Je inloglink voor het Fresh Forward klantenportaal",
      text:
        `Hallo,\n\nKlik op onderstaande link om in te loggen op het ` +
        `Fresh Forward klantenportaal. De link is 15 minuten geldig en kan ` +
        `een keer gebruikt worden:\n\n${link}\n\n` +
        `Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren.\n\n` +
        `- Fresh Forward`,
      html:
        `<p>Hallo,</p><p>Klik op de knop om in te loggen op het ` +
        `<strong>Fresh Forward klantenportaal</strong>. De link is 15 minuten ` +
        `geldig en kan een keer gebruikt worden.</p>` +
        `<p><a href="${link}" style="display:inline-block;background:#1a9648;` +
        `color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;` +
        `font-weight:600">Inloggen</a></p>` +
        `<p style="color:#666;font-size:13px">Werkt de knop niet? Plak deze link ` +
        `in je browser:<br>${link}</p>` +
        `<p style="color:#666;font-size:13px">Heb je dit niet aangevraagd? ` +
        `Negeer deze e-mail.</p><p>- Fresh Forward</p>`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[portaal] mail versturen faalde: ${res.status} ${body}`);
    return { sent: false };
  }
  return { sent: true };
}
