"use client";

import { useState, useEffect, useCallback } from "react";
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
import {
  Loader2,
  Bot,
  MessageSquare,
  Phone,
  CheckCircle,
  Copy,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DeployWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  workflowName: string;
}

interface ExistingDeployment {
  id: string;
  platform: string;
  status: string;
  name: string;
}

interface DeploymentInstructions {
  title: string;
  steps: string[];
  webhookUrl?: string;
}

export function DeployWorkflowModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
}: DeployWorkflowModalProps) {
  const [platform, setPlatform] = useState<
    "telegram" | "discord" | "slack" | "whatsapp"
  >("telegram");
  const [botToken, setBotToken] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [channelId, setChannelId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [existingDeployments, setExistingDeployments] = useState<
    ExistingDeployment[]
  >([]);
  const [isLoadingDeployments, setIsLoadingDeployments] = useState(false);
  const [deploymentSuccess, setDeploymentSuccess] = useState(false);
  const [deploymentInstructions, setDeploymentInstructions] =
    useState<DeploymentInstructions | null>(null);
  const { forgexAuth } = usePrivyAuth();

  const fetchExistingDeployments = useCallback(async () => {
    try {
      setIsLoadingDeployments(true);
      refreshApiClientAuth();

      const response = await defaultApiClient.getWorkflowDeployments(
        workflowId
      );
      if (response.success && response.data) {
        setExistingDeployments(
          response.data.deployments.map((d) => ({
            id: d.id,
            platform: d.platform,
            status: d.status,
            name: d.name,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching deployments:", error);
    } finally {
      setIsLoadingDeployments(false);
    }
  }, [workflowId]);

  // Fetch existing deployments when modal opens
  useEffect(() => {
    if (isOpen && workflowId) {
      fetchExistingDeployments();
    }
  }, [isOpen, workflowId, fetchExistingDeployments]);

  const isActivePlatform = (platformName: string) => {
    return existingDeployments.some(
      (d) => d.platform === platformName && d.status === "active"
    );
  };

  const handleClose = () => {
    // Reset form
    setBotToken("");
    setAccessToken("");
    setPhoneNumberId("");
    setChannelId("");
    setGuildId("");
    setPlatform("telegram");
    setDeploymentSuccess(false);
    setDeploymentInstructions(null);
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handleDeploy = async () => {
    if (!forgexAuth.isAuthenticated) {
      toast.error("Please authenticate first");
      return;
    }

    // Check if platform is already deployed
    if (isActivePlatform(platform)) {
      toast.error(`A ${platform} bot is already active for this workflow`);
      return;
    }

    // Validate platform-specific fields
    if (platform === "telegram" && !botToken.trim()) {
      toast.error("Please enter bot token for Telegram");
      return;
    }

    if (platform === "discord" && !botToken.trim()) {
      toast.error("Please enter bot token for Discord");
      return;
    }

    if (platform === "slack" && !botToken.trim()) {
      toast.error("Please enter bot token for Slack");
      return;
    }

    if (
      platform === "whatsapp" &&
      (!accessToken.trim() || !phoneNumberId.trim())
    ) {
      toast.error("Please enter access token and phone number ID for WhatsApp");
      return;
    }

    try {
      setIsDeploying(true);
      refreshApiClientAuth();

      let response;
      const autoBotName = `${workflowName} Bot`;

      if (platform === "telegram") {
        response = await defaultApiClient.deployTelegramBot({
          workflowId,
          botToken: botToken.trim(),
          botName: autoBotName,
          commands: [],
          allowedUsers: [],
        });
      } else if (platform === "discord") {
        response = await defaultApiClient.deployDiscordBot({
          workflowId,
          botToken: botToken.trim(),
          botName: autoBotName,
          guildId: guildId.trim() || undefined,
          channelId: channelId.trim() || undefined,
          commands: [],
          allowedUsers: [],
        });
      } else if (platform === "slack") {
        response = await defaultApiClient.deploySlackBot({
          workflowId,
          botToken: botToken.trim(),
          botName: autoBotName,
          channelId: channelId.trim() || undefined,
          commands: [],
          allowedUsers: [],
        });
      } else if (platform === "whatsapp") {
        response = await defaultApiClient.deployWhatsAppBot({
          workflowId,
          accessToken: accessToken.trim(),
          phoneNumberId: phoneNumberId.trim(),
          botName: autoBotName,
          allowedNumbers: [],
        });
      }

      if (response?.success) {
        toast.success(
          `${
            platform.charAt(0).toUpperCase() + platform.slice(1)
          } bot deployed successfully!`
        );

        // Show deployment instructions
        setDeploymentSuccess(true);
        setDeploymentInstructions({
          title: (response as any)?.instructions?.title || "Setup Instructions",
          steps: (response as any)?.instructions?.steps || [],
          webhookUrl: (response as any)?.webhookUrl,
        });

        // Refresh deployments
        fetchExistingDeployments();
      } else {
        toast.error(response?.error || "Failed to deploy workflow");
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
      case "slack":
        return <MessageSquare className="w-4 h-4" />;
      case "whatsapp":
        return <Phone className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const renderPlatformFields = () => {
    switch (platform) {
      case "telegram":
        return (
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
        );
      case "discord":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discordBotToken">Bot Token</Label>
              <Input
                id="discordBotToken"
                placeholder="Enter your Discord bot token"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guildId">Guild ID (Optional)</Label>
              <Input
                id="guildId"
                placeholder="Enter Discord server/guild ID"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channelId">Channel ID (Optional)</Label>
              <Input
                id="channelId"
                placeholder="Enter Discord channel ID"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
          </div>
        );
      case "slack":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slackBotToken">Bot Token</Label>
              <Input
                id="slackBotToken"
                placeholder="Enter your Slack bot token (xoxb-...)"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slackChannelId">Channel ID (Optional)</Label>
              <Input
                id="slackChannelId"
                placeholder="Enter Slack channel ID"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
          </div>
        );
      case "whatsapp":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accessToken">Access Token</Label>
              <Input
                id="accessToken"
                placeholder="Enter your WhatsApp access token"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumberId">Phone Number ID</Label>
              <Input
                id="phoneNumberId"
                placeholder="Enter WhatsApp phone number ID"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                className="bg-[#0B0C10] border-white/10"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderDeploymentInstructions = () => {
    if (!deploymentInstructions) return null;

    return (
      <div className="space-y-6">
        <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-400">
              Deployment Complete
            </span>
          </div>
          <p className="text-sm text-gray-300">
            Your {platform} bot has been deployed successfully. Complete the
            setup using the instructions below.
          </p>
        </div>

        {deploymentInstructions.webhookUrl && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Webhook URL</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={deploymentInstructions.webhookUrl}
                readOnly
                className="bg-[#0B0C10] border-white/10 text-sm font-mono"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  copyToClipboard(deploymentInstructions.webhookUrl!)
                }
                className="border-white/10 hover:bg-white/10"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Use this webhook URL in your {platform} app settings.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm font-semibold">
            {deploymentInstructions.title}
          </Label>
          <div className="space-y-2">
            {deploymentInstructions.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </span>
                <span className="text-gray-300">{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <h4 className="font-semibold text-blue-400 mb-2">Important Notes:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>
              • Make sure to save your webhook URL and configure it in your{" "}
              {platform} app
            </li>
            <li>• Your bot is now active and ready to receive messages</li>
            <li>
              • You can test the bot by sending a message through {platform}
            </li>
            {platform === "whatsapp" && (
              <li>
                • WhatsApp bots require approval from Meta for production use
              </li>
            )}
          </ul>
        </div>
      </div>
    );
  };

  const renderDeploymentForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={platform}
          onValueChange={(value: any) => setPlatform(value)}
        >
          <SelectTrigger className="bg-[#0B0C10] border-white/10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1A1B23] border-white/10">
            <SelectItem
              value="telegram"
              className={`text-white hover:bg-white/10 ${
                isActivePlatform("telegram") ? "opacity-50" : ""
              }`}
              disabled={isActivePlatform("telegram")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Bot className="w-4 h-4" />
                  <span>Telegram</span>
                </div>
                {isActivePlatform("telegram") && (
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Active</span>
                  </div>
                )}
              </div>
            </SelectItem>
            <SelectItem
              value="discord"
              className={`text-white hover:bg-white/10 ${
                isActivePlatform("discord") ? "opacity-50" : ""
              }`}
              disabled={isActivePlatform("discord")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Discord</span>
                </div>
                {isActivePlatform("discord") && (
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Active</span>
                  </div>
                )}
              </div>
            </SelectItem>
            <SelectItem
              value="slack"
              className={`text-white hover:bg-white/10 ${
                isActivePlatform("slack") ? "opacity-50" : ""
              }`}
              disabled={isActivePlatform("slack")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>Slack</span>
                </div>
                {isActivePlatform("slack") && (
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Active</span>
                  </div>
                )}
              </div>
            </SelectItem>
            <SelectItem
              value="whatsapp"
              className={`text-white hover:bg-white/10 ${
                isActivePlatform("whatsapp") ? "opacity-50" : ""
              }`}
              disabled={isActivePlatform("whatsapp")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp</span>
                </div>
                {isActivePlatform("whatsapp") && (
                  <div className="flex items-center space-x-1 text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Active</span>
                  </div>
                )}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoadingDeployments && (
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading existing deployments...</span>
        </div>
      )}

      {renderPlatformFields()}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1B23] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getPlatformIcon(platform)}
            <span>
              {deploymentSuccess ? "Deployment Successful!" : "Deploy Workflow"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {deploymentSuccess
              ? "Your bot has been deployed successfully. Follow the instructions below to complete the setup."
              : `Deploy "${workflowName}" to your chosen platform`}
          </DialogDescription>
        </DialogHeader>

        {deploymentSuccess
          ? renderDeploymentInstructions()
          : renderDeploymentForm()}

        <DialogFooter>
          {deploymentSuccess ? (
            <Button
              onClick={handleClose}
              className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer w-full"
            >
              Done
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isDeploying}
                className="border-white/10 text-black cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={isDeploying || isActivePlatform(platform)}
                className="bg-gradient-to-r from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : isActivePlatform(platform) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Active
                  </>
                ) : (
                  "Deploy"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
