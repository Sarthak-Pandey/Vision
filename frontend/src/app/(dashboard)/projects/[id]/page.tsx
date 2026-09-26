'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Images, Activity, Navigation, FileText, Clock, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProject } from '@/lib/api/client';
import { Project } from '@/types';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        setIsLoading(true);
        const data = await getProject(projectId);
        setProject(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch project details');
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [projectId]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'media', label: 'Media', count: 37 },
    { id: 'timeline', label: 'Timeline' },
    { id: 'evidence', label: 'Evidence', count: 18 },
    { id: 'reports', label: 'Reports', count: 2 },
  ];

  const sampleRecentMedia = [
    {
      id: 'p-m1',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60',
      title: 'Zone A Bio-filter Installation',
      date: 'Feb 10, 2025',
    },
    {
      id: 'p-m2',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=60',
      title: 'Turbidity Sampling Site #4',
      date: 'Feb 12, 2025',
    },
    {
      id: 'p-m3',
      url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=60',
      title: 'Solar Water Aerator',
      date: 'Feb 18, 2025',
    },
    {
      id: 'p-m4',
      url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=60',
      title: 'Trash Skimmer Deployment',
      date: 'Feb 22, 2025',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-secondary-bg rounded-md" />
        <div className="h-10 w-2/3 bg-secondary-bg rounded-md" />
        <div className="h-40 bg-secondary-bg rounded-xl" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-secondary-text hover:text-primary-text mb-6">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Projects</span>
        </Link>
        <EmptyState
          icon={<ShieldAlert className="w-8 h-8 text-status-error" />}
          title="Project not found"
          description={error || 'The requested project could not be loaded.'}
          action={
            <Link href="/projects">
              <Button variant="outline">View All Projects</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation */}
      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-text hover:text-brand-dark-orange transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </Link>

      {/* Project Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary-text tracking-tight">
            {project.name}
          </h1>
          <div className="flex items-center gap-4 text-xs text-secondary-text mt-1.5">
            {project.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-muted-text" />
                {project.location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-muted-text" />
              {project.start_date || 'Jan 2025'} – {project.end_date || 'Sep 2026'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Media"
              value={37}
              icon={<Images className="w-4 h-4 text-brand-orange" />}
            />
            <StatCard
              title="Activities"
              value={4}
              icon={<Activity className="w-4 h-4 text-brand-orange" />}
            />
            <StatCard
              title="Locations"
              value={2}
              icon={<Navigation className="w-4 h-4 text-brand-orange" />}
            />
          </div>

          {/* Project Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-secondary-text leading-relaxed">
                {project.description ||
                  'No description provided for this project. This project tracks field operations, visual media ingestion, and environmental evidence validation.'}
              </p>
            </CardContent>
          </Card>

          {/* Recent Media Section */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-primary-text">Recent Media</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sampleRecentMedia.map((m) => (
                <div key={m.id} className="bg-white border border-border rounded-xl overflow-hidden group">
                  <div className="aspect-4/3 bg-secondary-bg overflow-hidden relative">
                    <img
                      src={m.url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-primary-text truncate">{m.title}</p>
                    <p className="text-[11px] text-muted-text mt-0.5">{m.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Placeholders for non-overview tabs */}
      {activeTab === 'media' && (
        <EmptyState
          icon={<Images className="w-8 h-8 text-muted-text" />}
          title="Project Media Gallery"
          description="Cloudinary field media assets for this project will appear here."
        />
      )}

      {activeTab === 'timeline' && (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-muted-text" />}
          title="Project Activity Timeline"
          description="Chronological evidence progression and field updates will be tracked in Phase 1."
        />
      )}

      {activeTab === 'evidence' && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-muted-text" />}
          title="Evidence Provenance & Confidence"
          description="AI vision analysis & verified evidence graphs will be attached in future phases."
        />
      )}

      {activeTab === 'reports' && (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-muted-text" />}
          title="Project Impact Reports"
          description="Structured PDF & web impact reports will be generated here."
        />
      )}
    </div>
  );
}
