import prisma from "../../../core/database/prisma";
import { encryptObject, decryptObject } from "../../../core/utils/encryption";

export class PaymentSettingsService {

  async savePaymentConfig(instituteId: string, provider: string, credentials: any, userRole: string) {
    // 1. Validate Provider
    const validProviders = ["khalti", "esewa", "stripe", "global_ime"];
    if (!validProviders.includes(provider)) {
      throw new Error("Invalid payment provider");
    }

    // 2. Global IME Restriction (Super Admin Only)
    if (provider === "global_ime" && userRole !== "super_admin" && userRole !== "super-admin") {
      throw new Error("Global IME integration is only available for Super Admins");
    }

    // 3. Local Payment Constraint (Khalti XOR eSewa)
    // Only applies to Trial/Starter tiers (Professional+ can use both)
    if (provider === "khalti" || provider === "esewa") {
      // Get institute's subscription tier
      const institute = await prisma.institute.findUnique({
        where: { id: instituteId },
        select: { subscriptionTier: true }
      });

      const tier = institute?.subscriptionTier || 'trial';
      const isProfessionalOrAbove = tier === 'professional' || tier === 'enterprise';

      // Only enforce XOR for Trial/Starter tiers
      if (!isProfessionalOrAbove) {
        const otherProvider = provider === "khalti" ? "esewa" : "khalti";

        const existingConflict = await prisma.instituteIntegration.findUnique({
          where: {
            instituteId_provider: {
              instituteId,
              provider: otherProvider,
            },
          },
        });

        if (existingConflict && existingConflict.isActive) {
          throw new Error(`Cannot enable ${provider} when ${otherProvider} is active. Upgrade to Professional to use both gateways.`);
        }
      }
    }

    // 4. Encrypt Metadata
    const encryptedMetadata = encryptObject(credentials);

    // 5. Save/Update Configuration
    const integration = await prisma.instituteIntegration.upsert({
      where: {
        instituteId_provider: {
          instituteId,
          provider,
        },
      },
      update: {
        metadata: encryptedMetadata as any,
        isActive: true,
      },
      create: {
        instituteId,
        provider,
        metadata: encryptedMetadata as any,
        isActive: true,
        accessToken: "",
        refreshToken: "",
      },
    });

    return integration;
  }

  async getPaymentConfigs(instituteId: string) {
    const integrations = await prisma.instituteIntegration.findMany({
      where: {
        instituteId,
        provider: { in: ["khalti", "esewa", "stripe", "global_ime"] },
      },
      select: {
        provider: true,
        isActive: true,
        metadata: true,
        createdAt: true,
      }
    });

    // Handle decryption or return sanitized data
    return integrations.map(item => {
        let meta = null;
        if (item.metadata && typeof item.metadata === "string") {
            meta = decryptObject(item.metadata);
        } else {
            meta = item.metadata; // Fallback for existing plain JSON
        }

        return {
            provider: item.provider,
            isActive: item.isActive,
            createdAt: item.createdAt,
            // Return only public keys if necessary, or nothing for security
            hasKeys: !!meta
        };
    });
  }

  async getDecryptedMetadata(instituteId: string, provider: string) {
    const integration = await prisma.instituteIntegration.findUnique({
        where: { instituteId_provider: { instituteId, provider } }
    });

    if (!integration || !integration.metadata) return null;

    if (typeof integration.metadata === "string") {
        return decryptObject(integration.metadata);
    }
    return integration.metadata;
  }
}

export default new PaymentSettingsService();
