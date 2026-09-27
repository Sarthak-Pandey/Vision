'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { MapPin, Navigation } from 'lucide-react';
import { LocationClusterItem } from '@/types';

export interface LocationSummaryProps {
  locations: LocationClusterItem[];
}

export const LocationSummary: React.FC<LocationSummaryProps> = ({ locations }) => {
  return (
    <Card className="border border-border">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-primary" />
            <CardTitle className="text-base font-semibold">Locations Detected</CardTitle>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-semibold">
            {locations.length} {locations.length === 1 ? 'Site' : 'Sites'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {locations.length === 0 ? (
          <div className="p-6 text-center text-xs text-secondary-text bg-secondary-bg/30 rounded-xl border border-dashed border-border">
            <Navigation className="w-6 h-6 text-muted-text mx-auto mb-2 opacity-60" />
            <p className="font-medium text-primary-text">No location data available</p>
            <p className="text-muted-text mt-0.5">
              Geo-tagged evidence uploaded with GPS coordinates will map operational sites here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map((loc) => (
              <div
                key={loc.key}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary-bg/40 border border-border/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-primary-text block">
                      {loc.formattedCoordinates}
                    </span>
                    <span className="text-[11px] text-secondary-text">
                      Lat: {loc.latitude.toFixed(3)}, Lng: {loc.longitude.toFixed(3)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand-dark-orange bg-brand-light-orange px-2 py-0.5 rounded-md">
                  {loc.count} {loc.count === 1 ? 'media' : 'media'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
