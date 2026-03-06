import { PrismaClient } from '@prisma/client';

const ADMIN_USER_ID = process.env.ADMIN_USER_ID ?? 'user_admin';
const WALLET_NETWORK = process.env.ADMIN_WALLET_NETWORK ?? 'polygon';
const WALLET_ADDRESS = process.env.ADMIN_WALLET_ADDRESS ?? '0x0000000000000000000000000000000000000000';
const INDIVIDUAL_REG_AMOUNT = Number(process.env.ADMIN_INDIVIDUAL_REG_AMOUNT ?? '10');
const TEAM_REG_AMOUNT = Number(process.env.ADMIN_TEAM_REG_AMOUNT ?? '50');

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: ADMIN_USER_ID },
    create: {
      id: ADMIN_USER_ID,
      email: process.env.ADMIN_EMAIL ?? 'admin@example.com',
      fullName: 'Admin',
      accountType: 'admin',
      status: 'active',
      wallet: {
        network: WALLET_NETWORK,
        address: WALLET_ADDRESS,
      },
      individualRegAmount: INDIVIDUAL_REG_AMOUNT,
      teamRegAmount: TEAM_REG_AMOUNT,
    },
    update: {
      accountType: 'admin',
      status: 'active',
      wallet: {
        network: WALLET_NETWORK,
        address: WALLET_ADDRESS,
      },
      individualRegAmount: INDIVIDUAL_REG_AMOUNT,
      teamRegAmount: TEAM_REG_AMOUNT,
    },
  });
  console.log('Admin user upserted:', ADMIN_USER_ID);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
