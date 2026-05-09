import fs from "fs";
import path from "path";

let loaded = false;

export function loadLocalEnv() {
  if (loaded) return;
  loaded = true;

  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "site", ".env")
  ];

  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;

    const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

export function getServerEnv(key: string) {
  loadLocalEnv();
  return process.env[key]?.trim();
}
