"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { PlanPopup } from "@/components/ui/plan-popup";
import { useState } from "react";
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

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
  userProfile?: UserProfile | null;
  profileLoading?: boolean;
}

export function MobileSidebar({
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  userProfile,
  profileLoading = false,
}: MobileSidebarProps) {
  const [isPlanPopupOpen, setIsPlanPopupOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const router = useRouter();
  const { logout } = usePrivyAuth();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-[#1A1B23] border-r border-white/10 z-50 md:hidden transform transition-transform duration-300 ease-in-out flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
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
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleSectionChange(item.id)}
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

        {/* Bottom Section - User Profile and Logout */}
        <div className="flex-shrink-0">
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
      </div>

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
    </>
  );
}
