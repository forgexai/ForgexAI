"use client";

import { motion } from "framer-motion";

export default function AgentNetwork() {
  const orbitNodes = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    angle: (i * 60) * (Math.PI / 180), // 60 degrees apart
    radius: 100,
  }));

  return (
    <div className="relative w-full h-[420px] md:h-[500px] flex items-center justify-center">
      {/* Center pulsing node */}
      <motion.div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] shadow-[0_0_30px_rgba(153,69,255,0.6)]"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [1, 0.8, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating container for orbital motion */}
      <div className="absolute inset-0 animate-[spin_20s_linear_infinite]">
        {orbitNodes.map((node, index) => (
          <motion.div
            key={`orbit-${node.id}`}
            className="absolute w-3 h-3 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm"
            style={{
              left: `calc(50% + ${Math.cos(node.angle) * node.radius}px)`,
              top: `calc(50% + ${Math.sin(node.angle) * node.radius}px)`,
              transform: "translate(-50%, -50%)",
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 2 + index * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.3,
            }}
          />
        ))}
      </div>

      {/* Subtle SVG connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="agentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9945FF" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#14F195" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00BBFF" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        
        {orbitNodes.map((node, index) => {
          const centerX = 200;
          const centerY = 200;
          const outerX = centerX + Math.cos(node.angle) * node.radius;
          const outerY = centerY + Math.sin(node.angle) * node.radius;
          
          return (
            <motion.path
              key={`path-${node.id}`}
              d={`M ${centerX} ${centerY} Q ${(centerX + outerX) / 2} ${(centerY + outerY) / 2 - 15} ${outerX} ${outerY}`}
              stroke="url(#agentGradient)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="4 4"
              animate={{ strokeDashoffset: [0, -8] }}
              transition={{
                duration: 3 + index * 0.3,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.2,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
