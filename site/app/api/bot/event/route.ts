import { NextResponse } from "next/server";
import { requireBotApiKey } from "@/lib/utils";

export async function POST(request: Request) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const payload = await request.json();

  return NextResponse.json({
    ok: true,
    event: {
      id: payload.id ?? `evt_${Date.now()}`,
      ...payload
    }
  }, { status: 201 });
}
