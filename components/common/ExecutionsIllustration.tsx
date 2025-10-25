interface ExecutionsIllustrationProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ExecutionsIllustration({ 
  className = "", 
  size = "md" 
}: ExecutionsIllustrationProps) {
  const sizeMap = {
    sm: { width: 60, height: 60 },
    md: { width: 80, height: 80 },
    lg: { width: 100, height: 100 }
  };

  const { width, height } = sizeMap[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-gray-500 ${className}`}
    >
      <rect
        x="10"
        y="20"
        width="60"
        height="40"
        rx="4"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      <rect
        x="15"
        y="30"
        width="20"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <rect
        x="15"
        y="38"
        width="30"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <rect
        x="15"
        y="46"
        width="25"
        height="3"
        rx="1.5"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <circle
        cx="50"
        cy="35"
        r="8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M46 35L48 37L54 31"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M46 50L48 52L54 46"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
