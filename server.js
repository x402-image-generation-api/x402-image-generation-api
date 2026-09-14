import express from "express";
import { config } from "dotenv";
import Replicate from "replicate";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { paymentMiddleware, x402ResourceServer } from "@x402/express";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { facilitator } from "@payai/facilitator";

// Загружаем переменные окружения из .env
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ВАЖНО: доверяем заголовкам от Cloudflare Tunnel
// Без этой строки Express считает протокол "http" вместо "https"
app.set("trust proxy", true);

app.use(express.json());

// Раздача статики (favicon.ico и любых файлов из папки public)
app.use(express.static(path.join(__dirname, "public")));

const evmAddress = process.env.EVM_ADDRESS;

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  useFileOutput: false,
});

const facilitatorClient = new HTTPFacilitatorClient(facilitator);

// ЕДИНАЯ СЕТЬ ДЛЯ ВСЕГО СЕРВИСА
const NETWORK = "eip155:8453"; // Base Mainnet
// Для тестов используйте "eip155:84532" (Base Sepolia)

const resourceServer = new x402ResourceServer(facilitatorClient)
  .register(NETWORK, new ExactEvmScheme());

// --- КОНФИГУРАЦИЯ УРОВНЕЙ ---
const TIERS = {
  fast: {
    model: "black-forest-labs/flux-schnell",
    price: "$0.02",
    input: { num_outputs: 1, aspect_ratio: "1:1", output_format: "webp", output_quality: 80 },
  },
  quality: {
    model: "black-forest-labs/flux-1.1-pro",
    price: "$0.10",
    input: { aspect_ratio: "1:1", output_format: "webp", output_quality: 90 },
  },
  premium: {
    model: "ideogram-ai/ideogram-v3-quality",
    price: "$0.20",
    input: { aspect_ratio: "1:1", magic_prompt_option: "On" },
  },
};

const DEFAULT_TIER = "fast";
const IMAGE_TTL_SECONDS = 86400; // 24 часа

// --- ОТДАЧА OPENAPI.JSON (для x402scan и агентов) ---
app.get("/openapi.json", (req, res) => {
  res.sendFile(path.join(__dirname, "openapi.json"));
});

// --- ДИНАМИЧЕСКОЕ ЦЕНООБРАЗОВАНИЕ + BAZAAR DISCOVERY ---
app.use(
  paymentMiddleware(
    {
      "POST /api/generate-image": {
        accepts: [
          {
            scheme: "exact",
            price: (context) => {
              const body = context.adapter.getBody?.() || {};
              const tier = body.tier || DEFAULT_TIER;
              const cfg = TIERS[tier] || TIERS[DEFAULT_TIER];
              return cfg.price;
            },
            network: NETWORK,
            payTo: evmAddress,
          },
        ],
        description: "AI image generation with three quality tiers (fast/quality/premium)",
        mimeType: "application/json",
        // Расширение Bazaar для автоматической индексации в каталоге
        extensions: {
          ...declareDiscoveryExtension({
            input: {
              prompt: "A cyberpunk city with flying cars, neon, rain",
              tier: "quality",
            },
            inputSchema: {
              properties: {
                prompt: {
                  type: "string",
                  description: "Text description of the desired image",
                },
                tier: {
                  type: "string",
                  enum: ["fast", "quality", "premium"],
                  description: "Quality tier. fast=$0.02, quality=$0.10, premium=$0.20. Default: fast",
                },
              },
              required: ["prompt"],
            },
            bodyType: "json",
            output: {
              example: {
                success: true,
                imageUrl: "https://replicate.delivery/pbxt/...",
                model: "black-forest-labs/flux-1.1-pro",
                tier: "quality",
                notice: "Image is available for 24 hours only.",
                expiresAt: "2026-09-15T09:00:00.000Z",
              },
            },
          }),
        },
      },
    },
    resourceServer
  )
);

// --- ОБРАБОТЧИК ГЕНЕРАЦИИ ---
app.post("/api/generate-image", async (req, res) => {
  const { prompt, tier: requestedTier } = req.body;
  const tier = requestedTier || DEFAULT_TIER;

  console.log(`🎨 Request: tier="${tier}", prompt="${prompt}"`);

  if (!prompt) {
    return res.status(400).json({ error: "Parameter 'prompt' is required" });
  }

  const tierConfig = TIERS[tier];
  if (!tierConfig) {
    return res.status(400).json({
      error: `Unknown tier "${tier}". Available: ${Object.keys(TIERS).join(", ")}`,
    });
  }

  try {
    const output = await replicate.run(tierConfig.model, {
      input: { prompt, ...tierConfig.input },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;
    const expiresAt = new Date(Date.now() + IMAGE_TTL_SECONDS * 1000).toISOString();

    console.log(`✅ Done (${tier}):`, imageUrl);

    res.json({
      success: true,
      imageUrl,
      model: tierConfig.model,
      tier,
      notice: "Image is available for 24 hours only. Download it immediately and pass to your client.",
      expiresAt,
      ttlSeconds: IMAGE_TTL_SECONDS,
    });
  } catch (error) {
    console.error(`❌ Generation error (${tier}):`, error);
    res.status(500).json({ error: "Failed to generate image" });
  }
});

// --- HEALTH CHECK ---
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "x402-image-server",
    tiers: Object.keys(TIERS),
    network: NETWORK,
    imageTtlSeconds: IMAGE_TTL_SECONDS,
    protocol: req.protocol,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`💰 Paid tiers: fast ($0.02), quality ($0.10), premium ($0.20)`);
  console.log(`🌐 Network: ${NETWORK}`);
  console.log(`📄 OpenAPI: /openapi.json`);
  console.log(`🏪 Bazaar indexing: enabled`);
  console.log(`⏱️  Images available for 24 hours`);
});