import { prisma } from "@/lib/prisma";

export class SubscriptionRepository {
  async findByUserId(userId: string) {
    return prisma.subscription.findUnique({
      where: { userId },
    });
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    return prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });
  }

  async upsert(userId: string, data: {
    stripeCustomerId: string;
    stripeSubscriptionId?: string | null;
    stripePriceId?: string | null;
    status: string;
    currentPeriodEnd?: Date | null;
  }) {
    return prisma.subscription.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async update(stripeSubscriptionId: string, data: any) {
    return prisma.subscription.update({
      where: { stripeSubscriptionId },
      data,
    });
  }
}

export const subscriptionRepository = new SubscriptionRepository();
