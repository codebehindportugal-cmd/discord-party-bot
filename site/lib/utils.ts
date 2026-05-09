import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatGold(value: number) {
  return new Intl.NumberFormat("pt-PT").format(value) + " G";
}

export function formatMinutes(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (!h) return `${m}m`;
  return `${h}h ${m}m`;
}

export function requireBotApiKey(request: Request) {
  const expected = process.env.BOT_API_KEY;
  const provided = request.headers.get("x-api-key") || request.headers.get("authorization")?.replace("Bearer ", "");

  if (!expected) {
    return new Response(JSON.stringify({ error: "BOT_API_KEY is not configured" }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }

  if (provided !== expected) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { "content-type": "application/json" }
    });
  }

  return null;
}
