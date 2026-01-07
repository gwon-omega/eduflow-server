import Stripe from "stripe";
import paymentSettingsService from "./paymentSettings.service";

class StripeService {
  private getClient(apiKey: string) {
    return new Stripe(apiKey, {
      // apiVersion: "2024-12-18.acacia", // Removed to use default or avoid mismatch
    });
  }

  private async getInstituteCredentials(instituteId?: string) {
    if (!instituteId) return process.env.STRIPE_SECRET_KEY || "";

    const meta = await paymentSettingsService.getDecryptedMetadata(instituteId, "stripe");

    if (meta && meta.secretKey) {
      return meta.secretKey;
    }

    return process.env.STRIPE_SECRET_KEY || "";
  }

  async createPaymentIntent(amount: number, currency: string = "usd", metadata: any = {}, instituteId?: string) {
    const secretKey = await this.getInstituteCredentials(instituteId);

    if (!secretKey) throw new Error("Stripe configuration missing for this institute");

    const stripe = this.getClient(secretKey);

    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });
  }

  async constructEvent(payload: string | Buffer, signature: string, instituteId?: string) {
    let webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

    if (instituteId) {
        const meta = await paymentSettingsService.getDecryptedMetadata(instituteId, "stripe");
        if (meta && meta.webhookSecret) {
            webhookSecret = meta.webhookSecret;
        }
    }

    if (!webhookSecret) {
      throw new Error("Stripe webhook secret missing");
    }

    const stripe = this.getClient(process.env.STRIPE_SECRET_KEY || "");
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export default new StripeService();
