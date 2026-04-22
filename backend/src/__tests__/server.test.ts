import request from "supertest";
import app from "../server";
import { arbitrateAction } from "../gemini";

// Mock the Gemini API call so we don't need a real key/network call during tests
jest.mock("../gemini");

const mockedArbitrateAction = arbitrateAction as jest.MockedFunction<typeof arbitrateAction>;

describe("Micro-Arbiter API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the arbiter's public address", async () => {
    const res = await request(app).get("/api/arbiter-address");
    expect(res.status).toBe(200);
    expect(res.body.address).toBeDefined();
    expect(typeof res.body.address).toBe("string");
    expect(res.body.address.startsWith("0x")).toBe(true);
  });

  it("should return 400 if required fields are missing", async () => {
    const res = await request(app).post("/api/verify").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing required fields");
  });

  it("should reject an action if Gemini rejects it", async () => {
    mockedArbitrateAction.mockResolvedValue({
      status: "REJECT",
      reason: "Action exceeds budget constraint",
    });

    const payload = {
      userIntent: "Don't spend more than 1 USDC",
      proposedAction: "Swap 10 USDC",
      contractAddress: "0x123",
      chainId: 1,
      actionId: "0xabc",
      targetAddress: "0x456",
      amountWei: "1000000000000000000",
    };

    const res = await request(app).post("/api/verify").send(payload);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("REJECT");
    expect(res.body.reason).toBe("Action exceeds budget constraint");
    expect(res.body.signature).toBeNull();
  });

  it("should approve and sign an action if Gemini approves it", async () => {
    mockedArbitrateAction.mockResolvedValue({
      status: "APPROVE",
      reason: "Action is safe and within budget",
    });

    const payload = {
      userIntent: "Buy the latest data feed for 0.05 USDC",
      proposedAction: "Transfer 0.05 USDC for data",
      contractAddress: "0x1234567890123456789012345678901234567890",
      chainId: 42161, // Arbitrum or similar EVM
      actionId: "0x1111111111111111111111111111111111111111111111111111111111111111",
      targetAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
      amountWei: "50000000000000000",
    };

    const res = await request(app).post("/api/verify").send(payload);
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVE");
    expect(res.body.reason).toBe("Action is safe and within budget");
    expect(res.body.signature).toBeDefined();
    expect(typeof res.body.signature).toBe("string");
    expect(res.body.signature.startsWith("0x")).toBe(true);
  });
});
