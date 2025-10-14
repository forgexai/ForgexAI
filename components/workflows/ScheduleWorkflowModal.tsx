"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { Loader2, Clock } from "lucide-react";

interface ScheduleWorkflowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
  onScheduleSuccess?: () => void;
}

const cronPresets = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 2 hours", value: "0 */2 * * *" },
  { label: "Every 3 hours", value: "0 */3 * * *" },
  { label: "Every 4 hours", value: "0 */4 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 8 hours", value: "0 */8 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 9:00 AM", value: "0 9 * * *" },
  { label: "Daily at 6:00 PM", value: "0 18 * * *" },
  { label: "Weekly on Monday at 9:00 AM", value: "0 9 * * 1" },
  { label: "Monthly on the 1st at 9:00 AM", value: "0 9 1 * *" },
];

export function ScheduleWorkflowModal({
  open,
  onOpenChange,
  workflowId,
  workflowName,
  onScheduleSuccess,
}: ScheduleWorkflowModalProps) {
  const [scheduleName, setScheduleName] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [cronExpression, setCronExpression] = useState("");
  const [customCron, setCustomCron] = useState("");
  const [isCustomCron, setIsCustomCron] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!scheduleName.trim()) {
      toast.error("Please enter a schedule name");
      return;
    }

    if (!cronExpression && !customCron) {
      toast.error("Please select or enter a cron expression");
      return;
    }

    setIsScheduling(true);
    try {
      refreshApiClientAuth();
      
      const finalCronExpression = isCustomCron ? customCron : cronExpression;
      
      const response = await defaultApiClient.scheduleWorkflow(workflowId, {
        workflowId,
        cronExpression: finalCronExpression,
        inputData: {}, // Empty input data for now, can be enhanced later
        name: scheduleName,
        description: scheduleDescription,
      });

      if (response.success && response.data) {
        toast.success("Workflow scheduled successfully!");
        onScheduleSuccess?.();
        onOpenChange(false);
        // Reset form
        setScheduleName("");
        setScheduleDescription("");
        setCronExpression("");
        setCustomCron("");
        setIsCustomCron(false);
      } else {
        toast.error(response.error || "Failed to schedule workflow");
      }
    } catch (error) {
      console.error("Error scheduling workflow:", error);
      toast.error("Failed to schedule workflow");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleClose = () => {
    if (!isScheduling) {
      onOpenChange(false);
      // Reset form
      setScheduleName("");
      setScheduleDescription("");
      setCronExpression("");
      setCustomCron("");
      setIsCustomCron(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#1A1B23] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Schedule Workflow
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Schedule "{workflowName}" to run automatically
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-name" className="text-white mb-2">
              Schedule Name *
            </Label>
            <Input
              id="schedule-name"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              placeholder="e.g., Hourly Price Check"
              className="bg-[#0B0C10] border-white/10 text-white"
              disabled={isScheduling}
            />
          </div>

          <div>
            <Label htmlFor="schedule-description" className="text-white mb-2">
              Description
            </Label>
            <Textarea
              id="schedule-description"
              value={scheduleDescription}
              onChange={(e) => setScheduleDescription(e.target.value)}
              placeholder="e.g., Check token price every hour"
              className="bg-[#0B0C10] border-white/10 text-white"
              disabled={isScheduling}
            />
          </div>

          <div>
            <Label className="text-white mb-2">Schedule Frequency *</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="preset-cron"
                  name="cron-type"
                  checked={!isCustomCron}
                  onChange={() => setIsCustomCron(false)}
                  disabled={isScheduling}
                  className="text-orange-500"
                />
                <Label htmlFor="preset-cron" className="text-gray-300">
                  Use preset
                </Label>
              </div>
              
              {!isCustomCron && (
                <Select
                  value={cronExpression}
                  onValueChange={setCronExpression}
                  disabled={isScheduling}
                >
                  <SelectTrigger className="bg-[#0B0C10] border-white/10 text-white">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1B23] border-white/10">
                    {cronPresets.map((preset) => (
                      <SelectItem
                        key={preset.value}
                        value={preset.value}
                        className="text-white hover:bg-white/10"
                      >
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="custom-cron"
                  name="cron-type"
                  checked={isCustomCron}
                  onChange={() => setIsCustomCron(true)}
                  disabled={isScheduling}
                  className="text-orange-500"
                />
                <Label htmlFor="custom-cron" className="text-gray-300">
                  Custom cron expression
                </Label>
              </div>
              
              {isCustomCron && (
                <Input
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="e.g., 0 */1 * * *"
                  className="bg-[#0B0C10] border-white/10 text-white"
                  disabled={isScheduling}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isScheduling}
            className="border-gray-700 text-black cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={isScheduling || (!scheduleName.trim() || (!cronExpression && !customCron))}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90 text-white cursor-pointer"
          >
            {isScheduling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin " />
                Scheduling...
              </>
            ) : (
              "Schedule Workflow"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
