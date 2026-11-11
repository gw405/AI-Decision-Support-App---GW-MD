/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdvisorAnalysis } from '../lib/stats';
import { Traced } from './Traced';
import { DollarSign, TrendingUp, Calendar, Info, ShieldCheck } from 'lucide-react';

interface RecommendationCardProps {
  analysis: AdvisorAnalysis;
  positioning: string;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  analysis,
  positioning,
}) => {
  const {
    recommendedPrice,
    p25Price,
    p50Price,
    p75Price,
    medianOccupancy,
    estAnnualRevenue,
    compsMedianRevenue,
    revenueDiffPct,
  } = analysis;

  const positioningLabel =
    positioning === 'budget'
      ? 'Budget (25th Percentile)'
      : positioning === 'premium'
      ? 'Premium (75th Percentile)'
      : 'Market (50th Percentile Median)';

  const formatPrice = (v: number) =>
    v % 1 === 0 ? v.toFixed(0) : v.toFixed(2);
  const formatOcc = (v: number) =>
    v % 1 === 0 ? v.toFixed(0) : v.toFixed(1);

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Top Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-stone-900 to-stone-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
            Advisory Recommendation
          </span>
          <h2 className="text-lg font-bold text-white">Target Nightly Pricing & Revenue Model</h2>
        </div>
        <div className="text-xs text-stone-300 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700/60 font-medium">
          Strategy Tier: <span className="text-amber-300 font-semibold">{positioningLabel}</span>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-stone-100">
        {/* Recommended Nightly Price */}
        <div className="flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-amber-700" />
              <span>Recommended Nightly Rate</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-stone-950 font-mono tracking-tight">
                $<Traced traceId="recommended_price">{formatPrice(recommendedPrice)}</Traced>
              </span>
              <span className="text-xs text-stone-500 font-medium">/ night</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">Before taxes and guest cleaning fees</p>
          </div>

          <div className="pt-3 border-t border-stone-100">
            <span className="text-[11px] text-stone-500 block mb-1 font-medium">
              Comp Range (P25 – P75):
            </span>
            <div className="flex items-center gap-1.5 text-xs text-stone-800 font-mono font-medium">
              <span>
                $<Traced traceId="p25_price">{formatPrice(p25Price)}</Traced> (P25)
              </span>
              <span className="text-stone-300">—</span>
              <span className="text-stone-500 font-sans">
                Median $<Traced traceId="p50_price">{formatPrice(p50Price)}</Traced>
              </span>
              <span className="text-stone-300">—</span>
              <span>
                $<Traced traceId="p75_price">{formatPrice(p75Price)}</Traced> (P75)
              </span>
            </div>
          </div>
        </div>

        {/* Estimated Annual Revenue */}
        <div className="flex flex-col justify-between space-y-3 md:pl-6 pt-4 md:pt-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Annual Revenue Projection</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-emerald-950 font-mono tracking-tight">
                $<Traced traceId="est_annual_revenue">{Math.round(estAnnualRevenue).toLocaleString()}</Traced>
              </span>
              <span className="text-xs text-stone-500 font-medium">/ year</span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Based on{' '}
              <strong className="text-stone-800 font-mono">
                <Traced traceId="median_occupancy">{formatOcc(medianOccupancy)}</Traced>
              </strong>{' '}
              projected booked nights/yr
            </p>
          </div>

          <div className="pt-3 border-t border-stone-100 text-xs">
            <span className="text-[11px] text-stone-500 block font-medium">Formula:</span>
            <span className="text-stone-700 font-mono text-[11px]">
              $<Traced traceId="recommended_price">{formatPrice(recommendedPrice)}</Traced> ×{' '}
              <Traced traceId="median_occupancy">{formatOcc(medianOccupancy)}</Traced> nights
            </span>
          </div>
        </div>

        {/* Comps Median Cross-Check */}
        <div className="flex flex-col justify-between space-y-3 md:pl-6 pt-4 md:pt-0">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-blue-700" />
              <span>Historical Comps Cross-Check</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-stone-800 font-mono tracking-tight">
                $<Traced traceId="comps_median_revenue">{Math.round(compsMedianRevenue).toLocaleString()}</Traced>
              </span>
              <span className="text-xs text-stone-500 font-medium">median/yr</span>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`text-xs font-semibold font-mono px-2 py-0.5 rounded ${
                  revenueDiffPct >= 0
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-amber-50 text-amber-800'
                }`}
              >
                <Traced traceId="revenue_diff_pct">
                  {revenueDiffPct >= 0 ? `+${revenueDiffPct.toFixed(1)}%` : `${revenueDiffPct.toFixed(1)}%`}
                </Traced>
              </span>
              <span className="text-[11px] text-stone-500">vs. Inside Airbnb estimated revenue</span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 leading-snug">
            Median of Inside Airbnb’s 365-day trailing estimated revenues across all comps in this
            neighbourhood cohort.
          </div>
        </div>
      </div>
    </div>
  );
};
