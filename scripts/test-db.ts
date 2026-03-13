import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testPrismaConnection(name: string, url: string | undefined) {
  if (!url) {
    console.log(`[${name}] URL not found in .env`);
    return;
  }

  console.log(`[${name}] Testing: ${url.replace(/:[^:@]+@/, ':***@')}`);

  // Use a temporary environment variable to override DATABASE_URL for this test
  process.env.TEST_DATABASE_URL = url;

  const prisma = new PrismaClient({
    datasourceUrl: url,
    log: ['error'],
  });

  try {
    const start = Date.now();
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    console.log(`[${name}] SUCCESS (${duration}ms)`);
  } catch (err: any) {
    console.error(`[${name}] FAILED: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  const dbUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  await testPrismaConnection('DATABASE_URL (Pooler)', dbUrl);

  // Try adding sslmode=require to Pooler if it failed
  const poolerWithSsl = dbUrl + (dbUrl?.includes('?') ? '&' : '?') + 'sslmode=require';
  await testPrismaConnection('DATABASE_URL + sslmode=require', poolerWithSsl);

  await testPrismaConnection('DIRECT_URL (Direct)', directUrl);

  // Try adding sslmode=require to Direct
  const directWithSsl = directUrl + (directUrl?.includes('?') ? '&' : '?') + 'sslmode=require';
  await testPrismaConnection('DIRECT_URL + sslmode=require', directWithSsl);
}

run();
