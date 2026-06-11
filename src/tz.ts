// Tijdzone-helpers voor Europe/Amsterdam.
// Airtable bewaart dateTime in UTC; wij tonen/lezen in Nederlandse tijd.

const TZ = "Europe/Amsterdam";

// Offset (minuten) tussen lokale tijd en UTC op een gegeven moment.
function tzOffsetMinutes(at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return (asUTC - at.getTime()) / 60000;
}

// "YYYY-MM-DDTHH:mm" (wat een <input type=datetime-local> levert, bedoeld als
// Amsterdamse kloktijd) -> correcte UTC ISO-string voor opslag in Airtable.
export function amsterdamLocalToUtcIso(local: string): string {
  const asIfUtc = new Date(`${local}:00Z`);
  if (isNaN(asIfUtc.getTime())) return new Date().toISOString();
  const offset = tzOffsetMinutes(asIfUtc);
  return new Date(asIfUtc.getTime() - offset * 60000).toISOString();
}

// ISO (UTC) -> "16:50" in Amsterdamse tijd.
export function formatTijd(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

// ISO (UTC) -> "3 jun 16:50" in Amsterdamse tijd.
export function formatDatumTijd(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("nl-NL", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
