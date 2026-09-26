'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Filter, Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function SearchPage() {
  const [query, setQuery] = useState('Show plantation activities with visible growth');

  const filterTags = ['Project', 'Activity', 'Date', 'Location'];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-primary-text tracking-tight">Search Evidence</h1>
        <p className="text-sm text-secondary-text mt-0.5">
          Search your project media using natural language semantic queries.
        </p>
      </div>

      {/* Big Search Input */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-orange" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search field evidence using natural language..."
            className="w-full h-12 pl-12 pr-4 text-base bg-secondary-bg border border-border rounded-xl text-primary-text placeholder:text-muted-text focus:outline-none focus:bg-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-colors"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-secondary-text pt-1">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-text" />
            <span className="font-medium">Filter by:</span>
            {filterTags.map((tag) => (
              <Badge key={tag} variant="default" className="cursor-pointer hover:bg-border">
                {tag}
              </Badge>
            ))}
          </div>

          <span className="flex items-center gap-1 text-brand-dark-orange font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Natural Language AI
          </span>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-secondary-text border-b border-border pb-2">
          <span>Results matching "{query}"</span>
          <span>4 evidence items found</span>
        </div>

        <div className="p-4 bg-brand-light-orange/50 border border-orange-200 rounded-xl flex items-start gap-3 text-xs text-brand-dark-orange">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Semantic Search Preview:</span> Full pgvector embedding indexing and AI vision search will be activated in subsequent phases. UI interface and state are fully pre-configured.
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="flex gap-4 p-4">
            <div className="w-24 h-24 bg-secondary-bg rounded-lg overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&auto=format&fit=crop&q=60"
                alt="Plantation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <Badge variant="orange">Plantation</Badge>
                <h4 className="text-sm font-semibold text-primary-text mt-1">Coastal Mangrove Saplings</h4>
                <p className="text-xs text-secondary-text">Sundarbans Zone B • Feb 2025</p>
              </div>
              <div className="text-[11px] text-muted-text">Confidence Score: 94%</div>
            </div>
          </Card>

          <Card className="flex gap-4 p-4">
            <div className="w-24 h-24 bg-secondary-bg rounded-lg overflow-hidden shrink-0">
              <img
                src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=60"
                alt="Afforestation"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <Badge variant="orange">Afforestation</Badge>
                <h4 className="text-sm font-semibold text-primary-text mt-1">Village Perimeter Trees</h4>
                <p className="text-xs text-secondary-text">Green Village Site • Jan 2025</p>
              </div>
              <div className="text-[11px] text-muted-text">Confidence Score: 89%</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
