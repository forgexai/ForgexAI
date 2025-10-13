import { Zap, Layers, Coins, TrendingUp } from "lucide-react";

export default function TrustedBy() {
  return (
    <section className="bg-white/5 backdrop-blur-md py-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-12">
        <p className="text-sm text-gray-300 text-center mb-6">
          Powered by the Solana ecosystem — integrated with Jupiter, Tensor, Kamino, and Drift.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {/* Jupiter */}
          <div className="opacity-60 hover:opacity-100 transition-all duration-300 group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Zap className="w-6 h-6 text-[#9945FF] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Jupiter</span>
            </div>
          </div>
          
          {/* Tensor */}
          <div className="opacity-60 hover:opacity-100 transition-all duration-300 group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Layers className="w-6 h-6 text-[#14F195] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Tensor</span>
            </div>
          </div>
          
          {/* Kamino */}
          <div className="opacity-60 hover:opacity-100 transition-all duration-300 group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <Coins className="w-6 h-6 text-[#00BBFF] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Kamino</span>
            </div>
          </div>
          
          {/* Drift */}
          <div className="opacity-60 hover:opacity-100 transition-all duration-300 group">
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
              <TrendingUp className="w-6 h-6 text-[#FF6B35] group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-white">Drift</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
