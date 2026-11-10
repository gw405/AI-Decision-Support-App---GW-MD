/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdvisorAnalysis } from '../lib/stats';
import { Traced } from './Traced';
import { Scale, Calendar, DollarSign, BedDouble, Check } from 'lucide-react';

interface StrategyCardProps {
  analysis: AdvisorAnalysis;
  currentStrategy: string;
  onSelectStrategy: (strat: 'short_term' | 'monthly') => void;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  analysis,
  currentStrategy,
  onSelectStrategy,
}) => {
  const { shortTerm, monthly } = analysis.strategyComparison;

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Strategy Comparison: Short-Term vs. Monthly Lease
          </h3>
        </div>
        <span className="text-xs text-stone-500 hidden sm:inline">
          Same cohort specifications evaluated under DC regulations
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Short Term Column */}
        <div
          className={`rounded-xl border p-5 relative transition-all ${
            currentStrategy === 'short_term'
              ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
          }`}
        >
          {currentStrategy === 'short_term' && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Active Strategy
            </span>
          )}

          <div className="mb-4">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Vacation & Transient
            </span>
            <h4 className="text-base font-bold text-stone-900">Short-Term (&lt; 30 Nights)</h4>
            <div className="text-xs text-stone-500 mt-0.5">
              Comp cohort size: <strong className="font-mono text-stone-900">{shortTerm.n}</strong>{' '}
              active listings ({shortTerm.tierLabel})
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200">
              <span className="text-stone-600 font-sans">Median Nightly Price:</span>
              <span className="font-bold text-stone-950 text-sm">
                $<Traced traceId="st_median_price">{shortTerm.medianPrice}</Traced> / nt
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200">
              <span className="text-stone-600 font-sans">Median Booked Nights/Yr:</span>
              <span className="font-bold text-stone-950 text-sm">
                <Traced traceId="st_occupancy">{shortTerm.medianOccupancy}</Traced> nights
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-amber-100/60 rounded-lg border border-amber-300/80">
              <span className="text-amber-950 font-sans font-semibold">Annual Revenue Projection:</span>
              <span className="font-extrabold text-amber-950 text-base">
                $<Traced traceId="st_revenue">{shortTerm.estAnnualRevenue.toLocaleString()}</Traced>
              </span>
            </div>
          </div>

          {currentStrategy !== 'short_term' && (
            <button
              onClick={() => onSelectStrategy('short_term')}
              className="mt-4 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Apply Short-Term Strategy
            </button>
          )}
        </div>

        {/* Monthly Column */}
        <div
          className={`rounded-xl border p-5 relative transition-all ${
            currentStrategy === 'monthly'
              ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/30'
              : 'bg-stone-50/70 border-stone-200 hover:border-stone-300'
          }`}
        >
          {currentStrategy === 'monthly' && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2.5 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Active Strategy
            </span>
          )}

          <div className="mb-4">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Mid-Term & Corporate
            </span>
            <h4 className="text-base font-bold text-stone-900">Monthly (&ge; 30 Nights)</h4>
            <div className="text-xs text-stone-500 mt-0.5">
              Comp cohort size: <strong className="font-mono text-stone-900">{monthly.n}</strong>{' '}
              active listings ({monthly.tierLabel})
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200">
              <span className="text-stone-600 font-sans">Median Nightly Price:</span>
              <span className="font-bold text-stone-950 text-sm">
                $<Traced traceId="monthly_median_price">{monthly.medianPrice}</Traced> / nt
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200">
              <span className="text-stone-600 font-sans">Median Booked Nights/Yr:</span>
              <span className="font-bold text-stone-950 text-sm">
                <Traced traceId="monthly_occupancy">{monthly.medianOccupancy}</Traced> nights
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-amber-100/60 rounded-lg border border-amber-300/80">
              <span className="text-amber-950 font-sans font-semibold">Annual Revenue Projection:</span>
              <span className="font-extrabold text-amber-950 text-base">
                $<Traced traceId="monthly_revenue">{monthly.estAnnualRevenue.toLocaleString()}</Traced>
              </span>
            </div>
          </div>

          {currentStrategy !== 'monthly' && (
            <button
              onClick={() => onSelectStrategy('monthly')}
              className="mt-4 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Apply Monthly Strategy
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
