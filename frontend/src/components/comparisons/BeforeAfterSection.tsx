import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowRight,
  ArrowLeftRight,
  Sparkles,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Info,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  RefreshCw,
  Image as ImageIcon,
  ChevronDown,
  Check,
  Eye,
  History,
} from 'lucide-react';
import {
  MediaAssetWithAnalysis,
  ComparisonRecord,
  ComparisonChange,
  ComparisonCategory,
  ComparisonDirection,
} from '@/types';
import {
  createComparison,
  getProjectComparisons,
} from '@/lib/api/client';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfidenceIndicator } from '@/components/evidence/ConfidenceIndicator';

interface BeforeAfterSectionProps {
  projectId: string;
  projectName: string;
  assets: MediaAssetWithAnalysis[];
  onAssetSelect?: (asset: MediaAssetWithAnalysis) => void;
}

export const BeforeAfterSection: React.FC<BeforeAfterSectionProps> = ({
  projectId,
  projectName,
  assets,
  onAssetSelect,
}) => {
  // Only image assets can be compared in Phase 5
  const imageAssets = useMemo(() => {
    return assets.filter((a) => !a.type || a.type === 'image');
  }, [assets]);

  // Sort image assets chronologically where dates exist
  const sortedImageAssets = useMemo(() => {
    return [...imageAssets].sort((a, b) => {
      const dateA = a.capture_date || a.created_at || '';
      const dateB = b.capture_date || b.created_at || '';
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    });
  }, [imageAssets]);

  const [beforeAssetId, setBeforeAssetId] = useState<string>('');
  const [afterAssetId, setAfterAssetId] = useState<string>('');
  const [comparisons, setComparisons] = useState<ComparisonRecord[]>([]);
  const [activeComparison, setActiveComparison] = useState<ComparisonRecord | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'compare' | 'history'>('compare');

  // Load existing saved comparisons for this project
  const loadComparisons = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await getProjectComparisons(projectId);
      setComparisons(data);
      if (data.length > 0 && !activeComparison) {
        // Pre-select most recent comparison
        setActiveComparison(data[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load project comparisons:', err.message);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadComparisons();
  }, [projectId]);

  // Set default before and after assets when assets load
  useEffect(() => {
    if (sortedImageAssets.length >= 2 && !beforeAssetId && !afterAssetId) {
      setBeforeAssetId(sortedImageAssets[0].id);
      setAfterAssetId(sortedImageAssets[sortedImageAssets.length - 1].id);
    }
  }, [sortedImageAssets]);

  const beforeAsset = useMemo(() => {
    return imageAssets.find((a) => a.id === beforeAssetId) || null;
  }, [imageAssets, beforeAssetId]);

  const afterAsset = useMemo(() => {
    return imageAssets.find((a) => a.id === afterAssetId) || null;
  }, [imageAssets, afterAssetId]);

  // Check chronological validity
  const chronologicalWarning = useMemo(() => {
    if (!beforeAsset || !afterAsset) return null;
    if (!beforeAsset.capture_date || !afterAsset.capture_date) return null;
    const timeBefore = new Date(beforeAsset.capture_date).getTime();
    const timeAfter = new Date(afterAsset.capture_date).getTime();
    if (!isNaN(timeBefore) && !isNaN(timeAfter) && timeBefore > timeAfter) {
      return `Chronological notice: The selected 'Before' photo is dated later (${formatDate(
        beforeAsset.capture_date
      )}) than the 'After' photo (${formatDate(afterAsset.capture_date)}). Consider swapping.`;
    }
    return null;
  }, [beforeAsset, afterAsset]);

  const handleSwap = () => {
    const temp = beforeAssetId;
    setBeforeAssetId(afterAssetId);
    setAfterAssetId(temp);
    setErrorMessage(null);
  };

  const handleRunComparison = async () => {
    if (!beforeAssetId || !afterAssetId) {
      setErrorMessage('Please select both a Before image and an After image.');
      return;
    }

    if (beforeAssetId === afterAssetId) {
      setErrorMessage('Before and After images must be different photos.');
      return;
    }

    setIsComparing(true);
    setErrorMessage(null);

    // Multi-stage UX feedback while awaiting comparison
    setLoadingStep('Preparing and verifying image evidence...');
    const stepTimer1 = setTimeout(() => {
      setLoadingStep('Comparing before and after photos via Multimodal Vision AI...');
    }, 1200);
    const stepTimer2 = setTimeout(() => {
      setLoadingStep('Identifying observable physical changes and confidence metrics...');
    }, 2800);
    const stepTimer3 = setTimeout(() => {
      setLoadingStep('Validating observations and saving comparison record...');
    }, 4500);

    try {
      const record = await createComparison(projectId, {
        beforeAssetId,
        afterAssetId,
      });

      setActiveComparison(record);
      // Refresh comparison history
      await loadComparisons();
    } catch (err: any) {
      console.error('Comparison execution failed:', err);
      setErrorMessage(
        err.message ||
          'Comparison service is temporarily unavailable. Please verify selected images and try again.'
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      setIsComparing(false);
      setLoadingStep('');
    }
  };

  function formatDate(dateStr?: string | null): string {
    if (!dateStr) return 'Date unspecified';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Date unspecified';
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Date unspecified';
    }
  }

  const getCategoryColor = (category: ComparisonCategory): string => {
    switch (category) {
      case 'vegetation':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'waste':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'water':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'land':
        return 'bg-stone-50 text-stone-700 border-stone-200';
      case 'infrastructure':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'human_activity':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getDirectionBadge = (direction: ComparisonDirection) => {
    switch (direction) {
      case 'increase':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <TrendingUp className="w-3 h-3" /> Increase
          </span>
        );
      case 'decrease':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
            <TrendingDown className="w-3 h-3" /> Decrease
          </span>
        );
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
            <PlusCircle className="w-3 h-3" /> New
          </span>
        );
      case 'removed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
            <MinusCircle className="w-3 h-3" /> Removed
          </span>
        );
      case 'changed':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
            <ArrowRight className="w-3 h-3" /> Changed
          </span>
        );
      case 'unchanged':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
            Unchanged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-200">
            <HelpCircle className="w-3 h-3" /> Uncertain
          </span>
        );
    }
  };

  // If the project doesn't have enough images
  if (imageAssets.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-border p-12 text-center max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 bg-brand-light-orange/30 text-brand-dark-orange rounded-full flex items-center justify-center mx-auto mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-primary-text mb-2">
          Before / After Intelligence
        </h3>
        <p className="text-secondary-text mb-6">
          {imageAssets.length === 0
            ? 'No photographic evidence has been uploaded for this project yet. Please upload field photos to enable AI visual comparison.'
            : 'At least two photographic evidence assets are required to perform a Before and After visual verification comparison.'}
        </p>
        <div className="inline-flex items-center gap-2 text-xs text-secondary-text bg-secondary-bg px-4 py-2 rounded-lg border border-border">
          <Info className="w-4 h-4 text-brand-dark-orange" />
          <span>Upload chronological photos (e.g. baseline vs follow-up inspection) to track physical progress.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-light-orange text-brand-dark-orange border border-orange-200">
                Phase 5 Intelligence
              </span>
              <h2 className="text-xl font-bold text-primary-text">
                Before / After Visual Verification
              </h2>
            </div>
            <p className="text-sm text-secondary-text mt-1">
              Select two ground-truth photos from <strong>{projectName}</strong> to identify observable physical changes, ground cover progression, and structural differences.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveView('compare')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'compare'
                  ? 'bg-brand-dark-orange text-white'
                  : 'bg-secondary-bg text-secondary-text hover:bg-border/60'
              }`}
            >
              Compare Photos
            </button>
            <button
              onClick={() => setActiveView('history')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                activeView === 'history'
                  ? 'bg-brand-dark-orange text-white'
                  : 'bg-secondary-bg text-secondary-text hover:bg-border/60'
              }`}
            >
              <History className="w-4 h-4" />
              History ({comparisons.length})
            </button>
          </div>
        </div>
      </div>

      {activeView === 'history' ? (
        /* Saved Comparisons History View */
        <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-bold text-primary-text">Saved Comparisons</h3>
              <p className="text-xs text-secondary-text">
                Historical AI comparisons for this project. Loaded from Supabase persistence without re-running AI models.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadComparisons}
              disabled={isLoadingHistory}
              className="flex items-center gap-1.5 text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {comparisons.length === 0 ? (
            <div className="py-12 text-center text-secondary-text">
              <History className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium">No saved comparisons created yet.</p>
              <p className="text-xs mt-1">Switch to the "Compare Photos" tab to run your first visual comparison.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisons.map((c) => {
                const isSelected = activeComparison?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveComparison(c);
                      setBeforeAssetId(c.before_asset_id);
                      setAfterAssetId(c.after_asset_id);
                      setActiveView('compare');
                    }}
                    className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-brand-dark-orange/60 ${
                      isSelected
                        ? 'border-brand-dark-orange bg-orange-50/20 ring-1 ring-brand-dark-orange/40'
                        : 'border-border bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs text-secondary-text mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(c.created_at)}
                      </span>
                      <span className="font-semibold text-brand-dark-orange">
                        Model confidence: {Math.round(c.confidence * 100)}%
                      </span>
                    </div>

                    {/* Dual thumbnail strip */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary-bg border border-border">
                        {c.before_asset?.url ? (
                          <img
                            src={c.before_asset.url}
                            alt="Before"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-secondary-text">
                            Before Photo
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {formatDate(c.before_asset?.capture_date)}
                        </span>
                      </div>

                      <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary-bg border border-border">
                        {c.after_asset?.url ? (
                          <img
                            src={c.after_asset.url}
                            alt="After"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-secondary-text">
                            After Photo
                          </div>
                        )}
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                          {formatDate(c.after_asset?.capture_date)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-primary-text font-medium line-clamp-2 mb-3">
                      {c.comparison_result.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                      <span className="text-secondary-text">
                        {c.comparison_result.changes.length} change(s) detected
                      </span>
                      <span className="text-brand-dark-orange font-medium flex items-center gap-1">
                        Inspect Results <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Image Selection & Comparison Generator */
        <div className="space-y-6">
          {/* Pair Selector Panel */}
          <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-base font-bold text-primary-text mb-4">
              Select Evidence Pair for Comparison
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
              {/* BEFORE Selector */}
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                    Baseline (Before Image)
                  </label>
                  {beforeAsset && (
                    <span className="text-xs text-brand-dark-orange font-medium">
                      {formatDate(beforeAsset.capture_date || beforeAsset.created_at)}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={beforeAssetId}
                    onChange={(e) => {
                      setBeforeAssetId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full pl-3 pr-8 py-2.5 bg-secondary-bg border border-border rounded-lg text-sm text-primary-text font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-brand-dark-orange/30"
                  >
                    {imageAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {formatDate(asset.capture_date || asset.created_at)} — {asset.uploaded_by || 'Evidence'} ({asset.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-secondary-text absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              {/* Swap Button */}
              <div className="md:col-span-1 flex justify-center py-2 md:py-0">
                <button
                  type="button"
                  onClick={handleSwap}
                  title="Swap Before and After images"
                  className="p-2.5 rounded-full bg-secondary-bg hover:bg-border border border-border text-secondary-text hover:text-primary-text transition-transform active:scale-95"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
              </div>

              {/* AFTER Selector */}
              <div className="md:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                    Progress (After Image)
                  </label>
                  {afterAsset && (
                    <span className="text-xs text-brand-dark-orange font-medium">
                      {formatDate(afterAsset.capture_date || afterAsset.created_at)}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <select
                    value={afterAssetId}
                    onChange={(e) => {
                      setAfterAssetId(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full pl-3 pr-8 py-2.5 bg-secondary-bg border border-border rounded-lg text-sm text-primary-text font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-brand-dark-orange/30"
                  >
                    {imageAssets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {formatDate(asset.capture_date || asset.created_at)} — {asset.uploaded_by || 'Evidence'} ({asset.id.slice(0, 8)})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-secondary-text absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Chronological Warning Banner */}
            {chronologicalWarning && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{chronologicalWarning}</span>
                </div>
                <button
                  onClick={handleSwap}
                  className="font-bold underline text-amber-900 hover:text-amber-700 shrink-0 ml-3"
                >
                  Swap Now
                </button>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-800">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Trigger */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
              <div className="text-xs text-secondary-text">
                <span>Visual evidence comparison relies on verifiable photographic changes without unsupported scientific claims.</span>
              </div>

              <Button
                variant="primary"
                onClick={handleRunComparison}
                disabled={isComparing || beforeAssetId === afterAssetId}
                className="w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
                {isComparing ? 'Comparing Evidence...' : 'Run AI Comparison'}
              </Button>

            </div>

            {/* Loading Indicator */}
            {isComparing && (
              <div className="mt-4 p-4 bg-orange-50/50 border border-orange-200 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-brand-dark-orange border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-xs font-semibold text-brand-dark-orange">{loadingStep}</span>
                </div>
                <div className="w-full bg-orange-200/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-brand-dark-orange h-full rounded-full animate-pulse w-3/4" />
                </div>
              </div>
            )}
          </div>

          {/* Visual Side-by-Side Evidence Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BEFORE Card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-stone-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                    Before (Baseline)
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-secondary-text">
                  {beforeAsset ? formatDate(beforeAsset.capture_date || beforeAsset.created_at) : ''}
                </span>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary-bg border border-border flex items-center justify-center">
                {beforeAsset?.url ? (
                  <img
                    src={beforeAsset.url}
                    alt="Before evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-secondary-text text-sm flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> No image selected
                  </div>
                )}
              </div>

              {beforeAsset && (
                <div className="text-xs text-secondary-text space-y-1">
                  <div className="flex justify-between">
                    <span>Uploaded by:</span>
                    <span className="font-medium text-primary-text">{beforeAsset.uploaded_by || 'Unknown'}</span>
                  </div>
                  {beforeAsset.latitude && beforeAsset.longitude && (
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="font-mono text-primary-text">
                        {Number(beforeAsset.latitude).toFixed(4)}, {Number(beforeAsset.longitude).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {onAssetSelect && (
                    <button
                      onClick={() => onAssetSelect(beforeAsset)}
                      className="mt-2 text-xs text-brand-dark-orange font-medium flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect evidence details
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* AFTER Card */}
            <div className="bg-white rounded-xl border border-border p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                    After (Progress)
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-secondary-text">
                  {afterAsset ? formatDate(afterAsset.capture_date || afterAsset.created_at) : ''}
                </span>
              </div>

              <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary-bg border border-border flex items-center justify-center">
                {afterAsset?.url ? (
                  <img
                    src={afterAsset.url}
                    alt="After evidence"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-secondary-text text-sm flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" /> No image selected
                  </div>
                )}
              </div>

              {afterAsset && (
                <div className="text-xs text-secondary-text space-y-1">
                  <div className="flex justify-between">
                    <span>Uploaded by:</span>
                    <span className="font-medium text-primary-text">{afterAsset.uploaded_by || 'Unknown'}</span>
                  </div>
                  {afterAsset.latitude && afterAsset.longitude && (
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="font-mono text-primary-text">
                        {Number(afterAsset.latitude).toFixed(4)}, {Number(afterAsset.longitude).toFixed(4)}
                      </span>
                    </div>
                  )}
                  {onAssetSelect && (
                    <button
                      onClick={() => onAssetSelect(afterAsset)}
                      className="mt-2 text-xs text-brand-dark-orange font-medium flex items-center gap-1 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect evidence details
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Active Comparison Analysis Results Panel */}
          {activeComparison && (
            <div className="bg-white rounded-xl border border-border p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-primary-text">
                      Detected Visible Changes
                    </h3>
                    {activeComparison.status === 'inconclusive' && (
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Inconclusive Viewpoint
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-text">
                    Audited comparison between Baseline ({activeComparison.before_asset_id.slice(0, 8)}) and Progress ({activeComparison.after_asset_id.slice(0, 8)})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {activeComparison.compositeConfidence ? (
                    <ConfidenceIndicator confidence={activeComparison.compositeConfidence} compact />
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-xs font-bold text-brand-dark-orange flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Model confidence: {Math.round(activeComparison.confidence * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-secondary-bg/60 border border-border rounded-xl p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-text mb-1.5">
                  AI Visual Summary
                </h4>
                <p className="text-sm text-primary-text leading-relaxed">
                  {activeComparison.comparison_result.summary}
                </p>
              </div>

              {/* Changes List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary-text">
                  Observable Visual Differences ({activeComparison.comparison_result.changes.length})
                </h4>

                {activeComparison.comparison_result.changes.length === 0 ? (
                  <div className="py-6 text-center bg-secondary-bg/30 rounded-lg border border-dashed border-border text-secondary-text text-sm">
                    No clear visible changes were identified between these photos.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeComparison.comparison_result.changes.map((change, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-border/80 transition-shadow shadow-xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs uppercase font-bold px-2 py-0.5 rounded border ${getCategoryColor(
                                change.category
                              )}`}
                            >
                              {change.category}
                            </span>
                            {getDirectionBadge(change.direction)}
                          </div>
                          <p className="text-sm font-medium text-primary-text">
                            {change.description}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                          <span className="text-xs text-secondary-text">Certainty:</span>
                          <span className="text-xs font-mono font-bold text-primary-text bg-secondary-bg px-2 py-1 rounded border border-border">
                            {Math.round(change.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Traceability and Disclaimer Footer */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-secondary-text gap-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Evidence Traceability: Verified against assets {activeComparison.before_asset_id.slice(0, 8)} and {activeComparison.after_asset_id.slice(0, 8)}
                </span>
                <span className="italic">
                  * Note: Confidence represents model observation certainty, not scientific carbon or ecological metrics.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
