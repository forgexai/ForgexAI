"use client";

import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { WorkflowsSection } from "@/components/workflows/WorkflowsSection";
import { SchedulesSection } from "@/components/schedules/SchedulesSection";
import { DeploymentsSection } from "@/components/deployments/DeploymentsSection";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
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
      case 'deployments':
        return (
          <DeploymentsSection />
        );
      case 'marketplace':
        return (
          <MarketplaceSection />
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
      case 'deployments':
        return 'Deployments';
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
      case 'deployments':
        return 'Manage your deployed workflows across platforms';
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