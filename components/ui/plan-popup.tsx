"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Building2 } from "lucide-react";

interface PlanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
}

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Zap,
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    color: "bg-gray-600",
    textColor: "text-gray-200",
    features: {
      agents: "2 agents",
      executions: "50 executions/day",
      protocols: ["Jupiter", "Pyth", "Birdeye", "DexScreener"],
      credits: "5 credits/execution",
      features: ["Telegram", "Memory"],
      limitations: ["No scheduling", "No MCP export", "No advanced protocols"]
    }
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "$40",
    period: "per month",
    description: "For serious traders and developers",
    color: "bg-blue-600",
    textColor: "text-blue-100",
    popular: true,
    features: {
      agents: "10 agents",
      executions: "500 executions/day",
      protocols: ["Jupiter", "Kamino", "Tensor", "Marinade", "Pyth", "Birdeye", "DexScreener", "Helius", "Solend"],
      credits: "20 credits/execution",
      features: ["Telegram", "Memory", "Scheduling", "MCP Export", "Advanced Protocols"],
      limitations: []
    }
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: Building2,
    price: "Custom",
    period: "contact us",
    description: "For teams and organizations",
    color: "bg-purple-600",
    textColor: "text-purple-100",
    features: {
      agents: "Unlimited agents",
      executions: "Unlimited executions",
      protocols: ["All 20+ protocols", "Jupiter", "Kamino", "Tensor", "Marinade", "Drift", "Pyth", "Squads", "Mayan", "Sanctum", "Meteora", "Marginfi", "Helius", "Solend", "Birdeye", "Crossmint", "DexScreener", "Dialect", "Shyft", "Raydium"],
      credits: "100 credits/execution",
      features: ["All features", "Priority support", "Custom integrations", "Advanced analytics"],
      limitations: []
    }
  }
];

export function PlanPopup({ isOpen, onClose, currentTier }: PlanPopupProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-6xl max-h-[90vh] overflow-y-auto bg-[#0B0C10] border-white/10">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl font-bold text-white text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-gray-400 text-center">
            Upgrade to unlock more features and capabilities
          </p>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-0 top-0 text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border-2 p-6 transition-all duration-300 flex flex-col h-full group cursor-pointer transform hover:scale-105 hover:-translate-y-1 ${
                  isCurrentPlan
                    ? "border-green-500 bg-green-500/10 shadow-2xl shadow-green-500/20"
                    : "border-white/20 bg-[#1A1B23] hover:border-white/40 hover:bg-white/5 hover:shadow-xl hover:shadow-white/10"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 animate-pulse">
                    <Badge className="bg-blue-600 text-white px-3 py-1 shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-3 py-1 shadow-lg hover:shadow-green-500/25 transition-all duration-300">
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${plan.color} mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}>
                    <Icon className={`w-6 h-6 ${plan.textColor} transition-transform duration-300 group-hover:scale-110`} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 transition-colors duration-300 group-hover:text-blue-300">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-4 transition-colors duration-300 group-hover:text-gray-300">{plan.description}</p>
                  <div className="text-3xl font-bold text-white mb-1 transition-all duration-300 group-hover:scale-105 group-hover:text-blue-300">{plan.price}</div>
                  <div className="text-gray-400 text-sm transition-colors duration-300 group-hover:text-gray-300">{plan.period}</div>
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 transition-colors duration-300 group-hover:text-blue-300">Agents & Executions</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex items-center transition-all duration-300 group-hover:translate-x-1">
                        <Check className="w-4 h-4 text-green-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400" />
                        {plan.features.agents}
                      </div>
                      <div className="flex items-center transition-all duration-300 group-hover:translate-x-1">
                        <Check className="w-4 h-4 text-green-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400" />
                        {plan.features.executions}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 transition-colors duration-300 group-hover:text-blue-300">Protocols</h4>
                    <div className="text-sm text-gray-300">
                      {plan.features.protocols.length > 4 ? (
                        <div>
                          <div className="flex items-center mb-1 transition-all duration-300 group-hover:translate-x-1">
                            <Check className="w-4 h-4 text-green-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400" />
                            {plan.features.protocols[0]}
                          </div>
                          <div className="text-xs text-gray-400 ml-6 transition-colors duration-300 group-hover:text-gray-300">
                            +{plan.features.protocols.length - 1} more protocols
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {plan.features.protocols.map((protocol, index) => (
                            <div key={index} className="flex items-center transition-all duration-300 group-hover:translate-x-1" style={{ transitionDelay: `${index * 50}ms` }}>
                              <Check className="w-4 h-4 text-green-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400" />
                              {protocol}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2 transition-colors duration-300 group-hover:text-blue-300">Features</h4>
                    <div className="space-y-1 text-sm text-gray-300">
                      {plan.features.features.map((feature, index) => (
                        <div key={index} className="flex items-center transition-all duration-300 group-hover:translate-x-1" style={{ transitionDelay: `${index * 50}ms` }}>
                          <Check className="w-4 h-4 text-green-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-green-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.features.limitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-2 transition-colors duration-300 group-hover:text-red-300">Limitations</h4>
                      <div className="space-y-1 text-sm text-gray-400">
                        {plan.features.limitations.map((limitation, index) => (
                          <div key={index} className="flex items-center transition-all duration-300 group-hover:translate-x-1" style={{ transitionDelay: `${index * 50}ms` }}>
                            <X className="w-4 h-4 text-red-500 mr-2 transition-all duration-300 group-hover:scale-110 group-hover:text-red-400" />
                            {limitation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <div className="text-sm text-gray-400 mb-2 transition-colors duration-300 group-hover:text-gray-300">
                      Credits per execution: <span className="text-white font-semibold transition-colors duration-300 group-hover:text-blue-300">{plan.features.credits}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-gray-600 text-gray-300 cursor-not-allowed transition-all duration-300"
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      disabled
                      className="w-full bg-white/10 text-gray-400 cursor-not-allowed transition-all duration-300"
                    >
                      Coming Soon
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </DialogContent>
    </Dialog>
  );
}
