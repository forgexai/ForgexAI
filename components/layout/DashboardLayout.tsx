"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { PlanPopup } from "@/components/ui/plan-popup";
import { MobileHamburgerMenu } from "./MobileHamburgerMenu";
import { MobileSidebar } from "./MobileSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Workflow as WorkflowIcon,
  Clock,
  Store,
  Search,
  Plus,
  LogOut,
  Sparkles,
  Rocket,
} from "lucide-react";

const sidebarItems = [
  { id: "workflows", label: "Workflows", icon: WorkflowIcon },
  { id: "schedules", label: "Schedules", icon: Clock },
  { id: "deployments", label: "Deployments", icon: Rocket },
  { id: "marketplace", label: "Marketplace", icon: Store },
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userProfile?: UserProfile | null;
  userStats?: UserStats | null;
  profileLoading?: boolean;
  onAddNew?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  title?: string;
  subtitle?: string;
  onSearchChange?: (query: string) => void;
}

export function DashboardLayout({
  children,
  activeSection,
  onSectionChange,
  userProfile,
  userStats,
  profileLoading = false,
  onAddNew,
  showSearch = true,
  searchPlaceholder = "Search Name or Category",
  title = "Dashboard",
  subtitle = "Manage your workflows and executions",
  onSearchChange,
}: DashboardLayoutProps) {
  const [isPlanPopupOpen, setIsPlanPopupOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { logout } = usePrivyAuth();
  const isMobile = useIsMobile();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleUpgradePlan = (tier: string) => {
    // TODO: Implement actual upgrade logic
    console.log(`Upgrading to ${tier} plan`);
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 bg-[#1A1B23] border-r border-white/10 flex-col sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img
                src="/logo.jpg"
                alt="ForgeX"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold text-white whitespace-nowrap">
              ForgeXAI Studio
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-2">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onSectionChange(item.id)}
                  className={`w-full justify-start cursor-pointer text-base gap-2 mb-2 ${
                    isActive
                      ? "bg-gradient-to-r from-[#ff6b35] to-[#f7931e] text-white hover:opacity-90"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* User Profile Section */}
        {!profileLoading && userProfile && (
          <div className="border-t border-white/10">
            <div className="bg-[#1A1B23] rounded-lg p-4 space-y-4">
              <div className="flex justify-around items-center">
                <div className="text-center space-y-2">
                  <div className="text-sm text-gray-400">Current Plan</div>
                  <div
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      userProfile.tier === "free"
                        ? "bg-gray-600 text-gray-200"
                        : userProfile.tier === "pro"
                        ? "bg-blue-600 text-blue-100"
                        : "bg-purple-600 text-purple-100"
                    }`}
                  >
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

              <Button
                onClick={() => setIsPlanPopupOpen(true)}
                className="w-full bg-gradient-to-r text-white from-blue-500 to-purple-600 hover:opacity-90 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        )}

        {/* Settings Section */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start cursor-pointer text-white"
          >
            <Settings className="w-4 h-4 mr-3" />
            Settings
          </Button> */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start cursor-pointer text-white"
            onClick={() => setIsLogoutDialogOpen(true)}
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-white">{title}</h1>
                  <p className="text-gray-400">{subtitle}</p>
                </div>
                <MobileHamburgerMenu
                  isOpen={isMobileSidebarOpen}
                  onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                />
              </div>
            </div>

            {/* Action Bar */}
            <div className="px-4 md:px-8 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between flex-shrink-0 gap-4">
              <div className="flex items-center space-x-4 w-full md:w-auto">
                {showSearch && (
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10 w-full md:w-80 bg-[#1A1B23] border-white/10 text-white placeholder:text-gray-500"
                    />
                  </div>
                )}
              </div>
              {onAddNew && (
                <Button
                  onClick={onAddNew}
                  className="bg-gradient-to-r text-white from-[#ff6b35] to-[#f7931e] hover:opacity-90 cursor-pointer w-full md:w-auto"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 px-4 md:px-8 overflow-y-auto">{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        userProfile={userProfile}
        profileLoading={profileLoading}
      />

      {/* Plan Popup */}
      <PlanPopup
        isOpen={isPlanPopupOpen}
        onClose={() => setIsPlanPopupOpen(false)}
        currentTier={userProfile?.tier || "free"}
      />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="bg-[#1A1B23] border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to logout? You will need to reconnect your wallet to continue using the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 text-black cursor-pointer hover:bg-gray-100">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
