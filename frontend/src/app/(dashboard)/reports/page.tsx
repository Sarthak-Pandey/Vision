'use client';

import React from 'react';
import Link from 'next/link';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Generate and manage project impact reports.
        </p>
      </div>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-8 shadow-2xs">
        <EmptyState
          icon={<FileText className="w-10 h-10 text-muted-text" />}
          title="No reports yet"
          description="Reports will appear here after AI evidence analysis and verification."
          action={
            <Link href="/projects">
              <Button className="gap-2">
                <span>View Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
