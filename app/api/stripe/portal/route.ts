import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;
    const subscription = await subscriptionRepository.findByUserId(userId);

    if (!subscription?.stripeCustomerId) {
      return new NextResponse("Customer not found", { status: 404 });
    }

    const stripe = getStripe();
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/yui/settings`,
    });

    console.log(`[STRIPE_PORTAL] Portal session created for user ${userId}, customer ${subscription.stripeCustomerId}, subscription ${subscription.stripeSubscriptionId}, status ${subscription.status}`);

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("[STRIPE_PORTAL] Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
