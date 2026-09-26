'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Images, Activity, ShieldCheck, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { getProjects, getAssets } from '@/lib/api/client';
import { Project, MediaAsset } from '@/types';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
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

  const sampleRecentMedia = [
    {
      id: 'm1',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=60',
      title: 'Riverbank Clean Up',
      date: 'Feb 10, 2025',
    },
    {
      id: 'm2',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=60',
      title: 'Solar Array Inspection',
      date: 'Feb 15, 2025',
    },
    {
      id: 'm3',
      url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600&auto=format&fit=crop&q=60',
      title: 'Solar Panel Grid',
      date: 'Jan 20, 2025',
    },
    {
      id: 'm4',
      url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=600&auto=format&fit=crop&q=60',
      title: 'Waste Sorting Station',
      date: 'Jan 12, 2025',
    },
    {
      id: 'm5',
      url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&auto=format&fit=crop&q=60',
      title: 'Afforestation Site B',
      date: 'Dec 05, 2024',
    },
  ];

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
          value={projects.length || 12}
          icon={<FolderKanban className="w-4 h-4 text-brand-orange" />}
          trend={{ value: '12%', positive: true }}
        />
        <StatCard
          title="Media Assets"
          value={248}
          icon={<Images className="w-4 h-4 text-brand-orange" />}
          trend={{ value: '18%', positive: true }}
        />
        <StatCard
          title="Activities"
          value={34}
          icon={<Activity className="w-4 h-4 text-brand-orange" />}
          trend={{ value: '5%', positive: true }}
        />
        <StatCard
          title="Evidence"
          value={186}
          icon={<ShieldCheck className="w-4 h-4 text-brand-orange" />}
          trend={{ value: '24%', positive: true }}
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
                <div className="py-8 text-center text-xs text-secondary-text">No projects available yet.</div>
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
                      <Badge variant="orange">37 media</Badge>
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
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-primary-text">River Cleaning</span>
                    <span className="text-secondary-text">42 assets</span>
                  </div>
                  <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-primary-text">Plantation & Reforestation</span>
                    <span className="text-secondary-text">28 assets</span>
                  </div>
                  <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange/80 rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-primary-text">Solar Panel Setup</span>
                    <span className="text-secondary-text">19 assets</span>
                  </div>
                  <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange/60 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-primary-text">Waste Audit</span>
                    <span className="text-secondary-text">12 assets</span>
                  </div>
                  <div className="w-full h-2 bg-secondary-bg rounded-full overflow-hidden">
                    <div className="h-full bg-brand-orange/40 rounded-full" style={{ width: '25%' }} />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-secondary-bg rounded-lg border border-border text-xs text-secondary-text">
                <span className="font-semibold text-primary-text">34 total activities</span> indexed across active field zones this month.
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {sampleRecentMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-border rounded-xl overflow-hidden group hover:border-gray-300 transition-all duration-200"
            >
              <div className="aspect-square bg-secondary-bg relative overflow-hidden">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5">
                <p className="text-xs font-semibold text-primary-text truncate">{item.title}</p>
                <p className="text-[11px] text-muted-text mt-0.5">{item.date}</p>
              </div>
            </div>
          ))}
        </div>
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
