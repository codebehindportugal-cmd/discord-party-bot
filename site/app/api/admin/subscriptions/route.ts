import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const planDefaults = {
  FREE: { maxEvents: 1, maxPlayers: 5, maxGames: 1, priceMonthly: 0 },
  PRO: { maxEvents: 999, maxPlayers: 20, maxGames: 2, priceMonthly: 9 },
  PREMIUM: { maxEvents: 99999, maxPlayers: 99999, maxGames: 99999, priceMonthly: 19 }
};

export async function POST(request: Request) {
  const access = await getAdminSession();
  if (!access.isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const plan = payload.plan as "FREE" | "PRO" | "PREMIUM";
  const paymentMethod = payload.paymentMethod || "MANUAL";
  const paymentReference = payload.paymentReference || null;
  const amount = Number(payload.amount || 0);
  const amountCents = Math.max(0, Math.round(amount * 100));
  const planExpiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  const defaults = planDefaults[plan] || planDefaults.FREE;

  try {
    const subscriptionPlan = await prisma.subscriptionPlan.upsert({
      where: { name: plan },
      update: defaults,
      create: { name: plan, ...defaults }
    });

    const server = await prisma.server.update({
      where: { id: payload.serverId },
      data: {
        plan,
        planExpiresAt
      }
    });

    const activeSubscription = await prisma.subscription.findFirst({
      where: { serverId: server.id, status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
      orderBy: { createdAt: "desc" }
    });

    if (activeSubscription) {
      await prisma.subscription.update({
        where: { id: activeSubscription.id },
        data: {
          planId: subscriptionPlan.id,
          status: "ACTIVE",
          currentPeriodEnd: planExpiresAt,
          paymentMethod,
          paymentReference
        }
      });
    } else {
      await prisma.subscription.create({
        data: {
          serverId: server.id,
          planId: subscriptionPlan.id,
          status: "ACTIVE",
          currentPeriodEnd: planExpiresAt,
          paymentMethod,
          paymentReference
        }
      });
    }

    if (amountCents > 0) {
      await prisma.invoice.create({
        data: {
          serverId: server.id,
          amount: amountCents,
          paymentMethod,
          paymentReference,
          paidAt: new Date()
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        serverId: server.id,
        userId: access.userId,
        action: "ADMIN_SET_SUBSCRIPTION",
        metadata: {
          plan,
          planExpiresAt: payload.expiresAt || null,
          paymentMethod,
          paymentReference,
          amount
        }
      }
    });

    return NextResponse.json({ ok: true, server });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
