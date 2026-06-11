import { raw } from "hono/html";
import type { HtmlEscapedString } from "hono/utils/html";

// Veilige, lichte weergave van platte/markdown-achtige tekst (Airtable richText):
// escapet eerst alle HTML, maakt daarna URL's klikbaar, **vet**, en behoudt
// regelafbrekingen. Omdat we eerst escapen, blijft dit veilig tegen XSS.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderRich(input?: string): HtmlEscapedString {
  let s = esc(input ?? "");
  // URL's klikbaar maken (eindleestekens buiten de link houden).
  s = s.replace(/(https?:\/\/[^\s<]+)/g, (m) => {
    const trail = m.match(/[.,;:!?)]+$/);
    const url = trail ? m.slice(0, -trail[0].length) : m;
    const tail = trail ? trail[0] : "";
    return `<a href="${url}" target="_blank" rel="noopener">${url}</a>${tail}`;
  });
  // **vet**
  s = s.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  // regelafbrekingen behouden
  s = s.replace(/\r?\n/g, "<br />");
  return raw(s);
}
