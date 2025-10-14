"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkflowsSection } from "@/components/workflows/WorkflowsSection";
import { SchedulesSection } from "@/components/schedules/SchedulesSection";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePrivyAuth } from "@/hooks/usePrivyAuth";
import { defaultApiClient } from "@/lib/api-utils";

interface UserProfile {
  id: string;
  walletAddress: string;
  credits: number;
  tier: string;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('workflows');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { forgexAuth } = usePrivyAuth();

  const handleAddWorkflow = () => {
    router.push('/canvas');
  };


  const fetchUserProfile = async () => {
    if (!forgexAuth.isAuthenticated) {
      setProfileLoading(false);
      return;
    }

    try {
      const response = await defaultApiClient.getUserProfile();
      if (response.success && response.data) {
        setUserProfile(response.data.user);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [forgexAuth.isAuthenticated]);

  const getSectionContent = () => {
    switch (activeSection) {
      case 'workflows':
        return (
          <WorkflowsSection />
        );
      case 'schedules':
        return (
          <SchedulesSection />
        );
      case 'marketplace':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="mb-6">
              <svg
                width="80"
                height="80"
                viewBox="0 0 80 80"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-gray-500"
              >
                <rect
                  x="10"
                  y="15"
                  width="60"
                  height="50"
                  rx="6"
                  fill="currentColor"
                  fillOpacity="0.1"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <rect
                  x="20"
                  y="25"
                  width="15"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <rect
                  x="45"
                  y="25"
                  width="15"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <rect
                  x="20"
                  y="45"
                  width="15"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <rect
                  x="45"
                  y="45"
                  width="15"
                  height="12"
                  rx="2"
                  fill="currentColor"
                  fillOpacity="0.2"
                />
                <circle
                  cx="27.5"
                  cy="31"
                  r="2"
                  fill="currentColor"
                  fillOpacity="0.4"
                />
                <circle
                  cx="52.5"
                  cy="31"
                  r="2"
                  fill="currentColor"
                  fillOpacity="0.4"
                />
                <circle
                  cx="27.5"
                  cy="51"
                  r="2"
                  fill="currentColor"
                  fillOpacity="0.4"
                />
                <circle
                  cx="52.5"
                  cy="51"
                  r="2"
                  fill="currentColor"
                  fillOpacity="0.4"
                />
              </svg>
            </div>
            <p className="text-center mb-6 text-gray-300">Coming soon - Browse and install workflow templates</p>
          </div>
        );
      default:
        return (
          <WorkflowsSection />
        );
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'workflows':
        return 'Workflows';
      case 'schedules':
        return 'Schedules';
      case 'marketplace':
        return 'Marketplace';
      default:
        return 'Workflows';
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case 'workflows':
        return 'Build autonomous Solana agents with visual workflows';
      case 'schedules':
        return 'Monitor scheduled workflow executions';
      case 'marketplace':
        return 'Browse and install workflow templates';
      default:
        return 'Build autonomous Solana agents with visual workflows';
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        userProfile={userProfile}
        profileLoading={profileLoading}
        onAddNew={activeSection === 'workflows' ? handleAddWorkflow : undefined}
        showSearch={activeSection === 'workflows'}
        searchPlaceholder="Search Name or Category [Ctrl + F]"
        title={getSectionTitle()}
        subtitle={getSectionSubtitle()}
      >
        {getSectionContent()}
      </DashboardLayout>
    </AuthGuard>
  );
}