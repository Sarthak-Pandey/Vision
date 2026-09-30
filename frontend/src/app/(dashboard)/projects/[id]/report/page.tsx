'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImpactReportView } from '@/components/reports/ImpactReportView';
import { getProjectImpactReport } from '@/lib/api/client';
import { ImpactReport } from '@/types';

export default function ProjectImpactReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [report, setReport] = useState<ImpactReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjectImpactReport(projectId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate project impact report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 space-y-6">
        <div className="flex items-center gap-3 text-slate-700 font-semibold animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
          <span>Generating project impact report from verified evidence...</span>
        </div>
        <div className="h-10 w-2/3 bg-slate-200 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse" />
        <div className="h-48 bg-slate-100 rounded-2xl border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-16 space-y-6">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary-text mb-4 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Project Dashboard</span>
        </Link>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-status-error" />}
          title="Report Generation Failed"
          description={error || 'Unable to load report for the requested project.'}
          action={
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadReport}>
                Retry
              </Button>
              <Link href={`/projects/${projectId}`}>
                <Button>Return to Project</Button>
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  return <ImpactReportView report={report} onRefresh={loadReport} />;
}
