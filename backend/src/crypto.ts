import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

// The arbiter's private key that signs the approved payloads
const PRIVATE_KEY = process.env.ARBITER_PRIVATE_KEY || ethers.Wallet.createRandom().privateKey;
const wallet = new ethers.Wallet(PRIVATE_KEY);

export function getArbiterPublicKey(): string {
  return wallet.address;
}

/**
 * Generates an ECDSA signature for the given action if it's approved.
 * The payload structure must exactly match the MicroEscrow.sol contract:
 * keccak256(abi.encodePacked(contractAddress, chainId, actionId, target, amount))
 */
export async function signApprovedAction(
  contractAddress: string,
  chainId: number,
  actionId: string,
  targetAddress: string,
  amountWei: string
): Promise<string> {
  
  const messageHash = ethers.solidityPackedKeccak256(
    ["address", "uint256", "bytes32", "address", "uint256"],
    [contractAddress, chainId, actionId, targetAddress, amountWei]
  );

  // Ethers automatically adds the "\x19Ethereum Signed Message:\n32" prefix
  const signature = await wallet.signMessage(ethers.getBytes(messageHash));
  return signature;
}
