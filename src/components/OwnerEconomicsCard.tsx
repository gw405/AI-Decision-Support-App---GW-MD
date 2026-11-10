/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AdvisorAnalysis } from '../lib/stats';
import { Traced } from './Traced';
import { Wallet, ArrowRight, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

interface OwnerEconomicsCardProps {
  analysis: AdvisorAnalysis;
}

export const OwnerEconomicsCard: React.FC<OwnerEconomicsCardProps> = ({ analysis }) => {
  const { ownerEconomics } = analysis;
  const {
    hasInputs,
    managementFeePct,
    monthlyFixedCosts,
    longTermMonthlyRent,
    grossAirbnbAnnual,
    managementFeeAnnual,
    fixedCostsAnnual,
    netAirbnbAnnual,
    longTermLeaseAnnual,
    netDifference,
    breakEvenPrice,
  } = ownerEconomics;

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
            Owner Economics: Net Airbnb Return vs. Long-Term Lease
          </h3>
        </div>
        <span className="text-xs text-stone-500 font-medium">
          {hasInputs ? 'Custom Owner Assumptions Active' : 'Default / Blank Inputs'}
        </span>
      </div>

      {!hasInputs ? (
        <div className="p-6 text-center bg-stone-50/50">
          <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-stone-800">No Owner Cost Assumptions Entered</h4>
          <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
            Fill in the <strong>Owner Economics</strong> inputs in the left sidebar (Management Fee
            %, Monthly Fixed Costs, Long-Term Rent) or click <em>Load sample case</em> to evaluate net
            returns and lease break-even rates.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Side-by-side economics comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Net Airbnb Income Box */}
            <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Airbnb Net Annual Cash Flow
                </span>
                <span className="text-xs font-mono text-stone-500">
                  Fee: {managementFeePct}% | Costs: ${monthlyFixedCosts}/mo
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-950 font-mono">
                  $<Traced traceId="net_airbnb_income">{netAirbnbAnnual.toLocaleString()}</Traced>
                </span>
                <span className="text-xs text-stone-500">net / year</span>
              </div>

              {/* Waterfall breakdown */}
              <div className="text-xs text-stone-600 space-y-1 pt-2 border-t border-stone-200/80 font-mono">
                <div className="flex justify-between">
                  <span className="font-sans">Gross Airbnb Revenue:</span>
                  <span>$<Traced traceId="est_annual_revenue">{grossAirbnbAnnual.toLocaleString()}</Traced></span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span className="font-sans">Management Fee ({managementFeePct}%):</span>
                  <span>-${managementFeeAnnual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-700">
                  <span className="font-sans">Annual Fixed Costs (${monthlyFixedCosts} × 12):</span>
                  <span>-${fixedCostsAnnual.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Long-Term Lease Box */}
            <div className="p-5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Long-Term Lease Alternative
                </span>
                <span className="text-xs font-mono text-stone-500">
                  Rent: ${longTermMonthlyRent}/mo × 12
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-stone-800 font-mono">
                  $<Traced traceId="long_term_lease_annual">{longTermLeaseAnnual.toLocaleString()}</Traced>
                </span>
                <span className="text-xs text-stone-500">annual rent</span>
              </div>

              <div className="text-xs text-stone-600 pt-2 border-t border-stone-200/80 font-sans leading-relaxed">
                Represents conventional 12-month standard residential tenancy without short-term
                operational overhead, turnover cleaning, or vacancy risk.
              </div>
            </div>
          </div>

          {/* Bottom Summary Bar: Net Delta & Break-even */}
          <div className="p-4 bg-stone-900 text-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Net Annual Advantage
              </span>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-2xl font-bold font-mono ${
                    netDifference >= 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <Traced traceId="net_income_diff">
                    {netDifference >= 0
                      ? `+$${netDifference.toLocaleString()}`
                      : `-$${Math.abs(netDifference).toLocaleString()}`}
                  </Traced>
                </span>
                <span className="text-xs text-stone-300">
                  {netDifference >= 0
                    ? 'higher net income with Airbnb'
                    : 'lower than long-term lease guarantee'}
                </span>
              </div>
            </div>

            <div className="sm:border-l sm:border-stone-700 sm:pl-6 space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                Break-Even Nightly Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-300 font-mono">
                  $<Traced traceId="break_even_price">{breakEvenPrice ?? 0}</Traced>
                </span>
                <span className="text-xs text-stone-300">/ night to match lease</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
