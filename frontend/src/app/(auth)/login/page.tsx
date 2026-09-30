'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthContext';
import { Logo } from '@/components/ui/Logo';
import { ShieldCheck, Layers, FileCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('guest@example.com');
  const [password, setPassword] = useState('guest123');
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
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background text-foreground">
      {/* Left Split: Branding */}
      <div className="w-full md:w-1/2 bg-muted/40 p-8 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border min-h-[400px]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
              <Logo className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground uppercase leading-none">
                Impact
              </h1>
              <p className="text-[10px] font-semibold text-brand-dark-orange tracking-widest uppercase mt-0.5">
                Intelligence
              </p>
            </div>
          </div>
        </div>

        <div className="my-12 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-tight">
            Turn field media into structured evidence.
          </h2>
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            AI-powered visual evidence intelligence platform that validates real-world project activities, visible changes, and verifiable sustainability impact.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-brand-orange shrink-0" />
              <span>Traceable visual evidence provenance</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border shadow-2xs">
              <Layers className="w-4 h-4 text-brand-orange shrink-0" />
              <span>Multi-project impact tracking</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border shadow-2xs">
              <FileCheck className="w-4 h-4 text-brand-orange shrink-0" />
              <span>Automated confidence scoring & reports</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground/70">
          © 2026 Impact Intelligence Platform. All rights reserved.
        </div>
      </div>

      {/* Right Split: Sign In Form */}
      <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center bg-background">
        <div className="w-full max-w-[380px] space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back</h2>
            <p className="text-xs text-muted-foreground">Sign in to access your workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs bg-destructive/10 border border-destructive/20 text-destructive rounded-md font-medium">
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
              <label className="flex items-center gap-2 cursor-pointer text-muted-foreground select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-input text-primary focus:ring-ring"
                />
                <span>Remember me</span>
              </label>
              <a href="#" className="text-foreground hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full h-10 text-sm font-semibold" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
            Need access to an enterprise workspace?{' '}
            <a href="#" className="text-foreground font-medium hover:underline">
              Contact administrator
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
