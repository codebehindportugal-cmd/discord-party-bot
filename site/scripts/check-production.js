const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const buildIdPath = path.join(root, ".next", "BUILD_ID");
const serverPath = path.join(root, "server.js");
const publicPath = path.join(root, "public");
const envPath = path.join(root, ".env");

if (fs.existsSync(envPath)) {
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

const checks = [
  {
    label: "server.js",
    ok: fs.existsSync(serverPath),
    fix: "Confirma que o deploy Git trouxe o ficheiro site/server.js."
  },
  {
    label: "public directory",
    ok: fs.existsSync(publicPath),
    fix: "Cria a pasta site/public ou faz pull da versao atual do repo."
  },
  {
    label: ".next build",
    ok: fs.existsSync(buildIdPath),
    fix: "Corre npm run build dentro da pasta site."
  },
  {
    label: "DATABASE_URL",
    ok: Boolean(process.env.DATABASE_URL),
    fix: "Define DATABASE_URL nas variaveis Node.js do Plesk ou no site/.env."
  },
  {
    label: "NEXTAUTH_URL",
    ok: Boolean(process.env.NEXTAUTH_URL),
    fix: "Define NEXTAUTH_URL com o dominio publico do site."
  },
  {
    label: "NEXTAUTH_SECRET",
    ok: Boolean(process.env.NEXTAUTH_SECRET),
    fix: "Define NEXTAUTH_SECRET com uma string longa e privada."
  },
  {
    label: "DISCORD_TOKEN",
    ok: Boolean(process.env.DISCORD_TOKEN),
    fix: "Define DISCORD_TOKEN no site/.env para o botao Sincronizar servidores."
  }
];

let failed = false;

for (const check of checks) {
  if (check.ok) {
    console.log(`OK ${check.label}`);
  } else {
    failed = true;
    console.error(`FAIL ${check.label}: ${check.fix}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("Site production check passou.");
