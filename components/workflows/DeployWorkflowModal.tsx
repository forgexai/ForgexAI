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
  HelpCircle,
} from "lucide-react";

// Platform Icon Components
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M16.9,8.1l-1.7,8.2c-0.1,0.6-0.5,0.7-0.9,0.4l-2.6-2c-0.6,0.6-1.2,1.1-1.3,1.3c-0.2,0.1-0.3,0.3-0.5,0.3c-0.3,0-0.3-0.2-0.4-0.4l-0.9-3L5.9,12c-0.6-0.2-0.6-0.6,0.1-0.9l10.2-3.9C16.6,7.1,17.1,7.3,16.9,8.1z M14.5,9l-5.7,3.6l0.9,3l0.2-2l4.9-4.4C15.1,8.9,14.9,8.9,14.5,9z"/>
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
    </g>
  </svg>
);

const SlackIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <g>
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.528 2.528 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </g>
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.982 2.898a9.825 9.825 0 012.893 6.943c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
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

  const getPlatformHelpInstructions = (platform: string) => {
    switch (platform) {
      case "telegram":
        return {
          title: "Telegram Bot Setup Instructions",
          steps: [
            "Create a bot using @BotFather on Telegram",
            "Send /newbot to @BotFather and choose a name and username for your bot",
            "Copy the bot token provided by @BotFather",
            "Paste the bot token in the form above and deploy",
            "Click Deploy and wait for the bot to be deployed",
            "Test your bot by sending a message to it on Telegram",
          ],
        };
      case "discord":
        return {
          title: "Discord Bot Setup Instructions",
          steps: [
            "Go to Discord Developer Portal (https://discord.com/developers/applications)",
            "Create a new application and go to the 'Bot' section",
            "Click 'Add Bot' and copy the bot token",
            "Get your server's Guild ID (enable Developer Mode in Discord settings)",
            "Optionally get a specific Channel ID where the bot should respond",
            "Invite the bot to your server with appropriate permissions",
            "Deploy the bot and configure the webhook URL",
            "Test by mentioning the bot or using commands in Discord",
          ],
        };
      case "slack":
        return {
          title: "Slack Bot Setup Instructions",
          steps: [
            "Go to Slack API website (https://api.slack.com/apps)",
            "Create a new Slack app for your workspace",
            "Go to 'OAuth & Permissions' and copy the Bot User OAuth Token (xoxb-...)",
            "Add necessary bot token scopes (chat:write, app_mentions:read, etc.)",
            "Install the app to your workspace",
            "Optionally get a specific Channel ID where the bot should respond",
            "Deploy the bot and configure the webhook URL in Event Subscriptions",
            "Test by mentioning the bot or sending DMs in Slack",
          ],
        };
      case "whatsapp":
        return {
          title: "WhatsApp Business API Setup Instructions",
          steps: [
            "Set up a Meta Developer account and create an app",
            "Add WhatsApp Business API product to your app",
            "Get your Access Token from the app dashboard",
            "Get your Phone Number ID from WhatsApp Business API settings",
            "Configure your business profile and verify your phone number",
            "Deploy the bot and configure the webhook URL in Meta dashboard",
            "Set up webhook verification and subscribe to message events",
            "Test by sending messages to your WhatsApp Business number",
            "Note: Production use requires Meta approval for your app",
          ],
        };
      default:
        return { title: "Setup Instructions", steps: [] };
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

        <div>
          <Label className="text-sm font-semibold">
            {/* {deploymentInstructions.title} */}
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

      </div>
    );
  };

  const renderDeploymentForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="platform">Platform</Label>
        <Select
          value={platform}
        onValueChange={(value: any) => {
          if (value === "telegram") {
            setPlatform(value);
          } else {
            toast.info("Coming Soon", {
              description: `${value.charAt(0).toUpperCase() + value.slice(1)} platform integration is coming soon!`,
            });
          }
        }}
          disabled={false}
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
                  <TelegramIcon className="w-4 h-4" />
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
              className="text-white opacity-50 hover:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <DiscordIcon className="w-4 h-4" />
                <span>Discord</span>
              </div>
            </SelectItem>
            <SelectItem
              value="slack"
              className="text-white opacity-50 hover:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <SlackIcon className="w-4 h-4" />
                <span>Slack</span>
              </div>
            </SelectItem>
            <SelectItem
              value="whatsapp"
              className="text-white opacity-50 hover:bg-white/10"
            >
              <div className="flex items-center space-x-2">
                <WhatsAppIcon className="w-4 h-4" />
                <span>WhatsApp</span>
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
          <DialogTitle className="flex items-center ">
            <div className="flex items-center space-x-2">
              {getPlatformIcon(platform)}
              <span>
                {deploymentSuccess
                  ? "Deployment Successful!"
                  : "Deploy Workflow"}
              </span>
            </div>
            {!deploymentSuccess && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    className="bg-[#1A1B23] border-white/10 text-white max-w-md p-4"
                  >
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">
                        {getPlatformHelpInstructions(platform).title}
                      </h4>
                      <div className="space-y-2">
                        {getPlatformHelpInstructions(platform).steps.map(
                          (step, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-2 text-xs"
                            >
                              <span className="flex-shrink-0 w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">
                                {index + 1}
                              </span>
                              <span className="text-gray-300 leading-relaxed">
                                {step}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                     
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
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
