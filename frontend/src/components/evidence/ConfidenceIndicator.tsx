'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  Layers,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CompositeConfidence, ConfidenceLevel, ConfidenceSignals } from '@/types';

interface ConfidenceIndicatorProps {
  confidence?: CompositeConfidence | null;
  compact?: boolean;
  className?: string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  compact = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!confidence || !confidence.available || confidence.score === null) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 ${className}`}
      >
        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
        <span>Evidence Confidence: Unavailable</span>
      </div>
    );
  }

  const { percentage, level, breakdown, disclaimer, explanation, evaluatedWeightsSum } = confidence;

  const getLevelTheme = (lvl: ConfidenceLevel) => {
    switch (lvl) {
      case 'HIGH':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-700 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          fillColor: 'bg-emerald-500',
          icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-700 dark:text-amber-400',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          fillColor: 'bg-amber-500',
          icon: <AlertCircle className="w-4 h-4 text-amber-600" />,
        };
      case 'LOW':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/30',
          text: 'text-rose-700 dark:text-rose-400',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
          fillColor: 'bg-rose-500',
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
        };
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          text: 'text-slate-600',
          badgeBg: 'bg-slate-100 text-slate-700 border-slate-300',
          fillColor: 'bg-slate-400',
          icon: <HelpCircle className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const theme = getLevelTheme(level);

  // Compact Pill Badge View
  if (compact) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:shadow-sm ${theme.badgeBg}`}
          title="Click to view multi-signal breakdown"
        >
          {theme.icon}
          <span>Confidence: {percentage}%</span>
          <span className="font-extrabold uppercase text-[10px] tracking-wider px-1 py-0.2 rounded bg-white/60">
            {level}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 ml-0.5 opacity-70" />
          ) : (
            <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
          )}
        </button>

        {isExpanded && (
          <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-card rounded-xl border border-border shadow-xl z-30 text-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-bold text-primary-text flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Evidence Confidence Breakdown</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${theme.badgeBg}`}>
                {percentage}% {level}
              </span>
            </div>

            <p className="text-[11px] text-secondary-text leading-relaxed">
              {explanation}
            </p>

            <div className="space-y-2 pt-1">
              {Object.entries(breakdown).map(([key, item]) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-secondary-text font-medium">{item.name} ({Math.round(item.weight * 100)}%)</span>
                    <span className="font-mono font-semibold text-primary-text">
                      {item.available && item.percentage !== null
                        ? `${item.percentage}%`
                        : 'Not available'}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        item.available ? theme.fillColor : 'bg-transparent'
                      }`}
                      style={{
                        width: item.available && item.percentage !== null ? `${item.percentage}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex items-start gap-1.5 text-[10px] text-muted-text italic">
              <Info className="w-3 h-3 shrink-0 mt-0.5" />
              <span>{disclaimer}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full Expanded Card View
  return (
    <div
      className={`rounded-2xl border p-5 transition-all shadow-sm ${theme.bg} ${theme.border} ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider text-secondary-text">
              Evidence Confidence
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary-bg text-secondary-text border border-border">
              MVP Heuristic
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-extrabold tracking-tight text-primary-text">
              {percentage}%
            </span>
            <span
              className={`text-xs font-extrabold uppercase px-2.5 py-1 rounded-md border tracking-wider ${theme.badgeBg}`}
            >
              {level}
            </span>
          </div>

          <p className="text-xs text-secondary-text max-w-xl pt-0.5 leading-relaxed">
            {explanation}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary-text hover:text-brand-primary bg-card/80 px-3 py-1.5 rounded-lg border border-border hover:border-border/80 self-start sm:self-auto transition-colors"
        >
          <span>{isExpanded ? 'Hide Signals' : 'View 5-Signal Breakdown'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Progress Bar of Composite Score */}
      <div className="mt-4 w-full h-2 bg-card rounded-full overflow-hidden border border-border/50">
        <div
          className={`h-full transition-all duration-500 rounded-full ${theme.fillColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Expandable 5-Factor Signal Grid */}
      {isExpanded && (
        <div className="mt-5 pt-4 border-t border-border/60 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-secondary-text">
            <span className="font-semibold text-primary-text">
              Signal Breakdown (Evaluated weight sum: {Math.round(evaluatedWeightsSum * 100)}%)
            </span>
            <span className="text-[11px] text-muted-text">
              Missing signals normalized over available weights
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Vision Confidence */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary-text flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Vision Confidence</span>
                </span>
                <span className="text-[11px] text-muted-text font-mono">Weight 40%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary-text">
                  {breakdown.visionConfidence.available && breakdown.visionConfidence.percentage !== null
                    ? `${breakdown.visionConfidence.percentage}%`
                    : 'Not available'}
                </span>
                <span className="text-[10px] text-secondary-text">
                  {breakdown.visionConfidence.available ? 'AI Vision' : 'Unavailable'}
                </span>
              </div>
              <p className="text-[10px] text-muted-text leading-tight">
                {breakdown.visionConfidence.explanation}
              </p>
            </div>

            {/* Metadata Consistency */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary-text flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                  <span>Metadata Consistency</span>
                </span>
                <span className="text-[11px] text-muted-text font-mono">Weight 20%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary-text">
                  {breakdown.metadataConsistency.available && breakdown.metadataConsistency.percentage !== null
                    ? `${breakdown.metadataConsistency.percentage}%`
                    : 'Not available'}
                </span>
                <span className="text-[10px] text-secondary-text">
                  {breakdown.metadataConsistency.available ? 'GPS & Project' : 'Unavailable'}
                </span>
              </div>
              <p className="text-[10px] text-muted-text leading-tight">
                {breakdown.metadataConsistency.explanation}
              </p>
            </div>

            {/* Image Quality */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary-text flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Image Quality</span>
                </span>
                <span className="text-[11px] text-muted-text font-mono">Weight 15%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary-text">
                  {breakdown.imageQuality.available && breakdown.imageQuality.percentage !== null
                    ? `${breakdown.imageQuality.percentage}%`
                    : 'Not available'}
                </span>
                <span className="text-[10px] text-secondary-text">
                  {breakdown.imageQuality.available ? 'Readability' : 'Unavailable'}
                </span>
              </div>
              <p className="text-[10px] text-muted-text leading-tight">
                {breakdown.imageQuality.explanation}
              </p>
            </div>

            {/* Cross-Asset Agreement */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary-text flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span>Cross-Asset Agreement</span>
                </span>
                <span className="text-[11px] text-muted-text font-mono">Weight 15%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary-text">
                  {breakdown.crossAssetAgreement.available && breakdown.crossAssetAgreement.percentage !== null
                    ? `${breakdown.crossAssetAgreement.percentage}%`
                    : 'Not available'}
                </span>
                <span className="text-[10px] text-secondary-text">
                  {breakdown.crossAssetAgreement.available ? 'Corroboration' : 'Unavailable'}
                </span>
              </div>
              <p className="text-[10px] text-muted-text leading-tight">
                {breakdown.crossAssetAgreement.explanation}
              </p>
            </div>

            {/* Temporal Consistency */}
            <div className="p-3 rounded-xl bg-card border border-border space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-primary-text flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Temporal Consistency</span>
                </span>
                <span className="text-[11px] text-muted-text font-mono">Weight 10%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-bold text-primary-text">
                  {breakdown.temporalConsistency.available && breakdown.temporalConsistency.percentage !== null
                    ? `${breakdown.temporalConsistency.percentage}%`
                    : 'Not available'}
                </span>
                <span className="text-[10px] text-secondary-text">
                  {breakdown.temporalConsistency.available ? 'Chronology' : 'Unavailable'}
                </span>
              </div>
              <p className="text-[10px] text-muted-text leading-tight">
                {breakdown.temporalConsistency.explanation}
              </p>
            </div>
          </div>

          {/* Mandatory MVP Disclaimer Box */}
          <div className="p-3 rounded-xl bg-card/60 border border-border/80 text-[11px] text-muted-text flex items-start gap-2.5">
            <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-primary-text">MVP Heuristic Transparency Note:</span>
              <p>{disclaimer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
