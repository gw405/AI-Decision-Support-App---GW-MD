/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdvisorAnalysis } from '../lib/stats';
import { Traced } from './Traced';
import { Award, Star, FileText, CheckCircle, AlertCircle, Building } from 'lucide-react';

interface MarketContextCardProps {
  analysis: AdvisorAnalysis;
}

export const MarketContextCard: React.FC<MarketContextCardProps> = ({ analysis }) => {
  const { marketContext } = analysis;

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Market Context & Host Landscape
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-mono">
          Sample: <Traced traceId="comp_count">{marketContext.compCount}</Traced> comps
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Superhost Ratio */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Superhost Share</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 font-mono">
                <Traced traceId="superhost_pct">{marketContext.superhostPct.toFixed(1)}%</Traced>
              </span>
              <span className="text-xs text-stone-500">of active comps</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-stone-500">
            {marketContext.superhostCount} of {marketContext.compCount} active comps hold Airbnb
            Superhost status.
          </div>
        </div>

        {/* Median Review Score */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Median Review Rating</span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-stone-900 font-mono">
                <Traced traceId="median_review_score">
                  {marketContext.medianReviewRating ? marketContext.medianReviewRating.toFixed(2) : 'N/A'}
                </Traced>
              </span>
              <span className="text-xs text-stone-500">/ 5.0</span>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-stone-500">
            Based on {marketContext.reviewScoreCount} listings with active verified guest reviews.
          </div>
        </div>

        {/* License Status Breakdown */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5">
              <FileText className="w-4 h-4 text-stone-600" />
              <span>DC License Status Breakdown</span>
            </div>
            <div className="space-y-1.5 text-xs">
              {marketContext.licenseBreakdown.map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <span className="text-stone-700 text-[11px] flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.status.includes('Hosted')
                          ? 'bg-emerald-500'
                          : item.status.includes('Unhosted')
                          ? 'bg-blue-500'
                          : item.status.includes('Exempt')
                          ? 'bg-amber-500'
                          : 'bg-stone-300'
                      }`}
                    />
                    {item.status}
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-stone-900 font-semibold">{item.count}</span>
                    <span className="text-stone-400">({item.pct.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-stone-400 pt-2 border-t border-stone-200">
            License status as listed in Inside Airbnb data.
          </div>
        </div>
      </div>
    </div>
  );
};
