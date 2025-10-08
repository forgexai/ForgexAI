export default function TrustedBy() {
  return (
    <section className="bg-white/5 backdrop-blur-md py-6 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-12">
        <p className="text-sm text-gray-300 text-center mb-6">
          Powered by the Solana ecosystem — integrated with Jupiter, Tensor, Kamino, and Drift.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {/* Jupiter Logo */}
          <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
            <svg width="120" height="40" viewBox="0 0 120 40" className="grayscale hover:grayscale-0 transition-all duration-300">
              <rect x="10" y="15" width="100" height="10" rx="5" fill="currentColor" />
              <text x="60" y="25" textAnchor="middle" className="text-xs fill-white">Jupiter</text>
            </svg>
          </div>
          
          {/* Tensor Logo */}
          <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
            <svg width="120" height="40" viewBox="0 0 120 40" className="grayscale hover:grayscale-0 transition-all duration-300">
              <circle cx="20" cy="20" r="8" fill="currentColor" />
              <circle cx="40" cy="20" r="8" fill="currentColor" />
              <circle cx="60" cy="20" r="8" fill="currentColor" />
              <text x="80" y="25" textAnchor="middle" className="text-xs fill-white">Tensor</text>
            </svg>
          </div>
          
          {/* Kamino Logo */}
          <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
            <svg width="120" height="40" viewBox="0 0 120 40" className="grayscale hover:grayscale-0 transition-all duration-300">
              <polygon points="20,10 30,25 20,40 10,25" fill="currentColor" />
              <text x="50" y="25" textAnchor="middle" className="text-xs fill-white">Kamino</text>
            </svg>
          </div>
          
          {/* Drift Logo */}
          <div className="opacity-60 hover:opacity-100 transition-opacity duration-300">
            <svg width="120" height="40" viewBox="0 0 120 40" className="grayscale hover:grayscale-0 transition-all duration-300">
              <rect x="10" y="10" width="20" height="20" rx="3" fill="currentColor" />
              <rect x="35" y="10" width="20" height="20" rx="3" fill="currentColor" />
              <text x="70" y="25" textAnchor="middle" className="text-xs fill-white">Drift</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
