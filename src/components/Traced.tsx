/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTrace } from '../context/TraceContext';
import { TraceRecord } from '../lib/stats';

interface TracedProps {
  traceId?: string;
  record?: TraceRecord;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const Traced: React.FC<TracedProps> = ({
  traceId,
  record,
  children,
  className = '',
  title,
}) => {
  const { openTrace, openTraceById } = useTrace();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (record) {
      openTrace(record);
    } else if (traceId) {
      openTraceById(traceId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e as any);
    }
  };

  const tooltip =
    title || 'Data-backed metric: Click to inspect calculation formula, filters, and comp records';

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tooltip}
      className={`inline-flex items-baseline gap-0.5 border-b border-dashed border-amber-600/70 hover:border-amber-600 hover:bg-amber-50 text-inherit cursor-pointer rounded px-0.5 transition-all duration-150 group font-inherit ${className}`}
    >
      <span>{children}</span>
      <span
        aria-hidden="true"
        className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-700 font-sans select-none transition-opacity ml-0.5"
      >
        ↗
      </span>
    </span>
  );
};
