/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTrace } from '../context/TraceContext';
import { Listing } from '../lib/stats';
import { X, Download, Filter, Calculator, Database, ArrowUpDown, Search, CheckCircle2 } from 'lucide-react';
import Papa from 'papaparse';

type SortField =
  | 'id'
  | 'neighbourhood_cleansed'
  | 'property_type'
  | 'bedrooms'
  | 'minimum_nights'
  | 'price'
  | 'estimated_occupancy_l365d'
  | 'estimated_revenue_l365d';

export const TracedDrawer: React.FC = () => {
  const { activeTrace, closeTrace } = useTrace();
  const [sortField, setSortField] = useState<SortField>('price');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  const filteredAndSortedRows = useMemo(() => {
    if (!activeTrace || !activeTrace.rows) return [];
    let rows = [...activeTrace.rows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.id.toLowerCase().includes(q) ||
          r.neighbourhood_cleansed.toLowerCase().includes(q) ||
          r.property_type.toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });

    return rows;
  }, [activeTrace, sortField, sortAsc, searchQuery]);

  if (!activeTrace) return null;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setPage(1);
  };

  const downloadCompsCsv = () => {
    if (!activeTrace.rows || activeTrace.rows.length === 0) return;

    const exportData = activeTrace.rows.map((r: Listing) => ({
      id: r.id,
      neighbourhood: r.neighbourhood_cleansed,
      property_type: r.property_type,
      room_type: r.room_type,
      bedrooms: r.bedrooms,
      accommodates: r.accommodates,
      minimum_nights: r.minimum_nights,
      price: r.price,
      estimated_occupancy_l365d: r.estimated_occupancy_l365d,
      estimated_revenue_l365d: r.estimated_revenue_l365d,
      review_scores_rating: r.review_scores_rating ?? '',
      number_of_reviews_ltm: r.number_of_reviews_ltm,
      host_is_superhost: r.host_is_superhost,
      license_status: r.license_status,
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dc_comps_${activeTrace.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredAndSortedRows.length / pageSize) || 1;
  const pagedRows = filteredAndSortedRows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={closeTrace}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 w-full max-w-4xl bg-white shadow-2xl flex flex-col h-full border-l border-stone-200"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700">
              <Database className="w-3.5 h-3.5" />
              <span>Data Provenance & Traceability</span>
            </div>
            <h2 id="drawer-title" className="text-xl font-bold text-stone-900 mt-1">
              {activeTrace.label}
            </h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-stone-600">
              <span>
                Calculated Value:{' '}
                <strong className="text-stone-950 font-mono text-base font-semibold">
                  {activeTrace.valueFormatted}
                </strong>
              </span>
              <span className="text-stone-300">•</span>
              <span>
                Sample Size:{' '}
                <strong className="text-stone-950 font-mono">{activeTrace.n}</strong>{' '}
                {activeTrace.n === 1 ? 'record' : 'listings'}
              </span>
            </div>
          </div>
          <button
            onClick={closeTrace}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
            title="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Formula section */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1.5">
              <Calculator className="w-4 h-4 text-amber-700" />
              <span>Formula in Plain English</span>
            </div>
            <p className="text-stone-800 text-sm leading-relaxed font-sans">
              {activeTrace.formula}
            </p>
          </div>

          {/* Filters Applied section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2.5">
              <Filter className="w-3.5 h-3.5 text-stone-500" />
              <span>Filters & Criteria Applied</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {activeTrace.filters.map((filterStr, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-stone-700 bg-stone-100/80 border border-stone-200 rounded-lg px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{filterStr}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exact Comp Listings Table */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Exact Underlying Listings ({activeTrace.rows?.length || 0} rows)
                </h3>
                <p className="text-xs text-stone-500">
                  Click column headers to sort. Search by listing ID, neighbourhood, or unit type.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search comps..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-48"
                  />
                </div>
                <button
                  onClick={downloadCompsCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-md shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-700 font-semibold sticky top-0 border-b border-stone-200 z-10">
                    <tr>
                      <th
                        onClick={() => handleSort('id')}
                        className="py-2.5 px-3 cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center gap-1">
                          <span>Listing ID</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('neighbourhood_cleansed')}
                        className="py-2.5 px-3 cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center gap-1">
                          <span>Neighbourhood</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('property_type')}
                        className="py-2.5 px-3 cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center gap-1">
                          <span>Property Type</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('bedrooms')}
                        className="py-2.5 px-2 text-center cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Beds</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('minimum_nights')}
                        className="py-2.5 px-2 text-center cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>Min Nts</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('price')}
                        className="py-2.5 px-3 text-right cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Price ($/nt)</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('estimated_occupancy_l365d')}
                        className="py-2.5 px-3 text-right cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Occupancy (Nts)</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('estimated_revenue_l365d')}
                        className="py-2.5 px-3 text-right cursor-pointer hover:bg-stone-200/70"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>Revenue ($)</span>
                          <ArrowUpDown className="w-3 h-3 text-stone-400" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {pagedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-amber-50/40 transition-colors">
                        <td className="py-2 px-3 text-stone-600 font-medium">#{row.id}</td>
                        <td className="py-2 px-3 text-stone-800 font-sans truncate max-w-48">
                          {row.neighbourhood_cleansed}
                        </td>
                        <td className="py-2 px-3 text-stone-600 font-sans truncate max-w-40">
                          {row.property_type}
                        </td>
                        <td className="py-2 px-2 text-center text-stone-800">{row.bedrooms}</td>
                        <td className="py-2 px-2 text-center text-stone-600">
                          {row.minimum_nights}
                        </td>
                        <td className="py-2 px-3 text-right font-semibold text-stone-900">
                          ${row.price.toFixed(0)}
                        </td>
                        <td className="py-2 px-3 text-right text-stone-700">
                          {row.estimated_occupancy_l365d}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-medium">
                          ${Math.round(row.estimated_revenue_l365d).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {pagedRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-stone-400 font-sans">
                          No listings found matching filter or search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table pagination footer */}
              {totalPages > 1 && (
                <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
                  <span>
                    Showing {(page - 1) * pageSize + 1} to{' '}
                    {Math.min(page * pageSize, filteredAndSortedRows.length)} of{' '}
                    {filteredAndSortedRows.length} listings
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded disabled:opacity-40 hover:bg-stone-100"
                    >
                      Prev
                    </button>
                    <span className="px-2">
                      {page} / {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-2.5 py-1 bg-white border border-stone-300 rounded disabled:opacity-40 hover:bg-stone-100"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <span>Data source: Inside Airbnb Washington D.C. (Snapshot 19 Sept 2026)</span>
          <button
            onClick={closeTrace}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium rounded-md transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
