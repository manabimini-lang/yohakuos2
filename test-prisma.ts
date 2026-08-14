import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:VyIBc1Aoz9awTDpgPU91mTH5u8vWa74WD9ceGBvxyKA@db.gubxjsbxolcfecyhtjzn.supabase.co:5432/postgres"
      }
    }
  });

  try {
    console.log("Connecting to database on port 5432...");
    const start = Date.now();
    await prisma.$connect();
    console.log(`Connected successfully in ${Date.now() - start}ms`);
    
    const count = await prisma.user.count();
    console.log(`Total users in DB: ${count}`);
    
  } catch (error) {
    console.error("Failed to connect to database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
