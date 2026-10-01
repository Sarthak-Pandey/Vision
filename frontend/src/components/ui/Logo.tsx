import React from 'react';

export const Logo: React.FC<{ className?: string; alt?: string }> = ({
  className = 'w-5 h-5',
  alt = 'Vision Logo',
}) => {
  return (
    <img
      src="/logo-white.png"
      alt={alt}
      className={`object-contain inline-block select-none ${className}`}
    />
  );
};
