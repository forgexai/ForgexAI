import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const baseURL = "https://forgex-ai-frontend.vercel.app";
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
          `${baseURL}/api/transaction/analyze?txHash=${encodeURIComponent(txHash)}`
        );
        const data = await res.json();
        
        if (!res.ok) {
          return {
            content: [
              {
                type: "text",
                text: `Error analyzing transaction: ${data?.error || "Failed to analyze transaction"}`,
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
            analysisText += `  ${index + 1}. ${transfer.amount} ${transfer.token} from ${transfer.from} to ${transfer.to}\n`;
          });
        }
        
        if (data.solTransfers && data.solTransfers.length > 0) {
          analysisText += `\nSOL Transfers:\n`;
          data.solTransfers.forEach((transfer: any, index: number) => {
            analysisText += `  ${index + 1}. ${transfer.amount} SOL from ${transfer.from} to ${transfer.to}\n`;
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
});

export const GET = handler;
export const POST = handler;
