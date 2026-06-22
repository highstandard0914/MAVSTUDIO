import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  // Admin user is created automatically when the admin wallet connects.
  // Set ADMIN_WALLET_ADDRESSES in .env to designate admin accounts.
  console.log("Done. Connect with admin wallet to create admin account.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
