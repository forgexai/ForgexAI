"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteWorkflowDialog } from "@/components/workflows/DeleteWorkflowDialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";
import { refreshApiClientAuth } from "@/lib/auth-utils";
import { toast } from "sonner";
import { 
  Workflow as WorkflowIcon,  
  Play,  
  Store, 
  Database,
  Search,
  Grid3X3,
  Plus,
  Settings,
  LogOut,
  Sparkles,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Play as PlayIcon
} from "lucide-react";
import Image from "next/image";

const sidebarItems = [
  { id: 'workflows', label: 'Workflows', icon: WorkflowIcon, active: true },
  { id: 'executions', label: 'Executions', icon: Play },
  { id: 'marketplace', label: 'Marketplace', icon: Store },

];

const evaluationItems = [
  { id: 'datasets', label: 'Datasets', icon: Database },
];

interface UserProfile {
  id: string;
  walletAddress: string;
  credits: number;
  tier: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

interface UserStats {
  totalSpent: number;
  totalEarned: number;
  totalTransactions: number;
}

interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string;
  nodes: any[];
  connections: any[];
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

export default function WorkflowsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workflows');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflowsLoading, setWorkflowsLoading] = useState(true);
  const [workflowsError, setWorkflowsError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { logout, forgexAuth } = usePrivyAuth();

  const handleAddWorkflow = () => {
    router.push('/canvas');
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleEditWorkflow = async (workflowId: string) => {
    try {

      router.push(`/canvas?workflow=${workflowId}&mode=edit`);
    } catch (error) {
      console.error('Failed to edit workflow:', error);
      toast.error('Failed to open workflow for editing');
    }
  };

  const handleDeleteWorkflow = (workflowId: string, workflowName: string) => {
    setWorkflowToDelete({ id: workflowId, name: workflowName });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteWorkflow = async () => {
    if (!workflowToDelete) return;

    // Check if user is authenticated
    if (!forgexAuth.isAuthenticated) {
      toast.error('Please log in to delete workflows');
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      // Refresh auth token before making the request
      refreshApiClientAuth();
      const response = await defaultApiClient.deleteWorkflow(workflowToDelete.id);
      if (response.success) {
        toast.success('Workflow deleted successfully');
        // Refresh workflows list
        const refreshResponse = await defaultApiClient.getWorkflows({
          limit: 20,
          offset: 0
        });
        if (refreshResponse.success && refreshResponse.data) {
          setWorkflows(refreshResponse.data.workflows);
        }
      } else {
        toast.error(response.error || 'Failed to delete workflow');
      }
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast.error('Failed to delete workflow');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setWorkflowToDelete(null);
    }
  };

  const handleRunWorkflow = (workflowId: string) => {
    // TODO: Implement runWorkflow API call
    console.log('Run workflow:', workflowId);
    toast.success('Workflow execution started');
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!forgexAuth.isAuthenticated) {
        setProfileLoading(false);
        return;
      }

      try {
        const response = await defaultApiClient.getUserProfile();
        if (response.success && response.data) {
          setUserProfile(response.data.user);
          setUserStats(response.data.stats);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    const fetchWorkflows = async () => {
      if (!forgexAuth.isAuthenticated) {
        setWorkflowsLoading(false);
        return;
      }

      try {
        setWorkflowsError(null);
        const response = await defaultApiClient.getWorkflows({
          limit: 20,
          offset: 0
        });
        if (response.success && response.data) {
          setWorkflows(response.data.workflows);
        } else {
          setWorkflowsError(response.error || 'Failed to fetch workflows');
        }
      } catch (error) {
        setWorkflowsError('Failed to fetch workflows');
        console.error('Failed to fetch workflows:', error);
      } finally {
        setWorkflowsLoading(false);
      }
    };

    fetchUserProfile();
    fetchWorkflows();
  }, [forgexAuth.isAuthenticated]);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-[#0B0C10] text-white overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#1A1B23] border-r border-white/10 flex flex-col">
           {/* Logo */}
           <div className="p-6 border-b border-white/10">
             <div className="flex items-center space-x-3">
               <Image
                 src="/logo.jpg"
                 alt="ForgexAI Logo"
                 width={32}
                 height={32}
                 className="rounded"
               />
               <span className="text-xl font-bold">ForgexAIStudio</span>
             </div>
           </div>

          {/* Navigation Items */}
          <div className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    activeTab === item.id
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Profile Section */}
          {!profileLoading && userProfile && (
            <div className="border-t border-white/10">
              <div className="bg-[#1A1B23] rounded-lg p-4 space-y-4">
                <div className="flex justify-around items-center">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-400">Current Plan</div>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      userProfile.tier === 'free' ? 'bg-gray-600 text-gray-200' :
                      userProfile.tier === 'pro' ? 'bg-blue-600 text-blue-100' :
                      'bg-purple-600 text-purple-100'
                    }`}>
                      {userProfile.tier.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="text-center space-y-1">
                    <div className="text-sm text-gray-400">Credits</div>
                    <div className="text-xl font-bold text-white">
                      {userProfile.credits.toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <Button className="w-full bg-gradient-to-r text-white from-blue-500 to-purple-600 hover:opacity-90 cursor-pointer">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </div>
          )}

          {/* Settings Section */}
          <div className="p-4 border-t border-white/10 space-y-2">
            {/* <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer">
              <Moon className="w-4 h-4 mr-3" />
              Dark Mode
            </Button> */}
            <Button variant="ghost" size="sm" className="w-full justify-start cursor-pointer">
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="px-8 py-6 flex-shrink-0">
                <h1 className="text-3xl font-bold mb-2">Workflows</h1>
                <p className="text-gray-400">Build autonomous Solana agents with visual workflows</p>
              </div>

              {/* Action Bar */}
              <div className="px-8 pb-6 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search Name or Category [Ctrl + F]"
                      className="pl-10 w-80 bg-[#1A1B23] border-white/10"
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
                <Button 
                  onClick={handleAddWorkflow}
                  className="bg-gradient-to-r text-white from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              </div>

              {/* Workflows Content */}
              <div className="flex-1 px-8 overflow-y-auto">
                {workflowsLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-gray-400">Loading workflows...</div>
                  </div>
                ) : workflowsError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-red-400">Error: {workflowsError}</div>
                  </div>
                ) : workflows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                    <div className="w-64 h-48 mb-8 relative">
                      {/* Monitor illustration */}
                      <div className="w-full h-32 bg-[#1A1B23] border border-white/20 rounded-lg relative">
                        <div className="absolute inset-2 bg-[#0B0C10] rounded border border-white/10"></div>
                        <div className="absolute top-4 left-4 right-4 h-1 bg-white/20 rounded"></div>
                        <div className="absolute top-6 left-4 right-4 h-1 bg-white/10 rounded"></div>
                        <div className="absolute top-8 left-4 right-4 h-1 bg-white/10 rounded"></div>
                      </div>
                      
                      {/* Character blobs */}
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute top-4 -right-2 w-6 h-6 bg-purple-400 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-2 -left-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-purple-600 rounded-full"></div>
                        </div>
                      </div>
                      <div className="absolute bottom-4 right-4 w-4 h-4 bg-purple-300 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full flex items-center justify-center">
                          <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-semibold mb-2">No Workflows Yet</h3>
                    <p className="text-gray-400 mb-6 text-center max-w-md">
                      Create your first autonomous Solana agent workflow to get started with visual automation
                    </p>
                    <Button 
                      onClick={handleAddWorkflow}
                      className="bg-gradient-to-r from-[#ff6b35] text-white to-[#f7931e] hover:opacity-90 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2 " />
                      Create Your First Workflow
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                    {workflows.map((workflow) => (
                      <div
                        key={workflow.id}
                        className="group bg-[#1A1B23] border border-white/10 rounded-xl p-6 hover:border-white/20 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 cursor-pointer relative overflow-hidden"
                        onClick={() => router.push(`/canvas?workflow=${workflow.id}`)}
                      >
                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <WorkflowIcon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-white truncate group-hover:text-orange-400 transition-colors">
                                  {workflow.name}
                                </h3>
                                <p className="text-sm text-gray-400 line-clamp-2 mt-1">
                                  {workflow.description || 'No description available'}
                                </p>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent 
                                align="end" 
                                className="w-48 bg-[#1A1B23] border-white/10 text-white"
                              >
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWorkflow(workflow.id);
                                  }}
                                  className="hover:bg-white/10 cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkflow(workflow.id, workflow.name);
                                  }}
                                  className="hover:bg-red-500/20 text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Status</span>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                workflow.status === 'published' ? 'bg-green-600/20 text-green-400 border border-green-600/30' :
                                workflow.status === 'draft' ? 'bg-yellow-600/20 text-yellow-400 border border-yellow-600/30' :
                                workflow.status === 'paused' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' :
                                'bg-red-600/20 text-red-400 border border-red-600/30'
                              }`}>
                                {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Nodes</span>
                              <span className="text-sm text-white font-medium">{workflow.nodes.length}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-400">Connections</span>
                              <span className="text-sm text-white font-medium">{workflow.connections.length}</span>
                            </div>
                       
                          </div>
                          
                          {/* Run Workflow Button at Bottom */}
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRunWorkflow(workflow.id);
                              }}
                              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25"
                            >
                              <PlayIcon className="w-4 h-4 mr-2" />
                              Run Workflow
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeleteWorkflowDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        workflowName={workflowToDelete?.name || null}
        isDeleting={isDeleting}
        onConfirm={confirmDeleteWorkflow}
      />
    </AuthGuard>
  );
}
