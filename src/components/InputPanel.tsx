/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  AdvisorInputs,
  OwnerEconomicsInputs,
  RentalStrategy,
  UnitTypeFilter,
  Positioning,
} from '../lib/stats';
import {
  Building2,
  Home,
  Sliders,
  DollarSign,
  Briefcase,
  Sparkles,
  Layers,
  MapPin,
  CalendarDays,
  Percent,
} from 'lucide-react';

interface InputPanelProps {
  inputs: AdvisorInputs;
  setInputs: React.Dispatch<React.SetStateAction<AdvisorInputs>>;
  ownerInputs: OwnerEconomicsInputs;
  setOwnerInputs: React.Dispatch<React.SetStateAction<OwnerEconomicsInputs>>;
  neighbourhoods: string[];
  compTierLabel: string;
  compTierNumber: number;
  compCount: number;
}

export const InputPanel: React.FC<InputPanelProps> = ({
  inputs,
  setInputs,
  ownerInputs,
  setOwnerInputs,
  neighbourhoods,
  compTierLabel,
  compTierNumber,
  compCount,
}) => {
  const handleLoadSample = () => {
    // Prompt specification: "Shaw, Logan Circle", 1 bedroom, Condo or apartment, Short-term, Market.
    const targetNeighbourhood =
      neighbourhoods.find((n) => n.toLowerCase().includes('shaw') || n.toLowerCase().includes('logan')) ||
      'Shaw, Logan Circle';

    setInputs({
      neighbourhood: targetNeighbourhood,
      bedrooms: 1,
      accommodates: 2,
      unitType: 'Condo or apartment',
      strategy: 'short_term',
      positioning: 'market',
    });

    setOwnerInputs({
      managementFeePct: 15,
      monthlyFixedCosts: 250,
      longTermMonthlyRent: 2400,
    });
  };

  const tierBadgeColor =
    compTierNumber === 1
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : compTierNumber === 2
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : compTierNumber === 3
      ? 'bg-orange-50 text-orange-800 border-orange-200'
      : 'bg-red-50 text-red-800 border-red-200';

  return (
    <aside className="bg-white border border-stone-200 rounded-xl shadow-xs divide-y divide-stone-100 flex flex-col">
      {/* Header & Sample Case Action */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-700" />
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Property Parameters</h2>
          </div>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100/70 hover:bg-amber-200/70 rounded-md transition-colors border border-amber-200/80 cursor-pointer"
            title="Load: Shaw, Logan Circle | 1 Bed | Condo | Short-term | Market"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Load sample case</span>
          </button>
        </div>

        {/* Comp Set Tier Status Badge */}
        <div
          className={`px-3 py-2 rounded-lg border text-xs flex items-center justify-between font-medium ${tierBadgeColor}`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">{compTierLabel}</span>
          </div>
          <span className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-[11px] font-bold">
            n = {compCount}
          </span>
        </div>
      </div>

      {/* Property Core Inputs */}
      <div className="p-4 sm:p-5 space-y-4">
        {/* Neighbourhood */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-stone-500" />
            <span>Neighbourhood</span>
          </label>
          <select
            value={inputs.neighbourhood}
            onChange={(e) => setInputs((prev) => ({ ...prev, neighbourhood: e.target.value }))}
            className="w-full text-xs py-2 px-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
          >
            {neighbourhoods.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Bedrooms & Accommodates Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">Bedrooms</label>
            <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50 overflow-hidden">
              <button
                type="button"
                disabled={inputs.bedrooms <= 0}
                onClick={() =>
                  setInputs((prev) => ({ ...prev, bedrooms: Math.max(0, prev.bedrooms - 1) }))
                }
                className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 disabled:opacity-30 text-xs font-bold"
              >
                -
              </button>
              <input
                type="number"
                min="0"
                max="10"
                value={inputs.bedrooms}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setInputs((prev) => ({
                    ...prev,
                    bedrooms: isNaN(val) ? 0 : Math.max(0, val),
                  }));
                }}
                className="w-full text-center text-xs font-semibold py-1.5 bg-transparent focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setInputs((prev) => ({ ...prev, bedrooms: prev.bedrooms + 1 }))}
                className="px-2.5 py-1.5 text-stone-600 hover:bg-stone-200 text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Accommodates <span className="font-normal text-stone-400">(opt)</span>
            </label>
            <input
              type="number"
              min="1"
              max="20"
              placeholder="Any"
              value={inputs.accommodates ?? ''}
              onChange={(e) => {
                const val = e.target.value ? parseInt(e.target.value, 10) : null;
                setInputs((prev) => ({ ...prev, accommodates: val }));
              }}
              className="w-full text-xs py-1.5 px-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 focus:bg-white focus:border-amber-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Unit Type */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-stone-500" />
            <span>Unit Type</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {(
              [
                { id: 'Any', label: 'Any Type' },
                { id: 'Condo or apartment', label: 'Condo / Apt' },
                { id: 'House or townhouse', label: 'House / Town' },
              ] as { id: UnitTypeFilter; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setInputs((prev) => ({ ...prev, unitType: t.id }))}
                className={`py-2 px-2 text-center rounded-lg border font-medium transition-all ${
                  inputs.unitType === t.id
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rental Strategy */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-stone-500" />
            <span>Rental Strategy</span>
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setInputs((prev) => ({ ...prev, strategy: 'short_term' }))}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                inputs.strategy === 'short_term'
                  ? 'bg-amber-50/90 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Short-Term</span>
                <span className="text-[10px] font-mono text-stone-500">&lt; 30 nights</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Nightly vacation rentals</p>
            </button>

            <button
              type="button"
              onClick={() => setInputs((prev) => ({ ...prev, strategy: 'monthly' }))}
              className={`p-2.5 rounded-lg border text-left transition-all ${
                inputs.strategy === 'monthly'
                  ? 'bg-amber-50/90 border-amber-500 text-amber-950 ring-1 ring-amber-500'
                  : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="font-semibold text-xs flex items-center justify-between">
                <span>Monthly</span>
                <span className="text-[10px] font-mono text-stone-500">&ge; 30 nights</span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">Mid-term corporate stays</p>
            </button>
          </div>
        </div>

        {/* Pricing Positioning */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-stone-500" />
            <span>Target Positioning</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {(
              [
                { id: 'budget', label: 'Budget (P25)', desc: 'Higher occupancy' },
                { id: 'market', label: 'Market (P50)', desc: 'Balanced median' },
                { id: 'premium', label: 'Premium (P75)', desc: 'Luxury finish' },
              ] as { id: Positioning; label: string; desc: string }[]
            ).map((pos) => (
              <button
                key={pos.id}
                type="button"
                onClick={() => setInputs((prev) => ({ ...prev, positioning: pos.id }))}
                className={`py-2 px-1 text-center rounded-lg border transition-all ${
                  inputs.positioning === pos.id
                    ? 'bg-amber-800 text-white border-amber-800 font-semibold shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 font-medium'
                }`}
              >
                <div className="text-[11px] font-semibold">{pos.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Owner Economics Inputs */}
      <div className="p-4 sm:p-5 space-y-3.5 bg-stone-50/70">
        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 uppercase tracking-wider">
          <Briefcase className="w-3.5 h-3.5 text-stone-600" />
          <span>Owner Economics (Firm Inputs)</span>
        </div>
        <p className="text-[11px] text-stone-500 leading-tight">
          Enter homeowner baseline costs to calculate net income and lease break-even.
        </p>

        <div className="space-y-2.5">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1 flex items-center justify-between">
              <span>Management Fee (%)</span>
              <span className="text-[10px] text-stone-400">Firm commission</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                placeholder="e.g. 15"
                value={ownerInputs.managementFeePct ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setOwnerInputs((prev) => ({ ...prev, managementFeePct: val }));
                }}
                className="w-full text-xs py-1.5 pl-2.5 pr-7 bg-white border border-stone-300 rounded-lg text-stone-900 focus:border-amber-600 focus:outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                %
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1 flex items-center justify-between">
              <span>Monthly Fixed Costs ($/mo)</span>
              <span className="text-[10px] text-stone-400">Utilities, wifi, supplies</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                $
              </span>
              <input
                type="number"
                min="0"
                step="25"
                placeholder="e.g. 250"
                value={ownerInputs.monthlyFixedCosts ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setOwnerInputs((prev) => ({ ...prev, monthlyFixedCosts: val }));
                }}
                className="w-full text-xs py-1.5 pl-6 pr-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1 flex items-center justify-between">
              <span>Long-Term Monthly Rent ($/mo)</span>
              <span className="text-[10px] text-stone-400">Alternative lease</span>
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs">
                $
              </span>
              <input
                type="number"
                min="0"
                step="50"
                placeholder="e.g. 2400"
                value={ownerInputs.longTermMonthlyRent ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseFloat(e.target.value) : null;
                  setOwnerInputs((prev) => ({ ...prev, longTermMonthlyRent: val }));
                }}
                className="w-full text-xs py-1.5 pl-6 pr-2.5 bg-white border border-stone-300 rounded-lg text-stone-900 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
