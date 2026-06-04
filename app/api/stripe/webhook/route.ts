import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { subscriptionService } from "@/lib/services/subscription.service";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const eventObject = event.data.object as any;

  if (event.type === "checkout.session.completed") {
    const session = eventObject as Stripe.Checkout.Session;
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    ) as any;

    if (!session?.metadata?.userId) {
      return new NextResponse("User ID is missing in metadata", { status: 400 });
    }

    const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
    const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

    await subscriptionService.handleCheckoutCompleted(session.metadata.userId, {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      stripePriceId: subscription.items?.data?.[0]?.price?.id,
      status: subscription.status,
      currentPeriodEnd,
    });

    console.log(`[STRIPE_SUBSCRIPTION] Checkout completed: userId=${session.metadata.userId}, subscriptionId=${subscription.id}, customerId=${subscription.customer}, status=${subscription.status}`);
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = eventObject as any;
    const subscriptionId = invoice.subscription as string;
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;
      const currentPeriodEnd = periodEnd ? new Date(periodEnd * 1000) : null;

      await subscriptionRepository.update(subscription.id, { 
        currentPeriodEnd, 
        status: subscription.status,
        stripePriceId: subscription.items?.data?.[0]?.price?.id,
      });

      console.log(`[STRIPE_SUBSCRIPTION] Invoice paid: subscriptionId=${subscription.id}, customerId=${subscription.customer}, status=${subscription.status}`);
    }
  }
  
  if (event.type === "customer.subscription.deleted") {
    const subscription = eventObject as Stripe.Subscription;
    await subscriptionService.handleSubscriptionDeleted(subscription.id);
    console.log(`[STRIPE_SUBSCRIPTION] Subscription deleted: subscriptionId=${subscription.id}, customerId=${subscription.customer}, status=${subscription.status}`);
  }

  return new NextResponse(null, { status: 200 });
}
