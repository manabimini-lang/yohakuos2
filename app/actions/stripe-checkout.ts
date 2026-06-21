"use server";

import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";
import { checkActionRateLimit } from "@/lib/rate-limit-action";
import { headers } from "next/headers";

interface CheckoutActionParams {
  priceId: string;
  turnstileToken: string;
}

export async function createStripeCheckoutSession({ priceId, turnstileToken }: CheckoutActionParams) {
  try {
    // 1. IP Rate Limiting
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "127.0.0.1";
    const isAllowed = await checkActionRateLimit(ip);

    if (!isAllowed) {
      return { 
        success: false, 
        error: "アクセスを確認できませんでした。しばらくしてからお試しください。" 
      };
    }

    // 2. Turnstile Verification
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error("[STRIPE_CHECKOUT] TURNSTILE_SECRET_KEY is missing");
      return { success: false, error: "サーバー設定エラーが発生しました。" };
    }

    if (!turnstileToken) {
      return { 
        success: false, 
        error: "アクセスを確認できませんでした。しばらくしてからお試しください。" 
      };
    }

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", turnstileToken);
    formData.append("remoteip", ip);

    const turnstileResponse = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const turnstileData = await turnstileResponse.json();

    if (!turnstileData.success) {
      console.warn(`[STRIPE_CHECKOUT] Turnstile verification failed for IP ${ip}:`, turnstileData.errorCount);
      return { 
        success: false, 
        error: "アクセスを確認できませんでした。しばらくしてからお試しください。" 
      };
    }

    // 3. User Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "認証が必要です。" };
    }

    const user = await userRepository.findById(session.user.id);
    if (!user) {
      return { success: false, error: "ユーザーが見つかりません。" };
    }

    const subscription = await subscriptionRepository.findByUserId(session.user.id);

    if (subscription && ["active", "trialing", "past_due"].includes(subscription.status)) {
      console.warn(`[STRIPE_CHECKOUT] User ${session.user.id} already has an active subscription`);
      return { success: false, error: "すでに有効なサブスクリプションがあります。" };
    }

    // 4. Stripe Configuration Check
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error("[STRIPE_CHECKOUT] STRIPE_SECRET_KEY is missing");
      return { success: false, error: "サーバー設定エラーが発生しました。" };
    }

    // 5. Stripe Customer & Session Creation
    const stripe = getStripe();
    let stripeCustomerId = subscription?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await subscriptionRepository.upsert(user.id, {
        stripeCustomerId,
        status: "incomplete",
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXTAUTH_URL}/member/settings?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/member/settings?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    console.log(`[STRIPE_CHECKOUT] Checkout session created for user ${user.id}, customer ${stripeCustomerId}`);

    return { success: true, url: checkoutSession.url };

  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return { success: false, error: "通信中にエラーが発生しました。" };
  }
}
