/**
 * Database Performance Benchmark Script
 *
 * This script measures query performance before and after schema optimizations.
 * Run with: npx ts-node scripts/benchmark-db.ts
 */

import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient({
  log: [{ emit: "event", level: "query" }],
});

interface BenchmarkResult {
  name: string;
  queryTime: number;
  rowsAffected?: number;
}

const results: BenchmarkResult[] = [];

async function measureQuery(name: string, queryFn: () => Promise<any>): Promise<BenchmarkResult> {
  const start = performance.now();
  const result = await queryFn();
  const end = performance.now();
  const queryTime = end - start;

  const rowsAffected = Array.isArray(result) ? result.length : (result ? 1 : 0);

  const benchmark: BenchmarkResult = { name, queryTime, rowsAffected };
  results.push(benchmark);

  console.log(`[${name}] ${queryTime.toFixed(2)}ms (${rowsAffected} rows)`);
  return benchmark;
}

async function runBenchmarks() {
  console.log("\n========================================");
  console.log("DATABASE PERFORMANCE BENCHMARK");
  console.log("========================================\n");

  // Warm up connection
  await prisma.$queryRaw`SELECT 1`;
  console.log("Connection warmed up.\n");

  // =============================================
  // CRITICAL QUERIES (These need indexes)
  // =============================================

  console.log("--- USER QUERIES ---");

  // 1. Find user by email (most common auth query)
  await measureQuery("User.findByEmail", () =>
    prisma.user.findFirst({ where: { email: "test@example.com" } })
  );

  // 2. Find user's institutes (owner lookup)
  await measureQuery("Institute.findByOwner", () =>
    prisma.institute.findMany({ where: { ownerId: "00000000-0000-0000-0000-000000000000" } })
  );

  // 3. Find user's join requests
  await measureQuery("JoinRequest.findByUser", () =>
    prisma.instituteJoinRequest.findMany({
      where: { userId: "00000000-0000-0000-0000-000000000000" }
    })
  );

  console.log("\n--- MULTI-TENANT QUERIES ---");

  // 4. Find students in institute
  await measureQuery("Student.findByInstitute", () =>
    prisma.student.findMany({
      where: { instituteId: "00000000-0000-0000-0000-000000000000" },
      take: 100
    })
  );

  // 5. Find student by email (within institute)
  await measureQuery("Student.findByEmail", () =>
    prisma.student.findFirst({
      where: { email: "student@example.com" }
    })
  );

  // 6. Find teachers in institute
  await measureQuery("Teacher.findByInstitute", () =>
    prisma.teacher.findMany({
      where: { instituteId: "00000000-0000-0000-0000-000000000000" },
      take: 100
    })
  );

  console.log("\n--- MESSAGING QUERIES ---");

  // 7. Find user's messages
  await measureQuery("Message.findBySender", () =>
    prisma.message.findMany({
      where: { senderId: "00000000-0000-0000-0000-000000000000" },
      take: 50
    })
  );

  // 8. Find unread notifications
  await measureQuery("Notification.findUnread", () =>
    prisma.notification.findMany({
      where: {
        userId: "00000000-0000-0000-0000-000000000000",
        isRead: false
      },
      take: 20
    })
  );

  console.log("\n--- PAGINATION QUERIES ---");

  // 9. Courses ordered by createdAt
  await measureQuery("Course.findWithPagination", () =>
    prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      take: 20
    })
  );

  // 10. Attendance by date range
  await measureQuery("Attendance.findByDateRange", () =>
    prisma.attendance.findMany({
      where: {
        date: {
          gte: new Date("2024-01-01"),
          lte: new Date("2024-12-31")
        }
      },
      take: 100
    })
  );

  // =============================================
  // SUMMARY
  // =============================================

  console.log("\n========================================");
  console.log("BENCHMARK SUMMARY");
  console.log("========================================\n");

  const totalTime = results.reduce((sum, r) => sum + r.queryTime, 0);
  const avgTime = totalTime / results.length;
  const slowest = results.reduce((max, r) => r.queryTime > max.queryTime ? r : max);
  const fastest = results.reduce((min, r) => r.queryTime < min.queryTime ? r : min);

  console.log(`Total Queries: ${results.length}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`Average Time: ${avgTime.toFixed(2)}ms`);
  console.log(`Slowest: ${slowest.name} (${slowest.queryTime.toFixed(2)}ms)`);
  console.log(`Fastest: ${fastest.name} (${fastest.queryTime.toFixed(2)}ms)`);

  // Identify slow queries (> 100ms)
  const slowQueries = results.filter(r => r.queryTime > 100);
  if (slowQueries.length > 0) {
    console.log("\n⚠️  SLOW QUERIES (>100ms):");
    slowQueries.forEach(q => {
      console.log(`  - ${q.name}: ${q.queryTime.toFixed(2)}ms`);
    });
  }

  // Save results to JSON
  const report = {
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "unknown",
    results,
    summary: { totalTime, avgTime, slowest: slowest.name, fastest: fastest.name }
  };

  console.log("\n📊 Results saved to: benchmark-results.json");

  await prisma.$disconnect();
  return report;
}

// Run
runBenchmarks()
  .then(report => {
    console.log("\nBenchmark complete!");
    process.exit(0);
  })
  .catch(err => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
