"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Loader2, Bot, MessageSquare, Webhook, Settings } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DeployWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
}

export function DeployWorkflowModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
}: DeployWorkflowModalProps) {
  const [platform, setPlatform] = useState<"telegram" | "discord" | "mcp" | "webhook">("telegram");
  const [deploymentName, setDeploymentName] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [botName, setBotName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const { forgexAuth } = usePrivyAuth();

  const handleDeploy = async () => {
    if (!forgexAuth.isAuthenticated) {
      toast.error("Please authenticate first");
      return;
    }

    if (!deploymentName.trim()) {
      toast.error("Please enter a deployment name");
      return;
    }

    // Validate platform-specific fields
    if (platform === "telegram" && (!botToken.trim() || !chatId.trim() || !botName.trim())) {
      toast.error("Please enter bot token, chat ID, and bot name for Telegram");
      return;
    }

    if (platform === "webhook" && !webhookUrl.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    try {
      setIsDeploying(true);
      refreshApiClientAuth();

      let response;
      if (platform === "telegram") {
        response = await defaultApiClient.deployTelegramBot({
          workflowId,
          botToken: botToken.trim(),
          botName: botName.trim(),
          webhookUrl: `https://your-domain.com/webhook`,
          commands: [],
          allowedUsers: []
        });
      } else {
        const config: any = {};
        if (platform === "webhook") {
          config.webhookUrl = webhookUrl.trim();
        }

        response = await defaultApiClient.deployWorkflow({
          workflowId,
          platform,
          config,
          name: deploymentName.trim(),
        });
      }

      if (response.success) {
        toast.success("Workflow deployed successfully!");
        onClose();
        // Reset form
        setDeploymentName("");
        setBotToken("");
        setChatId("");
        setBotName("");
        setWebhookUrl("");
        setPlatform("telegram");
      } else {
        toast.error(response.error || "Failed to deploy workflow");
      }
    } catch (error) {
      console.error("Error deploying workflow:", error);
      toast.error("Failed to deploy workflow");
    } finally {
      setIsDeploying(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "telegram":
        return <Bot className="w-4 h-4" />;
      case "discord":
        return <MessageSquare className="w-4 h-4" />;
      case "webhook":
        return <Webhook className="w-4 h-4" />;
      case "mcp":
        return <Settings className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const renderPlatformFields = () => {
    switch (platform) {
      case "telegram":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="botToken">Bot Token</Label>
              <Input
                id="botToken"
                placeholder="Enter your Telegram bot token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Name</Label>
              <Input
                id="botName"
                placeholder="Enter a name for your bot"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatId">Chat ID</Label>
              <Input
                id="chatId"
                placeholder="Enter the chat ID to send messages to"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
          </>
        );
      case "webhook":
        return (
          <div className="space-y-2">
            <Label htmlFor="webhookUrl">Webhook URL</Label>
            <Input
              id="webhookUrl"
              placeholder="https://your-webhook-url.com/endpoint"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="bg-[#0B0C10] border-white/10"
            />
          </div>
        );
      case "discord":
        return (
          <div className="space-y-2">
            <Label htmlFor="botToken">Bot Token</Label>
            <Input
              id="botToken"
              placeholder="Enter your Discord bot token"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="bg-[#0B0C10] border-white/10"
            />
            <Label htmlFor="chatId">Channel ID</Label>
            <Input
              id="chatId"
              placeholder="Enter the Discord channel ID"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="bg-[#0B0C10] border-white/10"
            />
          </div>
        );
      case "mcp":
        return (
          <div className="space-y-2">
            <Label htmlFor="botToken">API Key</Label>
            <Input
              id="botToken"
              placeholder="Enter your MCP API key"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              className="bg-[#0B0C10] border-white/10"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1A1B23] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getPlatformIcon(platform)}
            <span>Deploy Workflow</span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Deploy "{workflowName}" to your chosen platform
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
              <SelectTrigger className="bg-[#0B0C10] border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1B23] border-white/10">
                <SelectItem value="telegram" className="text-white hover:bg-white/10">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span>Telegram</span>
                  </div>
                </SelectItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="discord" className="text-white hover:bg-white/10 cursor-not-allowed opacity-50" disabled>
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Discord</span>
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="webhook" className="text-white hover:bg-white/10 cursor-not-allowed opacity-50" disabled>
                        <div className="flex items-center space-x-2">
                          <Webhook className="w-4 h-4" />
                          <span>Webhook</span>
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem value="mcp" className="text-white hover:bg-white/10 cursor-not-allowed opacity-50" disabled>
                        <div className="flex items-center space-x-2">
                          <Settings className="w-4 h-4" />
                          <span>MCP</span>
                        </div>
                      </SelectItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Coming Soon</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deploymentName">Deployment Name</Label>
            <Input
              id="deploymentName"
              placeholder="Enter a name for this deployment"
              value={deploymentName}
              onChange={(e) => setDeploymentName(e.target.value)}
              className="bg-[#0B0C10] border-white/10"
            />
          </div>


          {renderPlatformFields()}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeploying}
            className="border-white/10 text-black cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              "Deploy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
