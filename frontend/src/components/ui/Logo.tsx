import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer circle */}
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      {/* Vertical divider line */}
      <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
      {/* Exact 3 diagonal hatch lines in right half */}
      <path d="M12 10L17.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 15L20.3 6.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 19.5L17.2 14.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
