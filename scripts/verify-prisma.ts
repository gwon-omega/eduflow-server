import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import prisma from '../src/core/database/prisma';

async function verify() {
  console.log('Testing application Prisma client with driver adapter...');
  console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20));

  try {
    const start = Date.now();
    // Test a basic count query
    const userCount = await prisma.user.count();
    const duration = Date.now() - start;
    console.log(`✅ SUCCESS: Found ${userCount} users in ${duration}ms`);
  } catch (err: any) {
    console.error(`❌ FAILED: ${err.message}`);
    // If it fails with TLS, let's see if generic pg works with the same settings
    console.log('--- Attempting fallback check with raw pg ---');
  } finally {
    await prisma.$disconnect();
  }
}

verify();
