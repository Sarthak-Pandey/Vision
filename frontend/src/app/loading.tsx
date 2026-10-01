'use client';

import React from 'react';
import ParticleLoader from '@/components/ui/ParticleLoader';

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0c0c0c] z-50">
      <ParticleLoader width={120} height={120} dotColor="#3D81E3" />
    </div>
  );
}
