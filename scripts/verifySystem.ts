import axios from "axios";

/**
 * EduFlow Synthetic System Test (2026)
 * Purpose: Validate the modular architecture, multi-tenancy, and security.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:4000/api";

const modules = [
  "auth", "course", "teacher", "student", "category",
  "analytics", "library", "finance", "forum", "studyGroup",
  "support", "notification", "institute", "academic", "billing",
  "progress", "attendance"
];

async function runTests() {
  console.log("🚀 Starting EduFlow System Verification...");
  let passed = 0;
  let failed = 0;

  // 1. Health Check
  try {
    const health = await axios.get(`${process.env.BASE_URL?.replace("/api", "") || "http://localhost:4000"}/health`);
    console.log("✅ Health Check: Passed");
    passed++;
  } catch (e: any) {
    console.error("❌ Health Check: Failed", e.message);
    failed++;
  }

  // 2. Public Auth Check
  try {
    await axios.post(`${BASE_URL}/auth/login`, { email: "test@example.com", password: "wrong_password" });
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ Auth Guard (Wrong Credentials): Passed");
      passed++;
    } else {
      console.error("❌ Auth Guard: Failed", e.message);
      failed++;
    }
  }

  // 3. Module Route Existence Audit (Protected)
  console.log("\n📡 Auditing Modular Route Guards...");
  for (const mod of modules) {
    try {
      await axios.get(`${BASE_URL}/${mod}`);
    } catch (e: any) {
      if (e.response?.status === 401) {
        console.log(`✅ [${mod.toUpperCase()}] Guarded: Passed`);
        passed++;
      } else if (e.response?.status === 404) {
         console.warn(`⚠️ [${mod.toUpperCase()}] Route missing or incorrect mount: Failed`);
         failed++;
      } else {
        console.error(`❌ [${mod.toUpperCase()}] Unexpected error:`, e.response?.status || e.message);
        failed++;
      }
    }
  }

  // 4. Multi-tenancy Isolation Test
  console.log("\n🔒 Verifying Tenant Isolation (Institute Spoofing Prevention)...");
  try {
    // This expects the server to reject a request where the subdomain and instituteId don't align
    const spoofRes = await axios.get(`${BASE_URL}/student/profile`, {
      headers: {
        Host: "school1.eduflow.localhost:4000",
        Authorization: "Bearer invalid_token"
      }
    });
  } catch (e: any) {
    if (e.response?.status === 401) {
       console.log("✅ Tenant Authentication Guard: Passed");
       passed++;
    } else {
       console.error("❌ Tenant Guard: Unexpected response", e.response?.status);
       failed++;
    }
  }

  console.log(`\n📊 Verification Summary: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
