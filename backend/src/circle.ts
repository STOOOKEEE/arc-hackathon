import dotenv from "dotenv";

dotenv.config();

// The cost of a single arbitration check in USDC
export const ARBITRATION_FEE_USDC = "0.001";

export interface Invoice {
  invoiceId: string;
  amount: string;
  currency: string;
  paymentUrl: string;
}

/**
 * Generates an invoice for the agent to pay via Circle Nanopayments.
 * In a production environment, this would call the Circle API to generate a verifiable x402 invoice.
 */
export async function createInvoice(agentAddress: string): Promise<Invoice> {
  // Mocking the Circle API response for hackathon demo purposes
  const mockInvoiceId = `inv_${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    invoiceId: mockInvoiceId,
    amount: ARBITRATION_FEE_USDC,
    currency: "USDC",
    paymentUrl: `https://payments.circle.com/checkout/${mockInvoiceId}`, // Fictional URL
  };
}

/**
 * Verifies if the provided payment token is valid and the invoice has been paid.
 * In a production environment, this would verify the token cryptographically or via the Circle API.
 */
export async function verifyPaymentToken(paymentToken: string): Promise<boolean> {
  if (!paymentToken) return false;
  
  // For the demo, we accept any token that starts with "tok_"
  // In reality, we would call Circle API: POST /v1/payments/verify
  if (paymentToken.startsWith("tok_")) {
    return true;
  }
  
  return false;
}
