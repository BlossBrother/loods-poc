import { html } from "hono/html";

// Vaste set reactie-emoji (gebruikerscontent — los van de no-emoji-UI-huisstijl).
export const EMOJI_SET = ["👍", "❤️", "😄", "🎉", "👏"] as const;

export function isEmoji(e: string): boolean {
  return (EMOJI_SET as readonly string[]).includes(e);
}

// Bouw {counts, mine} voor één target uit losse rijen.
export function emojiData(
  rijen: { emoji: string; auteur_id: string }[],
  meId?: string,
): { counts: Record<string, number>; mine: string[] } {
  const counts: Record<string, number> = {};
  const mine: string[] = [];
  for (const r of rijen) {
    if (!isEmoji(r.emoji)) continue;
    counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
    if (meId && r.auteur_id === meId) mine.push(r.emoji);
  }
  return { counts, mine };
}

export function emojiBar(
  targetType: "post" | "nieuws",
  targetId: string,
  data: { counts: Record<string, number>; mine: string[] },
  kanReageren: boolean,
) {
  return html`<div class="emojibar" data-type="${targetType}" data-id="${targetId}" data-actief="${kanReageren ? "1" : "0"}">
    ${EMOJI_SET.map((e) => {
      const n = data.counts[e] ?? 0;
      const on = data.mine.includes(e);
      return html`<button type="button" class="emojibtn${on ? " on" : ""}" data-emoji="${e}" aria-pressed="${on ? "true" : "false"}"${kanReageren ? "" : " disabled"}>
        <span class="e">${e}</span><span class="n"${n ? "" : ' hidden'}>${n}</span>
      </button>`;
    })}
  </div>`;
}
