import React, { useState } from 'react';
import { X, MapPin, Copy, Check, Ruler, Maximize2, Share2, Compass, FileSpreadsheet } from 'lucide-react';
import { GeoJSONFeature } from '../types';
import { getFeatureMetrics, formatLandArea, toDMS, exportToCSV } from '../utils/geoUtils';

interface PlotDetailDrawerProps {
  feature: GeoJSONFeature | null;
  onClose: () => void;
}

export const PlotDetailDrawer: React.FC<PlotDetailDrawerProps> = ({ feature, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [showCoordsList, setShowCoordsList] = useState(false);

  if (!feature) return null;

  const name = feature.properties?.name || feature.properties?.ORIG_FID || feature.id || 'Survey Plot';
  const ward = feature.properties?.Ward_Name || feature.properties?.Ward_No || 'Karuvarakundu';
  const surveyor = feature.properties?.Surveyor || feature.properties?.remarks || 'Kerala Survey Dept.';
  const metrics = getFeatureMetrics(feature);
  const areaInfo = formatLandArea(metrics.areaSqM);

  const copyCoordinates = () => {
    const text = `${metrics.centroid[0].toFixed(6)}, ${metrics.centroid[1].toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[420px] z-40 bg-slate-900/98 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Survey Plot #{name}
            </span>
            <span className="text-xs text-slate-400 font-medium">{ward}</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Plot Details & Cadastral Metrics</h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Body */}
      <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
        {/* Highlighted Area Card */}
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Calculated Area</span>
            <div className="text-xl font-extrabold text-white mt-0.5">{areaInfo.cents}</div>
            <div className="text-xs text-emerald-300">{areaInfo.acres} • {areaInfo.sqMeters}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-700/50 flex items-center justify-center text-emerald-400">
            <Maximize2 className="w-5 h-5" />
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="text-slate-400 text-[11px]">Boundary Perimeter</span>
            <div className="font-bold text-white mt-0.5">{metrics.perimeterM.toFixed(1)} meters</div>
            <span className="text-[10px] text-slate-500">{(metrics.perimeterM / 1000).toFixed(3)} km</span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <span className="text-slate-400 text-[11px]">Ares & Hectares</span>
            <div className="font-bold text-white mt-0.5">{areaInfo.ares}</div>
            <span className="text-[10px] text-slate-500">{areaInfo.hectares}</span>
          </div>
        </div>

        {/* Centroid Coordinates Card */}
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              Plot Centroid Coordinates
            </span>
            <button
              onClick={copyCoordinates}
              className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="font-mono text-slate-200 text-xs">
            {metrics.centroid[0].toFixed(6)}° N, {metrics.centroid[1].toFixed(6)}° E
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {toDMS(metrics.centroid[0], true)}, {toDMS(metrics.centroid[1], false)}
          </div>
        </div>

        {/* Feature Properties if any */}
        {Object.keys(feature.properties || {}).length > 1 && (
          <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 space-y-1 text-xs">
            <span className="text-slate-400 font-semibold">Extended Attributes</span>
            <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
              {Object.entries(feature.properties).map(([k, v]) => {
                if (k === 'name' || !v) return null;
                return (
                  <div key={k} className="flex flex-col">
                    <span className="text-slate-500 font-mono text-[10px]">{k}:</span>
                    <span className="text-slate-300 truncate">{String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => exportToCSV([feature], `survey_plot_${name}.csv`)}
            className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-400" />
            <span>Export Plot CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
