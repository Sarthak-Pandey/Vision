'use client';

import React from 'react';
import ParticleLoader from '@/components/ui/ParticleLoader';

export default function DashboardLoading() {
  return (
    <div className="min-h-[55vh] w-full flex flex-col items-center justify-center">
      <ParticleLoader width={100} height={100} dotColor="#3D81E3" />
    </div>
  );
}
