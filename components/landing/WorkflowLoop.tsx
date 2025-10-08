"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function WorkflowLoop() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  const workflowNodes = [
    { id: 0, label: "On Message", angle: 0 },
    { id: 1, label: "Logic Check", angle: 72 },
    { id: 2, label: "Swap", angle: 144 },
    { id: 3, label: "Alert", angle: 216 },
    { id: 4, label: "Memory", angle: 288 },
  ];

  const radius = 220;
  const centerX = 280;
  const centerY = 250;

  if (!isClient) {
    return (
      <div className="relative w-full h-[420px] md:h-[500px] flex items-center justify-center">
        <div className="relative max-w-[600px] mx-auto w-full h-full">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931e] shadow-[0_0_30px_rgba(255,107,53,0.6)] flex items-center justify-center">
            <img src="/sol.svg" alt="Solana" width="30" height="30" className="brightness-0 invert" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] md:h-[500px] flex items-center justify-center">
      <div className="relative max-w-[600px] mx-auto w-full h-full">
         {/* Central Solana logo/glow */}
         <motion.div
           className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931e] shadow-[0_0_30px_rgba(255,107,53,0.6)] flex items-center justify-center"
           animate={{
             scale: [1, 1.1, 1],
             opacity: [0.8, 1, 0.8],
           }}
           transition={{
             duration: 3,
             repeat: Infinity,
             ease: "easeInOut",
           }}
         >
           <img src="/sol.svg" alt="Solana" width="30" height="30" className="brightness-0 invert" />
         </motion.div>

        {/* Workflow nodes */}
        {workflowNodes.map((node, index) => {
          const x = centerX + Math.cos((node.angle * Math.PI) / 180) * radius;
          const y = centerY + Math.sin((node.angle * Math.PI) / 180) * radius;

          return (
             <motion.div
               key={node.id}
               className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#f7931e] shadow-[0_0_20px_rgba(255,107,53,0.5)] flex items-center justify-center text-white text-sm font-medium text-center px-2 z-10"
              style={{
                left: x - 32,
                top: y - 32,
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: index * 0.4,
              }}
            >
              {node.label}
            </motion.div>
          );
        })}

         {/* Connecting lines without arrows - positioned behind nodes */}
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
           <defs>
             <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" stopColor="#ff6b35" />
               <stop offset="50%" stopColor="#f7931e" />
               <stop offset="100%" stopColor="#ff8c42" />
             </linearGradient>
           </defs>

           {workflowNodes.map((node, index) => {
             const nextIndex = (index + 1) % workflowNodes.length;
             const nextNode = workflowNodes[nextIndex];
             
             // Calculate node edge positions instead of centers
             const nodeRadius = 40; // Half of node width (20px) + some padding
             const startAngle = (node.angle * Math.PI) / 180;
             const endAngle = (nextNode.angle * Math.PI) / 180;
             
             const startX = centerX + Math.cos(startAngle) * (radius - nodeRadius);
             const startY = centerY + Math.sin(startAngle) * (radius - nodeRadius);
             const endX = centerX + Math.cos(endAngle) * (radius - nodeRadius);
             const endY = centerY + Math.sin(endAngle) * (radius - nodeRadius);
             
             // Control points for curved lines
             const midX = (startX + endX) / 2;
             const midY = (startY + endY) / 2;
             const offset = 60;
             const controlX = midX + Math.cos(((node.angle + nextNode.angle) / 2 * Math.PI) / 180) * offset;
             const controlY = midY + Math.sin(((node.angle + nextNode.angle) / 2 * Math.PI) / 180) * offset;

             return (
               <motion.path
                 key={`line-${node.id}`}
                 d={`M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`}
                 stroke="url(#lineGradient)"
                 strokeWidth="2"
                 fill="none"
                 strokeDasharray="6 6"
                 animate={{ strokeDashoffset: [0, -12] }}
                 transition={{
                   duration: 2,
                   repeat: Infinity,
                   ease: "linear",
                   delay: index * 0.4,
                 }}
               />
             );
           })}
         </svg>

      </div>
    </div>
  );
}