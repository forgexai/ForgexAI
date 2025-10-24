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
import { Loader2, Bot, MessageSquare } from "lucide-react";
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

export function DeployWorkflowModal({
  isOpen,
  onClose,
  workflowId,
  workflowName,
}: DeployWorkflowModalProps) {
  const [platform, setPlatform] = useState<
    "telegram" | "discord" | "slack" | "whatsapp"
  >("telegram");
  const [deploymentName, setDeploymentName] = useState("");
  const [botToken, setBotToken] = useState("");
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

    // For Telegram, only validate bot token
    if (platform === "telegram" && !botToken.trim()) {
      toast.error("Please enter bot token for Telegram");
      return;
    }

    try {
      setIsDeploying(true);
      refreshApiClientAuth();

      let response;
      if (platform === "telegram") {
        // Auto-generate deployment name and bot name
        const autoDeploymentName =
          deploymentName.trim() || `${workflowName}-bot`;
        const autoBotName = `${workflowName} Bot`;

        response = await defaultApiClient.deployTelegramBot({
          workflowId,
          botToken: botToken.trim(),
          botName: autoBotName,
          commands: [],
          allowedUsers: [],
        });
      } else {
        // For other platforms (discord, slack)
        const config: any = {};

        response = await defaultApiClient.deployWorkflow({
          workflowId,
          name: deploymentName.trim() || `${workflowName}-deployment`,
          platform,
          config,
        });
      }

      if (response.success) {
        toast.success("Workflow deployed successfully!");
        onClose();
        // Reset form
        setDeploymentName("");
        setBotToken("");
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
      case "slack":
        return <MessageSquare className="w-4 h-4" />;
      case "whatsapp":
        return <MessageSquare className="w-4 h-4" />;
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
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Discord integration coming soon...
            </p>
          </div>
        );
      case "slack":
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Slack integration coming soon...
            </p>
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
            Deploy &quot;{workflowName}&quot; to your chosen platform
          </DialogDescription>
        </DialogHeader>

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
                  className="text-white hover:bg-white/10"
                >
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <span>Telegram</span>
                  </div>
                </SelectItem>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectItem
                        value="discord"
                        className="text-white hover:bg-white/10 cursor-not-allowed opacity-50"
                        disabled
                      >
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
                      <SelectItem
                        value="slack"
                        className="text-white hover:bg-white/10 cursor-not-allowed opacity-50"
                        disabled
                      >
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Slack</span>
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
                      <SelectItem
                        value="slack"
                        className="text-white hover:bg-white/10 cursor-not-allowed opacity-50"
                        disabled
                      >
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Whatsapp</span>
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
