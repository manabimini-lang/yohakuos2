import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const isDryRun = process.argv.includes("--dry-run");

  console.log(`Starting API Key Migration... ${isDryRun ? "[DRY-RUN]" : ""}`);

  // Count Audit
  const totalApiKeys = await prisma.userApiKey.count();
  const totalSettings = await prisma.userAISettings.count();
  console.log(`[AUDIT] Total UserApiKeys: ${totalApiKeys}`);
  console.log(`[AUDIT] Total UserAISettings before: ${totalSettings}`);

  const apiKeys = await prisma.userApiKey.findMany({
    orderBy: { createdAt: "asc" },
  });

  const migratedUserIds = new Set<string>();
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  // Group by user
  const keysByUser = apiKeys.reduce((acc, key) => {
    if (!acc[key.userId]) acc[key.userId] = [];
    acc[key.userId].push(key);
    return acc;
  }, {} as Record<string, typeof apiKeys>);

  for (const userId of Object.keys(keysByUser)) {
    try {
      const userKeys = keysByUser[userId];
      
      // Preference: gemini_oauth > gemini
      const oauthKey = userKeys.find((k) => k.apiProvider === "gemini_oauth");
      const legacyKey = userKeys.find((k) => k.apiProvider === "gemini");
      const targetKey = oauthKey || legacyKey;

      if (!targetKey) {
        skipped++;
        continue;
      }

      const existingSetting = await prisma.userAISettings.findUnique({
        where: { userId },
      });

      if (existingSetting?.encryptedApiKey) {
        console.log(`[SKIP] User ${userId} already has an encrypted API key in UserAISettings.`);
        skipped++;
        continue;
      }

      if (!isDryRun) {
        await prisma.userAISettings.upsert({
          where: { userId },
          update: {
            encryptedApiKey: targetKey.encryptedKey,
            provider: targetKey.apiProvider,
            isEnabled: true,
          },
          create: {
            userId,
            encryptedApiKey: targetKey.encryptedKey,
            provider: targetKey.apiProvider,
            isEnabled: true,
          },
        });
      }

      console.log(`[${isDryRun ? "DRY-RUN" : "MIGRATED"}] User ${userId} from provider ${targetKey.apiProvider}`);
      migrated++;
      migratedUserIds.add(userId);
    } catch (error) {
      console.error(`[FAILED] User ${userId}:`, error);
      failed++;
    }
  }

  // Final Audit
  const finalSettingsCount = await prisma.userAISettings.count();
  console.log(`\n=== Migration Report ===`);
  console.log(`[MIGRATION] migrated=${migrated}`);
  console.log(`[MIGRATION] skipped=${skipped}`);
  console.log(`[MIGRATION] failed=${failed}`);
  console.log(`[AUDIT] Total UserAISettings after: ${finalSettingsCount}`);
  console.log(`[AUDIT] Expected difference: +${migrated} (if records didn't exist before)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
