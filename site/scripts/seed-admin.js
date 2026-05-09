const { PrismaClient } = require('@prisma/client');
const { scryptSync, randomBytes } = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@partyloot.local').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || 'Admin12345!';
  const name = process.env.ADMIN_NAME || 'Administrador';

  await prisma.siteUser.upsert({
    where: { email },
    update: {
      name,
      role: 'ADMIN',
      passwordHash: hashPassword(password),
    },
    create: {
      email,
      name,
      role: 'ADMIN',
      passwordHash: hashPassword(password),
    },
  });

  console.log(`Conta admin pronta: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
