import "dotenv/config";
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
  // Reset des tables démo (ordre FK-safe). Ne tourne que contre koza-dev.
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.income.deleteMany();
  await prisma.monthlyBalance.deleteMany();

  // Budgets (créés d'abord pour récupérer leurs ids et y rattacher des dépenses).
  const vacances = await prisma.budget.create({
    data: {
      name: "Vacances Grèce",
      targetAmount: "1200.00",
      category: "leisure",
      deadline: new Date(now.getFullYear(), now.getMonth() + 2, 1),
    },
  });
  const fondsUrgence = await prisma.budget.create({
    data: {
      name: "Fonds d'urgence",
      targetAmount: "3000.00",
      category: "savings",
    },
  });

  // Revenus : salaire sur 3 mois + un extra freelance sur le mois courant.
  await prisma.income.createMany({
    data: [
      { source: "Salaire", amount: "2500.00", month: monthKey(-2) },
      { source: "Salaire", amount: "2500.00", month: monthKey(-1) },
      { source: "Salaire", amount: "2500.00", month: monthKey(0) },
      { source: "Freelance", amount: "400.00", month: monthKey(0) },
    ],
  });

  // 18 dépenses réalistes réparties sur 3 mois. Montants en strings (pas de float).
  await prisma.expense.createMany({
    data: [
      // Mois -2
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(-2, 3),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "320.50",
        description: "Courses Carrefour",
        date: dayInMonth(-2, 12),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "75.00",
        description: "Électricité",
        date: dayInMonth(-2, 8),
        category: "essential",
        subcategory: "bills",
      },
      {
        amount: "48.90",
        description: "Restaurant italien",
        date: dayInMonth(-2, 15),
        category: "leisure",
        subcategory: "restaurants",
      },
      {
        amount: "24.00",
        description: "Cinéma",
        date: dayInMonth(-2, 20),
        category: "leisure",
        subcategory: "culture",
      },
      {
        amount: "400.00",
        description: "Virement Livret A",
        date: dayInMonth(-2, 28),
        category: "savings",
        subcategory: "savings_account",
      },
      // Mois -1
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(-1, 3),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "295.00",
        description: "Courses",
        date: dayInMonth(-1, 10),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "75.00",
        description: "Abonnement transports",
        date: dayInMonth(-1, 5),
        category: "essential",
        subcategory: "transport",
      },
      {
        amount: "65.00",
        description: "Concert",
        date: dayInMonth(-1, 18),
        category: "leisure",
        subcategory: "outings",
      },
      {
        amount: "35.00",
        description: "Salle de sport",
        date: dayInMonth(-1, 2),
        category: "leisure",
        subcategory: "sport",
      },
      {
        amount: "300.00",
        description: "Achat ETF World",
        date: dayInMonth(-1, 25),
        category: "savings",
        subcategory: "etf",
      },
      // Mois courant
      {
        amount: "850.00",
        description: "Loyer",
        date: dayInMonth(0, 3),
        category: "essential",
        subcategory: "housing",
      },
      {
        amount: "180.40",
        description: "Courses",
        date: dayInMonth(0, 7),
        category: "essential",
        subcategory: "food",
      },
      {
        amount: "32.50",
        description: "Pharmacie",
        date: dayInMonth(0, 8),
        category: "essential",
        subcategory: "health",
      },
      {
        amount: "59.99",
        description: "Jeu vidéo",
        date: dayInMonth(0, 9),
        category: "leisure",
        subcategory: "games",
      },
      {
        amount: "250.00",
        description: "Acompte hôtel Santorin",
        date: dayInMonth(0, 6),
        category: "leisure",
        subcategory: "vacations",
        budgetId: vacances.id,
      },
      {
        amount: "200.00",
        description: "Épargne de précaution",
        date: dayInMonth(0, 4),
        category: "savings",
        subcategory: "emergency_fund",
        budgetId: fondsUrgence.id,
      },
    ],
  });

  // 2 mois précédents clôturés, avec léger surplus/déficit (le mois courant reste ouvert).
  await prisma.monthlyBalance.createMany({
    data: [
      {
        month: monthKey(-2),
        carryOver: "30.00",
        essentialOver: "-40.00",
        leisureOver: "15.00",
        savingsOver: "0.00",
        closedAt: lastDayOfMonth(-2),
      },
      {
        month: monthKey(-1),
        carryOver: "55.00",
        essentialOver: "-20.00",
        leisureOver: "25.00",
        savingsOver: "-10.00",
        closedAt: lastDayOfMonth(-1),
      },
    ],
  });

  // Profil unique du MVP : onboarding marqué terminé pour la démo.
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: { onboardingCompleted: true },
    create: { id: "default", theme: "light", locale: "fr", onboardingCompleted: true },
  });

  const [incomes, expenses, budgets] = await Promise.all([
    prisma.income.count(),
    prisma.expense.count(),
    prisma.budget.count(),
  ]);
  console.log(`Seed complete · incomes: ${incomes} · expenses: ${expenses} · budgets: ${budgets}`);
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
