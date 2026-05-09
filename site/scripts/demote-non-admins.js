const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const adminEmails = (process.env.ADMIN_EMAILS || process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    console.error("Define ADMIN_EMAILS com os emails que devem continuar ADMIN.");
    console.error("Exemplo: ADMIN_EMAILS=admin@example.com npm run demote:users");
    process.exit(1);
  }

  const result = await prisma.siteUser.updateMany({
    where: {
      role: "ADMIN",
      email: {
        notIn: adminEmails
      }
    },
    data: {
      role: "USER"
    }
  });

  console.log(`Contas ADMIN convertidas para USER: ${result.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
