import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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

    await prisma.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0].price.id,
        stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        role: "PAID_MEMBER",
      },
    });
  }

  if (event.type === "invoice.payment_succeeded") {
    const invoice = eventObject as any;
    const subscriptionId = invoice.subscription as string;
    
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId) as any;
      const periodEnd = subscription.current_period_end ?? subscription.items?.data?.[0]?.current_period_end;

      await prisma.user.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        },
      });
    }
  }
  
  if (event.type === "customer.subscription.deleted") {
    const subscription = eventObject as Stripe.Subscription;
    await prisma.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        role: "FREE_MEMBER",
        stripeSubscriptionId: null,
        stripePriceId: null,
        stripeCurrentPeriodEnd: null,
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
