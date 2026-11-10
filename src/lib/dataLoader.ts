/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import { Listing } from './stats';

export const REQUIRED_COLUMNS = [
  'id',
  'neighbourhood_cleansed',
  'latitude',
  'longitude',
  'property_type',
  'room_type',
  'accommodates',
  'bedrooms',
  'price',
  'minimum_nights',
  'number_of_reviews_ltm',
  'review_scores_rating',
  'estimated_occupancy_l365d',
  'estimated_revenue_l365d',
  'host_is_superhost',
  'license_status',
];

export function parseListingRow(row: Record<string, any>): Listing | null {
  const id = String(row.id || '').trim();
  const neighbourhood = String(row.neighbourhood_cleansed || '').trim();
  if (!id || !neighbourhood) return null;

  const lat = parseFloat(row.latitude);
  const lon = parseFloat(row.longitude);

  let rawPrice = row.price;
  if (typeof rawPrice === 'string') {
    rawPrice = rawPrice.replace(/[$,]/g, '').trim();
  }
  const price = parseFloat(rawPrice);
  if (isNaN(price)) return null;

  const bedrooms = parseFloat(row.bedrooms);
  const accommodates = parseFloat(row.accommodates);
  const minimum_nights = parseFloat(row.minimum_nights);
  const number_of_reviews_ltm = parseFloat(row.number_of_reviews_ltm);
  const estimated_occupancy = parseFloat(row.estimated_occupancy_l365d);
  const estimated_revenue = parseFloat(row.estimated_revenue_l365d);

  let rating: number | null = null;
  if (
    row.review_scores_rating !== undefined &&
    row.review_scores_rating !== null &&
    String(row.review_scores_rating).trim() !== ''
  ) {
    const parsedRating = parseFloat(row.review_scores_rating);
    if (!isNaN(parsedRating)) {
      rating = parsedRating;
    }
  }

  return {
    id,
    neighbourhood_cleansed: neighbourhood,
    latitude: isNaN(lat) ? 38.9072 : lat,
    longitude: isNaN(lon) ? -77.0369 : lon,
    property_type: String(row.property_type || '').trim(),
    room_type: String(row.room_type || '').trim(),
    accommodates: isNaN(accommodates) ? 2 : accommodates,
    bedrooms: isNaN(bedrooms) ? 1 : Math.round(bedrooms),
    price,
    minimum_nights: isNaN(minimum_nights) ? 1 : minimum_nights,
    number_of_reviews_ltm: isNaN(number_of_reviews_ltm) ? 0 : number_of_reviews_ltm,
    review_scores_rating: rating,
    estimated_occupancy_l365d: isNaN(estimated_occupancy) ? 0 : estimated_occupancy,
    estimated_revenue_l365d: isNaN(estimated_revenue) ? 0 : estimated_revenue,
    host_is_superhost: String(row.host_is_superhost || 'f').trim().toLowerCase(),
    license_status: String(row.license_status || 'Blank').trim() || 'Blank',
  };
}

export async function loadInitialDataset(): Promise<Listing[]> {
  // Primary path in public folder
  const response = await fetch('/data/dc_listings_clean.csv');
  if (!response.ok) {
    // Fallback try asset folder if needed
    const fallbackResponse = await fetch('/assets/aistudio/dc_listings_clean_60b32865.csv');
    if (!fallbackResponse.ok) {
      throw new Error(`Failed to load dataset: ${response.statusText}`);
    }
    const csvText = await fallbackResponse.text();
    return parseCsvString(csvText);
  }
  const csvText = await response.text();
  return parseCsvString(csvText);
}

export function parseCsvString(csvText: string): Listing[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (result.errors && result.errors.length > 0) {
    console.warn('CSV parsing warnings:', result.errors);
  }

  const listings: Listing[] = [];
  for (const row of result.data as Record<string, any>[]) {
    const item = parseListingRow(row);
    if (item) {
      listings.push(item);
    }
  }

  return listings;
}

export function validateCsvHeaders(headerRow: string[]): {
  valid: boolean;
  missing: string[];
} {
  const normalized = new Set(headerRow.map((h) => h.trim()));
  const missing = REQUIRED_COLUMNS.filter((col) => !normalized.has(col));
  return {
    valid: missing.length === 0,
    missing,
  };
}
