/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AdvisorAnalysis, Listing } from '../lib/stats';
import { useTrace } from '../context/TraceContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  CartesianGrid,
  Cell,
} from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, BarChart3, TrendingUp, Layers, Compass } from 'lucide-react';

interface VisualsProps {
  analysis: AdvisorAnalysis;
  subjectNeighbourhood: string;
}

export const Visuals: React.FC<VisualsProps> = ({ analysis, subjectNeighbourhood }) => {
  const { openTrace } = useTrace();
  const {
    tierResult,
    p25Price,
    p50Price,
    p75Price,
    recommendedPrice,
    priceHistogram,
    topNeighbourhoods,
    scatterComps,
  } = analysis;
  const comps = tierResult.comps;

  // Center coordinate for DC map
  const defaultCenter: [number, number] = [38.9072, -77.0369];

  // Helper color logic for price tiers
  const getMarkerColor = (price: number) => {
    if (price < p25Price) return '#10b981'; // emerald
    if (price <= p75Price) return '#f59e0b'; // amber
    return '#8b5cf6'; // purple
  };

  return (
    <div className="space-y-6">
      {/* Visuals Row 1: Price Histogram & Price vs Rating Scatter */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histogram of Comp Prices */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <BarChart3 className="w-4 h-4" />
              <span>Comp Price Frequency Distribution</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Nightly Price Distribution ($/night)
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Sample: Active Comp Set (n = {comps.length} listings)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priceHistogram}
                margin={{ top: 20, right: 20, left: 0, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="rangeLabel"
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  label={{
                    value: 'Nightly Price Range ($ USD)',
                    position: 'insideBottom',
                    offset: -15,
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  label={{
                    value: 'Active Listings (Count)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-mono">
                          <p className="font-semibold text-amber-300 font-sans">{data.rangeLabel}</p>
                          <p className="mt-1">
                            Listings:{' '}
                            <strong className="text-white font-bold">{data.count}</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#d6d3d1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Reference benchmark legend */}
          <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-[11px] font-mono text-stone-600 gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>P25 Budget: ${p25Price}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-700" />
              <span>Median P50: ${p50Price}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>P75 Premium: ${p75Price}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-100 px-2 py-0.5 rounded font-bold text-amber-900">
              <span>Target: ${recommendedPrice}</span>
            </div>
          </div>
        </div>

        {/* Scatter: Price vs Review Score */}
        <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <TrendingUp className="w-4 h-4" />
              <span>Correlation Analysis</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Price vs. Review Rating Score
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Comps with verified ratings (n = {scatterComps.length} listings)
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  dataKey="rating"
                  name="Rating"
                  domain={[4.0, 5.0]}
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  label={{
                    value: 'Review Score (Stars, 0 - 5.0)',
                    position: 'insideBottom',
                    offset: -15,
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="price"
                  name="Price"
                  tick={{ fontSize: 10, fill: '#78716c' }}
                  label={{
                    value: 'Nightly Price ($ USD)',
                    angle: -90,
                    position: 'insideLeft',
                    fontSize: 11,
                    fill: '#78716c',
                  }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-mono">
                          <p className="font-semibold text-amber-300 font-sans">
                            {data.propertyType}
                          </p>
                          <p className="mt-1">Listing #{data.id}</p>
                          <p>Price: ${data.price.toFixed(0)} / nt</p>
                          <p>Rating: {data.rating.toFixed(2)} ★</p>
                          <p>Est. Occupancy: {data.occupancy} nights/yr</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Comps" data={scatterComps} fill="#b45309" opacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center justify-between">
            <span>Higher ratings generally correlate with rate resilience above $200/night.</span>
          </div>
        </div>
      </div>

      {/* Visuals Row 2: Top 15 DC Neighbourhoods Bar Chart */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <Compass className="w-4 h-4" />
              <span>Citywide Submarket Comparison</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Top 15 DC Neighbourhoods: Median Nightly Rate ($/nt)
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Standardized Benchmark: 1-Bedroom Entire Home/Apt Short-Term Comps (Ranked by Density)
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-600 inline-block" />
              <span className="font-semibold text-stone-800">Subject ({subjectNeighbourhood})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-stone-300 inline-block" />
              <span className="text-stone-500">Other Top Submarkets</span>
            </div>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={topNeighbourhoods}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 130, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#78716c' }}
                label={{
                  value: 'Median Nightly Price ($ USD)',
                  position: 'insideBottom',
                  offset: -15,
                  fontSize: 11,
                  fill: '#78716c',
                }}
              />
              <YAxis
                type="category"
                dataKey="neighbourhood"
                tick={{ fontSize: 11, fill: '#44403c' }}
                width={125}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-stone-900 text-white p-2.5 rounded-lg text-xs shadow-lg font-mono">
                        <p className="font-semibold text-amber-300 font-sans">
                          {data.neighbourhood}
                        </p>
                        <p className="mt-1">Median Price: ${data.medianPrice} / nt</p>
                        <p>Listing Volume: {data.listingCount} active listings</p>
                        {data.isSubject && (
                          <p className="text-amber-400 font-bold mt-0.5">★ Subject Neighbourhood</p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="medianPrice" radius={[0, 4, 4, 0]}>
                {topNeighbourhoods.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isSubject ? '#b45309' : '#d6d3d1'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Visuals Row 3: Interactive Leaflet Map of Comps */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <MapPin className="w-4 h-4" />
              <span>Spatial Comp Mapping</span>
            </div>
            <h3 className="text-base font-bold text-stone-900 mt-0.5">
              Geographic Distribution of Selected Comps
            </h3>
            <p className="text-xs text-stone-500 font-mono">
              Washington D.C. Metropolitan Area (Sample: n = {comps.length} mapped listings)
            </p>
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
            <span className="text-[11px] font-semibold text-stone-600">Price Tiers:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-stone-700 text-[11px]">&lt; ${p25Price} (Budget)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-stone-700 text-[11px]">${p25Price}–${p75Price} (Market)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-stone-700 text-[11px]">&gt; ${p75Price} (Premium)</span>
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div className="h-[460px] w-full relative z-0">
          <MapContainer
            center={
              comps.length > 0 && comps[0].latitude
                ? [comps[0].latitude, comps[0].longitude]
                : defaultCenter
            }
            zoom={13}
            scrollWheelZoom={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {comps.map((c) => (
              <CircleMarker
                key={c.id}
                center={[c.latitude, c.longitude]}
                radius={6}
                pathOptions={{
                  fillColor: getMarkerColor(c.price),
                  fillOpacity: 0.8,
                  color: '#ffffff',
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs space-y-1 min-w-44">
                    <div className="font-bold text-stone-900 border-b pb-1 text-sm flex items-center justify-between">
                      <span>${c.price.toFixed(0)} / nt</span>
                      <span className="text-[10px] font-normal text-stone-500">#{c.id}</span>
                    </div>
                    <div className="text-stone-600 pt-0.5">
                      <strong>{c.property_type}</strong>
                    </div>
                    <div className="text-stone-500 text-[11px]">
                      {c.neighbourhood_cleansed}
                    </div>
                    <div className="flex justify-between text-stone-600 pt-1 border-t text-[11px] font-mono">
                      <span>Beds: {c.bedrooms}</span>
                      <span>Min Nts: {c.minimum_nights}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 text-[11px] font-mono">
                      <span>Occ: {c.estimated_occupancy_l365d} nts</span>
                      <span>Rating: {c.review_scores_rating ? `${c.review_scores_rating.toFixed(2)} ★` : 'None'}</span>
                    </div>
                    <div className="pt-1.5">
                      <button
                        onClick={() => openTrace(analysis.traces.recommended_price)}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-semibold underline cursor-pointer"
                      >
                        Inspect comp cohort &rarr;
                      </button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};
