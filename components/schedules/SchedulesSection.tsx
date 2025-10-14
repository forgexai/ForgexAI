"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { 
  Clock, 
  Trash2, 
  Play, 
  Pause, 
  Loader2,
  AlertCircle
} from "lucide-react";

interface Schedule {
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

interface SchedulesSectionProps {}

export function SchedulesSection({}: SchedulesSectionProps) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [schedulesError, setSchedulesError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSchedules = async () => {
    setSchedulesLoading(true);
    setSchedulesError(null);
    try {
      refreshApiClientAuth();
      const response = await defaultApiClient.getSchedules();
      if (response.success && response.data) {
        setSchedules(response.data.schedules);
      } else {
        setSchedulesError(response.error || 'Failed to fetch schedules');
        toast.error(response.error || 'Failed to fetch schedules');
      }
    } catch (error: any) {
      console.error('Error fetching schedules:', error);
      setSchedulesError(error.message || 'Failed to fetch schedules');
      toast.error(error.message || 'Failed to fetch schedules');
    } finally {
      setSchedulesLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDeleteSchedule = (scheduleId: string, scheduleName: string) => {
    setScheduleToDelete({ id: scheduleId, name: scheduleName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSchedule = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      refreshApiClientAuth();
      const response = await defaultApiClient.cancelSchedule(scheduleToDelete.id);
      if (response.success) {
        toast.success('Schedule cancelled successfully');
        fetchSchedules(); // Refresh schedules list
      } else {
        toast.error(response.error || 'Failed to cancel schedule');
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast.error('Failed to cancel schedule');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    }
  };

  const formatCronExpression = (cron: string) => {
    // Map of predefined cron expressions to human-readable text
    const cronMap: Record<string, string> = {
      "0 * * * *": "Every hour",
      "0 */6 * * *": "Every 6 hours",
      "0 */12 * * *": "Every 12 hours",
      "0 0 * * *": "Daily at midnight (12:00 AM)",
      "0 9 * * *": "Daily at 9:00 AM",
      "0 18 * * *": "Daily at 6:00 PM",
      "0 9 * * 1": "Weekly on Monday at 9:00 AM",
      "0 9 1 * *": "Monthly on the 1st at 9:00 AM",
      "*/5 * * * *": "Every 5 minutes",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
      "0 */2 * * *": "Every 2 hours",
      "0 */3 * * *": "Every 3 hours",
      "0 */4 * * *": "Every 4 hours",
      "0 */8 * * *": "Every 8 hours",
    };

    // Check if it's a predefined expression first
    if (cronMap[cron]) {
      return cronMap[cron];
    }

    // Fallback: parse the cron expression
    const parts = cron.split(' ');
    if (parts.length === 5) {
      const [minute, hour, day, month, weekday] = parts;
      
      // Every X minutes
      if (minute.startsWith('*/') && hour === '*' && day === '*' && month === '*' && weekday === '*') {
        const interval = minute.substring(2);
        return `Every ${interval} minutes`;
      }
      
      // Every X hours
      if (minute === '0' && hour.startsWith('*/') && day === '*' && month === '*' && weekday === '*') {
        const interval = hour.substring(2);
        return `Every ${interval} hours`;
      }
      
      // Daily at specific time
      if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        const timeStr = hourNum === 0 ? '12' : hourNum > 12 ? (hourNum - 12).toString() : hourNum.toString();
        const ampm = hourNum < 12 ? 'AM' : 'PM';
        const minuteStr = minuteNum === 0 ? '' : `:${minuteNum.toString().padStart(2, '0')}`;
        return `Daily at ${timeStr}${minuteStr} ${ampm}`;
      }
      
      // Weekly on specific day
      if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[parseInt(weekday)] || weekday;
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        const timeStr = hourNum === 0 ? '12' : hourNum > 12 ? (hourNum - 12).toString() : hourNum.toString();
        const ampm = hourNum < 12 ? 'AM' : 'PM';
        const minuteStr = minuteNum === 0 ? '' : `:${minuteNum.toString().padStart(2, '0')}`;
        return `Weekly on ${dayName} at ${timeStr}${minuteStr} ${ampm}`;
      }
      
      // Monthly on specific day
      if (minute !== '*' && hour !== '*' && day !== '*' && month === '*' && weekday === '*') {
        const hourNum = parseInt(hour);
        const minuteNum = parseInt(minute);
        const timeStr = hourNum === 0 ? '12' : hourNum > 12 ? (hourNum - 12).toString() : hourNum.toString();
        const ampm = hourNum < 12 ? 'AM' : 'PM';
        const minuteStr = minuteNum === 0 ? '' : `:${minuteNum.toString().padStart(2, '0')}`;
        return `Monthly on the ${day}${day.endsWith('1') && day !== '11' ? 'st' : day.endsWith('2') && day !== '12' ? 'nd' : day.endsWith('3') && day !== '13' ? 'rd' : 'th'} at ${timeStr}${minuteStr} ${ampm}`;
      }
    }
    
    // If we can't parse it, return the original cron expression
    return cron;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (schedulesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading schedules...</span>
        </div>
      </div>
    );
  }

  if (schedulesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span>Error: {schedulesError}</span>
        </div>
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        {/* SVG Icon */}
        <div className="mb-6">
          <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-gray-500"
          >
            {/* Clock Face */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="currentColor"
              fillOpacity="0.05"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            
            {/* Hour Markers */}
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i * 30) * (Math.PI / 180);
              const x1 = 50 + 32 * Math.cos(angle - Math.PI / 2);
              const y1 = 50 + 32 * Math.sin(angle - Math.PI / 2);
              const x2 = 50 + 36 * Math.cos(angle - Math.PI / 2);
              const y2 = 50 + 36 * Math.sin(angle - Math.PI / 2);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeWidth={i % 3 === 0 ? "2" : "1"}
                  strokeOpacity="0.4"
                />
              );
            })}
            
            {/* Center Dot */}
            <circle
              cx="50"
              cy="50"
              r="4"
              fill="currentColor"
              fillOpacity="0.8"
            />
            
            {/* Hour Hand */}
            <path
              d="M50 50L50 30"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Minute Hand */}
            <path
              d="M50 50L65 50"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Schedule Indicators */}
            <circle
              cx="25"
              cy="25"
              r="3"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <circle
              cx="75"
              cy="25"
              r="3"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <circle
              cx="25"
              cy="75"
              r="3"
              fill="currentColor"
              fillOpacity="0.3"
            />
            <circle
              cx="75"
              cy="75"
              r="3"
              fill="currentColor"
              fillOpacity="0.3"
            />
            
            {/* Calendar/Schedule Elements */}
            <rect
              x="15"
              y="85"
              width="70"
              height="12"
              rx="2"
              fill="currentColor"
              fillOpacity="0.1"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            <rect
              x="20"
              y="88"
              width="8"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.2"
            />
            <rect
              x="32"
              y="88"
              width="8"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.2"
            />
            <rect
              x="44"
              y="88"
              width="8"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.2"
            />
            <rect
              x="56"
              y="88"
              width="8"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.2"
            />
            <rect
              x="68"
              y="88"
              width="8"
              height="6"
              rx="1"
              fill="currentColor"
              fillOpacity="0.2"
            />
          </svg>
        </div>
        
        <p className="text-center mb-6 text-gray-300">No schedules yet</p>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Schedule workflows to run automatically at specific times or intervals. Create your first schedule from the Workflows section.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="bg-[#1A1B23] border border-white/10 rounded-lg p-6 flex flex-col justify-between hover:border-white/20 transition-colors"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-white">{schedule.name || "Untitled"}</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                  className="border-red-600/30 text-white bg-red-600 hover:bg-red-700 hover:border-red-500/50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  
                </Button>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                {schedule.description || "No description provided."}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Status</span>
                  <Badge 
                    className={schedule.isActive 
                      ? "bg-green-600/20 text-green-400 border border-green-600/30" 
                      : "bg-gray-600/20 text-gray-400 border border-gray-600/30"
                    }
                  >
                    {schedule.isActive ? (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </>
                    )}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Frequency</span>
                  <span className="text-white text-sm">
                    {formatCronExpression(schedule.cronExpression)}
                  </span>
                </div>
                
                {schedule.nextExecution && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Next Run</span>
                    <span className="text-white text-sm">
                      {formatDate(schedule.nextExecution)}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">Created</span>
                  <span className="text-white text-sm">
                    {formatDate(schedule.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1A1B23] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Schedule</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to cancel the schedule <span className="font-semibold text-white">"{scheduleToDelete?.name}"</span>?
              This action cannot be undone and will permanently stop the scheduled execution.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="border-gray-700 text-black cursor-pointer"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSchedule}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? "Cancelling..." : "Cancel Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
