import type { Charge, FundingSeason } from "./types";

// Charges in the Commission's own groups: 1(A) to 1(D), 2, 3, 4(A) to 4(D).
export function groupByNumber(charges: Charge[]): Charge[][] {
  const groups = new Map<string, Charge[]>();
  for (const charge of charges) {
    const number = charge.id.match(/^\d+/)![0];
    groups.set(number, [...(groups.get(number) ?? []), charge]);
  }
  return [...groups.values()];
}

// "Charge 1(A)" -> "1(A)", for where the word is already said once.
export function shortRef(charge: Charge): string {
  return charge.ref.replace(/^Charge /, "");
}

type Amount = Exclude<keyof FundingSeason, "season">;

export function total(seasons: FundingSeason[], amount: Amount): number {
  return seasons.reduce((sum, season) => sum + season[amount], 0);
}

// Amounts are £ million to two places, as the decision gives them.
export function money(amount: number): string {
  return amount.toFixed(2);
}
