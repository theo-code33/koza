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
  const rows = await prisma.userSettings.findMany({ take: 1 });
  console.log(`✅ Connected · read ${rows.length} UserSettings row(s) from Prisma Postgres`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Connection failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
