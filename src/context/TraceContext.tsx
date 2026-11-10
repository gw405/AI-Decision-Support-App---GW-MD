/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState } from 'react';
import { TraceRecord } from '../lib/stats';

interface TraceContextType {
  activeTrace: TraceRecord | null;
  openTrace: (record: TraceRecord) => void;
  openTraceById: (id: string) => void;
  closeTrace: () => void;
  setTracesMap: (map: Record<string, TraceRecord>) => void;
}

const TraceContext = createContext<TraceContextType | undefined>(undefined);

export function TraceProvider({ children }: { children: React.ReactNode }) {
  const [activeTrace, setActiveTrace] = useState<TraceRecord | null>(null);
  const [tracesMap, setTracesMapState] = useState<Record<string, TraceRecord>>({});

  const openTrace = (record: TraceRecord) => {
    setActiveTrace(record);
  };

  const openTraceById = (id: string) => {
    if (tracesMap[id]) {
      setActiveTrace(tracesMap[id]);
    } else {
      console.warn(`Trace record not found for id: "${id}"`);
    }
  };

  const closeTrace = () => {
    setActiveTrace(null);
  };

  const setTracesMap = (map: Record<string, TraceRecord>) => {
    setTracesMapState(map);
  };

  return (
    <TraceContext.Provider
      value={{
        activeTrace,
        openTrace,
        openTraceById,
        closeTrace,
        setTracesMap,
      }}
    >
      {children}
    </TraceContext.Provider>
  );
}

export function useTrace() {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error('useTrace must be used within a TraceProvider');
  }
  return context;
}
