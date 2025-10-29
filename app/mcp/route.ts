import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const baseURL =
  process.env.NEXT_PUBLIC_FRONTEND_URL ||
  "https://forgex-ai-frontend.vercel.app";

const getAppsSdkCompatibleHtml = async (path: string) => {
  const result = await fetch(`${baseURL}${path}`);
  return await result.text();
};

type ContentWidget = {
  id: string;
  title: string;
  templateUri: string;
  invoking: string;
  invoked: string;
  html: string;
  description: string;
  widgetDomain: string;
};

function widgetMeta(widget: ContentWidget) {
  return {
    "openai/outputTemplate": widget.templateUri,
    "openai/toolInvocation/invoking": widget.invoking,
    "openai/toolInvocation/invoked": widget.invoked,
    "openai/widgetAccessible": false,
    "openai/resultCanProduceWidget": true,
  } as const;
}

const handler = createMcpHandler(async (server) => {
  const html = await getAppsSdkCompatibleHtml("/");
  const swapHtml = await getAppsSdkCompatibleHtml("/swap");
  const transferHtml = await getAppsSdkCompatibleHtml("/transfer");
  const stakeHtml = await getAppsSdkCompatibleHtml("/stake");

  const contentWidget: ContentWidget = {
    id: "show_content",
    title: "Show Content",
    templateUri: "ui://widget/content-template.html",
    invoking: "Loading content...",
    invoked: "Content loaded",
    html: html,
    description: "Displays the homepage content",
    widgetDomain: "https://nextjs.org/docs",
  };

  const swapWidget: ContentWidget = {
    id: "jupiter_swap",
    title: "Jupiter Swap",
    templateUri: "ui://widget/swap-template.html",
    invoking: "Loading swap interface...",
    invoked: "Swap interface ready",
    html: swapHtml,
    description: "Swap tokens on Solana using Jupiter",
    widgetDomain: "https://jup.ag",
  };

  const transferWidget: ContentWidget = {
    id: "send_sol",
    title: "Send SOL",
    templateUri: "ui://widget/transfer-template.html",
    invoking: "Preparing transfer interface...",
    invoked: "Transfer interface ready",
    html: transferHtml,
    description: "Send SOL to a wallet address with explicit confirmation",
    widgetDomain: "https://solana.com",
  };

  const stakeWidget: ContentWidget = {
    id: "stake_sol",
    title: "Stake SOL (Jupiter)",
    templateUri: "ui://widget/stake-template.html",
    invoking: "Loading staking interface...",
    invoked: "Staking interface ready",
    html: stakeHtml,
    description: "Stake SOL into an LST (e.g., JupSOL) via Jupiter swap.",
    widgetDomain: "https://jup.ag",
  };

  // Register content widget
  server.registerResource(
    "content-widget",
    contentWidget.templateUri,
    {
      title: contentWidget.title,
      description: contentWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": contentWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${contentWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": contentWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": contentWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Register swap widget
  server.registerResource(
    "swap-widget",
    swapWidget.templateUri,
    {
      title: swapWidget.title,
      description: swapWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": swapWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${swapWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": swapWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": swapWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Reuse swap UI for staking (pre-configured SOL -> JupSOL)
  server.registerResource(
    "stake-widget",
    stakeWidget.templateUri,
    {
      title: stakeWidget.title,
      description: stakeWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": stakeWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${stakeWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": stakeWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": stakeWidget.widgetDomain,
          },
        },
      ],
    })
  );

  // Register transfer widget
  server.registerResource(
    "transfer-widget",
    transferWidget.templateUri,
    {
      title: transferWidget.title,
      description: transferWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": transferWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${transferWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": transferWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": transferWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    contentWidget.id,
    {
      title: contentWidget.title,
      description:
        "Fetch and display the homepage content with the name of the user",
      inputSchema: {
        name: z
          .string()
          .describe("The name of the user to display on the homepage"),
      },
      _meta: widgetMeta(contentWidget),
    },
    async ({ name }) => {
      return {
        content: [
          {
            type: "text",
            text: name,
          },
        ],
        structuredContent: {
          name: name,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(contentWidget),
      };
    }
  );

  server.registerTool(
    swapWidget.id,
    {
      title: swapWidget.title,
      description:
        "Swap tokens on Solana with Jupiter. Accepts tickers or mints (e.g., '0.001 SOL to $SEND') or free-form text.",
      inputSchema: {
        amount: z
          .string()
          .describe("The amount to swap (e.g., '0.001')")
          .optional(),
        inputToken: z
          .string()
          .describe("Input token ticker (e.g., SOL) or mint address")
          .optional(),
        outputToken: z
          .string()
          .describe("Output token ticker (e.g., $SEND) or mint address")
          .optional(),
        text: z
          .string()
          .describe("Free-form request, e.g., 'swap 0.001 SOL to $SEND'")
          .optional(),
      },
      _meta: widgetMeta(swapWidget),
    },
    async ({ amount, inputToken, outputToken, text }) => {
      // Parse free-form if provided
      if (text && (!amount || !inputToken || !outputToken)) {
        const s = String(text);
        const amountMatch = s.match(/\b(\d+\.\d+|\d+)\b/);
        const toMatch = s.match(
          /to\s+([$]?[a-z0-9]+|[1-9A-HJ-NP-Za-km-z]{32,44})/i
        );
        const fromMatch = s.match(
          /swap\s+(\d+\.\d+|\d+)\s+([$]?[a-z0-9]+|[1-9A-HJ-NP-Za-km-z]{32,44}|SOL)/i
        );
        amount = amount || (amountMatch ? amountMatch[1] : undefined);
        inputToken =
          inputToken || (fromMatch ? String(fromMatch[2]) : undefined);
        outputToken = outputToken || (toMatch ? String(toMatch[1]) : undefined);
      }

      const finalAmount: string = (amount as string) || "0.001";
      const finalInput: string = (inputToken as string) || "SOL";
      const finalOutput: string = (outputToken as string) || "USDC";
      return {
        content: [
          {
            type: "text",
            text: `Preparing to swap ${finalAmount} ${finalInput} to ${finalOutput}`,
          },
        ],
        structuredContent: {
          initialAmount: finalAmount,
          inputToken: finalInput,
          outputToken: finalOutput,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(swapWidget),
      };
    }
  );

  // Free-form swap parser tool
  server.registerTool(
    "swap_freeform",
    {
      title: "Swap (free-form)",
      description:
        "Parse a message like 'swap 0.0001 SOL to $SEND' and prefill the swap widget.",
      inputSchema: {
        text: z
          .string()
          .describe("Free-form user request, e.g., 'swap 0.001 SOL to $SEND'"),
      },
      _meta: widgetMeta(swapWidget),
    },
    async ({ text }) => {
      const s = String(text || "");
      const amountMatch = s.match(/\b(\d+\.\d+|\d+)\b/);
      const toMatch = s.match(
        /to\s+([$]?[a-z0-9]+|[1-9A-HJ-NP-Za-km-z]{32,44})/i
      );
      const fromMatch = s.match(/swap\s+(\d+\.\d+|\d+)\s+([$]?[a-z0-9]+|SOL)/i);

      const amount = amountMatch ? amountMatch[1] : "0.001";
      const inputToken = fromMatch ? String(fromMatch[2] || "SOL") : "SOL";
      const outputToken = toMatch ? String(toMatch[1]) : "USDC";

      return {
        content: [
          {
            type: "text",
            text: `Preparing to swap ${amount} ${inputToken} to ${outputToken}`,
          },
        ],
        structuredContent: {
          initialAmount: amount,
          inputToken,
          outputToken,
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(swapWidget),
      };
    }
  );

  // Send SOL tool (renders widget; backend executes via /api/transfer)
  server.registerTool(
    transferWidget.id,
    {
      title: transferWidget.title,
      description:
        "Display transfer interface widget for sending SOL. This opens a secure wallet interface for user confirmation - no actual transfer occurs without explicit user wallet approval.",
      inputSchema: {
        toAddress: z
          .string()
          .describe("Destination (address or SNS domain like arpit.sol)"),
        amount: z.string().describe("Amount of SOL to send (e.g., '0.001')"),
      },
      _meta: {
        ...widgetMeta(transferWidget),
        "openai/resultCanProduceWidget": true,
        "openai/widgetAccessible": true,
      },
    },
    async ({ toAddress, amount }) => {
      return {
        content: [
          {
            type: "text",
            text: `Transfer Widget Ready: ${amount} SOL → ${toAddress}\n\nThis opens a secure wallet interface where you can review and approve the transaction. No funds are moved without your explicit wallet confirmation.`,
          },
        ],
        structuredContent: {
          toAddress,
          amount,
          timestamp: new Date().toISOString(),
          action: "prepare_transfer",
          requiresWalletApproval: true,
        },
        _meta: widgetMeta(transferWidget),
      };
    }
  );

  // Check balance tool
  server.registerTool(
    "check_balance",
    {
      title: "Check Balance",
      description:
        "Fetch SOL balance for a wallet address or domain (.sol, AllDomains TLDs).",
      inputSchema: {
        account: z
          .string()
          .describe("Address or domain (e.g., arpit.superteam or 26k...QjC)"),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ account }) => {
      const res = await fetch(
        `${baseURL}/api/wallet/balance?account=${encodeURIComponent(account)}`
      );
      const data = await res.json();
      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${data?.error || "Failed to fetch balance"}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `Balance: ${data.sol} SOL (address: ${data.resolvedAddress})`,
          },
        ],
        structuredContent: {
          account,
          resolvedAddress: data.resolvedAddress,
          sol: data.sol,
          lamports: data.lamports,
          timestamp: data.timestamp,
        },
      };
    }
  );

  // Token price tool
  server.registerTool(
    "token_price",
    {
      title: "Token Price",
      description:
        "Fetch current USD price for any Solana token. ALWAYS use token symbols like 'SOL', 'TRUMP', 'BONK', 'RAY' - do not use mint addresses unless specifically provided by user.",
      inputSchema: {
        id: z
          .string()
          .describe(
            "Token symbol like 'TRUMP', 'SOL', 'BONK' (preferred) or mint address if provided by user"
          ),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ id }) => {
      const params = new URLSearchParams({ id: String(id) });
      const res = await fetch(`${baseURL}/api/price?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${data?.error || "Failed to fetch price"}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: `${data.symbol || id}: $${data.priceFormatted} USD`,
          },
        ],
        structuredContent: data,
      };
    }
  );

  // Stake SOL tool (renders widget; backend executes via /api/stake)
  server.registerTool(
    stakeWidget.id,
    {
      title: stakeWidget.title,
      description:
        "Stake SOL into a liquid staking token (default JupSOL). Confirm in widget.",
      inputSchema: {
        amount: z.string().describe("Amount of SOL to stake (e.g., '0.5')"),
        lst: z
          .string()
          .optional()
          .describe("LST symbol or mint (default: JupSOL)"),
      },
      _meta: {
        ...widgetMeta(stakeWidget),
        "openai/widgetAccessible": false,
      },
    },
    async ({ amount, lst }) => {
      // Provide state for UI to prefill and call /api/stake when user confirms
      return {
        content: [
          {
            type: "text",
            text: `Prepare to stake ${amount} SOL into ${lst || "JupSOL"}`,
          },
        ],
        structuredContent: {
          initialAmount: amount,
          lst: lst || "JupSOL",
          timestamp: new Date().toISOString(),
        },
        _meta: widgetMeta(stakeWidget),
      };
    }
  );

  // Transaction analysis tool
  server.registerTool(
    "analyze_transaction",
    {
      title: "Analyze Transaction",
      description:
        "Analyze and explain what a Solana transaction hash represents, including transaction type, amounts, tokens involved, and program interactions.",
      inputSchema: {
        txHash: z
          .string()
          .describe("Solana transaction signature/hash to analyze"),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ txHash }) => {
      try {
        const res = await fetch(
          `${baseURL}/api/transaction/analyze?txHash=${encodeURIComponent(
            txHash
          )}`
        );
        const data = await res.json();

        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error analyzing transaction: ${
                  data?.error || "Failed to analyze transaction"
                }`,
              },
            ],
          };
        }

        // Format the analysis response
        let analysisText = `Transaction Analysis for ${txHash}:\n\n`;
        analysisText += `• Status: ${data.status}\n`;
        analysisText += `• Block Time: ${data.blockTime}\n`;
        analysisText += `• Fee: ${data.fee} lamports\n`;

        if (data.transactionType) {
          analysisText += `• Type: ${data.transactionType}\n`;
        }

        if (data.programsInvolved && data.programsInvolved.length > 0) {
          analysisText += `• Programs: ${data.programsInvolved.join(", ")}\n`;
        }

        if (data.tokenTransfers && data.tokenTransfers.length > 0) {
          analysisText += `\nToken Transfers:\n`;
          data.tokenTransfers.forEach((transfer: any, index: number) => {
            analysisText += `  ${index + 1}. ${transfer.amount} ${
              transfer.token
            } from ${transfer.from} to ${transfer.to}\n`;
          });
        }

        if (data.solTransfers && data.solTransfers.length > 0) {
          analysisText += `\nSOL Transfers:\n`;
          data.solTransfers.forEach((transfer: any, index: number) => {
            analysisText += `  ${index + 1}. ${transfer.amount} SOL from ${
              transfer.from
            } to ${transfer.to}\n`;
          });
        }

        if (data.description) {
          analysisText += `\nDescription: ${data.description}`;
        }

        return {
          content: [
            {
              type: "text",
              text: analysisText,
            },
          ],
          structuredContent: {
            txHash,
            analysis: data,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing transaction: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Wallet history tool
  server.registerTool(
    "wallet_history",
    {
      title: "Wallet Transaction History",
      description:
        "Show recent transaction history for a Solana wallet address. Use this when user asks to 'show transactions', 'wallet history', 'recent activity', or 'last transactions' for any Solana address.",
      inputSchema: {
        address: z
          .string()
          .describe("Solana wallet address or domain (e.g., .sol domain)"),
        limit: z
          .number()
          .optional()
          .describe("Number of transactions to fetch (max 50, default 10)"),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ address, limit = 10 }) => {
      try {
        const res = await fetch(
          `${baseURL}/api/wallet/history?account=${encodeURIComponent(
            address
          )}&limit=${limit}`
        );
        const data = await res.json();

        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching wallet history: ${
                  data?.error || "Failed to fetch history"
                }`,
              },
            ],
          };
        }

        if (data.transactions.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No recent transactions found for wallet ${address}`,
              },
            ],
          };
        }

        // Format the history response
        let historyText = `Recent Transactions for ${address}:\n`;
        historyText += `Resolved Address: ${data.resolvedAddress}\n\n`;

        data.transactions.forEach((tx: any, index: number) => {
          historyText += `${index + 1}. ${tx.type}\n`;
          historyText += `   • Signature: ${tx.signature.slice(0, 16)}...\n`;
          historyText += `   • Time: ${
            tx.blockTime ? new Date(tx.blockTime).toLocaleString() : "Unknown"
          }\n`;
          historyText += `   • Status: ${tx.status}\n`;

          if (tx.solChange !== 0) {
            historyText += `   • SOL Change: ${
              tx.solChange > 0 ? "+" : ""
            }${tx.solChange.toFixed(6)} SOL\n`;
          }

          if (tx.programs && tx.programs.length > 0) {
            historyText += `   • Programs: ${tx.programs.join(", ")}\n`;
          }

          if (tx.description) {
            historyText += `   • ${tx.description}\n`;
          }

          historyText += `\n`;
        });

        return {
          content: [
            {
              type: "text",
              text: historyText,
            },
          ],
          structuredContent: {
            address,
            resolvedAddress: data.resolvedAddress,
            transactions: data.transactions,
            count: data.count,
            timestamp: data.timestamp,
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching wallet history: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Token security analysis tool
  server.registerTool(
    "analyze_token_security",
    {
      title: "Token Security & RugCheck",
      description:
        "Analyze a Solana token for security risks and rug pull indicators. Use this when user asks to 'run rugcheck', 'analyze token security', 'check if token is safe', or 'security analysis' for any token mint address.",
      inputSchema: {
        mint: z
          .string()
          .describe("Token mint address to analyze for security or rugcheck"),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ mint }) => {
      try {
        const res = await fetch(
          `${baseURL}/api/security/analyze?mint=${encodeURIComponent(mint)}`
        );
        const data = await res.json();

        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error analyzing token security: ${
                  data?.error || "Failed to analyze token"
                }`,
              },
            ],
          };
        }

        // ✅ Base Analysis
        let analysisText = `🔍 Security & RugCheck Analysis for ${data.tokenInfo.name} (${data.tokenInfo.symbol}):\n\n`;
        analysisText += `${data.summary}\n\n`;
        analysisText += `• Risk Score: ${data.riskScore} (Normalized: ${data.riskScoreNormalized}/100)\n`;
        analysisText += `• Price: $${data.price}\n`;
        analysisText += `• Market Cap: $${
          data.marketCap?.toLocaleString() || "N/A"
        }\n`;
        analysisText += `• Total Holders: ${data.totalHolders}\n`;
        analysisText += `• Liquidity: $${
          data.liquidity?.toLocaleString() || "N/A"
        }\n\n`;

        // ✅ Authority
        analysisText += `Authority Status:\n`;
        analysisText += `• Mint Authority: ${
          data.mintAuthority ? "⚠️ Enabled" : "✅ Disabled"
        }\n`;
        analysisText += `• Freeze Authority: ${
          data.freezeAuthority ? "⚠️ Enabled" : "✅ Disabled"
        }\n\n`;

        // ✅ Top Risks
        if (data.risks?.length) {
          analysisText += `Top Risk Factors:\n`;
          data.risks.slice(0, 5).forEach((risk: any, index: number) => {
            const emoji =
              risk.level === "danger"
                ? "🚨"
                : risk.level === "warn"
                ? "⚠️"
                : "ℹ️";
            analysisText += `${index + 1}. ${emoji} ${risk.name}\n   ${
              risk.description
            }\n`;
            if (risk.value) analysisText += `   Value: ${risk.value}\n`;
            analysisText += `\n`;
          });
        }

        // ✅ Verification
        if (data.verification) {
          analysisText += `Verification:\n`;
          analysisText += `• Jupiter Verified: ${
            data.verification.jupiterVerified ? "✅" : "❌"
          }\n`;
          analysisText += `• Jupiter Strict: ${
            data.verification.jupiterStrict ? "✅" : "❌"
          }\n\n`;
        }

        // ✅ Insider Networks
        if (data.insiderNetworks?.length) {
          analysisText += `⚠️ Insider Networks Detected: ${data.insiderNetworks.length}\n`;
          data.insiderNetworks.forEach((network: any, index: number) => {
            analysisText += `${index + 1}. ${network.type} network with ${
              network.activeAccounts
            } accounts\n`;
          });
          analysisText += `\n`;
        }

        // ✅ RugCheck Summary (Human-friendly)
        let rugSummary = "";
        if (data.riskScoreNormalized < 30) {
          rugSummary =
            "🚨 **High Rug Pull Risk** – Multiple red flags detected. Proceed with extreme caution.";
        } else if (data.riskScoreNormalized < 60) {
          rugSummary =
            "⚠️ **Moderate Rug Risk** – Some risk indicators found. Review token authorities and liquidity.";
        } else {
          rugSummary =
            "✅ **Low Rug Pull Risk** – No major red flags detected, but always verify sources.";
        }

        analysisText += `\n📊 RugCheck Summary:\n${rugSummary}\n`;

        return {
          content: [
            {
              type: "text",
              text: analysisText,
            },
          ],
          structuredContent: {
            mint,
            analysis: data,
            rugcheck: rugSummary,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error analyzing token security: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Token info tool
  server.registerTool(
    "token_info",
    {
      title: "Token Information",
      description:
        "Get detailed token metadata, price, market cap, and trading data for any Solana token. Use this when user asks to 'fetch token info', 'get token details', 'token metadata', or 'find token by symbol/mint'.",
      inputSchema: {
        query: z
          .string()
          .describe(
            "Token symbol, name, or mint address (e.g., BONK, SOL, or mint address)"
          ),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ query }) => {
      try {
        const res = await fetch(
          `${baseURL}/api/tokens/search?query=${encodeURIComponent(
            query
          )}&limit=1`
        );
        const data = await res.json();

        if (
          !res.ok ||
          !data.success ||
          !data.tokens ||
          data.tokens.length === 0
        ) {
          return {
            content: [
              {
                type: "text",
                text: `No token found for "${query}". Please check the symbol, name, or mint address.`,
              },
            ],
          };
        }

        const token = data.tokens[0];

        // Format the token info response
        let infoText = `Token Information for ${token.name} (${token.symbol}):\n\n`;

        infoText += `• Mint Address: ${token.mint}\n`;
        infoText += `• Decimals: ${token.decimals}\n`;

        if (token.usdPrice) {
          infoText += `• Price: $${token.usdPrice}\n`;
        }

        if (token.mcap) {
          infoText += `• Market Cap: $${token.mcap.toLocaleString()}\n`;
        }

        if (token.fdv) {
          infoText += `• Fully Diluted Value: $${token.fdv.toLocaleString()}\n`;
        }

        if (token.liquidity) {
          infoText += `• Liquidity: $${token.liquidity.toLocaleString()}\n`;
        }

        if (token.holderCount) {
          infoText += `• Holders: ${token.holderCount.toLocaleString()}\n`;
        }

        infoText += `• Verified: ${token.isVerified ? "✅ Yes" : "❌ No"}\n`;
        infoText += `• Organic Score: ${
          token.organicScoreLabel?.toUpperCase() || "Unknown"
        }\n`;

        if (token.tags && token.tags.length > 0) {
          infoText += `• Tags: ${token.tags.join(", ")}\n`;
        }

        return {
          content: [
            {
              type: "text",
              text: infoText,
            },
          ],
          structuredContent: {
            query,
            token,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching token information: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Swap quote tool
  server.registerTool(
    "get_swap_quote",
    {
      title: "Get Swap Quote",
      description:
        "Get real-time swap quotes for Solana tokens via Jupiter aggregator. Use this when user asks to 'quote swap', 'get swap quote', 'how much will I get', or 'swap X to Y' on Solana only.",
      inputSchema: {
        inputToken: z
          .string()
          .describe("Input token symbol or mint address (e.g., SOL, USDC)"),
        outputToken: z
          .string()
          .describe("Output token symbol or mint address (e.g., BONK, USDT)"),
        amount: z
          .string()
          .describe(
            "Amount to swap in human-readable format (e.g., '0.1', '1000')"
          ),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({ inputToken, outputToken, amount }) => {
      try {
        const res = await fetch(
          `${baseURL}/api/swap/quote?inputToken=${encodeURIComponent(
            inputToken
          )}&outputToken=${encodeURIComponent(
            outputToken
          )}&amount=${encodeURIComponent(amount)}`
        );
        const data = await res.json();

        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting swap quote: ${
                  data?.error || "Failed to get quote"
                }`,
              },
            ],
          };
        }

        // Format the quote response
        let quoteText = `Swap Quote: ${amount} ${inputToken} → ${outputToken}\n\n`;

        quoteText += `• Input: ${data.inputAmount} ${data.inputToken}\n`;
        quoteText += `• Output: ${data.outputAmount} ${data.outputToken}\n`;

        if (data.priceImpact) {
          quoteText += `• Price Impact: ${data.priceImpact}%\n`;
        }

        if (data.quote?.routePlan && data.quote.routePlan.length > 0) {
          quoteText += `• Route: ${data.quote.routePlan.length} hop(s)\n`;
          data.quote.routePlan.forEach((hop: any, index: number) => {
            quoteText += `  ${index + 1}. ${
              hop.swapInfo?.label || "Unknown DEX"
            } (${hop.percent}%)\n`;
          });
        }

        return {
          content: [
            {
              type: "text",
              text: quoteText,
            },
          ],
          structuredContent: {
            inputToken,
            outputToken,
            amount,
            quote: data,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting swap quote: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // Cross-chain swap widget
  const crossChainSwapHtml = await getAppsSdkCompatibleHtml("/crosschain-swap");
  const crossChainSwapWidget: ContentWidget = {
    id: "crosschain_swap_widget",
    title: "Cross-Chain Swap",
    templateUri: "ui://widget/crosschain-swap-template.html",
    invoking: "Loading cross-chain swap interface...",
    invoked: "Cross-chain swap interface ready",
    html: crossChainSwapHtml,
    description: "Swap tokens across different blockchains using Mayan Finance",
    widgetDomain: "https://mayan.finance",
  };

  // Register cross-chain swap widget
  server.registerResource(
    "crosschain-swap-widget",
    crossChainSwapWidget.templateUri,
    {
      title: crossChainSwapWidget.title,
      description: crossChainSwapWidget.description,
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": crossChainSwapWidget.description,
        "openai/widgetPrefersBorder": true,
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: `<html>${crossChainSwapWidget.html}</html>`,
          _meta: {
            "openai/widgetDescription": crossChainSwapWidget.description,
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": crossChainSwapWidget.widgetDomain,
          },
        },
      ],
    })
  );

  server.registerTool(
    crossChainSwapWidget.id,
    {
      title: crossChainSwapWidget.title,
      description:
        "Swap tokens across different blockchains (Solana, Ethereum, BSC, Polygon, Avalanche, Arbitrum) using Mayan Finance bridge.",
      inputSchema: {
        fromChain: z
          .string()
          .describe("Source blockchain (e.g., solana, ethereum, bsc)")
          .optional(),
        toChain: z
          .string()
          .describe("Destination blockchain (e.g., ethereum, solana, polygon)")
          .optional(),
        inputToken: z
          .string()
          .describe("Input token symbol (e.g., SOL, ETH, USDC)")
          .optional(),
        outputToken: z
          .string()
          .describe("Output token symbol (e.g., USDC, ETH, SOL)")
          .optional(),
        amount: z
          .string()
          .describe("Amount to swap (e.g., '0.1', '1000')")
          .optional(),
      },
      _meta: {
        ...widgetMeta(crossChainSwapWidget),
        "openai/resultCanProduceWidget": true,
      },
    },
    async ({ fromChain, toChain, inputToken, outputToken, amount }) => {
      const finalFromChain = fromChain || "solana";
      const finalToChain = toChain || "ethereum";
      const finalInputToken = inputToken || "SOL";
      const finalOutputToken = outputToken || "USDC";
      const finalAmount = amount || "0.1";

      return {
        content: [
          {
            type: "text",
            text: `Preparing cross-chain swap: ${finalAmount} ${finalInputToken} (${finalFromChain}) → ${finalOutputToken} (${finalToChain})`,
          },
        ],
        structuredContent: {
          fromChain: finalFromChain,
          toChain: finalToChain,
          inputToken: finalInputToken,
          outputToken: finalOutputToken,
          initialAmount: finalAmount,
          timestamp: new Date().toISOString(),
        },
        _meta: {
          ...widgetMeta(crossChainSwapWidget),
          "openai/resultCanProduceWidget": true,
        },
      };
    }
  );

  // Cross-chain quote tool
  server.registerTool(
    "get_crosschain_quote",
    {
      title: "Get Cross-Chain Quote",
      description:
        "Get a real-time cross-chain swap quote using Mayan Finance for swapping tokens between different blockchains. Supports Solana → Ethereum, BSC, Polygon, Avalanche, Arbitrum.",
      inputSchema: {
        fromChain: z
          .string()
          .optional()
          .describe("Source blockchain (default: solana)"),
        toChain: z
          .string()
          .describe(
            "Destination blockchain (ethereum, bsc, polygon, avalanche, arbitrum)"
          ),
        inputToken: z
          .string()
          .describe("Input token symbol (e.g., SOL, USDC, BONK)"),
        outputToken: z
          .string()
          .describe("Output token symbol (e.g., USDC, ETH, USDT)"),
        amount: z
          .string()
          .describe(
            "Amount to swap in human-readable format (e.g., '1', '0.5', '1000')"
          ),
        slippage: z
          .number()
          .optional()
          .describe("Slippage tolerance in percentage (default: 0.5)"),
      },
      _meta: {
        "openai/resultCanProduceWidget": false,
      },
    },
    async ({
      fromChain,
      toChain,
      inputToken,
      outputToken,
      amount,
      slippage,
    }) => {
      try {
        const finalFromChain = fromChain || "solana";
        const finalSlippage = slippage || 0.5;

        const response = await fetch(`${baseURL}/api/crosschain/quote`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            fromToken: inputToken,
            toToken: outputToken,
            fromChain: finalFromChain,
            toChain,
            slippage: finalSlippage,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error getting cross-chain quote: ${
                  data?.error || "Failed to get quote"
                }`,
              },
            ],
          };
        }

        const quote = data.quote;

        // Format the quote response
        let quoteText = `Cross-Chain Quote: ${amount} ${inputToken} (${finalFromChain}) → ${outputToken} (${toChain})\n\n`;

        quoteText += `• Input: ${quote.inputAmount} ${quote.inputToken} on ${quote.inputChain}\n`;
        quoteText += `• Output: ${quote.outputAmount} ${quote.outputToken} on ${quote.outputChain}\n`;
        quoteText += `• Estimated Time: ${quote.estimatedTime}\n`;
        quoteText += `• Bridge Fee: ${quote.bridgeFee}\n`;
        quoteText += `• Network Fee: ${quote.networkFee}\n`;
        quoteText += `• Price Impact: ${quote.priceImpact}\n`;
        quoteText += `• Route: ${quote.route}\n`;

        return {
          content: [
            {
              type: "text",
              text: quoteText,
            },
          ],
          structuredContent: {
            fromChain: finalFromChain,
            toChain,
            inputToken,
            outputToken,
            amount,
            slippage: finalSlippage,
            quote: data.quote,
            timestamp: new Date().toISOString(),
          },
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `Error getting cross-chain quote: ${error.message}`,
            },
          ],
        };
      }
    }
  );
});

export const GET = handler;
export const POST = handler;
