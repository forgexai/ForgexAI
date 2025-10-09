"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nodesAtom, edgesAtom } from "@/lib/state/atoms";
import { toast } from "sonner";
import { Save, Download, Send } from "lucide-react";
import Image from "next/image";

export function DashboardHeader() {
  const [nodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [botToken, setBotToken] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const { authenticated } = usePrivyAuth();

  const handleSaveWorkflow = () => {
    const workflow = {
      nodes,
      edges,
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(workflow, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workflow-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Workflow saved successfully");
  };

  const handleLoadWorkflow = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const workflow = JSON.parse(text);

        if (workflow.nodes && workflow.edges) {
          toast.success("Workflow loaded successfully");
        } else {
          toast.error("Invalid workflow file");
        }
      } catch (error) {
        toast.error("Failed to load workflow");
      }
    };
    input.click();
  };

  const handleDeployToTelegram = async () => {
    //TODO: Add deployment to Telegram
    if (!botToken.trim()) {
      toast.error("Please enter a bot token");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add nodes to your workflow before deploying");
      return;
    }

    setIsDeploying(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/deploy-agent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            botToken,
            workflow: {
              nodes,
              edges,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Deployment failed");
      }

      const data = await response.json();
      toast.success("Agent deployed successfully!");
      setIsDeployModalOpen(false);
      setBotToken("");
    } catch (error) {
      toast.error("Failed to deploy agent. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div className="h-16 bg-[#1A1B23] border-b border-white/10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="ForgexAI Logo"
            width={32}
            height={32}
            className="rounded"
          />
          <h1 className="text-xl font-bold text-white bg-clip-text text-transparent">
            ForgexAI Studio
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveWorkflow}
            className="border-gray-700 text-black cursor-pointer text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLoadWorkflow}
            className="border-gray-700  text-black cursor-pointer text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Load
          </Button>

          <Button
            size="sm"
            onClick={() => setIsDeployModalOpen(true)}
            disabled={!authenticated}
            className="bg-gradient-to-r from-[#9945FF]  to-[#00BBFF] text-white hover:opacity-90 cursor-pointer"
          >
            <Send className="w-4 h-4 mr-2" />
            Deploy to Telegram
          </Button>
        </div>
      </div>

      <Dialog open={isDeployModalOpen} onOpenChange={setIsDeployModalOpen}>
        <DialogContent className="bg-[#1A1B23] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Deploy Agent to Telegram</DialogTitle>
            <DialogDescription className="text-gray-400">
              Enter your Telegram bot token to deploy your workflow as a Telegram agent.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="botToken" className="text-sm text-gray-300">
                Telegram Bot Token
              </Label>
              <Input
                id="botToken"
                type="password"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="bg-[#0B0C10] border-gray-700 text-white"
              />
              <p className="text-xs text-gray-500">
                Get your bot token from{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#14F195] hover:underline"
                >
                  @BotFather
                </a>
              </p>
            </div>

            <div className="bg-[#0B0C10] border border-white/10 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-2">Workflow Summary:</p>
              <div className="flex gap-4 text-sm">
                <span className="text-gray-300">
                  {nodes.length} node{nodes.length !== 1 ? "s" : ""}
                </span>
                <span className="text-gray-300">
                  {edges.length} connection{edges.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeployModalOpen(false)}
              className="border-gray-700 text-black cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeployToTelegram}
              disabled={isDeploying || !botToken.trim()}
              className="bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#00BBFF] text-white hover:opacity-90"
            >
              {isDeploying ? "Deploying..." : "Confirm Deploy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
