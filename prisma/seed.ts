import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const now = new Date();

// "YYYY-MM" pour le mois courant + `offset` mois.
function monthKey(offset: number): string {
  const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Date d'un jour donné dans le mois courant + `offset` mois.
function dayInMonth(offset: number, day: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + offset, day);
}

// Dernier jour du mois courant + `offset` mois.
function lastDayOfMonth(offset: number): Date {
  return new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
}

async function main() {
  // Reset complet (cascade depuis User). Ne tourne que contre koza-dev.
  await prisma.user.deleteMany();

  // Utilisateur de démo, propriétaire de toute la data. DEMO_ONBOARDING=fresh → onboarding affiché.
  const onboardingCompleted = process.env.DEMO_ONBOARDING !== "fresh";
  const demo = await prisma.user.create({
    data: {
      email: "demo@koza.app",
      passwordHash: await bcrypt.hash("demo1234", 10),
      settings: { create: { theme: "light", locale: "fr", onboardingCompleted } },
    },
  });
  const userId = demo.id;

  // Budgets (créés d'abord pour récupérer leurs ids et y rattacher des dépenses).
  const vacances = await prisma.budget.create({
    data: {
      userId,
      name: "Vacances Grèce",
      targetAmount: "1200.00",
      category: "leisure",
      deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
    },
  });
  const fondsUrgence = await prisma.budget.create({
    data: {
      userId,
      name: "Fonds d'urgence",
      targetAmount: "3000.00",
      category: "savings",
    },
  });

  // Revenus : salaire sur 3 mois + un extra freelance sur le mois courant.
  // `date` = 1er du mois (le formulaire revenus ne capture pas de jour).
  await prisma.income.createMany({
    data: [
      { source: "Salaire", amount: "2500.00", date: dayInMonth(-2, 1), month: monthKey(-2) },
      { source: "Salaire", amount: "2500.00", date: dayInMonth(-1, 1), month: monthKey(-1) },
      { source: "Salaire", amount: "2500.00", date: dayInMonth(0, 1), month: monthKey(0) },
      { source: "Freelance", amount: "400.00", date: dayInMonth(0, 1), month: monthKey(0) },
    ].map((d) => ({ ...d, userId })),
  });

  // 18 dépenses réalistes réparties sur 3 mois. Montants en strings (pas de float).
  // `month` = mois d'imputation (déduit de la date).
  await prisma.expense.createMany({
    data: [
      // Mois -2
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(-2, 3),
        month: monthKey(-2),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "320.50",
        description: "Courses Carrefour",
        date: dayInMonth(-2, 12),
        month: monthKey(-2),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "75.00",
        description: "Électricité",
        date: dayInMonth(-2, 8),
        month: monthKey(-2),
        category: "essential",
        subcategory: "bills",
      },
      {
        amount: "48.90",
        description: "Restaurant italien",
        date: dayInMonth(-2, 15),
        month: monthKey(-2),
        category: "leisure",
        subcategory: "restaurants",
      },
      {
        amount: "24.00",
        description: "Cinéma",
        date: dayInMonth(-2, 20),
        month: monthKey(-2),
        category: "leisure",
        subcategory: "culture",
      },
      {
        amount: "400.00",
        description: "Virement Livret A",
        date: dayInMonth(-2, 28),
        month: monthKey(-2),
        category: "savings",
        subcategory: "savings_account",
      },
      // Mois -1
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(-1, 3),
        month: monthKey(-1),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "295.00",
        description: "Courses",
        date: dayInMonth(-1, 10),
        month: monthKey(-1),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "75.00",
        description: "Abonnement transports",
        date: dayInMonth(-1, 5),
        month: monthKey(-1),
        category: "essential",
        subcategory: "transport",
      },
      {
        amount: "65.00",
        description: "Concert",
        date: dayInMonth(-1, 18),
        month: monthKey(-1),
        category: "leisure",
        subcategory: "outings",
      },
      {
        amount: "35.00",
        description: "Salle de sport",
        date: dayInMonth(-1, 2),
        month: monthKey(-1),
        category: "leisure",
        subcategory: "sport",
      },
      {
        amount: "300.00",
        description: "Achat ETF World",
        date: dayInMonth(-1, 25),
        month: monthKey(-1),
        category: "savings",
        subcategory: "etf",
      },
      // Mois courant
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(0, 3),
        month: monthKey(0),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "180.40",
        description: "Courses",
        date: dayInMonth(0, 7),
        month: monthKey(0),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "32.50",
        description: "Pharmacie",
        date: dayInMonth(0, 8),
        month: monthKey(0),
        category: "essential",
        subcategory: "health",
      },
      {
        amount: "59.99",
        description: "Jeu vidéo",
        date: dayInMonth(0, 9),
        month: monthKey(0),
        category: "leisure",
        subcategory: "games",
      },
      {
        amount: "250.00",
        description: "Acompte hôtel Santorin",
        date: dayInMonth(0, 6),
        month: monthKey(0),
        category: "leisure",
        subcategory: "vacations",
        budgetId: vacances.id,
      },
      {
        amount: "200.00",
        description: "Épargne de précaution",
        date: dayInMonth(0, 4),
        month: monthKey(0),
        category: "savings",
        subcategory: "emergency_fund",
        budgetId: fondsUrgence.id,
      },
    ].map((d) => ({ ...d, userId })),
  });

  // Périodes mensuelles : 2 mois clôturés avec report propagé, mois courant ouvert.
  // Mois -2 : base 2500, dépensé 1718,40 → report 781,60.
  // Mois -1 : base 2500+781,60=3281,60, dépensé 1620 → report 1661,60.
  // Mois courant : carryIn 1661,60 (ouvert).
  await prisma.monthlyPeriod.createMany({
    data: [
      { month: monthKey(-2), carryIn: "0.00", carryOut: "781.60", closedAt: lastDayOfMonth(-2) },
      { month: monthKey(-1), carryIn: "781.60", carryOut: "1661.60", closedAt: lastDayOfMonth(-1) },
      { month: monthKey(0), carryIn: "1661.60" },
    ].map((d) => ({ ...d, userId })),
  });

  // Modèles récurrents de démo. Loyer/Assurance pour l'écran de gestion ;
  // Électricité VARIABLE avec une occurrence à confirmer ce mois-ci.
  await prisma.recurringExpense.create({
    data: {
      userId,
      label: "Loyer",
      type: "FIXED",
      amount: "850.00",
      category: "essential",
      subcategory: "housing",
      frequency: "MONTHLY",
      anchorMonth: monthKey(-2),
    },
  });
  await prisma.recurringExpense.create({
    data: {
      userId,
      label: "Assurance habitation",
      type: "FIXED",
      amount: "15.00",
      category: "essential",
      subcategory: "bills",
      frequency: "QUARTERLY",
      anchorMonth: monthKey(0),
    },
  });
  const electricite = await prisma.recurringExpense.create({
    data: {
      userId,
      label: "Électricité",
      type: "VARIABLE",
      amount: "75.00",
      category: "essential",
      subcategory: "bills",
      frequency: "MONTHLY",
      anchorMonth: monthKey(0),
    },
  });
  await prisma.recurringOccurrence.create({
    data: { userId, recurringId: electricite.id, month: monthKey(0), status: "PENDING" },
  });

  const [incomes, expenses, budgets, recurring] = await Promise.all([
    prisma.income.count(),
    prisma.expense.count(),
    prisma.budget.count(),
    prisma.recurringExpense.count(),
  ]);
  console.log(
    `Seed complete · incomes: ${incomes} · expenses: ${expenses} · budgets: ${budgets} · recurring: ${recurring}`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
