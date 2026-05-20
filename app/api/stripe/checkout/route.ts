import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { userRepository } from "@/lib/repositories/user.repository";
import { subscriptionRepository } from "@/lib/repositories/subscription.repository";

export async function POST(req: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return new NextResponse("Price ID is required", { status: 400 });
    }

    const user = await userRepository.findById(session.user.id);
    const subscription = await subscriptionRepository.findByUserId(session.user.id);

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if Stripe is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || stripeKey.trim() === "" || stripeKey.startsWith("sk_live_...")) {
      const mockUrl = `/member/checkout-mock?priceId=${priceId}`;
      return NextResponse.json({ url: mockUrl });
    }

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

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[STRIPE_CHECKOUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
