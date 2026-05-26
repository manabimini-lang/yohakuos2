const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== Testing Prisma Json Query ===");
  try {
    // 1. Create a dummy AIJob
    const job = await prisma.aIJob.create({
      data: {
        userId: "test-user-id",
        jobType: "content_analysis",
        status: "pending",
        input: { contentItemId: "test-content-id" }
      }
    });
    console.log("Created dummy job:", job);

    // 2. Try to query using input with path/equals (the query used in ai-processing.ts)
    const foundJobs = await prisma.aIJob.findMany({
      where: {
        userId: "test-user-id",
        jobType: "content_analysis",
        input: { path: ["contentItemId"], equals: "test-content-id" },
        status: { in: ["pending", "processing"] }
      }
    });
    console.log("Found jobs with path/equals:", foundJobs);

    // 3. Clean up
    await prisma.aIJob.deleteMany({
      where: { userId: "test-user-id" }
    });
    console.log("Cleaned up successfully");

  } catch (error) {
    console.error("Prisma Json query FAILED:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
