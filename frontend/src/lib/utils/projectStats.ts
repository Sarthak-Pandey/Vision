import {
  MediaAssetWithAnalysis,
  ProjectStatsSummary,
  ActivitySummaryItem,
  TimelineYearGroup,
  TimelineMonthGroup,
  LocationClusterItem,
} from '@/types';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Formats a string to Title Case (e.g. "tree plantation" -> "Tree Plantation")
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Calculates real project statistics from database asset & AI analysis records.
 */
export function calculateProjectStats(assets: MediaAssetWithAnalysis[]): ProjectStatsSummary {
  const mediaCount = assets.length;

  // 1. Calculate Activity Summary
  // Map normalized key -> { displayLabel, Set of asset IDs }
  const activityMap = new Map<string, { label: string; assetIds: Set<string> }>();

  for (const asset of assets) {
    const rawActivities = asset.ai_analysis?.activities;
    if (!Array.isArray(rawActivities) || rawActivities.length === 0) {
      continue;
    }

    for (const item of rawActivities) {
      if (typeof item !== 'string') continue;
      const trimmed = item.trim();
      if (!trimmed) continue;

      const normalizedKey = trimmed.toLowerCase();
      const existing = activityMap.get(normalizedKey);

      if (existing) {
        existing.assetIds.add(asset.id);
      } else {
        activityMap.set(normalizedKey, {
          label: toTitleCase(trimmed),
          assetIds: new Set([asset.id]),
        });
      }
    }
  }

  const activities: ActivitySummaryItem[] = Array.from(activityMap.entries())
    .map(([key, value]) => ({
      normalizedKey: key,
      activity: value.label,
      count: value.assetIds.size,
    }))
    .sort((a, b) => b.count - a.count || a.activity.localeCompare(b.activity));

  const activityCount = activities.length;

  // 2. Calculate Location Summary
  // Group coordinates by rounding to 3 decimal places (~110 meters cluster precision)
  // Strategy: Group nearby coordinates by 0.001 degree precision to count distinct operational sites.
  const locationMap = new Map<
    string,
    { lat: number; lng: number; count: number; sampleUrl?: string }
  >();

  for (const asset of assets) {
    const lat = Number(asset.latitude);
    const lng = Number(asset.longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      continue;
    }

    // Key with 3 decimal places (~110m precision)
    const roundedLat = Number(lat.toFixed(3));
    const roundedLng = Number(lng.toFixed(3));
    const key = `${roundedLat.toFixed(3)},${roundedLng.toFixed(3)}`;

    const existing = locationMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      locationMap.set(key, {
        lat: roundedLat,
        lng: roundedLng,
        count: 1,
        sampleUrl: asset.url,
      });
    }
  }

  const locations: LocationClusterItem[] = Array.from(locationMap.entries()).map(
    ([key, value]) => ({
      key,
      latitude: value.lat,
      longitude: value.lng,
      formattedCoordinates: `${value.lat >= 0 ? `${value.lat}° N` : `${Math.abs(value.lat)}° S`}, ${
        value.lng >= 0 ? `${value.lng}° E` : `${Math.abs(value.lng)}° W`
      }`,
      count: value.count,
      sampleAssetUrl: value.sampleUrl,
    })
  );

  const locationCount = locations.length;

  // 3. Calculate Timeline Grouping (Year -> Month)
  // Maps yearString -> Map(monthIndex -> list of assets)
  const timelineMap = new Map<string, Map<number, MediaAssetWithAnalysis[]>>();
  const undatedAssets: MediaAssetWithAnalysis[] = [];

  for (const asset of assets) {
    let dateObj: Date | null = null;
    if (asset.capture_date) {
      const d = new Date(asset.capture_date);
      if (!isNaN(d.getTime())) dateObj = d;
    }

    if (!dateObj && asset.created_at) {
      const d = new Date(asset.created_at);
      if (!isNaN(d.getTime())) dateObj = d;
    }

    if (!dateObj) {
      undatedAssets.push(asset);
      continue;
    }

    const yearStr = dateObj.getFullYear().toString();
    const monthIndex = dateObj.getMonth();

    if (!timelineMap.has(yearStr)) {
      timelineMap.set(yearStr, new Map());
    }

    const yearMonthsMap = timelineMap.get(yearStr)!;
    if (!yearMonthsMap.has(monthIndex)) {
      yearMonthsMap.set(monthIndex, []);
    }

    yearMonthsMap.get(monthIndex)!.push(asset);
  }

  // Convert timelineMap to TimelineYearGroup[]
  const timeline: TimelineYearGroup[] = Array.from(timelineMap.entries())
    .map(([yearStr, yearMonthsMap]) => {
      let totalYearAssets = 0;
      const months: TimelineMonthGroup[] = Array.from(yearMonthsMap.entries())
        .map(([mIdx, monthAssets]) => {
          totalYearAssets += monthAssets.length;
          // Sort assets within month newest first
          const sortedAssets = [...monthAssets].sort((a, b) => {
            const timeA = new Date(a.capture_date || a.created_at).getTime();
            const timeB = new Date(b.capture_date || b.created_at).getTime();
            return timeB - timeA;
          });

          return {
            monthName: MONTH_NAMES[mIdx],
            monthKey: `${yearStr}-${String(mIdx + 1).padStart(2, '0')}`,
            count: monthAssets.length,
            assets: sortedAssets,
          };
        })
        .sort((a, b) => {
          // Sort months newest first (December to January)
          const idxA = MONTH_NAMES.indexOf(a.monthName);
          const idxB = MONTH_NAMES.indexOf(b.monthName);
          return idxB - idxA;
        });

      return {
        year: yearStr,
        totalAssets: totalYearAssets,
        months,
      };
    })
    .sort((a, b) => Number(b.year) - Number(a.year)); // Sort years newest first

  return {
    mediaCount,
    activityCount,
    locationCount,
    activities,
    locations,
    timeline,
    undatedAssetsCount: undatedAssets.length,
  };
}
