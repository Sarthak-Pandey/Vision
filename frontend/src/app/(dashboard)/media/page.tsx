'use client';

import React, { useState } from 'react';
import { Upload, Images } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { MediaCard } from '@/components/ui/MediaCard';

export default function MediaPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleAssets = [
    {
      id: 'ast-1',
      project_id: 'proj-1',
      url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=60',
      type: 'image',
      capture_date: '2025-02-10T10:00:00Z',
      latitude: 28.6139,
      longitude: 77.209,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ast-2',
      project_id: 'proj-1',
      url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=60',
      type: 'image',
      capture_date: '2025-02-15T14:30:00Z',
      latitude: 28.6145,
      longitude: 77.2095,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ast-3',
      project_id: 'proj-2',
      url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=60',
      type: 'image',
      capture_date: '2025-01-20T09:15:00Z',
      latitude: 26.9124,
      longitude: 75.7873,
      created_at: new Date().toISOString(),
    },
    {
      id: 'ast-4',
      project_id: 'proj-3',
      url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=60',
      type: 'image',
      capture_date: '2025-03-01T11:00:00Z',
      latitude: 21.9497,
      longitude: 88.8955,
      created_at: new Date().toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-text tracking-tight">Media</h1>
          <p className="text-sm text-secondary-text mt-0.5">
            Organize and inspect visual evidence from all field locations.
          </p>
        </div>
        <Button className="gap-2 shrink-0">
          <Upload className="w-4 h-4" />
          <span>Upload Media</span>
        </Button>
      </div>

      {/* Filter controls */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-border">
        <div className="w-full md:w-80">
          <SearchInput
            placeholder="Search media..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
          <Select
            options={[
              { value: 'all', label: 'All Projects' },
              { value: 'p1', label: 'Yamuna Restoration' },
              { value: 'p2', label: 'Green Village Solar' },
              { value: 'p3', label: 'Coastal Mangrove' },
            ]}
          />

          <Select
            options={[
              { value: 'all', label: 'All Activities' },
              { value: 'clean', label: 'Clean-up' },
              { value: 'plant', label: 'Plantation' },
              { value: 'solar', label: 'Solar Install' },
            ]}
          />

          <Select
            options={[
              { value: 'all', label: 'All Dates' },
              { value: 'this-month', label: 'This Month' },
              { value: 'last-month', label: 'Last Month' },
            ]}
          />

          <Select
            options={[
              { value: 'all', label: 'All Locations' },
              { value: 'delhi', label: 'Delhi' },
              { value: 'rajasthan', label: 'Rajasthan' },
              { value: 'bengal', label: 'West Bengal' },
            ]}
          />
        </div>
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {sampleAssets.map((asset) => (
          <MediaCard key={asset.id} asset={asset} projectName="Yamuna Restoration" />
        ))}
      </div>
    </div>
  );
}
