"use client";

import Link from "next/link";

export function BonusStar() {
  return (
    <Link 
      href="/bonuses"
      className="group relative inline-block transition-transform duration-300 hover:scale-110 active:scale-105"
      aria-label="Bonus Material - Click to view"
    >
      <div className="relative">
        {/* Red circle */}
        <div 
          className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(circle, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
          }}
        >
          {/* Inner content */}
          <div className="absolute inset-0 flex items-center justify-center text-white px-3 py-2">
            <div className="text-xs sm:text-sm md:text-base font-bold leading-tight text-center">
              BONUS<br />MATERIAL
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
