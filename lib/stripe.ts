import Stripe from "stripe";

let _stripe: Stripe | null = null;

/** Normalizes a Vercel environment value without ever exposing the secret. */
export function getStripeSecretKey(): string | undefined {
  const raw = process.env.STRIPE_SECRET_KEY?.trim();
  if (!raw) return undefined;
  const unquoted = raw.replace(/^(["'])(.*)\1$/, "$2").trim();
  return unquoted || undefined;
}

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = getStripeSecretKey();
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(key, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }
  return _stripe;
}
