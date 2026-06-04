import { subscriptionRepository } from "@/lib/repositories/subscription.repository";
import { userRepository } from "@/lib/repositories/user.repository";
import { ROLE, PLAN } from "@/lib/constants/plan";

export class SubscriptionService {
  /**
   * Check if a user has an active subscription based on their status
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const sub = await subscriptionRepository.findByUserId(userId);
    if (!sub) return false;

    return ["active", "trialing"].includes(sub.status);
  }

  /**
   * Downgrades user role if their subscription is deleted/canceled
   */
  async handleSubscriptionDeleted(stripeSubscriptionId: string) {
    const sub = await subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (sub) {
      await userRepository.updateRole(sub.userId, ROLE.FREE_MEMBER);
      await userRepository.updatePlan(sub.userId, PLAN.FREE);
      await subscriptionRepository.update(stripeSubscriptionId, { status: "canceled" });
    }
  }

  /**
   * Updates subscription and synchronizes user role based on status
   */
  async handleSubscriptionUpdated(
    stripeSubscriptionId: string, 
    status: string, 
    currentPeriodEnd: Date | null, 
    stripePriceId?: string
  ) {
    const sub = await subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!sub) return;

    await subscriptionRepository.update(stripeSubscriptionId, {
      status,
      currentPeriodEnd,
      stripePriceId,
    });

    if (["active", "trialing"].includes(status)) {
      await userRepository.updateRole(sub.userId, ROLE.PAID_MEMBER);
      await userRepository.updatePlan(sub.userId, PLAN.PREMIUM);
    } else {
      await userRepository.updateRole(sub.userId, ROLE.FREE_MEMBER);
      await userRepository.updatePlan(sub.userId, PLAN.FREE);
    }
  }

  /**
   * Promotes user role and saves subscription
   */
  async handleCheckoutCompleted(userId: string, subscriptionData: any) {
    await userRepository.updateRole(userId, ROLE.PAID_MEMBER);
    await userRepository.updatePlan(userId, PLAN.PREMIUM);
    await subscriptionRepository.upsert(userId, {
      ...subscriptionData,
      status: "active",
    });
  }
}

export const subscriptionService = new SubscriptionService();
