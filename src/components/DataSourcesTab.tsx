/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { CleaningStats, Listing } from '../lib/stats';
import { parseCsvString, validateCsvHeaders, REQUIRED_COLUMNS } from '../lib/dataLoader';
import {
  Database,
  ExternalLink,
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface DataSourcesTabProps {
  cleaningStats: CleaningStats;
  currentCompCount: number;
  totalListingsCount: number;
  onReplaceDataset: (newListings: Listing[]) => void;
}

export const DataSourcesTab: React.FC<DataSourcesTabProps> = ({
  cleaningStats,
  currentCompCount,
  totalListingsCount,
  onReplaceDataset,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploadSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          throw new Error('File is empty.');
        }

        const lines = text.split('\n');
        const headerLine = lines[0] || '';
        const headers = headerLine.split(',').map((h) => h.replace(/["\r]/g, '').trim());

        const validation = validateCsvHeaders(headers);
        if (!validation.valid) {
          throw new Error(
            `Uploaded CSV is missing required columns: ${validation.missing.join(', ')}`
          );
        }

        const parsed = parseCsvString(text);
        if (parsed.length === 0) {
          throw new Error('No valid listings could be parsed from the uploaded CSV.');
        }

        onReplaceDataset(parsed);
        setUploadSuccess(
          `Successfully loaded ${parsed.length.toLocaleString()} listings from ${file.name}!`
        );
      } catch (err: any) {
        console.error('Snapshot upload error:', err);
        setUploadError(err.message || 'Failed to parse uploaded CSV.');
      }
    };

    reader.readAsText(file);
    // Reset file input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Attribution & Provenance Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <Database className="w-4 h-4" />
              <span>Primary Data Citation & Attribution</span>
            </div>
            <h2 className="text-xl font-bold text-stone-900 mt-1">
              Inside Airbnb — Washington, D.C. Detailed Listings
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
              <span>
                Snapshot Date: <strong className="text-stone-900">19 September 2026</strong>
              </span>
              <span className="text-stone-300">•</span>
              <span>
                License:{' '}
                <a
                  href="https://creativecommons.org/licenses/by/4.0/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 underline font-medium hover:text-amber-950 inline-flex items-center gap-0.5"
                >
                  Creative Commons Attribution 4.0 International (CC BY 4.0)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
              <span className="text-stone-300">•</span>
              <span>
                Source URL:{' '}
                <a
                  href="https://insideairbnb.com/get-the-data/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-800 underline font-medium hover:text-amber-950 inline-flex items-center gap-0.5"
                >
                  insideairbnb.com/get-the-data
                  <ExternalLink className="w-3 h-3" />
                </a>
              </span>
            </div>
          </div>

          {/* Upload newer snapshot button */}
          <div className="shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload newer snapshot</span>
            </button>
          </div>
        </div>

        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Pre-Processing Pipeline Specification */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Pre-Processing & Data Sanitization (Documented Audit Trail)</span>
        </div>
        <h3 className="text-base font-bold text-stone-900 mb-3">
          Reproducible Pipeline Transformation Steps
        </h3>

        {/* Required prompt exact wording */}
        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 leading-relaxed font-sans mb-4">
          <p className="font-medium text-stone-950 mb-1">Raw Dataset Ingestion Standards:</p>
          <p className="italic text-stone-700">
            &ldquo;Kept 16 of 90 columns; removed all host identity columns, listing
            name/description/URLs and photos for privacy; converted price text to numbers; replaced
            license numbers with a license_status category; rounded coordinates to 4 decimals;
            removed 913 rows with no price (6,906 → 5,993).&rdquo;
          </p>
        </div>

        {/* Schema breakdown */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
            Retained Columns Schema ({REQUIRED_COLUMNS.length} fields):
          </span>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {REQUIRED_COLUMNS.map((col) => (
              <span
                key={col}
                className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded border border-stone-200 font-medium"
              >
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Live In-App Filter Pipeline with Row Counts */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-2">
          <Filter className="w-4 h-4" />
          <span>Live In-App Filter Pipeline (Current State)</span>
        </div>
        <h3 className="text-base font-bold text-stone-900 mb-4">
          Listing Counts Remaining After Each Step
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Step 1: Raw Ingestion
            </span>
            <div className="mt-2 text-2xl font-extrabold text-stone-950 font-mono">
              {cleaningStats.rawCount.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Valid rows loaded from clean Inside Airbnb CSV
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Step 2: P1–P99 Trim
            </span>
            <div className="mt-2 text-2xl font-extrabold text-stone-950 font-mono">
              {cleaningStats.afterPriceTrimCount.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Kept prices between ${cleaningStats.p1CitywidePrice.toFixed(0)} and $
              {cleaningStats.p99CitywidePrice.toFixed(0)}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              Step 3: Active Listings
            </span>
            <div className="mt-2 text-2xl font-extrabold text-emerald-900 font-mono">
              {cleaningStats.afterActiveFilterCount.toLocaleString()}
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Filtered for active hosts with reviews in last 12 months (&ge; 1 review LTM)
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-300">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              Step 4: Comp Cohort
            </span>
            <div className="mt-2 text-2xl font-extrabold text-amber-950 font-mono">
              {currentCompCount.toLocaleString()}
            </div>
            <p className="text-xs text-amber-900/80 mt-1">
              Exact matching comps used for current property calculation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
