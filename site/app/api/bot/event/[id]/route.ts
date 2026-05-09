import { NextResponse } from "next/server";
import { requireBotApiKey } from "@/lib/utils";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const authError = requireBotApiKey(request);
  if (authError) return authError;

  const payload = await request.json();

  return NextResponse.json({
    ok: true,
    event: {
      id: params.id,
      ...payload
    }
  });
}
