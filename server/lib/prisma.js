import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

// Ensure SQLite URLs start with 'file:' protocol
if (!databaseUrl.startsWith('file:') && !databaseUrl.includes('://')) {
  databaseUrl = `file:${databaseUrl}`;
}

const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
