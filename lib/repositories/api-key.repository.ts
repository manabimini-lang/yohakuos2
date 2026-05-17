import { prisma } from "@/lib/prisma";

export class ApiKeyRepository {
  async findByUserIdAndProvider(userId: string, apiProvider: string = "gemini") {
    return prisma.userApiKey.findUnique({
      where: {
        userId_apiProvider: {
          userId,
          apiProvider,
        },
      },
    });
  }

  async upsert(userId: string, encryptedKey: string, apiProvider: string = "gemini") {
    return prisma.userApiKey.upsert({
      where: {
        userId_apiProvider: {
          userId,
          apiProvider,
        },
      },
      update: { encryptedKey },
      create: {
        userId,
        apiProvider,
        encryptedKey,
      },
    });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
