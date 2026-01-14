/**
 * EduFlow Main Seed Orchestrator
 *
 * Runs:
 * 1. Admin seeding (Super Admin + Admin Institute)
 * 2. Institute seeding (300+ Nepal Institutes)
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting EduFlow Full Database Seeding...\n");

  // Global Clear
  console.log("🗑️  Performing global database cleanup...");
  await prisma.instituteJoinRequest.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.institute.deleteMany();
  await prisma.session.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleared\n");

  // Run Admin Seed
  console.log("➡️  Running Admin Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-admin.ts", { stdio: "inherit" });

  // Run Institutes Seed
  console.log("➡️  Running Institutes Seeding...");
  execSync("npx ts-node -r tsconfig-paths/register prisma/seed-institutes.ts", { stdio: "inherit" });

  console.log("\n✨ Full Seeding Complete!");
}

main()
  .catch((e) => {
    console.error("Main seed orchestrator failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
