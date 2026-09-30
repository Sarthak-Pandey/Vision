'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthContext';
import { ShieldCheck, Layers, FileCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('sarthak.pandey@example.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Split: Branding */}
      <div className="w-full md:w-1/2 bg-secondary-bg p-8 md:p-16 flex flex-col justify-between border-r border-border min-h-[400px]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-orange flex items-center justify-center text-white font-bold text-base shadow-xs">
              ◉
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-primary-text uppercase leading-none">
                Impact
              </h1>
              <p className="text-xs font-semibold text-brand-dark-orange tracking-widest uppercase mt-0.5">
                Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="my-12 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-text leading-tight">
            Turn field media into structured evidence.
          </h2>
          <p className="text-sm text-secondary-text mt-3 leading-relaxed">
            AI-powered visual evidence intelligence platform that validates real-world project activities, visible changes, and verifiable sustainability impact.
          </p>

          <div className="mt-8 space-y-3.5">
            <div className="flex items-center gap-3 text-xs text-secondary-text bg-white p-3 rounded-xl border border-border">
              <ShieldCheck className="w-4 h-4 text-brand-orange" />
              <span>Traceable visual evidence provenance</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-secondary-text bg-white p-3 rounded-xl border border-border">
              <Layers className="w-4 h-4 text-brand-orange" />
              <span>Multi-project impact tracking</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-secondary-text bg-white p-3 rounded-xl border border-border">
              <FileCheck className="w-4 h-4 text-brand-orange" />
              <span>Automated confidence scoring & reports</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-text">
          © 2026 Impact Intelligence Platform. All rights reserved.
        </div>
      </div>

      {/* Right Split: Sign In Form */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-white">
        <div className="w-full max-w-[400px] space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary-text tracking-tight">Welcome back</h2>
            <p className="text-xs text-secondary-text mt-1">Sign in to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {error}
              </div>
            )}
            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-secondary-text">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-border text-brand-orange focus:ring-brand-orange"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-brand-dark-orange hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-secondary-text pt-4 border-t border-border">
            Need access to an enterprise workspace?{' '}
            <a href="#" className="text-brand-dark-orange font-medium hover:underline">
              Contact administrator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
