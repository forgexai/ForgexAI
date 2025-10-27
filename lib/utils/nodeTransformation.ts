export interface NodeInput {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "any";
  required: boolean;
  description?: string;
  default?: any;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "any";
  description?: string;
}

export interface NodeData {
  label?: string;
  category?: string;
  description?: string;
  parameters?: Record<string, any>;
  inputs?: NodeInput[];
  outputs?: NodeOutput[];
}

export interface TransformContext {
  workflowId?: string;
  nodeData: NodeData;
}

export function getProtocolInputs(nodeData: NodeData): NodeInput[] {
  const protocolNodeLabel = nodeData.label || '';
  const nodeNameLower = protocolNodeLabel.toLowerCase();
  
  if (nodeNameLower.includes("pyth") || nodeNameLower.includes("price feed")) {
    return [
      { id: "symbol", name: "Price Symbol", type: "string" as const, required: true, description: "Token symbol (e.g., SOL/USD)" }
    ];
  }
  
  if (nodeNameLower.includes("jupiter") || nodeNameLower.includes("swap")) {
    return [
      { id: "inputMint", name: "Input Token", type: "string" as const, required: true, description: "Input token mint address" },
      { id: "outputMint", name: "Output Token", type: "string" as const, required: true, description: "Output token mint address" },
      { id: "amount", name: "Amount", type: "number" as const, required: true, description: "Amount to swap (in base units)" },
      { id: "slippageBps", name: "Slippage (bps)", type: "number" as const, required: false, default: 50, description: "Slippage tolerance in basis points" }
    ];
  }
  
  if (nodeNameLower.includes("kamino") || nodeNameLower.includes("solend") || nodeNameLower.includes("loan health")) {
    return [
      { id: "walletAddress", name: "Wallet Address", type: "string" as const, required: true, description: "Wallet to check loan health" }
    ];
  }
  
  if (nodeNameLower.includes("tensor") || nodeNameLower.includes("floor")) {
    return [
      { id: "collectionId", name: "Collection ID", type: "string" as const, required: true, description: "NFT collection slug" }
    ];
  }
  
  if (nodeNameLower.includes("squads") || nodeNameLower.includes("multisig") || nodeNameLower.includes("treasury")) {
    return [
      { id: "multisigAddress", name: "Multisig Address", type: "string" as const, required: true, description: "Multisig wallet address" }
    ];
  }
  
  return [
    { id: "walletAddress", name: "Wallet Address", type: "string" as const, required: true, description: "Wallet address" }
  ];
}

export function getProtocolOutputs(nodeData: NodeData): NodeOutput[] {
  const protocolName = (nodeData.label || '').toLowerCase();
  
  if (protocolName.includes("pyth") || protocolName.includes("price feed")) {
    return [
      { id: "price", name: "Price", type: "number" as const, description: "Current price" },
      { id: "confidence", name: "Confidence", type: "number" as const, description: "Price confidence interval" },
      { id: "timestamp", name: "Timestamp", type: "string" as const, description: "Price update timestamp" }
    ];
  }
  
  if (protocolName.includes("jupiter") || protocolName.includes("swap")) {
    return [
      { id: "quote", name: "Swap Quote", type: "object" as const, description: "Best route and expected output" },
      { id: "outputAmount", name: "Output Amount", type: "number" as const, description: "Expected output amount" },
      { id: "priceImpact", name: "Price Impact", type: "number" as const, description: "Price impact percentage" }
    ];
  }
  
  if (protocolName.includes("kamino") || protocolName.includes("loan health")) {
    return [
      { id: "healthFactor", name: "Health Factor", type: "number" as const, description: "Current health factor" },
      { id: "totalDeposits", name: "Total Deposits", type: "number" as const, description: "Total deposited amount" },
      { id: "totalBorrows", name: "Total Borrows", type: "number" as const, description: "Total borrowed amount" },
      { id: "liquidationRisk", name: "Liquidation Risk", type: "string" as const, description: "Risk level assessment" }
    ];
  }
  
  return [
    { id: "result", name: "Result", type: "object" as const, description: "Protocol result" }
  ];
}

export function getProtocolConfig(nodeData: NodeData, workflowId?: string): Record<string, any> {
  const protocolName = (nodeData.label || '').toLowerCase();
  
  if (protocolName.includes("pyth") || protocolName.includes("price feed")) {
    return { protocol: 'pyth', method: 'getPrice', credits: 1 };
  }
  
  if (protocolName.includes("jupiter") || protocolName.includes("swap")) {
    if (protocolName.includes("quote")) {
      return { protocol: 'jupiter', method: 'getSwapQuote', credits: 1 };
    }
    return { protocol: 'jupiter', method: 'executeSwap', credits: 1 };
  }
  
  if (protocolName.includes("kamino") || protocolName.includes("loan health")) {
    return { protocol: 'kamino', method: 'getLoanHealth', credits: 1 };
  }
  
  if (protocolName.includes("solend")) {
    return { protocol: 'solend', method: 'getLoanHealth', credits: 1 };
  }
  
  return { protocol: 'jupiter', method: 'executeSwap', credits: 1 };
}

export function getTriggerInputs(nodeData: NodeData, workflowId?: string): NodeInput[] {
  const nodeLabel = nodeData.label || '';
  const isScheduleTimer = nodeLabel.toLowerCase().includes("schedule") || 
                          nodeLabel.toLowerCase().includes("timer") ||
                          nodeLabel.toLowerCase().includes("on schedule");
  
  if (isScheduleTimer) {
    return [
      { id: "cronExpression", name: "Schedule Frequency", type: "string" as const, required: true, default: "0 * * * *", description: "When to run automatically" }
    ];
  }
  
  return [
    { id: "botToken", name: "Bot Token", type: "string" as const, required: true, description: "Telegram bot token for listening to messages" }
  ];
}

export function getTriggerOutputs(nodeData: NodeData): NodeOutput[] {
  const nodeLabel = nodeData.label || '';
  const isScheduleTimer = nodeLabel.toLowerCase().includes("schedule") || 
                          nodeLabel.toLowerCase().includes("timer") ||
                          nodeLabel.toLowerCase().includes("on schedule");
  
  if (isScheduleTimer) {
    return [
      { id: "timestamp", name: "Timestamp", type: "string" as const, description: "Current timestamp when triggered" }
    ];
  }
  
  return [
    { id: "triggered", name: "Triggered", type: "boolean" as const, description: "Trigger status" }
  ];
}

export function getMemoryInputs(nodeData: NodeData, workflowId?: string): NodeInput[] {
  const operation = nodeData.parameters?.operation || 'store';
  const valueSource = nodeData.parameters?.valueSource || 'connected';
  
  if (operation === 'store' || operation === 'update') {
    if (valueSource === 'manual') {
      return [
        { id: "value", name: "Value", type: "any" as const, required: true, description: "Value to store" }
      ];
    }
    return [];
  }
  
  return [];
}

export function getConditionInputs(nodeData: NodeData): NodeInput[] {
  return [
    { id: "condition", name: "Condition", type: "boolean" as const, required: true, description: "Boolean condition to evaluate" },
    { id: "trueValue", name: "True Value", type: "any" as const, required: false, description: "Value when condition is true" },
    { id: "falseValue", name: "False Value", type: "any" as const, required: false, description: "Value when condition is false" }
  ];
}

export function getTransformInputs(nodeData: NodeData): NodeInput[] {
  return [
    { id: "data", name: "Input Data", type: "any" as const, required: true, description: "Data to transform" },
    { id: "format", name: "Output Format", type: "string" as const, required: false, default: "json", description: "Output format (json, string, number)" }
  ];
}

export function getTransformOutputs(nodeData: NodeData): NodeOutput[] {
  return [
    { id: "transformed", name: "Transformed Data", type: "any" as const, description: "Transformed data" }
  ];
}

export function getConditionOutputs(nodeData: NodeData): NodeOutput[] {
  return [
    { id: "result", name: "Result", type: "any" as const, description: "Conditional result" },
    { id: "branch", name: "Branch", type: "string" as const, description: "Which branch was taken" }
  ];
}

export function getCommunicationInputs(nodeData: NodeData): NodeInput[] {
  return [
    { id: "chatId", name: "Chat ID", type: "string" as const, required: false, description: "Telegram chat ID (optional - will use bot's default chat)" },
    { id: "message", name: "Message", type: "string" as const, required: true, description: "Message to send" },
    { id: "parseMode", name: "Parse Mode", type: "string" as const, required: false, default: "Markdown", description: "Message parse mode" }
  ];
}

export function getCommunicationOutputs(nodeData: NodeData): NodeOutput[] {
  return [
    { id: "messageId", name: "Message ID", type: "string" as const, description: "Sent message ID" },
    { id: "success", name: "Success", type: "boolean" as const, description: "Whether message was sent" }
  ];
}

export function getDefaultInputs(category: string, nodeData: NodeData, workflowId?: string): NodeInput[] {
  switch (category) {
    case 'trigger':
      return getTriggerInputs(nodeData, workflowId);
    case 'protocol':
      return getProtocolInputs(nodeData);
    case 'communication':
      return getCommunicationInputs(nodeData);
    case 'memory':
      return getMemoryInputs(nodeData, workflowId);
    case 'condition':
      return getConditionInputs(nodeData);
    case 'transform':
      return getTransformInputs(nodeData);
    default:
      return [];
  }
}

export function getDefaultOutputs(category: string, nodeData: NodeData): NodeOutput[] {
  switch (category) {
    case 'trigger':
      return getTriggerOutputs(nodeData);
    case 'protocol':
      return getProtocolOutputs(nodeData);
    case 'communication':
      return getCommunicationOutputs(nodeData);
    case 'memory':
      return [{ id: "success", name: "Success", type: "boolean" as const, description: "Operation success" }];
    case 'condition':
      return getConditionOutputs(nodeData);
    case 'transform':
      return getTransformOutputs(nodeData);
    default:
      return [];
  }
}

export function getDefaultConfig(category: string, nodeData: NodeData, workflowId?: string): Record<string, any> {
  if (category === 'protocol') {
    return getProtocolConfig(nodeData, workflowId);
  }
  
  const config: Record<string, any> = { ...nodeData.parameters };
  
  if (category === 'memory') {
    config.key = workflowId;
  }
  
  if (category === 'communication') {
    const nodeLabel = (nodeData.label || '').toLowerCase();
    
    if (nodeLabel.includes('telegram')) {
      config.platform = 'telegram';
      config.credits = 1;
      if (config.botToken) {
        config.botToken = config.botToken;
      }
    } else {
      config.chatId = config.chatId || '@default_chat';
    }
  }
  
  if (category === 'condition') {
    config.leftOperand = nodeData.parameters?.leftOperand;
    config.operator = nodeData.parameters?.operator;
    config.rightOperand = nodeData.parameters?.rightOperand;
  }
  
  return config;
}

