import React from 'react';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className = '', iconOnly = false, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {/* Abstract QR mark: 3 corner blocks + subtle curved spark */}
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#6d5dfc] to-[#13b8a6] p-1.5 shadow-sm text-white ${iconSizes[size]}`}>
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Top-Left Finder block */}
          <rect x="2" y="2" width="9" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <rect x="4.5" y="4.5" width="4" height="4" rx="1" fill="currentColor" />

          {/* Top-Right Finder block */}
          <rect x="17" y="2" width="9" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <rect x="19.5" y="4.5" width="4" height="4" rx="1" fill="currentColor" />

          {/* Bottom-Left Finder block */}
          <rect x="2" y="17" width="9" height="9" rx="2.5" stroke="currentColor" strokeWidth="2" />
          <rect x="4.5" y="19.5" width="4" height="4" rx="1" fill="currentColor" />

          {/* Creative Spark / Curved connector at bottom-right */}
          <path
            d="M17 18C20 18 22 20 22 23M22 17V24"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="24" cy="18" r="1.5" fill="currentColor" />
          <circle cx="17" cy="24" r="1.5" fill="currentColor" />
        </svg>
      </div>

      {!iconOnly && (
        <span className={`font-display font-bold text-[#111827] tracking-tight ${textSizes[size]}`}>
          qr<span className="text-[#6d5dfc]">creative</span>
        </span>
      )}
    </div>
  );
};
