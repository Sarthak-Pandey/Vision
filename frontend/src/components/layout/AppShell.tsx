'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Non-blocking loading state
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0c0c0c]">
        <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F8F9FA] dark:bg-[#0c0c0c] text-zinc-900 dark:text-white flex overflow-hidden relative selection:bg-[#3D81E3]/30 transition-colors duration-200">
      {/* Global SVG Noise Filter */}
      <svg className="absolute w-0 h-0 pointer-events-none opacity-0" aria-hidden="true">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      {/* Global Background Video (Visible in Dark mode) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden hidden dark:block">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover pointer-events-none opacity-15"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/80 to-[#0c0c0c]/90 pointer-events-none" />
      </div>

      {/* Fixed Vertical Guide Lines at 36rem Container Edges */}
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 -translate-x-[calc(50%+36rem)] w-px bg-black/[0.04] dark:bg-white/[0.04] z-[5]" />
      <div className="hidden md:block pointer-events-none fixed inset-y-0 left-1/2 translate-x-[calc(-50%+36rem)] w-px bg-black/[0.04] dark:bg-white/[0.04] z-[5]" />

      {/* Pinned Fixed Sidebar */}
      <Sidebar />

      {/* Main Container with pinned Header and scrollable Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1400px] w-full mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
