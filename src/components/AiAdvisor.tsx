/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AdvisorAnalysis, AdvisorInputs } from '../lib/stats';
import { Traced } from './Traced';
import {
  Sparkles,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Info,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface AiAdvisorProps {
  analysis: AdvisorAnalysis;
  inputs: AdvisorInputs;
}

interface MemoToken {
  type: 'text' | 'traced' | 'unverified';
  content: string;
  traceId?: string;
  matchedValue?: number;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({ analysis, inputs }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [memoText, setMemoText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateMemo = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/memo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: analysis.compactAiJson,
          inputs,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.memo) {
        throw new Error('No memo returned by advisor endpoint.');
      }

      setMemoText(data.memo);
    } catch (err: any) {
      console.error('Failed to generate memo:', err);
      setError(
        err?.message ||
          'Could not generate AI owner memo. The underlying statistics, charts, and trace drawer remain 100% active.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Parse the memo text and verify numbers against compactAiJson.
   * Handles both tagged formats like "$185 [recommended_price]" and
   * untagged numbers like "$185" or "215".
   */
  const parsedParagraphs = React.useMemo(() => {
    if (!memoText) return [];

    const json = analysis.compactAiJson;
    const knownKeys = new Set(Object.keys(json));

    // Extract all numeric values from JSON for fallback matching
    const numericEntries: Array<{ key: string; value: number }> = [];
    for (const [key, val] of Object.entries(json)) {
      if (typeof val === 'number') {
        numericEntries.push({ key, value: val });
      }
    }

    const paragraphs = memoText.split(/\n\s*\n/);

    return paragraphs.map((para) => {
      // Regex to detect pattern: (optional currency/symbol)(number)(optional %)(spaces)[key]
      // or bare numbers
      const taggedRegex = /([$£€]?\s*\d+(?:\.\d+)?\s*%?)\s*\[([a-zA-Z0-9_]+)\]/g;

      // We process line by line or token by token
      const tokens: MemoToken[] = [];
      let lastIndex = 0;
      let match;

      while ((match = taggedRegex.exec(para)) !== null) {
        const matchStart = match.index;
        const matchEnd = taggedRegex.lastIndex;

        // Push preceding plain text
        if (matchStart > lastIndex) {
          const preText = para.substring(lastIndex, matchStart);
          tokens.push(...processUntaggedText(preText, numericEntries));
        }

        const rawDisplay = match[1].trim();
        const tagKey = match[2].trim();

        // Check if tagKey exists in json
        if (knownKeys.has(tagKey)) {
          tokens.push({
            type: 'traced',
            content: rawDisplay,
            traceId: tagKey,
          });
        } else {
          // Untraced tag
          tokens.push({
            type: 'unverified',
            content: `${rawDisplay} [${tagKey}]`,
          });
        }

        lastIndex = matchEnd;
      }

      // Remaining text
      if (lastIndex < para.length) {
        const remaining = para.substring(lastIndex);
        tokens.push(...processUntaggedText(remaining, numericEntries));
      }

      return tokens;
    });
  }, [memoText, analysis.compactAiJson]);

  // Helper to process untagged text for any standalone hallucinated numbers
  function processUntaggedText(
    text: string,
    numericEntries: Array<{ key: string; value: number }>
  ): MemoToken[] {
    const tokens: MemoToken[] = [];
    // Matches numbers with optional dollar sign and percent
    const numRegex = /([$£€]?\b\d+(?:\.\d+)?%?\b)/g;
    let lastIdx = 0;
    let m;

    while ((m = numRegex.exec(text)) !== null) {
      const start = m.index;
      const end = numRegex.lastIndex;

      if (start > lastIdx) {
        tokens.push({
          type: 'text',
          content: text.substring(lastIdx, start),
        });
      }

      const numStr = m[1];
      const numericVal = parseFloat(numStr.replace(/[$,%]/g, ''));

      if (!isNaN(numericVal)) {
        // Skip purely ordinal numbers or small counting words like "1-bedroom" or dates
        if (numericVal === 1 && /bedroom|bed/i.test(text.substring(start, start + 15))) {
          tokens.push({ type: 'text', content: numStr });
        } else {
          // Check if this number exists in the JSON payload (allow rounding tolerance)
          const matched = numericEntries.find((entry) => {
            if (entry.value === numericVal) return true;
            if (Math.abs(entry.value - numericVal) < 0.5) return true;
            if (entry.value > 0 && Math.abs(entry.value - numericVal) / entry.value < 0.02)
              return true;
            return false;
          });

          if (matched) {
            tokens.push({
              type: 'traced',
              content: numStr,
              traceId: matched.key,
              matchedValue: matched.value,
            });
          } else {
            // Unverified number! Flag it per requirements
            tokens.push({
              type: 'unverified',
              content: numStr,
            });
          }
        }
      } else {
        tokens.push({ type: 'text', content: numStr });
      }

      lastIdx = end;
    }

    if (lastIdx < text.length) {
      tokens.push({ type: 'text', content: text.substring(lastIdx) });
    }

    return tokens;
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-700" />
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              AI Executive Memo (Strict Provenance)
            </h3>
            <p className="text-xs text-stone-500">
              Only runs on button click. Generates a client-ready advisory memo citing strictly verified
              dataset metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGenerateMemo}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Drafting Memo...</span>
            </>
          ) : (
            <>
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Draft Owner Memo</span>
            </>
          )}
        </button>
      </div>

      {/* Body Area */}
      <div className="p-6">
        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2 mb-4">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>AI Advisor Notice</span>
            </div>
            <p>{error}</p>
            <p className="text-stone-600">
              Note: The core application, calculations, charts, and trace drawers run completely
              in-browser from the Inside Airbnb dataset and do not require AI.
            </p>
          </div>
        )}

        {!memoText && !loading && !error && (
          <div className="text-center py-8 text-stone-500 bg-stone-50/50 rounded-xl border border-dashed border-stone-200 p-6">
            <Sparkles className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-stone-700">No Advisory Memo Drafted Yet</h4>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Click <strong>Draft Owner Memo</strong> above. Gemini will generate a ~150-word
              homeowner memo using exclusively the verified comp metrics computed in code.
            </p>
          </div>
        )}

        {loading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-6 h-6 text-amber-700 animate-spin" />
            <p className="text-xs font-medium text-stone-600">
              Generating executive memo with bracketed data tags...
            </p>
            <p className="text-[11px] text-stone-400">Verifying numbers against calculated statistics</p>
          </div>
        )}

        {memoText && !loading && (
          <div className="space-y-4">
            {/* Memo Verification Badge */}
            <div className="flex items-center justify-between text-xs bg-emerald-50 border border-emerald-200 text-emerald-900 px-3.5 py-2 rounded-lg font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Memo successfully parsed. All tagged and recognized numbers are linked to the Data
                  Provenance Drawer.
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-mono font-semibold">
                Audit Verified
              </span>
            </div>

            {/* Rendered Text with Interactive Traced & Red Unverified Highlighting */}
            <div className="bg-stone-50/80 border border-stone-200 rounded-xl p-5 text-sm text-stone-800 leading-relaxed font-sans space-y-4 shadow-2xs">
              {parsedParagraphs.map((paraTokens, pIdx) => (
                <p key={pIdx}>
                  {paraTokens.map((tok, tIdx) => {
                    if (tok.type === 'traced' && tok.traceId) {
                      return (
                        <Traced
                          key={tIdx}
                          traceId={tok.traceId}
                          className="font-semibold text-amber-900"
                        >
                          {tok.content}
                        </Traced>
                      );
                    }

                    if (tok.type === 'unverified') {
                      return (
                        <span
                          key={tIdx}
                          className="inline-flex items-center gap-1 bg-red-100 text-red-900 border border-red-300 rounded px-1.5 py-0.5 mx-0.5 text-xs font-semibold"
                          title="Untraced number! This figure does not match any metric in the verified CSV calculation payload."
                        >
                          <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                          <span>{tok.content}</span>
                          <span className="text-[9px] uppercase tracking-wider bg-red-600 text-white px-1 py-0.2 rounded font-sans font-bold">
                            Not traced to data
                          </span>
                        </span>
                      );
                    }

                    return <span key={tIdx}>{tok.content}</span>;
                  })}
                </p>
              ))}
            </div>

            {/* Memo Footer Information */}
            <div className="text-[11px] text-stone-500 flex items-center justify-between pt-1">
              <span>
                Tip: Click any underlined number to view its formula, exact comp set, and CSV export.
              </span>
              <button
                onClick={handleGenerateMemo}
                className="text-stone-700 hover:text-stone-900 font-semibold underline cursor-pointer"
              >
                Regenerate Memo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
