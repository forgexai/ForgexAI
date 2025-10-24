// ForgexAI API Client Utilities
// Comprehensive client for all backend endpoints

import { WorkflowTemplate } from "@/components/marketplace/MarketplaceSection";

export interface ApiConfig {
  baseUrl: string;
  authToken?: string;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

export interface WorkflowNode {
  id: string;
  type: "input" | "logic" | "data" | "output" | "protocol";
  category:
    | "trigger"
    | "condition"
    | "transform"
    | "protocol"
    | "memory"
    | "communication";
  name: string;
  description: string;
  inputs: NodeInput[];
  outputs: NodeOutput[];
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface NodeInput {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "any";
  required: boolean;
  default?: any;
  description?: string;
}

export interface NodeOutput {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object" | "any";
  description?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourceOutputId: string;
  targetNodeId: string;
  targetInputId: string;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  config: {
    isActive: boolean;
    scheduleType?: "manual" | "cron" | "event";
    cronExpression?: string;
    triggerEvents?: string[];
  };
  templateId?: string;
  status: "draft" | "published" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
  deployments: any[];
}

export interface ExecutionResult {
  status: "success" | "error";
  results: any[];
  duration: number;
  executionContext: Record<string, any>;
  error?: string;
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  credits: number;
  tier: "free" | "pro" | "enterprise";
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export interface CreditsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: "debit" | "credit";
  reason: string;
  timestamp: string;
  balanceAfter: number;
  metadata?: Record<string, any>;
}

export interface DeploymentConfig {
  id: string;
  userId: string;
  workflowId: string;
  platform: "telegram" | "discord" | "mcp" | "webhook";
  name: string;
  description?: string;
  config: any;
  status: "pending" | "deploying" | "active" | "paused" | "error" | "stopped";
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  metrics: any;
  errorLogs?: any[];
}

export interface Secret {
  id: string;
  name: string;
  type: "telegram_bot_token" | "api_key" | "webhook_url" | "custom";
  createdAt: string;
}

export interface Schedule {
  id: string;
  workflowId: string;
  userId: string;
  cronExpression: string;
  inputData?: Record<string, any>;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  nextExecution?: string;
}

export interface McpTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface McpExecutionResult {
  success: boolean;
  tool: string;
  result: any;
  user: {
    userId: string;
    walletAddress: string;
  };
  timestamp: string;
}

export interface MarketplaceListing {
  id: string;
  workflowId: string;
  sellerId: string;
  sellerName?: string;
  sellerWallet: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  price: number;
  pricing: {
    type: "free" | "credits" | "sol";
    amount: number;
  };
  thumbnail?: string;
  screenshots?: string[];
  featured: boolean;
  verified: boolean;
  status: "pending" | "active" | "paused" | "removed";
  stats: {
    views: number;
    purchases: number;
    rating: number;
    ratingCount: number;
  };
  preview: {
    nodes: number;
    connections: number;
    protocols: string[];
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

class ForgexApiClient {
  private config: ApiConfig;

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      ...config,
    };
  }

  // Chat methods implemented below

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only add Content-Type for requests with a body
    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    if (this.config.authToken) {
      headers.Authorization = `Bearer ${this.config.authToken}`;
    } else {
      console.warn("No auth token found for API request to:", endpoint);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok
          ? undefined
          : data.error || data.message || "Request failed",
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.name === "AbortError" ? "Request timeout" : error.message,
        status: 0,
      };
    }
  }

  // ============================================================================
  // HEALTH & SYSTEM ENDPOINTS
  // ============================================================================

  async getHealth(): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      version: string;
      uptime?: number;
    }>
  > {
    return this.request("/health");
  }

  async getSystemHealth(): Promise<
    ApiResponse<{
      status: string;
      timestamp: string;
      scheduler: any;
    }>
  > {
    return this.request("/system/health");
  }

  async getMcpHealth(): Promise<
    ApiResponse<{
      status: string;
      service: string;
      sdk_health: any;
      available_protocols: number;
      timestamp: string;
    }>
  > {
    return this.request("/mcp/health");
  }

  // ============================================================================
  // AUTHENTICATION ENDPOINTS
  // ============================================================================

  async generateAuthChallenge(walletAddress: string): Promise<
    ApiResponse<{
      message: string;
      timestamp: number;
      walletAddress: string;
    }>
  > {
    return this.request("/users/auth/challenge", {
      method: "POST",
      body: JSON.stringify({ walletAddress }),
    });
  }

  async loginWithWallet(authRequest: {
    walletAddress: string;
    signature: string;
    message: string;
    timestamp: number;
  }): Promise<
    ApiResponse<{
      sessionToken: string;
      expiresAt: string;
      user: UserProfile;
      stats: any;
    }>
  > {
    return this.request("/users/auth/login", {
      method: "POST",
      body: JSON.stringify(authRequest),
    });
  }

  async logout(): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
    }>
  > {
    return this.request("/users/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  // ============================================================================
  // USER MANAGEMENT ENDPOINTS
  // ============================================================================

  async getUserProfile(): Promise<
    ApiResponse<{
      user: UserProfile;
      stats: any;
    }>
  > {
    return this.request("/users/profile");
  }

  async getUserCredits(): Promise<
    ApiResponse<{
      credits: number;
      userId: string;
      walletAddress: string;
    }>
  > {
    return this.request("/users/credits");
  }

  async getCreditsHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResponse<{
      transactions: CreditsTransaction[];
      pagination: {
        limit: number;
        offset: number;
        count: number;
      };
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/users/credits/history?${queryParams}`);
  }

  async addCredits(params: {
    targetUserId: string;
    amount: number;
    reason: string;
    metadata?: Record<string, any>;
  }): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      newBalance: number;
      targetUserId: string;
    }>
  > {
    return this.request("/users/credits/add", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async purchaseCredits(params: {
    package: "starter" | "pro" | "enterprise";
    paymentMethod: "sol" | "usdc" | "card";
  }): Promise<
    ApiResponse<{
      package: string;
      credits: number;
      price: number;
      paymentMethod: string;
      status: string;
      message: string;
      instructions: string;
    }>
  > {
    return this.request("/users/credits/purchase", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async updateUserTier(params: {
    targetUserId: string;
    tier: "free" | "pro" | "enterprise";
  }): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
      targetUserId: string;
      newTier: string;
      updatedBy: string;
    }>
  > {
    return this.request("/users/tier", {
      method: "PUT",
      body: JSON.stringify(params),
    });
  }

  // ============================================================================
  // WORKFLOW MANAGEMENT ENDPOINTS
  // ============================================================================

  async getNodeTemplates(): Promise<
    ApiResponse<{
      templates: any[];
      categories: string[];
      protocols: string[];
    }>
  > {
    return this.request("/agents/nodes/templates");
  }

  async getWorkflows(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<
    ApiResponse<{
      workflows: Workflow[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());
    if (params?.status) queryParams.set("status", params.status);

    return this.request(`/agents/workflows?${queryParams}`);
  }

  async getWorkflow(workflowId: string): Promise<ApiResponse<Workflow>> {
    return this.request(`/agents/workflows/${workflowId}`);
  }

  async createWorkflow(workflow: {
    name: string;
    description?: string;
    nodes?: WorkflowNode[];
    connections?: WorkflowConnection[];
    templateId?: string;
  }): Promise<ApiResponse<Workflow>> {
    return this.request("/agents/workflows", {
      method: "POST",
      body: JSON.stringify(workflow),
    });
  }

  async updateWorkflow(
    workflowId: string,
    workflow: {
      name?: string;
      description?: string;
      nodes?: WorkflowNode[];
      connections?: WorkflowConnection[];
      config?: {
        isActive?: boolean;
        scheduleType?: "manual" | "cron" | "event";
        cronExpression?: string;
        triggerEvents?: string[];
      };
      status?: "draft" | "published" | "paused" | "error";
    }
  ): Promise<ApiResponse<Workflow>> {
    return this.request(`/agents/workflows/${workflowId}`, {
      method: "PUT",
      body: JSON.stringify(workflow),
    });
  }

  async deleteWorkflow(
    workflowId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request(`/agents/workflows/${workflowId}`, {
      method: "DELETE",
    });
  }

  async executeWorkflow(
    workflowId: string,
    inputData: Record<string, any> = {}
  ): Promise<ApiResponse<ExecutionResult>> {
    return this.request(`/agents/workflows/${workflowId}/execute`, {
      method: "POST",
      body: JSON.stringify({ inputData }),
    });
  }

  async getWorkflowExecutions(
    workflowId: string,
    params?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<
    ApiResponse<{
      executions: any[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(
      `/agents/workflows/${workflowId}/executions?${queryParams}`
    );
  }

  async getWorkflowTemplates(): Promise<
    ApiResponse<{
      templates: any[];
      categories: string[];
    }>
  > {
    return this.request("/agents/templates");
  }

  async getMarketplaceTemplates(params?: {
    category?: string;
    sort?: "popular" | "rating" | "recent" | "difficulty";
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResponse<{
      marketplaceWorkflows: WorkflowTemplate[];
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set("category", params.category);
    if (params?.sort) queryParams.set("sort", params.sort);
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/workflows/marketplace?${queryParams}`);
  }

  // ============================================================================
  // DEPLOYMENT MANAGEMENT ENDPOINTS
  // ============================================================================

  async deployTelegramBot(params: {
    workflowId: string;
    botToken: string;
    botName: string;
    webhookUrl?: string;
    commands?: any[];
    allowedUsers?: string[];
  }): Promise<ApiResponse<DeploymentConfig & { botInfo: any }>> {
    return this.request("/deployments/telegram", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getDeployments(params?: {
    platform?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResponse<{
      deployments: DeploymentConfig[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.platform) queryParams.set("platform", params.platform);
    if (params?.status) queryParams.set("status", params.status);
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/deployments?${queryParams}`);
  }

  async controlDeployment(
    deploymentId: string,
    action: "start" | "stop" | "restart"
  ): Promise<
    ApiResponse<{
      success: boolean;
      status: string;
      action: string;
    }>
  > {
    return this.request(`/deployments/${deploymentId}/${action}`, {
      method: "POST",
    });
  }

  async deployWorkflow(params: {
    workflowId: string;
    platform: "telegram" | "discord" | "slack" | "whatsapp" | "webhook";
    config: {
      botToken?: string;
      chatId?: string;
      webhookUrl?: string;
      [key: string]: any;
    };
    name: string;
    description?: string;
  }): Promise<ApiResponse<DeploymentConfig>> {
    return this.request("/deployments", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  // ============================================================================
  // SECRETS MANAGEMENT ENDPOINTS
  // ============================================================================

  async storeSecret(params: {
    name: string;
    value: string;
    type: "telegram_bot_token" | "api_key" | "webhook_url" | "custom";
  }): Promise<
    ApiResponse<{
      id: string;
      name: string;
      type: string;
      created: boolean;
    }>
  > {
    return this.request("/system/secrets", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getSecrets(): Promise<
    ApiResponse<{
      secrets: Secret[];
    }>
  > {
    return this.request("/system/secrets");
  }

  async deleteSecret(secretId: string): Promise<
    ApiResponse<{
      success: boolean;
      deleted: string;
    }>
  > {
    return this.request(`/system/secrets/${secretId}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // SCHEDULING ENDPOINTS
  // ============================================================================

  async scheduleWorkflow(
    workflowId: string,
    params: {
      workflowId: string;
      cronExpression: string;
      inputData?: Record<string, any>;
      name: string;
      description?: string;
    }
  ): Promise<
    ApiResponse<{
      scheduleId: string;
      workflowId: string;
      cronExpression: string;
      scheduled: boolean;
    }>
  > {
    return this.request(`/system/schedules`, {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getSchedules(): Promise<
    ApiResponse<{
      schedules: Schedule[];
    }>
  > {
    return this.request("/system/schedules");
  }

  async cancelSchedule(scheduleId: string): Promise<
    ApiResponse<{
      success: boolean;
      cancelled: string;
    }>
  > {
    return this.request(`/system/schedules/${scheduleId}`, {
      method: "DELETE",
    });
  }

  // ============================================================================
  // MCP (Model Context Protocol) ENDPOINTS
  // ============================================================================

  async executeMcpTool(params: {
    tool_name: string;
    arguments: any;
  }): Promise<ApiResponse<McpExecutionResult>> {
    return this.request("/mcp/execute", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getMcpTools(): Promise<
    ApiResponse<{
      tools: McpTool[];
      available_protocols: string[];
      user_tier: string;
    }>
  > {
    return this.request("/mcp/tools");
  }

  async getUserContext(params?: {
    type?: string;
    limit?: number;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set("type", params.type);
    if (params?.limit) queryParams.set("limit", params.limit.toString());

    return this.request(`/mcp/context?${queryParams}`);
  }

  // ============================================================================
  // CHAT ENDPOINTS
  // ============================================================================

  async chatCompletion(params: {
    messages: Array<{ role: string; content: string }>;
    agentId?: string;
    sessionId?: string;
    workflowContext?: any;
    model?: string;
  }): Promise<
    ApiResponse<{
      message?: string;
      conversationId?: string;
      remainingCredits?: number;
      choices?: any;
      choicesText?: string;
    }>
  > {
    return this.request("/chat/completion", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getChatSession(workflowId: string): Promise<
    ApiResponse<{
      sessionId: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        timestamp: string;
      }>;
      remainingCredits?: number;
    }>
  > {
    return this.request(`/chat/sessions/${workflowId}`);
  }

  async saveChatSession(params: {
    sessionId: string;
    workflowId: string;
    messages: Array<{
      id: string;
      role: string;
      content: string;
      timestamp: Date;
    }>;
    remainingCredits?: number;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request("/chat/sessions", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async getAllChatSessions(workflowId: string): Promise<
    ApiResponse<{
      sessions: Array<{
        id: string;
        workflowId: string;
        workflowName: string;
        messages: Array<{
          id: string;
          role: string;
          content: string;
          timestamp: string;
        }>;
        createdAt: string;
        updatedAt: string;
      }>;
    }>
  > {
    return this.request(`/chat/sessions/all/${workflowId}`);
  }

  async getChatSessionById(
    workflowId: string,
    sessionId: string
  ): Promise<
    ApiResponse<{
      sessionId: string;
      messages: Array<{
        id: string;
        role: string;
        content: string;
        timestamp: string;
      }>;
      remainingCredits?: number;
      feedback?: Record<string, string>;
    }>
  > {
    return this.request(`/chat/sessions/${workflowId}/${sessionId}`);
  }

  async addMessageFeedback(
    sessionId: string,
    messageId: string,
    feedback: "like" | "unlike"
  ): Promise<ApiResponse<{ messageId: string; feedback: string }>> {
    return this.request(
      `/chat/sessions/${sessionId}/messages/${messageId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ feedback }),
      }
    );
  }

  async getMessageFeedback(
    sessionId: string
  ): Promise<ApiResponse<{ feedback: Record<string, string> }>> {
    return this.request(`/chat/sessions/${sessionId}/feedback`);
  }

  // ============================================================================
  // MARKETPLACE ENDPOINTS
  // ============================================================================

  async getMarketplaceListings(params?: {
    category?: string;
    tag?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    sort?: "popular" | "rating" | "recent" | "price-low" | "price-high";
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResponse<{
      listings: MarketplaceListing[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.set("category", params.category);
    if (params?.tag) queryParams.set("tag", params.tag);
    if (params?.featured !== undefined)
      queryParams.set("featured", params.featured.toString());
    if (params?.minPrice !== undefined)
      queryParams.set("minPrice", params.minPrice.toString());
    if (params?.maxPrice !== undefined)
      queryParams.set("maxPrice", params.maxPrice.toString());
    if (params?.sort) queryParams.set("sort", params.sort);
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/workflows/marketplace?${queryParams}`);
  }

  async getMarketplaceListing(
    listingId: string
  ): Promise<ApiResponse<MarketplaceListing>> {
    return this.request(`/marketplace/listings/${listingId}`);
  }

  async getMarketplaceCategories(): Promise<
    ApiResponse<{
      categories: Array<{
        id: string;
        name: string;
        icon: string;
      }>;
    }>
  > {
    return this.request("/marketplace/categories");
  }

  async purchaseWorkflow(listingId: string): Promise<
    ApiResponse<{
      id: string;
      listingId: string;
      workflowId: string;
      buyerId: string;
      sellerId: string;
      price: number;
      pricingType: string;
      status: string;
      purchasedAt: string;
    }>
  > {
    return this.request(`/marketplace/listings/${listingId}/purchase`, {
      method: "POST",
    });
  }

  async getMyPurchases(params?: { limit?: number; offset?: number }): Promise<
    ApiResponse<{
      purchases: Array<{
        id: string;
        listingId: string;
        workflowId: string;
        buyerId: string;
        sellerId: string;
        price: number;
        pricingType: string;
        status: string;
        purchasedAt: string;
        listing?: MarketplaceListing;
      }>;
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/marketplace/purchases?${queryParams}`);
  }

  async getMyListings(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<
    ApiResponse<{
      listings: MarketplaceListing[];
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());

    return this.request(`/marketplace/my-listings?${queryParams}`);
  }

  async publishWorkflowToMarketplace(params: {
    workflowId: string;
    name: string;
    description: string;
    category: string;
    tags: string[];
    pricing: {
      type: "free" | "credits" | "sol";
      amount: number;
    };
    thumbnail?: string;
    screenshots?: string[];
  }): Promise<ApiResponse<MarketplaceListing>> {
    return this.request("/marketplace/listings", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  async updateMarketplaceListing(
    listingId: string,
    updates: {
      name?: string;
      description?: string;
      pricing?: {
        type: "free" | "credits" | "sol";
        amount: number;
      };
      tags?: string[];
    }
  ): Promise<ApiResponse<MarketplaceListing>> {
    return this.request(`/marketplace/listings/${listingId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async updateListingStatus(
    listingId: string,
    status: "active" | "paused"
  ): Promise<
    ApiResponse<{
      id: string;
      status: string;
      message: string;
    }>
  > {
    return this.request(`/marketplace/listings/${listingId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  async deleteMarketplaceListing(listingId: string): Promise<
    ApiResponse<{
      success: boolean;
      message: string;
    }>
  > {
    return this.request(`/marketplace/listings/${listingId}`, {
      method: "DELETE",
    });
  }

  async addListingReview(
    listingId: string,
    review: {
      rating: number;
      comment: string;
    }
  ): Promise<
    ApiResponse<{
      id: string;
      listingId: string;
      userId: string;
      userName: string;
      rating: number;
      comment: string;
      createdAt: string;
      helpful: number;
    }>
  > {
    return this.request(`/marketplace/listings/${listingId}/reviews`, {
      method: "POST",
      body: JSON.stringify(review),
    });
  }

  async getListingReviews(
    listingId: string,
    params?: {
      limit?: number;
      offset?: number;
      sort?: "recent" | "helpful" | "rating-high" | "rating-low";
    }
  ): Promise<
    ApiResponse<{
      reviews: Array<{
        id: string;
        listingId: string;
        userId: string;
        userName: string;
        rating: number;
        comment: string;
        createdAt: string;
        helpful: number;
      }>;
      total: number;
    }>
  > {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", params.limit.toString());
    if (params?.offset) queryParams.set("offset", params.offset.toString());
    if (params?.sort) queryParams.set("sort", params.sort);

    return this.request(
      `/marketplace/listings/${listingId}/reviews?${queryParams}`
    );
  }

  // ============================================================================
  // CONVENIENCE METHODS
  // ============================================================================

  /**
   * Set authentication token for subsequent requests
   */
  setAuthToken(token: string): void {
    this.config.authToken = token;
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.config.authToken = undefined;
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.config.baseUrl = url;
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }

  // ============================================================================
  // WORKFLOW BUILDER HELPERS
  // ============================================================================

  /**
   * Create a simple price monitoring workflow
   */
  createPriceMonitorWorkflow(params: {
    tokenAddress: string;
    alertThreshold?: number;
    chatId?: string;
  }): Partial<Workflow> {
    return {
      name: "Price Monitor",
      description: `Monitor token price and send alerts`,
      nodes: [
        {
          id: "timer_1",
          type: "input",
          category: "trigger",
          name: "On Schedule (Timer)",
          description: "Triggers on a scheduled basis",
          inputs: [
            {
              id: "cronExpression",
              name: "Cron Expression",
              type: "string",
              required: true,
              default: "0 */15 * * *",
            },
          ],
          outputs: [
            {
              id: "timestamp",
              name: "Timestamp",
              type: "string",
            },
          ],
          config: {},
          position: { x: 100, y: 100 },
        },
        {
          id: "jupiter_1",
          type: "protocol",
          category: "protocol",
          name: "Jupiter Price Check",
          description: "Get token price from Jupiter",
          inputs: [
            {
              id: "inputMint",
              name: "Input Token",
              type: "string",
              required: true,
            },
          ],
          outputs: [
            {
              id: "price",
              name: "Price",
              type: "number",
            },
          ],
          config: {
            protocol: "jupiter",
            method: "getTokenPrice",
            credits: 1,
          },
          position: { x: 300, y: 100 },
        },
        {
          id: "telegram_1",
          type: "output",
          category: "communication",
          name: "Send Telegram Message",
          description: "Send price alert to Telegram",
          inputs: [
            {
              id: "chatId",
              name: "Chat ID",
              type: "string",
              required: true,
            },
            {
              id: "message",
              name: "Message",
              type: "string",
              required: true,
            },
          ],
          outputs: [
            {
              id: "messageId",
              name: "Message ID",
              type: "string",
            },
            {
              id: "success",
              name: "Success",
              type: "boolean",
            },
          ],
          config: {
            platform: "telegram",
            credits: 1,
          },
          position: { x: 500, y: 100 },
        },
      ],
      connections: [
        {
          id: "conn_1",
          sourceNodeId: "timer_1",
          sourceOutputId: "timestamp",
          targetNodeId: "jupiter_1",
          targetInputId: "inputMint",
        },
        {
          id: "conn_2",
          sourceNodeId: "jupiter_1",
          sourceOutputId: "price",
          targetNodeId: "telegram_1",
          targetInputId: "message",
        },
      ],
      config: {
        isActive: true,
        scheduleType: "cron",
        cronExpression: "0 */15 * * *",
      },
    };
  }

  /**
   * Create a DeFi liquidation monitoring workflow
   */
  createLiquidationMonitorWorkflow(params: {
    walletAddress: string;
    healthThreshold?: number;
    chatId?: string;
  }): Partial<Workflow> {
    return {
      name: "DeFi Liquidation Guardian",
      description:
        "Monitor loan health and alert when liquidation risk is high",
      nodes: [
        {
          id: "timer_1",
          type: "input",
          category: "trigger",
          name: "On Schedule (Timer)",
          description: "Check every 15 minutes",
          inputs: [
            {
              id: "cronExpression",
              name: "Cron Expression",
              type: "string",
              required: true,
              default: "0 */15 * * *",
            },
          ],
          outputs: [
            {
              id: "timestamp",
              name: "Timestamp",
              type: "string",
            },
          ],
          config: {},
          position: { x: 100, y: 100 },
        },
        {
          id: "kamino_1",
          type: "protocol",
          category: "protocol",
          name: "Kamino Loan Health",
          description: "Check lending position health factor",
          inputs: [
            {
              id: "walletAddress",
              name: "Wallet Address",
              type: "string",
              required: true,
            },
          ],
          outputs: [
            {
              id: "healthFactor",
              name: "Health Factor",
              type: "number",
            },
            {
              id: "liquidationRisk",
              name: "Liquidation Risk",
              type: "string",
            },
          ],
          config: {
            protocol: "kamino",
            method: "getLoanHealth",
            credits: 1,
          },
          position: { x: 300, y: 100 },
        },
        {
          id: "telegram_1",
          type: "output",
          category: "communication",
          name: "Send Alert",
          description: "Send liquidation risk alert",
          inputs: [
            {
              id: "chatId",
              name: "Chat ID",
              type: "string",
              required: true,
            },
            {
              id: "message",
              name: "Message",
              type: "string",
              required: true,
            },
          ],
          outputs: [
            {
              id: "messageId",
              name: "Message ID",
              type: "string",
            },
            {
              id: "success",
              name: "Success",
              type: "boolean",
            },
          ],
          config: {
            platform: "telegram",
            credits: 1,
          },
          position: { x: 500, y: 100 },
        },
      ],
      connections: [
        {
          id: "conn_1",
          sourceNodeId: "timer_1",
          sourceOutputId: "timestamp",
          targetNodeId: "kamino_1",
          targetInputId: "walletAddress",
        },
        {
          id: "conn_2",
          sourceNodeId: "kamino_1",
          sourceOutputId: "healthFactor",
          targetNodeId: "telegram_1",
          targetInputId: "message",
        },
      ],
      config: {
        isActive: true,
        scheduleType: "cron",
        cronExpression: "0 */15 * * *",
      },
    };
  }
}

// ============================================================================
// EXPORT DEFAULT INSTANCE AND CLASS
// ============================================================================

export const createApiClient = (config: ApiConfig) =>
  new ForgexApiClient(config);

export const defaultApiClient = new ForgexApiClient({
  baseUrl:
    process.env.NEXT_PUBLIC_API_URL ||
    "https://forgex-ai-backend.vercel.app/api",
});

export default ForgexApiClient;
