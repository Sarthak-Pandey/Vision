'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Images, Activity, ShieldCheck, ArrowRight, MapPin, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { getProjects, getAssets } from '@/lib/api/client';
import { Project, MediaAssetWithAnalysis } from '@/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<MediaAssetWithAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [projData, assetData] = await Promise.all([
        getProjects().catch(() => []),
        getAssets().catch(() => []),
      ]);
      setProjects(projData);
      setAssets(assetData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute distinct activities from AI analysis
  const distinctActivities = useMemo(() => {
    const set = new Set<string>();
    assets.forEach((a) => {
      (a.ai_analysis?.activities || []).forEach((act) => set.add(act));
    });
    return Array.from(set);
  }, [assets]);

  // Compute verified evidence count
  const evidenceCount = useMemo(() => {
    return assets.filter((a) => !!a.ai_analysis).length;
  }, [assets]);

  // Compute activity distribution dynamically
  const activityDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    assets.forEach((a) => {
      (a.ai_analysis?.activities || []).forEach((act) => {
        counts.set(act, (counts.get(act) || 0) + 1);
      });
    });
    const total = Array.from(counts.values()).reduce((sum, n) => sum + n, 0);
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([name, count]) => ({
        name,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [assets]);

  const recentMedia = assets.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">Dashboard</h1>
          <p className="text-sm text-secondary-text mt-0.5">
            Monitor your projects, media and evidence.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Projects"
          value={projects.length}
          icon={<FolderKanban className="w-4 h-4 text-brand-orange" />}
        />
        <StatCard
          title="Media Assets"
          value={assets.length}
          icon={<Images className="w-4 h-4 text-brand-orange" />}
        />
        <StatCard
          title="Activities"
          value={distinctActivities.length}
          icon={<Activity className="w-4 h-4 text-brand-orange" />}
        />
        <StatCard
          title="Evidence Records"
          value={evidenceCount}
          icon={<ShieldCheck className="w-4 h-4 text-brand-orange" />}
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 cols) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Projects</CardTitle>
                <CardDescription>Active sustainability & environmental field projects</CardDescription>
              </div>
              <Link
                href="/projects"
                className="text-xs font-semibold text-brand-dark-orange hover:underline flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3 py-2">
                  <div className="h-14 bg-secondary-bg animate-pulse rounded-lg" />
                  <div className="h-14 bg-secondary-bg animate-pulse rounded-lg" />
                  <div className="h-14 bg-secondary-bg animate-pulse rounded-lg" />
                </div>
              ) : projects.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-brand-light-orange text-brand-dark-orange flex items-center justify-center mx-auto">
                    <FolderKanban className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary-text">No projects yet</h4>
                    <p className="text-xs text-secondary-text mt-1">Get started by creating your first field impact project.</p>
                  </div>
                  <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Project</span>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {projects.slice(0, 4).map((proj) => (
                    <Link
                      key={proj.id}
                      href={`/projects/${proj.id}`}
                      className="py-3 flex items-center justify-between hover:bg-secondary-bg/50 px-2 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-brand-light-orange text-brand-dark-orange flex items-center justify-center font-bold text-xs shrink-0">
                          {proj.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-primary-text group-hover:text-brand-dark-orange transition-colors">
                            {proj.name}
                          </h4>
                          {proj.location && (
                            <p className="text-xs text-secondary-text flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-muted-text" />
                              {proj.location}
                            </p>
                          )}
                        </div>
                      </div>
                      <Badge variant="orange">{proj.media_count || 0} media</Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Overview (1 col) */}
        <div>
          <Card className="h-full flex flex-col justify-between">
            <CardHeader>
              <div>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Visual evidence capture frequency</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {isLoading ? (
                <div className="space-y-3 py-4">
                  <div className="h-8 bg-secondary-bg animate-pulse rounded-lg" />
                  <div className="h-8 bg-secondary-bg animate-pulse rounded-lg" />
                </div>
              ) : activityDistribution.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Activity className="w-8 h-8 text-muted-text/50 mx-auto" />
                  <p className="text-xs text-secondary-text">
                    No field activities detected yet. Upload project media to automatically extract evidence activities.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityDistribution.map((item, idx) => (
                    <div key={item.name}>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-primary-text capitalize">{item.name}</span>
                        <span className="text-secondary-text">{item.count} asset{item.count === 1 ? '' : 's'}</span>
                      </div>
                      <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            idx === 0
                              ? 'bg-brand-orange'
                              : idx === 1
                              ? 'bg-brand-orange/80'
                              : idx === 2
                              ? 'bg-brand-orange/60'
                              : 'bg-brand-orange/40'
                          }`}
                          style={{ width: `${Math.max(item.percent, 8)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 bg-secondary-bg rounded-lg border border-border text-xs text-secondary-text">
                <span className="font-semibold text-primary-text">{distinctActivities.length} total activities</span> indexed across active field zones.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Media Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-text">Recent Media</h2>
            <p className="text-xs text-secondary-text">Latest ingested visual evidence from field projects</p>
          </div>
          <Link href="/media" className="text-xs font-semibold text-brand-dark-orange hover:underline">
            Explore Media →
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square bg-secondary-bg animate-pulse rounded-xl" />
            ))}
          </div>
        ) : recentMedia.length === 0 ? (
          <div className="p-8 text-center bg-card text-card-foreground border border-border rounded-xl space-y-2 shadow-2xs">
            <Images className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p className="text-xs text-muted-foreground">No media assets uploaded yet.</p>
            <Link href="/media">
              <Button size="sm" variant="secondary" className="mt-2 text-xs">
                Upload Media
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {recentMedia.map((item) => (
              <div
                key={item.id}
                className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden group hover:border-border/80 transition-all duration-200 shadow-2xs"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.ai_analysis?.scene || 'Field evidence'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-semibold text-primary-text truncate">
                    {item.ai_analysis?.activities?.[0] || item.ai_analysis?.scene || 'Evidence Asset'}
                  </p>
                  <p className="text-[11px] text-muted-text mt-0.5">
                    {item.capture_date
                      ? new Date(item.capture_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Undated'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={fetchDashboardData}
      />
    </div>
  );
}
