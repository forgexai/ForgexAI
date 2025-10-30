# 🚀 ForgexAI - Solana Agent Studio

## 🏆 Solana CYPHERPUNK COLOSSEUM HACKATHON Submission

**Built by Team ForgexAI** | [https://forgexai.com](https://forgexai.com/)

---

## 🎬 Live Demo

📹 **Live demo (playable)** — embedded below. GitHub serves raw files via raw.githubusercontent.com; we reference the raw URL so the video can be played directly in the README.

<video controls width="720" poster="./forgexai-fe/public/logo.jpg">
  <source src="https://raw.githubusercontent.com/forgexai/ForgexAI/main/public/ForgexAI-Final%20Submission.mp4" type="video/mp4">
  Your browser does not support the video tag. You can also watch the demo directly: [Demo (blob link)](https://github.com/forgexai/ForgexAI/blob/main/public/ForgexAI-Final%20Submission.mp4) or open the file in the `forgexai-fe/public/` folder.
</video>

🎨 **[View Our Pitch Deck](https://www.canva.com/design/DAG3RxEiYHI/frqYycbg3JyE857rHwImFQ/edit?utm_content=DAG3RxEiYHI&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)**

📦 **[ForgeX SDK on NPM](https://www.npmjs.com/package/forgexai-sdk)**

---

## 🌟 Project Overview

ForgexAI is a revolutionary **Solana Agent Studio** that democratizes AI-powered blockchain automation. Our platform enables users to create sophisticated Solana agents without coding, featuring visual workflow builders, comprehensive protocol integrations, and seamless AI orchestration.

### 🎯 Key Innovation

- **Visual Agent Builder**: Drag-and-drop interface for creating complex Solana automation workflows
- **AI-Native Architecture**: Built-in AI agents for portfolio management, arbitrage detection, and DeFi optimization
- **Universal Protocol Integration**: 21+ Solana ecosystem protocols in a single SDK
- **MCP Compatibility**: Model Context Protocol integration for Claude, Cursor, and other AI systems
- **Zero-Code Automation**: No programming required for advanced blockchain operations

---

## 🏗️ Architecture

### Frontend (`forgexai-fe/`)

- **Next.js 14** with TypeScript
- **Tailwind CSS** for styling
- **Privy** for wallet authentication
- **Visual Workflow Canvas** with drag-and-drop nodes
- **Real-time AI Chat Interface**
- **MCP Widget Integration**

### Backend (`forgexai-backend/`)

- **Fastify** Node.js server
- **Wallet-based Authentication**
- **Credit Management System**
- **Workflow Execution Engine**
- **AI Agent Orchestration**
- **Comprehensive API Layer**

### SDK (`forgexai-sdk/`)

- **TypeScript SDK** with full type safety
- **21+ Protocol Integrations**
- **Cross-chain Capabilities**
- **Privacy Features via Elusiv**
- **Comprehensive Examples**

---

## ⚡ Features

### 🤖 AI-Powered Agents

- **Portfolio Management**: Automated rebalancing and yield optimization
- **Arbitrage Detection**: Cross-DEX price monitoring and execution
- **Risk Management**: Stop-loss, take-profit, and position sizing
- **Social Trading**: Copy-trading and strategy sharing
- **Market Analysis**: Real-time sentiment and technical analysis

### 🛠️ Visual Workflow Builder

- **20+ Node Types**: Protocol operations, conditions, loops, and AI decisions
- **Drag-and-Drop Canvas**: Intuitive visual programming interface
- **Real-time Execution**: Live workflow monitoring and debugging
- **Scheduling System**: Cron-based automation and triggers
- **Template Library**: Pre-built strategies and common patterns

### 🔗 Protocol Integrations

- **Jupiter**: Advanced swapping and limit orders
- **Kamino**: Yield farming and liquidity management
- **Drift**: Perpetual futures and margin trading
- **Tensor**: NFT marketplace operations
- **Marinade**: Liquid staking automation
- **Raydium**: LP management and farming
- **Pyth**: Real-time price feeds
- **Mayan Finance**: Cross-chain swaps
- **Elusiv**: Private transactions
- **And 12+ more protocols**

### 🧠 AI Integration

- **Claude MCP Support**: Native Model Context Protocol integration
- **Natural Language Processing**: Convert text to executable workflows
- **Intelligent Routing**: AI-optimized transaction paths
- **Risk Assessment**: ML-powered portfolio analysis
- **Predictive Analytics**: Market trend forecasting

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Solana CLI (optional)
- Wallet with Solana devnet/mainnet access

### Installation

```bash
# Clone the repository
git clone https://github.com/forgexai/ForgexAI-Frontend.git
cd ForgexAI-Frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Configure your API keys and Solana RPC endpoints

# Start the development servers
npm run dev        # Frontend (port 3000)
npm run dev:backend # Backend (port 8000)
```

### Using the SDK

```bash
npm install forgexai-sdk
```

```typescript
import { ForgexSDK } from "forgexai-sdk";

// Initialize the SDK
const sdk = new ForgexSDK({
  cluster: "mainnet-beta",
  jupiter: { apiKey: "your-key" },
  helius: { apiKey: "your-key" },
});

// Execute a Jupiter swap
const result = await sdk.jupiter.swap({
  inputMint: "So11111111111111111111111111111111111111112", // SOL
  outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  amount: 1000000000, // 1 SOL
  slippageBps: 50,
});
```

---

## 🛠️ Available MCP Tools

ForgexAI provides a comprehensive suite of Model Context Protocol (MCP) tools for Solana blockchain operations. These tools can be used directly through our AI interface or integrated into other AI systems like Claude, Cursor, and more.

### 📊 Complete Tool Reference

| Tool ID                  | Title                      | Description                                                  | Inputs                                                                                                        |
| ------------------------ | -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `jupiter_swap`           | Jupiter Swap               | Swap tokens on Solana with Jupiter                           | `amount`, `inputToken`, `outputToken`, `text` (all optional)                                                  |
| `swap_freeform`          | Swap (free-form)           | Parse free-form swap request like "swap 0.0001 SOL to $SEND" | `text` (string) - Free-form request                                                                           |
| `send_sol`               | Send SOL                   | Display transfer interface for sending SOL                   | `toAddress` (string), `amount` (string)                                                                       |
| `check_balance`          | Check Balance              | Fetch SOL balance for wallet/domain                          | `account` (string) - Address or domain                                                                        |
| `token_price`            | Token Price                | Fetch current USD price for any Solana token                 | `id` (string) - Token symbol or mint                                                                          |
| `stake_sol`              | Stake SOL (Jupiter)        | Stake SOL into liquid staking token                          | `amount` (string), `lst` (optional string)                                                                    |
| `analyze_transaction`    | Analyze Transaction        | Analyze and explain a Solana transaction                     | `txHash` (string) - Transaction signature                                                                     |
| `wallet_history`         | Wallet Transaction History | Show recent transaction history for wallet                   | `address` (string), `limit` (optional number)                                                                 |
| `analyze_token_security` | Token Security & RugCheck  | Analyze token for security risks and rug pull indicators     | `mint` (string) - Token mint address                                                                          |
| `token_info`             | Token Information          | Get detailed token metadata, price, and trading data         | `query` (string) - Symbol, name, or mint                                                                      |
| `get_swap_quote`         | Get Swap Quote             | Get real-time swap quotes via Jupiter aggregator             | `inputToken`, `outputToken`, `amount` (all strings)                                                           |
| `crosschain_swap_widget` | Cross-Chain Swap           | Swap tokens across blockchains via Mayan Finance             | `fromChain`, `toChain`, `inputToken`, `outputToken`, `amount`, `destinationWallet`, `slippage` (all optional) |
| `get_crosschain_quote`   | Get Cross-Chain Quote      | Get cross-chain swap quote using Mayan Finance               | `fromChain` (optional), `toChain`, `inputToken`, `outputToken`, `amount`, `slippage` (optional)               |

### 🗂️ Tool Categories

#### 💼 Wallet Operations

- **`check_balance`** - Check SOL balance for any wallet or domain
- **`send_sol`** - Transfer SOL with secure confirmation interface
- **`wallet_history`** - View comprehensive transaction history

#### 🔄 Swapping & Trading

- **`jupiter_swap`** - Execute token swaps on Solana via Jupiter
- **`swap_freeform`** - Parse natural language swap requests
- **`get_swap_quote`** - Get real-time swap quotes and pricing
- **`crosschain_swap_widget`** - Cross-chain swaps via Mayan Finance
- **`get_crosschain_quote`** - Cross-chain swap quotes and estimates

#### 🥩 Staking

- **`stake_sol`** - Stake SOL into liquid staking tokens (JupSOL, mSOL, etc.)

#### 🪙 Token Analysis

- **`token_price`** - Get current USD price for any Solana token
- **`token_info`** - Comprehensive token metadata and market data
- **`analyze_token_security`** - RugCheck and security risk analysis

#### 🔍 Transaction Analysis

- **`analyze_transaction`** - Detailed transaction hash analysis
- **`wallet_history`** - Complete transaction history and patterns

### 💡 Usage Examples

```typescript
// Natural language swap
await mcp.call("swap_freeform", {
  text: "swap 0.1 SOL to USDC",
});

// Check wallet balance
await mcp.call("check_balance", {
  account: "arpit.sol",
});

// Analyze a transaction
await mcp.call("analyze_transaction", {
  txHash: "5J7Z...",
});

// Get token security analysis
await mcp.call("analyze_token_security", {
  mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
});
```

---

## 🎯 Hackathon Highlights

### 🏆 Innovation Categories

- **AI & Machine Learning**: Advanced agent framework with predictive analytics
- **Developer Tooling**: Comprehensive SDK and visual builder for Solana development
- **DeFi**: Unified protocol integration and automated yield strategies
- **Infrastructure**: Scalable architecture supporting high-throughput operations

### 💡 Technical Achievements

- **21+ Protocol Integrations** in a single unified SDK
- **Visual Programming Interface** for blockchain automation
- **AI-Native Architecture** with LLM-powered decision making
- **Cross-Chain Capabilities** via Mayan Finance integration
- **Privacy-First Design** with Elusiv zero-knowledge proofs
- **Production-Ready** with comprehensive testing and monitoring

### 🌍 Real-World Impact

- **Democratized Access**: No-code blockchain automation for everyone
- **Capital Efficiency**: Automated yield optimization and risk management
- **Developer Experience**: Simplified Solana development with comprehensive tooling
- **Ecosystem Growth**: Unified access to the entire Solana DeFi ecosystem

---

## 📊 Technical Specifications

### Performance

- **Sub-second** transaction execution
- **99.9%** uptime with robust error handling
- **Horizontal scaling** with microservices architecture
- **Real-time** WebSocket connections for live updates

### Security

- **Wallet-based Authentication** with challenge-response
- **AES-256 Encryption** for sensitive data
- **Input Validation** and XSS protection
- **Audit Trail** for all operations
- **Rate Limiting** and DDoS protection

### Scalability

- **Microservices Architecture** for independent scaling
- **Event-Driven Design** for asynchronous processing
- **Database Optimization** with connection pooling
- **CDN Integration** for global asset delivery

---

## 🎨 User Experience

### Dashboard

- **Portfolio Overview**: Real-time balance and performance metrics
- **Agent Management**: Create, monitor, and optimize AI agents
- **Workflow Builder**: Visual programming canvas with templates
- **Analytics**: Comprehensive trading and yield performance data

### AI Chat Interface

- **Natural Language**: Create workflows using conversational AI
- **Smart Suggestions**: AI-powered optimization recommendations
- **Real-time Execution**: Watch your strategies execute live
- **Learning System**: Improves recommendations based on your preferences

---

## 🔧 Development

### Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend**: Fastify, TypeScript, PostgreSQL, Redis
- **Blockchain**: Solana Web3.js, Anchor Framework
- **AI**: OpenAI GPT-4, Claude MCP, Custom ML Models
- **Infrastructure**: Vercel, Railway, Cloudflare

### API Documentation

- **Interactive API Docs**: Built-in Swagger/OpenAPI documentation
- **Postman Collection**: Complete API testing suite included
- **SDK Examples**: Comprehensive code samples for all features
- **Video Tutorials**: Step-by-step implementation guides

---

## 🤝 Contributing

We welcome contributions from the Solana community! See our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Start development mode
npm run dev

# Build for production
npm run build
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🏢 Team ForgexAI

**Building the future of decentralized automation**

- 🌐 **Website**: [https://forgexai.com](https://forgexai.com/)
- 📧 **Contact**: team@forgexai.com
- 🐦 **Twitter**: [@ForgexAI](https://x.com/ForgeX_ai)
- 📱 **Discord**: [Join our community](https://discord.gg/forgexai)

---

## 🚀 What's Next

- **Mobile App**: Native iOS/Android applications
- **Advanced AI Models**: Custom-trained models for Solana ecosystem
- **Institutional Features**: Enterprise-grade portfolio management
- **Cross-Chain Expansion**: Support for additional blockchains
- **DeFi Innovations**: Novel yield strategies and risk management tools

---

**Built with ❤️ for the Solana ecosystem and the CYPHERPUNK COLOSSEUM community**

_ForgexAI - Where AI meets DeFi automation_
