import crypto from "crypto";

/**
 * Academic Integrity Service
 *
 * Provides cryptographic verification for sensitive academic records (Results/Grades).
 * Prevents unauthorized tampering of student performance data.
 */
export class AcademicIntegrityService {
  /**
   * Generates a unique verification hash for an assessment result.
   */
  static generateResultHash(studentId: string, assessmentId: string, marks: number): string {
    const secret = process.env.RESULT_VERIFICATION_SECRET || "default_academic_secret";
    const data = `${studentId}:${assessmentId}:${marks}`;

    return crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("hex");
  }

  /**
   * Verifies if a stored result hash matches the current data.
   */
  static verifyResultIntegrity(studentId: string, assessmentId: string, marks: number, hash: string): boolean {
    const recomputedHash = this.generateResultHash(studentId, assessmentId, marks);
    return recomputedHash === hash;
  }
}

export default AcademicIntegrityService;
