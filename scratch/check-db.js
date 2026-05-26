const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== DB Connection Check ===");
  try {
    // 1. Check extension pgvector
    const extensionCheck = await prisma.$queryRaw`
      SELECT extname FROM pg_extension WHERE extname = 'vector';
    `;
    console.log("pgvector extension check:", extensionCheck);

    // 2. Check content_items count and embedding status
    const contentItems = await prisma.contentItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`\n=== ContentItems (Total count: ${await prisma.contentItem.count()}) ===`);
    contentItems.forEach(item => {
      console.log(`ID: ${item.id}`);
      console.log(`Title: ${item.title}`);
      console.log(`Type: ${item.type}`);
      console.log(`AI Status: ${item.aiStatus}`);
      console.log(`Has Summary: ${!!item.summary}`);
      console.log(`Has AI Tags: ${item.aiTags && item.aiTags.length > 0}`);
      console.log(`Has Embedding: ${item.embeddingDimensions !== null}`);
      console.log(`Embedding model: ${item.embeddingModel}`);
      console.log(`Created At: ${item.createdAt}`);
      console.log('-----------------------------------');
    });

    // 3. Check AIJob status
    const aiJobs = await prisma.aIJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log(`\n=== AIJobs (Total count: ${await prisma.aIJob.count()}) ===`);
    aiJobs.forEach(job => {
      console.log(`ID: ${job.id}`);
      console.log(`Type: ${job.jobType}`);
      console.log(`Status: ${job.status}`);
      console.log(`Last Error: ${job.lastError}`);
      console.log(`Retry Count: ${job.retryCount}`);
      console.log(`Created At: ${job.createdAt}`);
      console.log('-----------------------------------');
    });

    // 4. Check user custom API keys
    const userKeys = await prisma.userApiKey.findMany();
    console.log(`\n=== User API Keys (Count: ${userKeys.length}) ===`);
    userKeys.forEach(key => {
      console.log(`User ID: ${key.userId}`);
      console.log(`Provider: ${key.apiProvider}`);
      console.log('-----------------------------------');
    });

  } catch (error) {
    console.error("Error during DB check:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
