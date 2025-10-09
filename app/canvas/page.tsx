import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { SidebarLeft } from "@/components/dashboard/SidebarLeft";
import { CanvasArea } from "@/components/dashboard/CanvasArea";
import { SidebarRight } from "@/components/dashboard/SidebarRight";

export default function CanvasPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen w-full bg-[#0B0C10] text-white">
        <DashboardHeader />
        <div className="flex flex-1 overflow-hidden">
          <SidebarLeft />
          <CanvasArea />
          <SidebarRight />
        </div>
      </div>
    </AuthGuard>
  );
}