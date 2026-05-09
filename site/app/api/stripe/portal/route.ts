import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    error: "Stripe portal ainda não está ligado. Configura STRIPE_SECRET_KEY e guarda customerId por servidor."
  }, { status: 501 });
}
