// Dwarsdoorsnijdend ownership-/moderatieprincipe: de maker óf een admin/beheerder
// mag content bewerken/verwijderen. Eén centrale helper, overal hergebruikt.
import type { Player } from "./account";
import { isAdmin } from "./account";

export function canEditOrDelete(p: Player | undefined, createdById?: string | null): boolean {
  if (!p) return false;
  if (isAdmin(p) || p.roles.includes("beheerder")) return true;
  return !!createdById && createdById === p.id;
}
