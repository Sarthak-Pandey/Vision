'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  User,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Eye,
  Layers,
  Activity as ActivityIcon,
  Compass,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { MediaAssetWithAnalysis, AiAnalysis } from '@/types';
import { analyzeAsset } from '@/lib/api/client';

export interface MediaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: MediaAssetWithAnalysis | null;
  projectName?: string;
  onAnalysisUpdated?: (assetId: string, analysis: AiAnalysis) => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  isOpen,
  onClose,
  asset,
  projectName,
  onAnalysisUpdated,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AiAnalysis | null>(null);
  const currentAssetIdRef = React.useRef<string | null>(null);
  const pendingRequestsRef = React.useRef<Map<string, number>>(new Map());
  const activeAnalyzingIdsRef = React.useRef<Set<string>>(new Set());
  const requestIdCounterRef = React.useRef<number>(0);

  // Sync analysis when asset changes
  React.useEffect(() => {
    if (asset) {
      currentAssetIdRef.current = asset.id;
      setCurrentAnalysis(asset.ai_analysis || null);
      setError(null);
      // Reflect whether this specific asset currently has an in-flight analysis
      setIsAnalyzing(activeAnalyzingIdsRef.current.has(asset.id));
    } else {
      currentAssetIdRef.current = null;
      setIsAnalyzing(false);
    }
  }, [asset]);

  if (!isOpen || !asset) return null;

  const handleRunAnalysis = async () => {
    if (!asset) return;
    const targetAssetId = asset.id;

    // Prevent duplicate concurrent requests for the same asset
    if (activeAnalyzingIdsRef.current.has(targetAssetId)) return;

    const token = ++requestIdCounterRef.current;
    pendingRequestsRef.current.set(targetAssetId, token);
    activeAnalyzingIdsRef.current.add(targetAssetId);

    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeAsset(targetAssetId);

      // Only apply result if this request is still the latest token for this asset
      if (pendingRequestsRef.current.get(targetAssetId) === token) {
        if (onAnalysisUpdated) {
          onAnalysisUpdated(targetAssetId, result);
        }
        if (currentAssetIdRef.current === targetAssetId) {
          setCurrentAnalysis(result);
        }
      }
    } catch (err: any) {
      console.error('Failed to run AI analysis:', err);
      if (
        pendingRequestsRef.current.get(targetAssetId) === token &&
        currentAssetIdRef.current === targetAssetId
      ) {
        setError(err.message || 'Failed to complete vision analysis');
      }
    } finally {
      if (pendingRequestsRef.current.get(targetAssetId) === token) {
        activeAnalyzingIdsRef.current.delete(targetAssetId);
        if (currentAssetIdRef.current === targetAssetId) {
          setIsAnalyzing(false);
        }
      }
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const confidencePercentage = currentAnalysis?.confidence
    ? Math.round(currentAnalysis.confidence * 100)
    : null;

  const mapsUrl =
    asset.latitude && asset.longitude
      ? `https://www.google.com/maps?q=${asset.latitude},${asset.longitude}`
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-primary-text leading-tight">
                Visual Evidence Inspector
              </h2>
              <p className="text-xs text-secondary-text">
                {projectName ? `${projectName} • ` : ''}ID: {asset.id.slice(0, 13)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-secondary-text hover:text-primary-text hover:bg-secondary-bg rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Visual Media Preview */}
          <div className="md:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-black/5 border border-border flex items-center justify-center">
              {asset.type === 'video' ? (
                <video
                  src={asset.url}
                  controls
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <img
                  src={asset.url}
                  alt="Visual Evidence"
                  className="w-full h-full object-cover"
                />
              )}

              {/* Status pill on image */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1.5 shadow-sm">
                {currentAnalysis ? (
                  currentAnalysis.source === 'simulated' ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulated Preview</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Verified ({confidencePercentage}%)</span>
                    </>
                  )
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>Pending Inspection</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Metadata Chips */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-secondary-bg/60 border border-border flex items-start gap-2.5">
                <Calendar className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-text block">Capture Date</span>
                  <span className="font-medium text-primary-text">{formatDate(asset.capture_date)}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-secondary-bg/60 border border-border flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-dark-orange shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-muted-text block">GPS Coordinates</span>
                  {asset.latitude && asset.longitude ? (
                    <a
                      href={mapsUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary-text hover:text-brand-primary flex items-center gap-1 truncate"
                    >
                      <span>
                        {asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="font-medium text-muted-text">None provided</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Vision Intelligence */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-brand-primary" />
                  Multimodal AI Analysis
                </h3>
                {confidencePercentage !== null && (
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                      currentAnalysis?.source === 'simulated'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {currentAnalysis?.source === 'simulated'
                      ? 'Simulated Preview'
                      : `${confidencePercentage}% Confidence`}
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {currentAnalysis ? (
                <div className="space-y-3.5">
                  {/* Confidence Bar */}
                  {confidencePercentage !== null && (
                    <div>
                      <div className="flex justify-between text-xs text-secondary-text mb-1">
                        <span>Detection Certainty</span>
                        <span className="font-semibold text-primary-text">{confidencePercentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-secondary-bg overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                          style={{ width: `${confidencePercentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Description Box */}
                  <div className="p-3 rounded-xl bg-secondary-bg/70 border border-border">
                    <span className="text-xs font-medium text-muted-text block mb-1">
                      Scene Assessment
                    </span>
                    <p className="text-xs text-primary-text leading-relaxed">
                      {currentAnalysis.description}
                    </p>
                  </div>

                  {/* Structured Classification Cards */}
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                      <span className="text-secondary-text flex items-center gap-1.5">
                        <ActivityIcon className="w-3.5 h-3.5 text-brand-primary" />
                        Activity
                      </span>
                      <span className="font-medium text-primary-text">
                        {currentAnalysis.activities.join(', ') || 'Sustainability monitoring'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                      <span className="text-secondary-text flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-cyan-600" />
                        Scene
                      </span>
                      <span className="font-medium text-primary-text capitalize">
                        {currentAnalysis.scene}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between text-xs">
                      <span className="text-secondary-text flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-amber-600" />
                        Condition
                      </span>
                      <span className="font-medium text-primary-text capitalize">
                        {currentAnalysis.visible_condition}
                      </span>
                    </div>
                  </div>

                  {/* Detected Objects Chips */}
                  <div>
                    <span className="text-xs font-medium text-muted-text block mb-1.5">
                      Identified Ground Objects
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentAnalysis.objects.map((obj, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-md bg-secondary-bg border border-border text-primary-text font-medium"
                        >
                          {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-border bg-secondary-bg/30 text-center flex flex-col items-center justify-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-semibold text-primary-text">No Vision Analysis Yet</h4>
                  <p className="text-xs text-secondary-text max-w-xs">
                    Trigger multimodal AI inspection to extract ground-truth activities, objects, and confidence metrics.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex gap-2">
              <Button
                variant={currentAnalysis ? 'outline' : 'primary'}
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="w-full gap-2 text-xs h-9"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? 'Analyzing Evidence...' : currentAnalysis ? 'Re-analyze with Vision AI' : 'Run AI Analysis'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
