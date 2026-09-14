/**
 * Example x402 client for the Image Generation API.
 * Shows how an AI agent can pay for and use the service.
 *
 * Install dependencies:
 *   npm install @x402/fetch @x402/evm viem dotenv
 *
 * Run:
 *   PRIVATE_KEY=0x... node client.js
 */

import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { toClientEvmSigner } from "@x402/evm";

const API_URL = process.env.API_URL || "https://api.x402img.com/api/generate-image";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY environment variable is required");
  process.exit(1);
}

// Create a wallet from the private key
const account = privateKeyToAccount(PRIVATE_KEY);
const signer = toClientEvmSigner(account);

console.log(`Wallet: ${account.address}`);

// Register x402 client for all EVM networks
const client = new x402Client().register(
  "eip155:*",
  new ExactEvmScheme(signer)
);

const paidFetch = wrapFetchWithPayment(fetch, client);

// Generate an image
async function generateImage(prompt, tier = "fast") {
  console.log(`\nGenerating image (tier: ${tier})...`);
  console.log(`Prompt: ${prompt}`);

  const response = await paidFetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, tier }),
  });

  const result = await response.json();
  console.log("\nResult:", JSON.stringify(result, null, 2));
  return result;
}

// Run example
generateImage("A cyberpunk city with flying cars, neon, rain", "fast")
  .then((result) => {
    if (result.imageUrl) {
      console.log(`\n✅ Image: ${result.imageUrl}`);
    }
  })
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });