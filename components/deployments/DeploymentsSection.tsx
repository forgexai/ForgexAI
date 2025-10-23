"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient, DeploymentConfig } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import {
  MoreVertical,
  Play,
  Pause,
  Square,
  RotateCcw,
  Loader2,
  ExternalLink,
  Bot,
  Webhook,
  MessageSquare,
  Settings,
} from "lucide-react";

type DeploymentsSectionProps = Record<string, never>;
export function DeploymentsSection({}: DeploymentsSectionProps) {
  const [deployments, setDeployments] = useState<DeploymentConfig[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(true);
  const [deploymentsError, setDeploymentsError] = useState<string | null>(null);
  const [controllingDeployment, setControllingDeployment] = useState<
    string | null
  >(null);
  const { forgexAuth } = usePrivyAuth();

  const fetchDeployments = async () => {
    try {
      setDeploymentsLoading(true);
      setDeploymentsError(null);

      refreshApiClientAuth();
      const response = await defaultApiClient.getDeployments({
        limit: 20,
        offset: 0,
      });

      if (response.success && response.data) {
        setDeployments(response.data.deployments);
      } else {
        setDeploymentsError(response.error || "Failed to fetch deployments");
      }
    } catch (error) {
      console.error("Error fetching deployments:", error);
      setDeploymentsError("Failed to fetch deployments");
    } finally {
      setDeploymentsLoading(false);
    }
  };

  const handleControlDeployment = async (
    deploymentId: string,
    action: "start" | "stop" | "restart"
  ) => {
    try {
      setControllingDeployment(deploymentId);
      refreshApiClientAuth();

      const response = await defaultApiClient.controlDeployment(
        deploymentId,
        action
      );

      if (response.success) {
        toast.success(`Deployment ${action}ed successfully`);
        await fetchDeployments(); // Refresh the list
      } else {
        toast.error(response.error || `Failed to ${action} deployment`);
      }
    } catch (error) {
      console.error(`Error ${action}ing deployment:`, error);
      toast.error(`Failed to ${action} deployment`);
    } finally {
      setControllingDeployment(null);
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
        return <ExternalLink className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "paused":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "deploying":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "stopped":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (forgexAuth.isAuthenticated) {
      fetchDeployments();
    }
  }, [forgexAuth.isAuthenticated]);

  if (deploymentsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading deployments...</span>
        </div>
      </div>
    );
  }

  if (deploymentsError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <div className="mb-4">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-red-500"
          >
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 20L40 40M40 20L20 40"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="text-center mb-4 text-red-400">{deploymentsError}</p>
        <Button onClick={fetchDeployments} variant="outline" size="sm">
          Try Again
        </Button>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        {/* Enhanced SVG Icon */}
        <div className="mb-6">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-500"
          >
            {/* Background circle with gradient effect */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="currentColor"
              fillOpacity="0.05"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.2"
            />

            {/* Rocket body */}
            <rect
              x="35"
              y="25"
              width="30"
              height="50"
              rx="6"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
            />

            {/* Rocket nose cone */}
            <path
              d="M35 25L50 10L65 25L50 35L35 25Z"
              fill="currentColor"
              fillOpacity="0.15"
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity="0.3"
            />

            {/* Rocket fins */}
            <path
              d="M35 75L30 85L40 85L35 75Z"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
            <path
              d="M65 75L70 85L60 85L65 75Z"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />

            {/* Rocket window */}
            <circle
              cx="50"
              cy="40"
              r="6"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* Rocket details */}
            <rect
              x="42"
              y="50"
              width="16"
              height="2"
              rx="1"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <rect
              x="42"
              y="55"
              width="12"
              height="2"
              rx="1"
              fill="currentColor"
              fillOpacity="0.3"
            />

            {/* Exhaust flames */}
            <path
              d="M40 75L45 85L50 80L55 85L60 75"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.3"
            />

            {/* Stars around the rocket */}
            <circle
              cx="20"
              cy="20"
              r="1.5"
              fill="currentColor"
              fillOpacity="0.4"
            />
            <circle
              cx="80"
              cy="30"
              r="1"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <circle
              cx="15"
              cy="60"
              r="1.2"
              fill="currentColor"
              fillOpacity="0.35"
            />
            <circle
              cx="85"
              cy="70"
              r="0.8"
              fill="currentColor"
              fillOpacity="0.25"
            />

            {/* Small sparkles */}
            <path
              d="M25 15L27 17L25 19L23 17L25 15Z"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <path
              d="M75 25L77 27L75 29L73 27L75 25Z"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </svg>
        </div>

        <div className="text-center space-y-3">
          <h3 className="text-lg font-medium text-gray-300">
            No deployments yet
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Deploy your workflows to Telegram, Discord, webhooks, or MCP to see
            them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deployments.map((deployment) => (
        <Card key={deployment.id} className="bg-[#0B0C10] border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getPlatformIcon(deployment.platform)}
                <div>
                  <CardTitle className="text-lg font-medium text-white">
                    {deployment.name}
                  </CardTitle>
                  <p className="text-sm text-gray-400">
                    {deployment.platform.charAt(0).toUpperCase() +
                      deployment.platform.slice(1)}{" "}
                    • Created {formatDate(deployment.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(deployment.status)}
                >
                  {deployment.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={controllingDeployment === deployment.id}
                    >
                      {controllingDeployment === deployment.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MoreVertical className="w-4 h-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1A1B23] border-white/10"
                  >
                    {deployment.status === "active" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleControlDeployment(deployment.id, "stop")
                        }
                        className="text-yellow-400 hover:bg-yellow-500/10"
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </DropdownMenuItem>
                    )}
                    {deployment.status === "paused" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleControlDeployment(deployment.id, "start")
                        }
                        className="text-green-400 hover:bg-green-500/10"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </DropdownMenuItem>
                    )}
                    {deployment.status === "stopped" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleControlDeployment(deployment.id, "start")
                        }
                        className="text-green-400 hover:bg-green-500/10"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() =>
                        handleControlDeployment(deployment.id, "restart")
                      }
                      className="text-blue-400 hover:bg-blue-500/10"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Restart
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    {deployment.status === "active" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleControlDeployment(deployment.id, "stop")
                        }
                        className="text-red-400 hover:bg-red-500/10"
                      >
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {deployment.description && (
              <p className="text-sm text-gray-400 mb-3">
                {deployment.description}
              </p>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Workflow ID: {deployment.workflowId}</span>
              {deployment.lastActivity && (
                <span>
                  Last activity: {formatDate(deployment.lastActivity)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
