/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Listing {
  id: string;
  neighbourhood_cleansed: string;
  latitude: number;
  longitude: number;
  property_type: string;
  room_type: string;
  accommodates: number;
  bedrooms: number;
  price: number;
  minimum_nights: number;
  number_of_reviews_ltm: number;
  review_scores_rating: number | null;
  estimated_occupancy_l365d: number;
  estimated_revenue_l365d: number;
  host_is_superhost: string;
  license_status: string;
}

export type UnitTypeFilter = 'Any' | 'Condo or apartment' | 'House or townhouse';
export type RentalStrategy = 'short_term' | 'monthly';
export type Positioning = 'budget' | 'market' | 'premium';

export interface AdvisorInputs {
  neighbourhood: string;
  bedrooms: number;
  accommodates: number | null;
  unitType: UnitTypeFilter;
  strategy: RentalStrategy;
  positioning: Positioning;
}

export interface OwnerEconomicsInputs {
  managementFeePct: number | null;
  monthlyFixedCosts: number | null;
  longTermMonthlyRent: number | null;
}

export interface CleaningStats {
  rawCount: number;
  p1CitywidePrice: number;
  p99CitywidePrice: number;
  afterPriceTrimCount: number;
  afterActiveFilterCount: number;
}

export interface CompTierResult {
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  tierDescription: string;
  n: number;
  comps: Listing[];
}

export interface StrategyMetrics {
  strategy: RentalStrategy;
  label: string;
  n: number;
  medianPrice: number;
  medianOccupancy: number;
  estAnnualRevenue: number;
  compsMedianRevenue: number;
  tier: number;
  tierLabel: string;
  comps: Listing[];
}

export interface LicenseStatusBreakdown {
  status: string;
  count: number;
  pct: number;
}

export interface MarketContextMetrics {
  compCount: number;
  superhostCount: number;
  superhostPct: number;
  medianReviewRating: number | null;
  reviewScoreCount: number;
  licenseBreakdown: LicenseStatusBreakdown[];
}

export interface OwnerEconomicsMetrics {
  managementFeePct: number;
  monthlyFixedCosts: number;
  longTermMonthlyRent: number;
  grossAirbnbAnnual: number;
  managementFeeAnnual: number;
  fixedCostsAnnual: number;
  netAirbnbAnnual: number;
  longTermLeaseAnnual: number;
  netDifference: number;
  breakEvenPrice: number | null;
  hasInputs: boolean;
}

export interface PriceHistogramBin {
  binMin: number;
  binMax: number;
  rangeLabel: string;
  count: number;
}

export interface TopNeighbourhoodRow {
  neighbourhood: string;
  listingCount: number;
  medianPrice: number;
  isSubject: boolean;
}

export interface TraceRecord {
  id: string;
  label: string;
  valueFormatted: string;
  numericValue: number;
  formula: string;
  filters: string[];
  n: number;
  rows: Listing[];
}

export interface AdvisorAnalysis {
  cleaningStats: CleaningStats;
  tierResult: CompTierResult;
  p25Price: number;
  p50Price: number;
  p75Price: number;
  recommendedPrice: number;
  medianOccupancy: number;
  estAnnualRevenue: number;
  compsMedianRevenue: number;
  revenueDiffPct: number;
  strategyComparison: {
    shortTerm: StrategyMetrics;
    monthly: StrategyMetrics;
  };
  marketContext: MarketContextMetrics;
  ownerEconomics: OwnerEconomicsMetrics;
  priceHistogram: PriceHistogramBin[];
  topNeighbourhoods: TopNeighbourhoodRow[];
  scatterComps: Array<{
    id: string;
    price: number;
    rating: number;
    propertyType: string;
    occupancy: number;
  }>;
  traces: Record<string, TraceRecord>;
  compactAiJson: Record<string, number | string | boolean>;
}

export const CONDO_TYPES = new Set([
  'Entire condo',
  'Entire rental unit',
  'Entire serviced apartment',
  'Entire loft',
]);

export const HOUSE_TYPES = new Set(['Entire home', 'Entire townhouse']);

/**
 * Excel PERCENTILE.INC compatible linear interpolation.
 * Given an array sorted in ascending order and p in [0, 1].
 */
export function percentileInc(arr: number[], p: number): number {
  if (!arr || arr.length === 0) return 0;
  if (arr.length === 1) return arr[0];

  const sorted = [...arr].sort((a, b) => a - b);
  const clampedP = Math.max(0, Math.min(1, p));
  const r = clampedP * (sorted.length - 1);
  const i = Math.floor(r);
  const f = r - i;

  if (i >= sorted.length - 1) {
    return sorted[sorted.length - 1];
  }
  return sorted[i] + f * (sorted[i + 1] - sorted[i]);
}

export function median(arr: number[]): number {
  return percentileInc(arr, 0.5);
}

/**
 * Haversine formula to compute distance in km between two lat/lng coordinates.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter raw listings according to Step 1:
 * - Drop prices below 1st or above 99th percentile of citywide price
 * - Keep active listings (number_of_reviews_ltm >= 1)
 */
export function cleanListings(rawListings: Listing[]): {
  cleanedListings: Listing[];
  cleaningStats: CleaningStats;
} {
  const validPriceListings = rawListings.filter(
    (l) => typeof l.price === 'number' && !isNaN(l.price) && l.price > 0
  );

  const citywidePrices = validPriceListings.map((l) => l.price);
  const p1 = percentileInc(citywidePrices, 0.01);
  const p99 = percentileInc(citywidePrices, 0.99);

  const afterPriceTrim = validPriceListings.filter(
    (l) => l.price >= p1 && l.price <= p99
  );

  const cleanedListings = afterPriceTrim.filter(
    (l) => l.number_of_reviews_ltm >= 1
  );

  return {
    cleanedListings,
    cleaningStats: {
      rawCount: rawListings.length,
      p1CitywidePrice: p1,
      p99CitywidePrice: p99,
      afterPriceTrimCount: afterPriceTrim.length,
      afterActiveFilterCount: cleanedListings.length,
    },
  };
}

function matchesUnitType(propertyType: string, unitType: UnitTypeFilter): boolean {
  if (unitType === 'Any') return true;
  if (unitType === 'Condo or apartment') return CONDO_TYPES.has(propertyType);
  if (unitType === 'House or townhouse') return HOUSE_TYPES.has(propertyType);
  return true;
}

function matchesStrategy(minNights: number, strategy: RentalStrategy): boolean {
  if (strategy === 'short_term') return minNights < 30;
  return minNights >= 30;
}

/**
 * Multi-tier comp selection:
 * 1. Exact match (neighbourhood, room_type Entire home/apt, bedrooms, unitType, strategy, optional accommodates)
 * 2. Drop unit type if n < 15
 * 3. 1.5 km radius from neighbourhood's median coords if n < 15
 * 4. Citywide if n < 15
 */
export function findComps(
  cleanedListings: Listing[],
  inputs: AdvisorInputs
): CompTierResult {
  const { neighbourhood, bedrooms, accommodates, unitType, strategy } = inputs;

  const baseFilter = (l: Listing) => {
    if (l.room_type !== 'Entire home/apt') return false;
    if (l.bedrooms !== bedrooms) return false;
    if (!matchesStrategy(l.minimum_nights, strategy)) return false;
    if (accommodates !== null && accommodates > 0 && l.accommodates < accommodates) {
      return false;
    }
    return true;
  };

  // Tier 1: Exact match with neighbourhood and unit type
  const tier1Comps = cleanedListings.filter(
    (l) =>
      l.neighbourhood_cleansed === neighbourhood &&
      matchesUnitType(l.property_type, unitType) &&
      baseFilter(l)
  );

  if (tier1Comps.length >= 15) {
    return {
      tier: 1,
      tierLabel: 'Tier 1: Exact Neighborhood & Unit Type',
      tierDescription: `Exact match for ${neighbourhood}, ${bedrooms} bedroom(s), ${unitType}, and ${strategy === 'short_term' ? 'short-term' : 'monthly'} strategy.`,
      n: tier1Comps.length,
      comps: tier1Comps,
    };
  }

  // Tier 2: Drop unit type filter (keep neighbourhood)
  const tier2Comps = cleanedListings.filter(
    (l) => l.neighbourhood_cleansed === neighbourhood && baseFilter(l)
  );

  if (tier2Comps.length >= 15) {
    return {
      tier: 2,
      tierLabel: 'Tier 2: Expanded Unit Types',
      tierDescription: `Insufficient comps (${tier1Comps.length} found). Dropped unit type filter to include all Entire home/apt properties in ${neighbourhood}.`,
      n: tier2Comps.length,
      comps: tier2Comps,
    };
  }

  // Tier 3: 1.5 km radius of neighbourhood median coordinates
  const neighbourhoodListings = cleanedListings.filter(
    (l) => l.neighbourhood_cleansed === neighbourhood
  );

  let medianLat = 38.9072;
  let medianLon = -77.0369;

  if (neighbourhoodListings.length > 0) {
    medianLat = median(neighbourhoodListings.map((l) => l.latitude));
    medianLon = median(neighbourhoodListings.map((l) => l.longitude));
  }

  const tier3Comps = cleanedListings.filter((l) => {
    if (!baseFilter(l)) return false;
    const dist = haversineDistanceKm(medianLat, medianLon, l.latitude, l.longitude);
    return dist <= 1.5;
  });

  if (tier3Comps.length >= 15) {
    return {
      tier: 3,
      tierLabel: 'Tier 3: 1.5 km Geographic Radius',
      tierDescription: `Insufficient comps in neighbourhood boundary (${tier2Comps.length} found). Expanded search to listings within 1.5 km radius of ${neighbourhood}'s center coordinates.`,
      n: tier3Comps.length,
      comps: tier3Comps,
    };
  }

  // Tier 4: Citywide comps
  const tier4Comps = cleanedListings.filter(baseFilter);

  return {
    tier: 4,
    tierLabel: 'Tier 4: Citywide Comps',
    tierDescription: `Expanded to citywide benchmark (${tier4Comps.length} active listings citywide with matching bedrooms & strategy).`,
    n: tier4Comps.length,
    comps: tier4Comps,
  };
}

/**
 * Top 15 neighbourhoods with the most listings:
 * Criteria: 1-bedroom, room_type "Entire home/apt", short-term (minimum_nights < 30)
 */
export function computeTop15Neighbourhoods(
  cleanedListings: Listing[],
  subjectNeighbourhood: string
): TopNeighbourhoodRow[] {
  const filtered = cleanedListings.filter(
    (l) =>
      l.bedrooms === 1 &&
      l.room_type === 'Entire home/apt' &&
      l.minimum_nights < 30
  );

  const groups: Record<string, number[]> = {};
  for (const item of filtered) {
    if (!groups[item.neighbourhood_cleansed]) {
      groups[item.neighbourhood_cleansed] = [];
    }
    groups[item.neighbourhood_cleansed].push(item.price);
  }

  const rows = Object.entries(groups).map(([neighbourhood, prices]) => ({
    neighbourhood,
    listingCount: prices.length,
    medianPrice: Math.round(median(prices)),
    isSubject: neighbourhood === subjectNeighbourhood,
  }));

  rows.sort((a, b) => b.listingCount - a.listingCount);

  // Take top 15
  return rows.slice(0, 15);
}

/**
 * Compute price histogram bins
 */
export function computePriceHistogram(
  comps: Listing[],
  binCount: number = 10
): PriceHistogramBin[] {
  if (comps.length === 0) return [];
  const prices = comps.map((c) => c.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  if (min === max) {
    return [
      {
        binMin: Math.floor(min),
        binMax: Math.ceil(max) + 1,
        rangeLabel: `$${Math.round(min)}`,
        count: comps.length,
      },
    ];
  }

  const step = Math.ceil((max - min) / binCount);
  const bins: PriceHistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const binMin = Math.round(min + i * step);
    const binMax = Math.round(min + (i + 1) * step);
    const count = prices.filter(
      (p) => (i === binCount - 1 ? p >= binMin && p <= binMax : p >= binMin && p < binMax)
    ).length;

    bins.push({
      binMin,
      binMax,
      rangeLabel: `$${binMin}–$${binMax}`,
      count,
    });
  }

  return bins;
}

/**
 * Comprehensive Advisor Analysis Engine
 */
export function calculateAdvisorAnalysis(
  cleanedListings: Listing[],
  cleaningStats: CleaningStats,
  inputs: AdvisorInputs,
  ownerInputs: OwnerEconomicsInputs
): AdvisorAnalysis {
  const tierResult = findComps(cleanedListings, inputs);
  const comps = tierResult.comps;

  // Prices and percentiles
  const compPrices = comps.map((c) => c.price).sort((a, b) => a - b);
  const p25Price = Math.round(percentileInc(compPrices, 0.25));
  const p50Price = Math.round(percentileInc(compPrices, 0.5));
  const p75Price = Math.round(percentileInc(compPrices, 0.75));

  let recommendedPrice = p50Price;
  if (inputs.positioning === 'budget') recommendedPrice = p25Price;
  if (inputs.positioning === 'premium') recommendedPrice = p75Price;

  // Occupancy and revenues
  const compOccupancies = comps.map((c) => c.estimated_occupancy_l365d);
  const medianOccupancy = Math.round(median(compOccupancies));

  const estAnnualRevenue = Math.round(recommendedPrice * medianOccupancy);

  const compRevenues = comps.map((c) => c.estimated_revenue_l365d);
  const compsMedianRevenue = Math.round(median(compRevenues));

  const revenueDiffPct =
    compsMedianRevenue > 0
      ? Math.round(
          ((estAnnualRevenue - compsMedianRevenue) / compsMedianRevenue) * 1000
        ) / 10
      : 0;

  // Strategy comparison (Short-term vs Monthly for same base property)
  const stResult = findComps(cleanedListings, {
    ...inputs,
    strategy: 'short_term',
  });
  const monthlyResult = findComps(cleanedListings, {
    ...inputs,
    strategy: 'monthly',
  });

  const stMedianPrice = Math.round(median(stResult.comps.map((c) => c.price)));
  const stMedianOcc = Math.round(
    median(stResult.comps.map((c) => c.estimated_occupancy_l365d))
  );
  const stEstRevenue = Math.round(stMedianPrice * stMedianOcc);
  const stMedianRev = Math.round(
    median(stResult.comps.map((c) => c.estimated_revenue_l365d))
  );

  const mMedianPrice = Math.round(median(monthlyResult.comps.map((c) => c.price)));
  const mMedianOcc = Math.round(
    median(monthlyResult.comps.map((c) => c.estimated_occupancy_l365d))
  );
  const mEstRevenue = Math.round(mMedianPrice * mMedianOcc);
  const mMedianRev = Math.round(
    median(monthlyResult.comps.map((c) => c.estimated_revenue_l365d))
  );

  // Market Context
  const superhostCount = comps.filter((c) => c.host_is_superhost === 't').length;
  const superhostPct =
    comps.length > 0 ? Math.round((superhostCount / comps.length) * 1000) / 10 : 0;

  const validRatings = comps
    .map((c) => c.review_scores_rating)
    .filter((r): r is number => r !== null && !isNaN(r));
  const medianReviewRating =
    validRatings.length > 0
      ? Math.round(percentileInc(validRatings, 0.5) * 100) / 100
      : null;

  // License breakdown
  const licenseCounts: Record<string, number> = {
    'Hosted license': 0,
    'Unhosted license': 0,
    Exempt: 0,
    Blank: 0,
    Other: 0,
  };
  for (const c of comps) {
    const status = c.license_status || 'Blank';
    if (status in licenseCounts) {
      licenseCounts[status]++;
    } else {
      licenseCounts['Other']++;
    }
  }

  const licenseBreakdown: LicenseStatusBreakdown[] = Object.entries(licenseCounts).map(
    ([status, count]) => ({
      status,
      count,
      pct: comps.length > 0 ? Math.round((count / comps.length) * 1000) / 10 : 0,
    })
  );

  // Owner Economics
  const feePct = ownerInputs.managementFeePct ?? 0;
  const fixedCosts = ownerInputs.monthlyFixedCosts ?? 0;
  const monthlyRent = ownerInputs.longTermMonthlyRent ?? 0;
  const hasEconomicsInputs =
    ownerInputs.managementFeePct !== null ||
    ownerInputs.monthlyFixedCosts !== null ||
    ownerInputs.longTermMonthlyRent !== null;

  const grossAirbnbAnnual = estAnnualRevenue;
  const managementFeeAnnual = Math.round(grossAirbnbAnnual * (feePct / 100));
  const fixedCostsAnnual = Math.round(fixedCosts * 12);
  const netAirbnbAnnual = grossAirbnbAnnual - managementFeeAnnual - fixedCostsAnnual;
  const longTermLeaseAnnual = Math.round(monthlyRent * 12);
  const netDifference = netAirbnbAnnual - longTermLeaseAnnual;

  let breakEvenPrice: number | null = null;
  const feeMultiplier = 1 - feePct / 100;
  if (medianOccupancy > 0 && feeMultiplier > 0 && monthlyRent > 0) {
    const requiredGross = (longTermLeaseAnnual + fixedCostsAnnual) / feeMultiplier;
    breakEvenPrice = Math.round((requiredGross / medianOccupancy) * 10) / 10;
  }

  // Visuals: Histogram, Top 15 Neighbourhoods, Scatter Comps
  const priceHistogram = computePriceHistogram(comps, 12);
  const topNeighbourhoods = computeTop15Neighbourhoods(
    cleanedListings,
    inputs.neighbourhood
  );

  const scatterComps = comps
    .filter((c) => c.review_scores_rating !== null && !isNaN(c.review_scores_rating))
    .map((c) => ({
      id: c.id,
      price: c.price,
      rating: c.review_scores_rating as number,
      propertyType: c.property_type,
      occupancy: c.estimated_occupancy_l365d,
    }));

  // Build Provenance Traces Dictionary
  const commonFilters = [
    `Neighbourhood: ${inputs.neighbourhood}`,
    `Bedrooms: ${inputs.bedrooms}`,
    `Room Type: Entire home/apt`,
    `Unit Type Filter: ${inputs.unitType}`,
    `Strategy: ${inputs.strategy === 'short_term' ? 'Short-term (<30 nights)' : 'Monthly (>=30 nights)'}`,
    `Comp Fallback Tier: ${tierResult.tierLabel}`,
    `Cleaning Rule: Citywide P1-P99 ($${Math.round(cleaningStats.p1CitywidePrice)}–$${Math.round(cleaningStats.p99CitywidePrice)}) & Active (number_of_reviews_ltm >= 1)`,
  ];

  const traces: Record<string, TraceRecord> = {
    recommended_price: {
      id: 'recommended_price',
      label: 'Recommended Nightly Price',
      valueFormatted: `$${recommendedPrice} / night`,
      numericValue: recommendedPrice,
      formula: `Computed as the ${inputs.positioning === 'budget' ? '25th percentile (P25)' : inputs.positioning === 'premium' ? '75th percentile (P75)' : 'median (50th percentile)'} of comp nightly rates using Excel PERCENTILE.INC linear interpolation.`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    p25_price: {
      id: 'p25_price',
      label: 'Budget (25th Percentile) Price',
      valueFormatted: `$${p25Price} / night`,
      numericValue: p25Price,
      formula: '25th percentile of comp nightly prices (Excel PERCENTILE.INC linear interpolation).',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    p50_price: {
      id: 'p50_price',
      label: 'Market (Median / P50) Price',
      valueFormatted: `$${p50Price} / night`,
      numericValue: p50Price,
      formula: 'Median (50th percentile) of comp nightly prices (Excel PERCENTILE.INC linear interpolation).',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    p75_price: {
      id: 'p75_price',
      label: 'Premium (75th Percentile) Price',
      valueFormatted: `$${p75Price} / night`,
      numericValue: p75Price,
      formula: '75th percentile of comp nightly prices (Excel PERCENTILE.INC linear interpolation).',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    median_occupancy: {
      id: 'median_occupancy',
      label: 'Median Annual Occupancy',
      valueFormatted: `${medianOccupancy} nights / yr`,
      numericValue: medianOccupancy,
      formula: 'Median of estimated_occupancy_l365d across the filtered comp set.',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    est_annual_revenue: {
      id: 'est_annual_revenue',
      label: 'Estimated Annual Revenue',
      valueFormatted: `$${estAnnualRevenue.toLocaleString()}`,
      numericValue: estAnnualRevenue,
      formula: `Product of Chosen Recommended Price ($${recommendedPrice}) × Median Comp Occupancy (${medianOccupancy} nights/yr).`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    comps_median_revenue: {
      id: 'comps_median_revenue',
      label: 'Comps Median Historical Revenue (Cross-Check)',
      valueFormatted: `$${compsMedianRevenue.toLocaleString()}`,
      numericValue: compsMedianRevenue,
      formula: 'Median of estimated_revenue_l365d across all comps in the comp set.',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    revenue_diff_pct: {
      id: 'revenue_diff_pct',
      label: 'Revenue Estimate Cross-Check Difference',
      valueFormatted: `${revenueDiffPct > 0 ? '+' : ''}${revenueDiffPct}%`,
      numericValue: revenueDiffPct,
      formula: '((Estimated Annual Revenue - Comps Median Revenue) / Comps Median Revenue) × 100%.',
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    comp_count: {
      id: 'comp_count',
      label: 'Comp Sample Size',
      valueFormatted: `${comps.length} listings`,
      numericValue: comps.length,
      formula: `Total active listings meeting ${tierResult.tierLabel} filtering criteria.`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    superhost_pct: {
      id: 'superhost_pct',
      label: 'Superhost Share',
      valueFormatted: `${superhostPct}%`,
      numericValue: superhostPct,
      formula: `(Comps where host_is_superhost = "t" [${superhostCount}] / Total Comps [${comps.length}]) × 100%.`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    median_review_score: {
      id: 'median_review_score',
      label: 'Median Review Rating',
      valueFormatted: `${medianReviewRating ?? 'N/A'} / 5.0`,
      numericValue: medianReviewRating ?? 0,
      formula: 'Median of review_scores_rating among comps with reported guest reviews.',
      filters: [...commonFilters, `Review count with ratings: ${validRatings.length}`],
      n: validRatings.length,
      rows: comps.filter((c) => c.review_scores_rating !== null),
    },
    st_median_price: {
      id: 'st_median_price',
      label: 'Short-Term Median Nightly Price',
      valueFormatted: `$${stMedianPrice} / night`,
      numericValue: stMedianPrice,
      formula: 'Median price for minimum_nights < 30 comp set.',
      filters: [`Strategy = Short-term (<30)`, `Tier: ${stResult.tierLabel}`],
      n: stResult.comps.length,
      rows: stResult.comps,
    },
    st_occupancy: {
      id: 'st_occupancy',
      label: 'Short-Term Median Occupancy',
      valueFormatted: `${stMedianOcc} nights / yr`,
      numericValue: stMedianOcc,
      formula: 'Median estimated_occupancy_l365d for short-term comp set.',
      filters: [`Strategy = Short-term (<30)`],
      n: stResult.comps.length,
      rows: stResult.comps,
    },
    st_revenue: {
      id: 'st_revenue',
      label: 'Short-Term Annual Revenue Estimate',
      valueFormatted: `$${stEstRevenue.toLocaleString()}`,
      numericValue: stEstRevenue,
      formula: `Short-Term Median Price ($${stMedianPrice}) × Short-Term Median Occupancy (${stMedianOcc} nights).`,
      filters: [`Strategy = Short-term (<30)`],
      n: stResult.comps.length,
      rows: stResult.comps,
    },
    monthly_median_price: {
      id: 'monthly_median_price',
      label: 'Monthly Lease Median Nightly Rate',
      valueFormatted: `$${mMedianPrice} / night`,
      numericValue: mMedianPrice,
      formula: 'Median price for minimum_nights >= 30 comp set.',
      filters: [`Strategy = Monthly (>=30)`, `Tier: ${monthlyResult.tierLabel}`],
      n: monthlyResult.comps.length,
      rows: monthlyResult.comps,
    },
    monthly_occupancy: {
      id: 'monthly_occupancy',
      label: 'Monthly Median Occupancy',
      valueFormatted: `${mMedianOcc} nights / yr`,
      numericValue: mMedianOcc,
      formula: 'Median estimated_occupancy_l365d for monthly comp set.',
      filters: [`Strategy = Monthly (>=30)`],
      n: monthlyResult.comps.length,
      rows: monthlyResult.comps,
    },
    monthly_revenue: {
      id: 'monthly_revenue',
      label: 'Monthly Annual Revenue Estimate',
      valueFormatted: `$${mEstRevenue.toLocaleString()}`,
      numericValue: mEstRevenue,
      formula: `Monthly Median Price ($${mMedianPrice}) × Monthly Median Occupancy (${mMedianOcc} nights).`,
      filters: [`Strategy = Monthly (>=30)`],
      n: monthlyResult.comps.length,
      rows: monthlyResult.comps,
    },
    net_airbnb_income: {
      id: 'net_airbnb_income',
      label: 'Net Annual Airbnb Income',
      valueFormatted: `$${netAirbnbAnnual.toLocaleString()}`,
      numericValue: netAirbnbAnnual,
      formula: `Gross Revenue ($${grossAirbnbAnnual.toLocaleString()}) - Management Fee ($${managementFeeAnnual.toLocaleString()} at ${feePct}%) - Fixed Annual Operating Costs ($${fixedCostsAnnual.toLocaleString()}).`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    long_term_lease_annual: {
      id: 'long_term_lease_annual',
      label: 'Long-Term Lease 12-Month Total',
      valueFormatted: `$${longTermLeaseAnnual.toLocaleString()}`,
      numericValue: longTermLeaseAnnual,
      formula: `Monthly Rent ($${monthlyRent.toLocaleString()}) × 12 months.`,
      filters: [`User Input: Monthly Rent = $${monthlyRent}`],
      n: 1,
      rows: comps,
    },
    break_even_price: {
      id: 'break_even_price',
      label: 'Break-Even Nightly Rate',
      valueFormatted: breakEvenPrice !== null ? `$${breakEvenPrice} / night` : 'N/A',
      numericValue: breakEvenPrice ?? 0,
      formula: `(12 × Monthly Rent [$${longTermLeaseAnnual}] + 12 × Fixed Costs [$${fixedCostsAnnual}]) / (Median Occupancy [${medianOccupancy}] × (1 - Fee Rate [${feeMultiplier.toFixed(2)}])).`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
    net_income_diff: {
      id: 'net_income_diff',
      label: 'Net Income Difference (Airbnb vs Long-Term Lease)',
      valueFormatted: `${netDifference >= 0 ? '+' : ''}$${netDifference.toLocaleString()}`,
      numericValue: netDifference,
      formula: `Net Annual Airbnb Income ($${netAirbnbAnnual.toLocaleString()}) - 12 × Long-Term Monthly Rent ($${longTermLeaseAnnual.toLocaleString()}).`,
      filters: commonFilters,
      n: comps.length,
      rows: comps,
    },
  };

  // Compact JSON for Gemini AI Advisor (Numbers strictly supplied from computation)
  const compactAiJson: Record<string, number | string | boolean> = {
    neighbourhood: inputs.neighbourhood,
    bedrooms: inputs.bedrooms,
    unit_type: inputs.unitType,
    strategy: inputs.strategy === 'short_term' ? 'Short-term (<30 nights)' : 'Monthly (>=30 nights)',
    positioning: inputs.positioning,
    comp_count: comps.length,
    comp_tier: tierResult.tier,
    recommended_price: recommendedPrice,
    p25_price: p25Price,
    p50_price: p50Price,
    p75_price: p75Price,
    median_occupancy: medianOccupancy,
    est_annual_revenue: estAnnualRevenue,
    comps_median_revenue: compsMedianRevenue,
    revenue_diff_pct: revenueDiffPct,
    superhost_pct: superhostPct,
    median_review_score: medianReviewRating ?? 0,
    st_median_price: stMedianPrice,
    st_occupancy: stMedianOcc,
    st_revenue: stEstRevenue,
    monthly_median_price: mMedianPrice,
    monthly_occupancy: mMedianOcc,
    monthly_revenue: mEstRevenue,
    management_fee_pct: feePct,
    monthly_fixed_costs: fixedCosts,
    long_term_monthly_rent: monthlyRent,
    gross_airbnb_annual: grossAirbnbAnnual,
    net_airbnb_income: netAirbnbAnnual,
    long_term_lease_annual: longTermLeaseAnnual,
    net_income_diff: netDifference,
    break_even_price: breakEvenPrice ?? 0,
    has_owner_economics: hasEconomicsInputs,
  };

  return {
    cleaningStats,
    tierResult,
    p25Price,
    p50Price,
    p75Price,
    recommendedPrice,
    medianOccupancy,
    estAnnualRevenue,
    compsMedianRevenue,
    revenueDiffPct,
    strategyComparison: {
      shortTerm: {
        strategy: 'short_term',
        label: 'Short-Term (< 30 nights)',
        n: stResult.comps.length,
        medianPrice: stMedianPrice,
        medianOccupancy: stMedianOcc,
        estAnnualRevenue: stEstRevenue,
        compsMedianRevenue: stMedianRev,
        tier: stResult.tier,
        tierLabel: stResult.tierLabel,
        comps: stResult.comps,
      },
      monthly: {
        strategy: 'monthly',
        label: 'Monthly (>= 30 nights)',
        n: monthlyResult.comps.length,
        medianPrice: mMedianPrice,
        medianOccupancy: mMedianOcc,
        estAnnualRevenue: mEstRevenue,
        compsMedianRevenue: mMedianRev,
        tier: monthlyResult.tier,
        tierLabel: monthlyResult.tierLabel,
        comps: monthlyResult.comps,
      },
    },
    marketContext: {
      compCount: comps.length,
      superhostCount,
      superhostPct,
      medianReviewRating,
      reviewScoreCount: validRatings.length,
      licenseBreakdown,
    },
    ownerEconomics: {
      managementFeePct: feePct,
      monthlyFixedCosts: fixedCosts,
      longTermMonthlyRent: monthlyRent,
      grossAirbnbAnnual,
      managementFeeAnnual,
      fixedCostsAnnual,
      netAirbnbAnnual,
      longTermLeaseAnnual,
      netDifference,
      breakEvenPrice,
      hasInputs: hasEconomicsInputs,
    },
    priceHistogram,
    topNeighbourhoods,
    scatterComps,
    traces,
    compactAiJson,
  };
}
