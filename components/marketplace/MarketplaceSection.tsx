"use client";

interface MarketplaceSectionProps {}

export function MarketplaceSection({}: MarketplaceSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      {/* SVG Icon */}
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
}
