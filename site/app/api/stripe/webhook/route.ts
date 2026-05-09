import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();

  return NextResponse.json({
    received: true,
    bytes: body.length,
    note: "Validar assinatura STRIPE_WEBHOOK_SECRET antes de ativar em produção."
  });
}
