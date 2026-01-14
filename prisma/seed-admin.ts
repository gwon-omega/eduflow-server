/**
 * EduFlow Super Admin Seed Script
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SUPER_ADMIN = {
  email: "super-admin@eduflow.com.np",
  password: "MAYAoftheworld123@#$",
  firstName: "Super",
  lastName: "Admin",
  subdomain: "super-admin",
  instituteName: "EduFlow Administration",
};

async function main() {
  console.log("👤 Seeding Super Admin...");
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

  // Surgical clear for Super Admin
  // Delete institutes owned by this email first to satisfy foreign key constraints
  await prisma.institute.deleteMany({ where: { owner: { email: SUPER_ADMIN.email } } });
  await prisma.user.deleteMany({ where: { email: SUPER_ADMIN.email } });
  // Also ensure no institute with the same subdomain exists
  await prisma.institute.deleteMany({ where: { subdomain: SUPER_ADMIN.subdomain } });

  const superAdmin = await prisma.user.create({
    data: {
      email: SUPER_ADMIN.email,
      password: hashedPassword,
      firstName: SUPER_ADMIN.firstName,
      lastName: SUPER_ADMIN.lastName,
      role: "super_admin",
      emailVerified: true,
      accountStatus: "active",
      ownedInstitutes: {
        create: {
          instituteName: SUPER_ADMIN.instituteName,
          subdomain: SUPER_ADMIN.subdomain,
          instituteNumber: "ADMIN-001",
          type: "UNIVERSITY",
          isActive: true,
          emailVerified: true,
          accountStatus: "active",
        },
      },
    },
  });

  console.log(`✅ Super Admin created: ${superAdmin.email}`);
  console.log(`✅ Super Admin Institute created: ${SUPER_ADMIN.subdomain}.eduflow.jeevanbhatt.com.np\n`);
}

main()
  .catch((e) => {
    console.error("Admin seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
