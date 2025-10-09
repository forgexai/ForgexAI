import { AuthGuard } from "@/components/auth/AuthGuard";
import { CanvasHeader } from "@/components/canvas/CanvasHeader";
import { CanvasArea } from "@/components/dashboard/CanvasArea";
import { NodePaletteButton } from "@/components/canvas/NodePaletteButton";
import { NodeInspectorButton } from "@/components/canvas/NodeInspectorButton";

export default function CanvasPage() {
  return (
    <AuthGuard>
      <div className="flex flex-col h-screen w-full bg-[#111827] text-white">
        <CanvasHeader />
        <div className="flex-1 relative" style={{ height: 'calc(100vh - 4rem)' }}>
          <CanvasArea />
          <NodePaletteButton />
          <NodeInspectorButton />
        </div>
      </div>
    </AuthGuard>
  );
}