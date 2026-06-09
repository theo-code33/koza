import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // The app is single-profile for the MVP: one settings row keyed "default".
  await prisma.userSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      theme: "light",
      locale: "fr",
      onboardingCompleted: false,
    },
  });

  const count = await prisma.userSettings.count();
  console.log(`Seed complete · UserSettings rows: ${count}`);
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
