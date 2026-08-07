import prisma from './lib/prisma.js';

async function clearDb() {
  console.log('Clearing database tables...');
  await prisma.todo.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database cleared successfully.');
}

clearDb().catch(console.error).finally(() => prisma.$disconnect());
