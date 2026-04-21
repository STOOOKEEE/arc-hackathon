import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "DUMMY_KEY_FOR_TESTS");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface ArbitrationResult {
  status: "APPROVE" | "REJECT";
  reason: string;
}

export async function arbitrateAction(userIntent: string, proposedAction: string): Promise<ArbitrationResult> {
  const prompt = `
You are a Security Arbiter for an autonomous AI agent.
Your job is to read the user's intent (policy) and the agent's proposed action, and determine if the action is safe and aligns with the intent.

USER INTENT POLICY: "${userIntent}"
AGENT PROPOSED ACTION: "${proposedAction}"

Respond STRICTLY with a JSON object in this exact format, without markdown wrapping or extra text:
{
  "status": "APPROVE" or "REJECT",
  "reason": "Brief explanation of your decision"
}
`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting (e.g. ```json ... ```)
    const cleanedText = responseText.replace(/^```json/i, "").replace(/```$/, "").trim();
    
    const parsed = JSON.parse(cleanedText) as ArbitrationResult;
    
    if (parsed.status !== "APPROVE" && parsed.status !== "REJECT") {
      throw new Error("Invalid status returned by Gemini");
    }
    
    return parsed;
  } catch (error) {
    console.error("Gemini Arbitration Error:", error);
    // Default to secure fallback
    return {
      status: "REJECT",
      reason: "Internal error during arbitration or invalid response format."
    };
  }
}
