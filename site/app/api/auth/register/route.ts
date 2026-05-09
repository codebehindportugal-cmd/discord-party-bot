import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  const payload = await request.json();
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").toLowerCase().trim();
  const password = String(payload.password || "");

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Email inválido." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "A password deve ter pelo menos 8 caracteres." }, { status: 400 });
  }

  try {
    const existingUser = await prisma.siteUser.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "Já existe uma conta com este email." }, { status: 409 });
    }

    const user = await prisma.siteUser.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
        role: "USER"
      }
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({
      error: "Não foi possível criar a conta. Confirma a ligação à base de dados e corre as migrations Prisma.",
      detail: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
