"use client";

import React from 'react';

interface ModelComparisonProps {
  comparisonResult?: any;
  liveTestResult?: any;
}

export default function ModelComparisonPanel({ comparisonResult, liveTestResult }: ModelComparisonProps) {
  // Prefer comparisonResult when present, else show top two results from liveTestResult
  let left = null;
  let right = null;
  if (comparisonResult) {
    left = comparisonResult.baseLLM;
    right = comparisonResult.governedLLM;
  } else if (liveTestResult && Array.isArray(liveTestResult.results)) {
    const sorted = [...liveTestResult.results].sort((a: any, b: any) => (b?.cries?.Omega || 0) - (a?.cries?.Omega || 0));
    left = sorted[0] || null;
    right = sorted[1] || null;
  }

  return (
    <div className="bg-slate-900/40 border border-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Model Comparison</h3>
        <div className="text-sm text-gray-400">Standard vs Rosetta</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-3 bg-slate-800/30 rounded border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-200">Standard Model</div>
            <div className="text-sm text-gray-400">{left?.modelName || left?.provider || '—'}</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded text-sm text-slate-300 max-h-44 overflow-y-auto whitespace-pre-wrap">{left?.response || 'No output yet.'}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div className="bg-slate-800/20 p-2 rounded text-center">CRIES Ω<div className="text-sm font-bold text-white mt-1">{left?.cries?.Omega?.toFixed ? left.cries.Omega.toFixed(2) : 'N/A'}</div></div>
            <div className="bg-slate-800/20 p-2 rounded text-center">Integrity<div className="text-sm font-bold text-white mt-1">{left?.cries?.I?.toFixed ? left.cries.I.toFixed(2) : 'N/A'}</div></div>
            <div className="bg-slate-800/20 p-2 rounded text-center">Security<div className="text-sm font-bold text-white mt-1">{left?.cries?.S?.toFixed ? left.cries.S.toFixed(2) : 'N/A'}</div></div>
          </div>
        </div>

        <div className="p-3 bg-slate-800/30 rounded border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-200">Rosetta Governed</div>
            <div className="text-sm text-gray-400">{right?.modelName || right?.provider || '—'}</div>
          </div>
          <div className="bg-slate-900/50 p-3 rounded text-sm text-slate-300 max-h-44 overflow-y-auto whitespace-pre-wrap">{right?.response || 'No output yet.'}</div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div className="bg-slate-800/20 p-2 rounded text-center">CRIES Ω<div className="text-sm font-bold text-white mt-1">{right?.cries?.Omega?.toFixed ? right.cries.Omega.toFixed(2) : 'N/A'}</div></div>
            <div className="bg-slate-800/20 p-2 rounded text-center">Integrity<div className="text-sm font-bold text-white mt-1">{right?.cries?.I?.toFixed ? right.cries.I.toFixed(2) : 'N/A'}</div></div>
            <div className="bg-slate-800/20 p-2 rounded text-center">Security<div className="text-sm font-bold text-white mt-1">{right?.cries?.S?.toFixed ? right.cries.S.toFixed(2) : 'N/A'}</div></div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div className={`px-2 py-1 rounded text-xs ${right && right.cries && (right.cries.Omega >= (left?.cries?.Omega || 0)) ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>
              {right && left ? ( (right.cries?.Omega || 0) >= (left.cries?.Omega || 0) ? 'Audit Passed' : 'Audit Delta' ) : 'No Audit'}
            </div>
            <div className="text-xs text-gray-400">Δ-Integrity: {right && left ? ((right.cries?.I || 0) - (left.cries?.I || 0)).toFixed(2) : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
