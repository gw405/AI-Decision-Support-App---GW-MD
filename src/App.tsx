/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  Listing,
  AdvisorInputs,
  OwnerEconomicsInputs,
  cleanListings,
  calculateAdvisorAnalysis,
} from './lib/stats';
import { loadInitialDataset } from './lib/dataLoader';
import { TraceProvider, useTrace } from './context/TraceContext';
import { TracedDrawer } from './components/TracedDrawer';
import { InputPanel } from './components/InputPanel';
import { RecommendationCard } from './components/RecommendationCard';
import { StrategyCard } from './components/StrategyCard';
import { MarketContextCard } from './components/MarketContextCard';
import { OwnerEconomicsCard } from './components/OwnerEconomicsCard';
import { Visuals } from './components/Visuals';
import { AiAdvisor } from './components/AiAdvisor';
import { DataSourcesTab } from './components/DataSourcesTab';
import {
  Building,
  MapPin,
  FileText,
  BarChart2,
  Database,
  Compass,
  AlertCircle,
  Loader2,
} from 'lucide-react';

function AdvisorApp() {
  const { setTracesMap } = useTrace();

  const [rawListings, setRawListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'advisor' | 'map' | 'data'>('advisor');

  // Property Inputs
  const [inputs, setInputs] = useState<AdvisorInputs>({
    neighbourhood: 'Shaw, Logan Circle',
    bedrooms: 1,
    accommodates: null,
    unitType: 'Condo or apartment',
    strategy: 'short_term',
    positioning: 'market',
  });

  // Owner Economics Inputs (default blank per specification)
  const [ownerInputs, setOwnerInputs] = useState<OwnerEconomicsInputs>({
    managementFeePct: null,
    monthlyFixedCosts: null,
    longTermMonthlyRent: null,
  });

  // Load dataset on initial startup
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const data = await loadInitialDataset();
        setRawListings(data);
      } catch (err: any) {
        console.error('Initial data load error:', err);
        setLoadError(
          err.message || 'Failed to load initial Washington D.C. Inside Airbnb dataset.'
        );
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Cleaning Pipeline (Step 1)
  const { cleanedListings, cleaningStats } = useMemo(() => {
    if (rawListings.length === 0) {
      return {
        cleanedListings: [],
        cleaningStats: {
          rawCount: 0,
          p1CitywidePrice: 0,
          p99CitywidePrice: 0,
          afterPriceTrimCount: 0,
          afterActiveFilterCount: 0,
        },
      };
    }
    return cleanListings(rawListings);
  }, [rawListings]);

  // Unique neighbourhoods for dropdown
  const neighbourhoods = useMemo(() => {
    const set = new Set<string>();
    for (const l of rawListings) {
      if (l.neighbourhood_cleansed) {
        set.add(l.neighbourhood_cleansed);
      }
    }
    const list = Array.from(set).sort();
    return list;
  }, [rawListings]);

  // Ensure current inputs neighbourhood is valid
  useEffect(() => {
    if (neighbourhoods.length > 0 && !neighbourhoods.includes(inputs.neighbourhood)) {
      const match =
        neighbourhoods.find((n) => n.toLowerCase().includes('shaw')) || neighbourhoods[0];
      setInputs((prev) => ({ ...prev, neighbourhood: match }));
    }
  }, [neighbourhoods, inputs.neighbourhood]);

  // Advisor Analysis Computation
  const analysis = useMemo(() => {
    if (cleanedListings.length === 0) return null;
    return calculateAdvisorAnalysis(cleanedListings, cleaningStats, inputs, ownerInputs);
  }, [cleanedListings, cleaningStats, inputs, ownerInputs]);

  // Sync trace records to context so any Traced click can resolve
  useEffect(() => {
    if (analysis && analysis.traces) {
      setTracesMap(analysis.traces);
    }
  }, [analysis, setTracesMap]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-8 h-8 text-amber-700 animate-spin mb-3" />
        <h2 className="text-base font-bold text-stone-900">Loading DC Listing Advisor...</h2>
        <p className="text-xs text-stone-500 mt-1">
          Ingesting and cleaning 5,993 Washington, D.C. Airbnb listings
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-6 rounded-xl border border-red-200 shadow-sm">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <h2 className="text-base font-bold text-stone-900">Data Loading Error</h2>
          <p className="text-xs text-stone-600 mt-2">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-stone-900 text-white text-xs font-semibold rounded-lg"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 font-sans">
      {/* Global Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-stone-950 flex items-center justify-center text-amber-400 font-bold text-base shadow-xs">
              DC
            </div>
            <div>
              <h1 className="text-base font-bold text-stone-950 leading-tight">
                DC Listing Advisor
              </h1>
              <p className="text-[11px] text-stone-500">
                Washington D.C. Residential Advisory &middot; Pure Data Provenance
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('advisor')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'advisor'
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Advisor
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Market Map & Visuals
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'data'
                  ? 'bg-white text-stone-950 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Data & Sources
            </button>
          </nav>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'advisor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Inputs Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              <InputPanel
                inputs={inputs}
                setInputs={setInputs}
                ownerInputs={ownerInputs}
                setOwnerInputs={setOwnerInputs}
                neighbourhoods={neighbourhoods}
                compTierLabel={analysis.tierResult.tierLabel}
                compTierNumber={analysis.tierResult.tier}
                compCount={analysis.tierResult.comps.length}
              />
            </div>

            {/* Right Advisory Workspace (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Output 1 & 2: Recommended Nightly Rate & Revenue Model */}
              <RecommendationCard
                analysis={analysis}
                positioning={inputs.positioning}
              />

              {/* Output 3: Strategy Comparison Card */}
              <StrategyCard
                analysis={analysis}
                currentStrategy={inputs.strategy}
                onSelectStrategy={(strat) =>
                  setInputs((prev) => ({ ...prev, strategy: strat }))
                }
              />

              {/* Output 4: Market Context */}
              <MarketContextCard analysis={analysis} />

              {/* Output 5: Owner Economics */}
              <OwnerEconomicsCard analysis={analysis} />

              {/* AI Advisor Memo Section */}
              <AiAdvisor analysis={analysis} inputs={inputs} />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-6">
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-800">
                <MapPin className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Showing active comp cohort for{' '}
                  <strong className="text-stone-950 font-semibold">{inputs.neighbourhood}</strong>{' '}
                  ({inputs.bedrooms} Bed, {inputs.unitType},{' '}
                  {inputs.strategy === 'short_term' ? 'Short-term' : 'Monthly'}).
                </span>
              </div>
              <span className="font-mono bg-white px-2 py-1 rounded text-stone-700 border border-stone-200 shrink-0">
                Tier {analysis.tierResult.tier} &middot; n = {analysis.tierResult.comps.length} comps
              </span>
            </div>

            <Visuals
              analysis={analysis}
              subjectNeighbourhood={inputs.neighbourhood}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <DataSourcesTab
            cleaningStats={cleaningStats}
            currentCompCount={analysis.tierResult.comps.length}
            totalListingsCount={rawListings.length}
            onReplaceDataset={(newListings) => setRawListings(newListings)}
          />
        )}
      </main>

      {/* Global Slide-Over Data Provenance Drawer */}
      <TracedDrawer />

      {/* Global Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Data: Inside Airbnb (CC BY 4.0) &middot; Washington, D.C. snapshot 19 September 2026.
          </p>
          <p className="text-stone-400">
            Hard Rule: Every single number is computed strictly in code from verified listings.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TraceProvider>
      <AdvisorApp />
    </TraceProvider>
  );
}
