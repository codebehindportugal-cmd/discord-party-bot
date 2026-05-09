import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const allowedFeatures = new Set(["antispam", "albion"]);

export async function POST(request: Request) {
  const access = await getAdminSession();
  if (!access.isAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payload = await request.json();
  const serverId = String(payload.serverId || "");
  const key = String(payload.key || "");
  const enabled = Boolean(payload.enabled);

  if (!serverId || !allowedFeatures.has(key)) {
    return NextResponse.json({ error: "Invalid feature" }, { status: 400 });
  }

  const config = key === "antispam"
    ? {
        messageLimit: Number(payload.config?.messageLimit || 5),
        timeWindowSeconds: Number(payload.config?.timeWindowSeconds || 10),
      }
    : {};

  const feature = await prisma.serverFeature.upsert({
    where: {
      serverId_key: {
        serverId,
        key,
      },
    },
    create: {
      serverId,
      key,
      enabled,
      config,
    },
    update: {
      enabled,
      config,
    },
  });

  await prisma.auditLog.create({
    data: {
      serverId,
      userId: access.userId,
      action: "ADMIN_SET_FEATURE",
      metadata: { key, enabled, config },
    },
  }).catch(() => null);

  return NextResponse.json({ ok: true, feature });
}
