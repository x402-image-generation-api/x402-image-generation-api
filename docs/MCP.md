# MCP Integration

This API can be discovered and used by AI clients that support the Model Context Protocol (MCP) with x402 payments.

## Discovery

The service is listed in:
- Official MCP Registry
- Smithery.ai
- Glama.ai
- PulseMCP.com

## Using with Claude Desktop

1. Ensure your MCP client supports x402 payments.
2. The service is auto-discovered via the registry.
3. When Claude calls the API, x402 payment is handled automatically.

## Manual invocation

If your client doesn't support x402 natively, use the [`@x402/fetch`](https://www.npmjs.com/package/@x402/fetch) library:

\`\`\`javascript
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { toClientEvmSigner } from "@x402/evm";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const signer = toClientEvmSigner(account);
const client = new x402Client().register("eip155:*", new ExactEvmScheme(signer));
const paidFetch = wrapFetchWithPayment(fetch, client);

const res = await paidFetch("https://api.x402img.com/api/generate-image", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "sunset over mountains", tier: "quality" }),
});
\`\`\`

## Protocol

- **Version:** x402 v2
- **Network:** Base Mainnet (eip155:8453)
- **Asset:** USDC (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`)
- **Facilitator:** PayAI