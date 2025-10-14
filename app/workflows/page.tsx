"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";
import { 
  Workflow,  
  Play,  
  Store, 
  Database,
  Search,
  Grid3X3,
  Plus,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import Image from "next/image";

const sidebarItems = [
  { id: 'workflows', label: 'Workflows', icon: Workflow, active: true },
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

export default function WorkflowsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('workflows');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
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

    fetchUserProfile();
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

              {/* Empty State */}
              <div className="flex-1 flex flex-col items-center justify-center px-8">
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
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
