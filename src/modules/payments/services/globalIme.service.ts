import crypto from "crypto";
import paymentSettingsService from "./paymentSettings.service";

class GlobalImeService {
  private gatewayUrl: string;

  constructor() {
    this.gatewayUrl = process.env.NODE_ENV === "production"
      ? "https://secureacceptance.cybersource.com/pay"
      : "https://testsecureacceptance.cybersource.com/pay";
  }

  private async getCredentials(instituteId?: string) {
    const meta = await paymentSettingsService.getDecryptedMetadata(instituteId || "SYSTEM", "global_ime");

    if (meta) {
      return {
        accessKey: meta.accessKey || "",
        profileId: meta.profileId || "",
        secretKey: meta.secretKey || "",
      };
    }

    return {
      accessKey: process.env.GLOBAL_IME_ACCESS_KEY || "",
      profileId: process.env.GLOBAL_IME_PROFILE_ID || "",
      secretKey: process.env.GLOBAL_IME_SECRET_KEY || "",
    };
  }

  sign(params: Record<string, string>, secretKey: string) {
    const sortedKeys = Object.keys(params).sort();
    const dataToSign = sortedKeys.map(key => `${key}=${params[key]}`).join(",");

    return crypto
      .createHmac("sha256", secretKey)
      .update(dataToSign)
      .digest("base64");
  }

  async getPaymentParams(
    amount: number,
    transactionUuid: string,
    referenceNumber: string,
    currency: string = "NPR",
    instituteId?: string
  ) {
    const creds = await this.getCredentials(instituteId);

    if (!creds.accessKey || !creds.profileId || !creds.secretKey) {
        throw new Error("Global IME configuration missing");
    }

    const params: Record<string, string> = {
      access_key: creds.accessKey,
      profile_id: creds.profileId,
      transaction_uuid: transactionUuid,
      signed_field_names: "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency",
      unsigned_field_names: "",
      signed_date_time: new Date().toISOString().split(".")[0] + "Z", // Format: YYYY-MM-DDThh:mm:ssZ
      locale: "en",
      transaction_type: "sale",
      reference_number: referenceNumber,
      amount: amount.toFixed(2),
      currency: currency,
    };

    params.signature = this.sign(params, creds.secretKey);
    params.url = this.gatewayUrl;

    return params;
  }

  async verifyResponse(response: any, instituteId?: string) {
      const creds = await this.getCredentials(instituteId);
      const signature = response.signature;
      const signedFieldNames = response.signed_field_names.split(",");

      const paramsToSign: Record<string, string> = {};
      signedFieldNames.forEach((field: string) => {
          paramsToSign[field] = response[field];
      });

      const calculatedSignature = this.sign(paramsToSign, creds.secretKey);

      return calculatedSignature === signature && response.decision === "ACCEPT";
  }
}

export default new GlobalImeService();
