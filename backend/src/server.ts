import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { arbitrateAction } from "./gemini";
import { signApprovedAction, getArbiterPublicKey } from "./crypto";
import { createInvoice, verifyPaymentToken, ARBITRATION_FEE_USDC } from "./circle";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Public Endpoint: Get the Arbiter's Address (to configure the Escrow contract)
app.get("/api/arbiter-address", (req, res) => {
  res.json({ address: getArbiterPublicKey() });
});

// Core Endpoint: Request Arbitration
app.post("/api/verify", async (req, res) => {
  try {
    const { 
      userIntent, 
      proposedAction, 
      contractAddress, 
      chainId, 
      actionId, 
      targetAddress, 
      amountWei,
      circlePaymentToken // x402 payment token
    } = req.body;

    if (!userIntent || !proposedAction || !contractAddress || !chainId || !actionId || !targetAddress || !amountWei) {
      return res.status(400).json({ error: "missing required fields" });
    }

    // 1. Nanopayments Guard (The 402 Flow)
    if (!circlePaymentToken) {
      // No token provided? Generate an invoice and return HTTP 402
      const invoice = await createInvoice(contractAddress);
      return res.status(402).json({
        error: "Payment Required",
        message: `Arbitration requires a micro-payment of ${ARBITRATION_FEE_USDC} USDC.`,
        invoice
      });
    }

    // Token provided? Verify it.
    const isValidPayment = await verifyPaymentToken(circlePaymentToken);
    if (!isValidPayment) {
      return res.status(401).json({ error: "Invalid or expired payment token" });
    }

    // 2. Ask Gemini to arbitrate
    const verdict = await arbitrateAction(userIntent, proposedAction);

    // 2. If rejected, return immediately
    if (verdict.status === "REJECT") {
      return res.status(200).json({
        status: "REJECT",
        reason: verdict.reason,
        signature: null
      });
    }

    // 3. If approved, sign the payload
    const signature = await signApprovedAction(
      contractAddress,
      chainId,
      actionId,
      targetAddress,
      amountWei
    );

    return res.status(200).json({
      status: "APPROVE",
      reason: verdict.reason,
      signature
    });

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default app;