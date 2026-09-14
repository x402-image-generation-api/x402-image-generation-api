# x402 Image Generation API

Pay-per-call image generation API for autonomous AI agents.  
**Protocol:** [x402](https://x402.org) · **Network:** Base · **Payment:** USDC · **No API keys required.**

[![Live](https://img.shields.io/badge/live-api.x402img.com-blue)](https://api.x402img.com/health)
[![x402](https://img.shields.io/badge/x402-v2-green)](https://x402.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is this?

An HTTP API that generates images from text prompts. Instead of API keys or subscriptions, clients pay **per call in USDC** using the x402 protocol. Perfect for AI agents that need image generation without account management.

**Key features:**
- 🚀 **No API keys** — authentication replaced by payment
- ⚡ **Instant settlement** — USDC on Base L2, sub-second finality
- 🎨 **Three quality tiers** — from $0.02 to $0.20 per image
- 🤖 **Agent-friendly** — discoverable via Bazaar, x402scan, MCP
- 📄 **OpenAPI spec** — available at `/openapi.json`

---

## Pricing

| Tier | Model | Price | Best for |
|------|-------|-------|----------|
| `fast` | FLUX.1 Schnell | **$0.02** | Drafts, bulk generation |
| `quality` | FLUX 1.1 Pro | **$0.10** | High-quality production |
| `premium` | Ideogram v3 Quality | **$0.20** | Best quality, text rendering |

---

## Quick start

### 1. Install dependencies

```bash
npm install