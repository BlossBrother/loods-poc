import type { AirtableRecord, MedewerkerFields } from "./airtable";

export interface Jarig {
  naam: string;
  datum: string; // dd-mm
  overDagen: number;
  foto?: string;
}

// Verjaardagen binnen `binnenDagen` dagen (jaar genegeerd), vandaag eerst.
export function komendeVerjaardagen(
  medewerkers: AirtableRecord<MedewerkerFields>[],
  binnenDagen = 7,
): Jarig[] {
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Amsterdam",
  }).format(new Date());
  const today = new Date(`${todayStr}T00:00:00Z`);
  const out: Jarig[] = [];
  for (const m of medewerkers) {
    if (m.fields.VerjaardagZichtbaar === false) continue;
    const v = m.fields.Verjaardag;
    if (!v) continue;
    const parts = v.split("-");
    const mm = Number(parts[1]);
    const dd = Number(parts[2]);
    if (!mm || !dd) continue;
    const jaar = today.getUTCFullYear();
    let next = new Date(Date.UTC(jaar, mm - 1, dd));
    if (next.getTime() < today.getTime()) {
      next = new Date(Date.UTC(jaar + 1, mm - 1, dd));
    }
    const overDagen = Math.round((next.getTime() - today.getTime()) / 86400000);
    if (overDagen <= binnenDagen) {
      out.push({
        naam: m.fields.Naam ?? "(onbekend)",
        datum: `${String(dd).padStart(2, "0")}-${String(mm).padStart(2, "0")}`,
        overDagen,
        foto: m.fields.Foto?.[0]?.thumbnails?.large?.url ?? m.fields.Foto?.[0]?.url,
      });
    }
  }
  out.sort((a, b) => a.overDagen - b.overDagen);
  return out;
}
