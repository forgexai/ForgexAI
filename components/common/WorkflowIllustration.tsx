interface WorkflowIllustrationProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WorkflowIllustration({ 
  className = "", 
  size = "md" 
}: WorkflowIllustrationProps) {
  const sizeMap = {
    sm: { width: 80, height: 60 },
    md: { width: 120, height: 80 },
    lg: { width: 160, height: 100 }
  };

  const { width, height } = sizeMap[size];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-gray-500 ${className}`}
    >
      {/* Main workflow box */}
      <rect
        x="10"
        y="20"
        width="100"
        height="40"
        rx="6"
        fill="currentColor"
        fillOpacity="0.1"
        stroke="currentColor"
        strokeWidth="2"
      />
      
      {/* Input node */}
      <circle
        cx="25"
        cy="40"
        r="8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 40L23 42L29 36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Arrow to middle */}
      <path
        d="M33 40L45 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M41 36L45 40L41 44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Processing node */}
      <rect
        x="50"
        y="32"
        width="20"
        height="16"
        rx="3"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M55 37L57 39L63 33"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M55 43L57 45L63 39"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Arrow to output */}
      <path
        d="M70 40L82 40"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M78 36L82 40L78 44"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Output node */}
      <circle
        cx="95"
        cy="40"
        r="8"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M91 40L93 42L99 36"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Decorative elements */}
      <circle
        cx="20"
        cy="15"
        r="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <circle
        cx="100"
        cy="15"
        r="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <circle
        cx="60"
        cy="10"
        r="1.5"
        fill="currentColor"
        fillOpacity="0.4"
      />
    </svg>
  );
}
