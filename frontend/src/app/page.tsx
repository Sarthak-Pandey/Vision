'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AmbientWave } from '@/components/landing/AmbientWave';
import './landing.css';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const heroPhotoRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Sync menuOpen state to body.menu-open
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  // Handle Escape key & window resize >= 901px
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 901) {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Motion engine: animationend listeners + double-rAF fallback
  useEffect(() => {
    if (!containerRef.current) return;

    const appearElements = containerRef.current.querySelectorAll<HTMLElement>('.appear');

    appearElements.forEach((el) => {
      const onEnd = () => {
        el.classList.add('is-in');
      };
      el.addEventListener('animationend', onEnd, { once: true });
    });

    if (heroPhotoRef.current) {
      const onPhotoEnd = () => {
        heroPhotoRef.current?.classList.add('is-in');
      };
      heroPhotoRef.current.addEventListener('animationend', onPhotoEnd, { once: true });
    }

    // Two-frame fallback verification
    const rAF1 = requestAnimationFrame(() => {
      const rAF2 = requestAnimationFrame(() => {
        let hasRunning = false;
        appearElements.forEach((el) => {
          if (typeof el.getAnimations === 'function') {
            const anims = el.getAnimations();
            if (anims.some((a) => a.playState === 'running' || a.playState === 'finished')) {
              hasRunning = true;
            }
          }
        });

        // If no animations running or API unavailable, guarantee immediate visibility
        if (!hasRunning) {
          appearElements.forEach((el) => el.classList.add('is-in'));
          heroPhotoRef.current?.classList.add('is-in');
        }
      });
      return () => cancelAnimationFrame(rAF2);
    });

    return () => cancelAnimationFrame(rAF1);
  }, []);

  return (
    <div
      ref={containerRef}
      className="landing-viewport"
      style={{ background: '#000000', color: '#ffffff' }}
    >
      {/* Noise Grain Overlay */}
      <div className="grain" aria-hidden="true" />

      {/* Infinite Organic Ambient Wave (Never loops, never resets, silky 60fps) */}
      <div ref={heroPhotoRef} className="hero-photo" aria-hidden="true">
        <AmbientWave />
        <div className="hero-glow" />
      </div>

      {/* Single-Viewport Master Page */}
      <div className="page">
        {/* Mobile Fullscreen Menu Backdrop with 24px blur */}
        <div
          className="menu-backdrop"
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* 3-Column Header */}
        <header className="header">
          {/* Left: Logo */}
          <Link
            href="/"
            className="logo appear appear--scale"
            style={{ '--d': '0.08s' } as React.CSSProperties}
            aria-label="Vision Platform"
          >
            <img
              src="/logo-white.png"
              alt="Vision"
              className="logo-mark-svg object-contain"
            />
            <span className="logo-wordmark">
              Vision<span className="logo-suffix">.ai</span>
            </span>
          </Link>

          {/* Center: Liquid-Metal Pill Navigation */}
          <nav id="site-nav" aria-label="Primary">
            <Link
              href="/dashboard"
              className="nav-pill appear appear--scale"
              style={{ '--d': '0.16s' } as React.CSSProperties}
              onClick={closeMenu}
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="nav-pill appear appear--soft"
              style={{ '--d': '0.28s' } as React.CSSProperties}
              onClick={closeMenu}
            >
              Projects
            </Link>
            <Link
              href="/media"
              className="nav-pill appear appear--scale"
              style={{ '--d': '0.40s' } as React.CSSProperties}
              onClick={closeMenu}
            >
              Media Intelligence
            </Link>
            <Link
              href="/search"
              className="nav-pill appear appear--soft"
              style={{ '--d': '0.46s' } as React.CSSProperties}
              onClick={closeMenu}
            >
              Evidence Search
            </Link>
            <Link
              href="/reports"
              className="nav-pill appear appear--soft"
              style={{ '--d': '0.52s' } as React.CSSProperties}
              onClick={closeMenu}
            >
              Impact Reports
            </Link>
          </nav>

          {/* Right: Header CTA & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 justify-self-end">
            <Link
              href="/dashboard"
              className="btn btn-solid header-cta appear appear--scale"
              style={{ '--d': '0.34s', color: '#050508' } as React.CSSProperties}
            >
              <span className="text-[#050508] font-semibold tracking-tight">Launch Workspace</span>
            </Link>

            <button
              className="burger appear appear--scale"
              style={{ '--d': '0.34s' } as React.CSSProperties}
              onClick={toggleMenu}
              aria-controls="site-nav"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              <span className="burger-bar" />
              <span className="burger-bar" />
              <span className="burger-bar" />
            </button>
          </div>
        </header>

        {/* Hero Section (Harmoniously Centered) */}
        <main className="hero" id="top">
          <div className="hero-copy">
            {/* Metallic Silver Badge */}
            <div
              className="badge appear appear--pop"
              style={{ '--d': '0.22s' } as React.CSSProperties}
            >
              <svg
                className="badge-star"
                width="18"
                height="20"
                viewBox="0 0 24 24"
                fill="#ffffff"
                aria-hidden="true"
              >
                <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
              </svg>
              <span>Multimodal Visual Evidence Intelligence</span>
            </div>

            {/* H1 Two Masked Lines */}
            <h1>
              <span className="headline-line">
                <span
                  className="headline-line-inner appear appear--mask"
                  style={{ '--d': '0.42s' } as React.CSSProperties}
                >
                  Verify <em>ground truth</em> across
                </span>
              </span>
              <span className="headline-line">
                <span
                  className="headline-line-inner appear appear--mask"
                  style={{ '--d': '0.62s' } as React.CSSProperties}
                >
                  field operations in real time.
                </span>
              </span>
            </h1>

            {/* Refined Lede */}
            <p
              className="lede appear appear--soft"
              style={{ '--d': '0.82s' } as React.CSSProperties}
            >
              Autonomous multimodal media intelligence for sustainability, infrastructure, and environmental initiatives. Ingest geotagged media, detect physical changes, and compute verifiable proof.
            </p>

            {/* Actions: Liquid-Glass Buttons with High-Contrast Text */}
            <div className="hero-actions">
              <Link
                href="/dashboard"
                className="btn btn-solid appear appear--btn"
                style={{ '--d': '0.96s', color: '#050508' } as React.CSSProperties}
              >
                <span className="text-[#050508] font-semibold tracking-tight">Launch Workspace</span>
              </Link>
              <Link
                href="/projects"
                className="btn btn-hero-ghost appear appear--side"
                style={{ '--d': '1.10s' } as React.CSSProperties}
              >
                <span className="text-white font-medium">Explore Projects</span>
              </Link>
            </div>
          </div>
        </main>

        {/* Three Stats Footer */}
        <footer className="stats">
          {/* Stat 1: Before/After Comparison & Timeline */}
          <div
            className="stat appear appear--stat"
            style={{ '--d': '1.12s' } as React.CSSProperties}
          >
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <path d="M12 3V21" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeDasharray="2 2" />
              <path d="M7 10L9 12L7 14" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M17 14L15 12L17 10" stroke="#a0a0a0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Observable Change & Timeline Tracking</span>
          </div>

          {/* Stat 2: Deterministic 5-Signal Confidence */}
          <div
            className="stat appear appear--stat"
            style={{ '--d': '1.28s' } as React.CSSProperties}
          >
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
              <path d="M12 3 A9 9 0 0 1 21 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <path d="M8 12L10.5 14.5L16 9" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Deterministic 5-Signal Confidence Scoring</span>
          </div>

          {/* Stat 3: Audit-Grade Traceability & Impact Reports */}
          <div
            className="stat appear appear--stat"
            style={{ '--d': '1.44s' } as React.CSSProperties}
          >
            <svg className="stat-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 5V11C4 16.5 7.5 21.2 12 22C16.5 21.2 20 16.5 20 11V5L12 2Z" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <path d="M8.5 11.5L11 14L15.5 9.5" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Audit-Grade Traceability & Reports</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
