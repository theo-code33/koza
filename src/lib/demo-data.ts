import { Prisma } from "../generated/prisma/client";
import { nextMonth, monthDiff } from "./month";
import type { CategoryKey } from "./categories";

export interface DemoBudget {
  key: string;
  name: string;
  targetAmount: string;
  category: CategoryKey;
  deadlineMonth?: string;
}

export interface DemoRecurring {
  key: string;
  label: string;
  type: "FIXED" | "VARIABLE";
  amount: string;
  category: CategoryKey;
  subcategory: string;
  frequency: "MONTHLY" | "QUARTERLY" | "YEARLY";
  anchorMonth: string;
  endMonth?: string;
}

export interface DemoExpense {
  amount: string;
  description: string;
  month: string;
  day: number;
  category: CategoryKey;
  subcategory: string;
  budgetKey?: string;
  recurringKey?: string;
}

export interface DemoOccurrence {
  recurringKey: string;
  month: string;
  status: "APPLIED" | "CONFIRMED" | "PENDING";
}

export interface DemoIncome {
  source: string;
  amount: string;
  month: string;
  day: number;
}

export interface DemoPeriod {
  month: string;
  carryIn: string;
  carryOut: string | null;
  closed: boolean;
}

export interface DemoDataset {
  user: { email: string; password: string; locale: string; theme: string };
  budgets: DemoBudget[];
  recurring: DemoRecurring[];
  expenses: DemoExpense[];
  occurrences: DemoOccurrence[];
  incomes: DemoIncome[];
  periods: DemoPeriod[];
}

const START_MONTH = "2026-01";
const FREQ_PERIOD = { MONTHLY: 1, QUARTERLY: 3, YEARLY: 12 } as const;

// Liste des mois "YYYY-MM" de `start` à `end` inclus.
function monthsFrom(start: string, end: string): string[] {
  const months: string[] = [];
  let cursor = start;
  while (monthDiff(cursor, end) >= 0) {
    months.push(cursor);
    cursor = nextMonth(cursor);
  }
  return months;
}

// Élément cyclique d'un tableau (séries déterministes → tests stables).
function pick(arr: string[], i: number): string {
  return arr[i % arr.length]!;
}

// Profil mensuel déterministe : un an d'activité réaliste, majoritairement dans les
// cibles 50/30/20, report toujours positif, courbe d'épargne croissante.
export function buildDemoDataset(currentMonth: string): DemoDataset {
  const start = monthDiff(START_MONTH, currentMonth) >= 0 ? START_MONTH : currentMonth;
  const months = monthsFrom(start, currentMonth);

  const budgets: DemoBudget[] = [
    {
      key: "vacances",
      name: "Vacances Grèce",
      targetAmount: "1200.00",
      category: "leisure",
      deadlineMonth: nextMonth(nextMonth(currentMonth)),
    },
    { key: "fonds", name: "Fonds d'urgence", targetAmount: "3000.00", category: "savings" },
  ];

  const recurring: DemoRecurring[] = [
    {
      key: "loyer",
      label: "Loyer",
      type: "FIXED",
      amount: "850.00",
      category: "essential",
      subcategory: "housing",
      frequency: "MONTHLY",
      anchorMonth: START_MONTH,
    },
    {
      key: "assurance",
      label: "Assurance habitation",
      type: "FIXED",
      amount: "45.00",
      category: "essential",
      subcategory: "bills",
      frequency: "QUARTERLY",
      anchorMonth: START_MONTH,
    },
    {
      key: "electricite",
      label: "Électricité",
      type: "VARIABLE",
      amount: "70.00",
      category: "essential",
      subcategory: "bills",
      frequency: "MONTHLY",
      anchorMonth: START_MONTH,
    },
  ];

  const food = ["268.40", "252.90", "281.20", "248.75", "274.50", "259.10"];
  const elec = ["68.00", "74.30", "71.10", "69.40", "76.20", "73.00"];
  const transport = ["0", "75.00", "0", "0", "75.00", "0"];
  const restaurant = ["42.50", "0", "58.00", "31.90", "0", "47.00"];
  const outings = ["0", "65.00", "0", "0", "80.00", "0"];
  const culture = ["24.00", "0", "18.50", "0", "22.00", "0"];
  const games = ["0", "0", "0", "59.99", "0", "0"];
  const health = ["0", "32.50", "0", "0", "45.00", "0"];
  const etf = ["0", "200.00", "0", "0", "200.00", "0"];
  const fonds = ["200.00", "0", "0", "200.00", "0", "0"];
  const vacances = ["0", "0", "250.00", "0", "300.00", "0"];

  const expenses: DemoExpense[] = [];
  const occurrences: DemoOccurrence[] = [];
  const incomes: DemoIncome[] = [];

  months.forEach((month, i) => {
    const isCurrent = month === currentMonth;

    incomes.push({ source: "Salaire", amount: "2500.00", month, day: 1 });
    if (i === 2) incomes.push({ source: "Prime", amount: "600.00", month, day: 1 });
    if (i === 4) incomes.push({ source: "Freelance", amount: "400.00", month, day: 1 });

    for (const r of recurring) {
      const d = monthDiff(r.anchorMonth, month);
      if (d < 0 || d % FREQ_PERIOD[r.frequency] !== 0) continue;
      if (r.type === "FIXED") {
        expenses.push({
          amount: r.amount,
          description: r.label,
          month,
          day: 3,
          category: r.category,
          subcategory: r.subcategory,
          recurringKey: r.key,
        });
        occurrences.push({ recurringKey: r.key, month, status: "APPLIED" });
      } else if (isCurrent) {
        occurrences.push({ recurringKey: r.key, month, status: "PENDING" });
      } else {
        expenses.push({
          amount: pick(elec, i),
          description: r.label,
          month,
          day: 8,
          category: r.category,
          subcategory: r.subcategory,
          recurringKey: r.key,
        });
        occurrences.push({ recurringKey: r.key, month, status: "CONFIRMED" });
      }
    }

    const add = (
      amount: string,
      description: string,
      category: CategoryKey,
      subcategory: string,
      day: number,
      budgetKey?: string,
    ) => {
      if (Number(amount) > 0) {
        expenses.push({ amount, description, month, day, category, subcategory, budgetKey });
      }
    };

    add(pick(food, i), "Courses", "essential", "food", 10);
    add(pick(transport, i), "Transport", "essential", "transport", 5);
    add(pick(health, i), "Pharmacie", "essential", "health", 14);
    add(pick(restaurant, i), "Restaurant", "leisure", "restaurants", 16);
    add(pick(outings, i), "Sortie", "leisure", "outings", 18);
    add("35.00", "Salle de sport", "leisure", "sport", 2);
    add(pick(culture, i), "Culture", "leisure", "culture", 20);
    add(pick(games, i), "Jeu vidéo", "leisure", "games", 9);
    add("300.00", "Virement Livret A", "savings", "savings_account", 28);
    add(pick(etf, i), "Achat ETF World", "savings", "etf", 25);
    add(pick(fonds, i), "Épargne de précaution", "savings", "emergency_fund", 4, "fonds");
    add(pick(vacances, i), "Acompte vacances", "leisure", "vacations", 6, "vacances");
  });

  const periods: DemoPeriod[] = [];
  let carryIn = new Prisma.Decimal(0);
  for (const month of months) {
    const income = incomes
      .filter((x) => x.month === month)
      .reduce((acc, x) => acc.plus(x.amount), new Prisma.Decimal(0));
    const spent = expenses
      .filter((x) => x.month === month)
      .reduce((acc, x) => acc.plus(x.amount), new Prisma.Decimal(0));
    const carryOut = income.plus(carryIn).minus(spent);
    const isCurrent = month === currentMonth;
    periods.push({
      month,
      carryIn: carryIn.toFixed(2),
      carryOut: isCurrent ? null : carryOut.toFixed(2),
      closed: !isCurrent,
    });
    carryIn = carryOut;
  }

  return {
    user: {
      email: "cedric@agricole.com",
      password: "cedricagricole123",
      locale: "fr",
      theme: "light",
    },
    budgets,
    recurring,
    expenses,
    occurrences,
    incomes,
    periods,
  };
}
