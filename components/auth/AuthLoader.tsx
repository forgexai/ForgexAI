"use client";

import Image from "next/image";

export function AuthLoader() {
  return (
    <div className="fixed inset-0 bg-[#02021A] flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <Image
            src="/logo.jpg"
            alt="ForgeX"
            width={50}
            height={50}
            className="animate-spin"
            style={{ animationDuration: '2s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#ff6b35] to-[#f7931e] opacity-30 rounded-full animate-ping"></div>
        </div>
        <div className="text-white text-xl font-semibold">Authenticating...</div>
        <div className="w-40 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#ff6b35] to-[#f7931e] rounded-full animate-pulse"></div>
        </div>
        <div className="text-gray-400 text-sm">Please wait while we set up your account</div>
      </div>
    </div>
  );
}
