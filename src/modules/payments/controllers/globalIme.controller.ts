import { Response, Request } from "express";
import globalImeService from "../services/globalIme.service";

export const initiateGlobalImePayment = async (req: Request, res: Response) => {
  try {
    const { amount, transactionUuid, referenceNumber, currency } = req.body;
    const instituteId = (req as any).instituteId;

    if (!amount || !transactionUuid || !referenceNumber) {
      return res.status(400).json({ status: "error", message: "Missing required payment fields" });
    }

    const params = await globalImeService.getPaymentParams(
      amount,
      transactionUuid,
      referenceNumber,
      currency || "NPR",
      instituteId
    );

    res.json(params);
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
};

export const handleGlobalImeCallback = async (req: Request, res: Response) => {
  try {
    const responseData = req.body;
    const instituteId = (req as any).instituteId;

    const isValid = await globalImeService.verifyResponse(responseData, instituteId);

    if (isValid) {
      console.log(`Global IME Success: ${responseData.reference_number}`);
      // Update DB
      return res.redirect(`${process.env.CLIENT_URL}/payment/success`);
    }

    res.redirect(`${process.env.CLIENT_URL}/payment/failure`);
  } catch (error: any) {
    console.error("Global IME Callback Error:", error);
    res.redirect(`${process.env.CLIENT_URL}/payment/failure`);
  }
};
