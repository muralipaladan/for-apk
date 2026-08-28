import React, { useState } from 'react';
import {
  X,
  Navigation,
  Copy,
  Check,
  Maximize2,
  Share2,
  FileSpreadsheet,
  MapPin,
  Compass,
  Layers,
  ChevronDown
} from 'lucide-react';
import { GeoJSONFeature } from '../types';
import { getFeatureMetrics, formatLandArea, toDMS, exportToCSV } from '../utils/geoUtils';

interface GoogleMapsPlotSheetProps {
  feature: GeoJSONFeature | null;
  onClose: () => void;
  onZoomTo: () => void;
}

export const GoogleMapsPlotSheet: React.FC<GoogleMapsPlotSheetProps> = ({ feature, onClose, onZoomTo }) => {
  const [copied, setCopied] = useState(false);

  if (!feature) return null;

  const metrics = getFeatureMetrics(feature);
  const areaInfo = formatLandArea(metrics.areaSqM);
  const plotName = feature.properties?.name || feature.properties?.ORIG_FID || feature.id || 'N/A';
  const wardName = feature.properties?.Ward_Name || feature.properties?.Ward_No || 'Karuvarakundu';
  const surveyor = feature.properties?.Surveyor || 'Taluk Surveyor';
  const phone = feature.properties?.Mob_No || '';

  const handleCopyCoord = () => {
    navigator.clipboard.writeText(`${metrics.centroid[0].toFixed(6)}, ${metrics.centroid[1].toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${metrics.centroid[0]},${metrics.centroid[1]}`;
    window.open(url, '_blank');
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 sm:left-4 sm:bottom-4 sm:right-auto sm:w-[410px] z-30 pointer-events-auto">
      <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
        {/* Top Drag Handle */}
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-extrabold text-base flex items-center justify-center shadow-inner flex-shrink-0">
              #{plotName}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">Survey Plot #{plotName}</h3>
              </div>
              <p className="text-xs text-emerald-400 font-semibold">{wardName} • Karuvarakundu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Metrics */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Main Kerala Land Area Highlight Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
              Registered Land Area (കേരള ലാൻഡ് ഏരിയ)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{areaInfo.cents}</span>
              <span className="text-sm font-semibold text-slate-400">({areaInfo.acres})</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] block">Square Meters</span>
                <span className="font-mono font-bold text-slate-200">{areaInfo.sqMeters}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Square Feet</span>
                <span className="font-mono font-bold text-slate-200">{areaInfo.sqFeet}</span>
              </div>
            </div>
          </div>

          {/* Boundary Perimeter & Centroid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Perimeter</span>
              <span className="text-sm font-extrabold text-cyan-400 font-mono mt-0.5 block">
                {metrics.perimeterM >= 1000
                  ? `${(metrics.perimeterM / 1000).toFixed(2)} km`
                  : `${metrics.perimeterM.toFixed(1)} m`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ares</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono mt-0.5 block">
                {areaInfo.ares}
              </span>
            </div>
          </div>

          {/* Coordinates DMS */}
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Centroid Coordinates</span>
              <span className="font-mono text-slate-200 font-semibold">
                {metrics.centroid[0].toFixed(6)}° N, {metrics.centroid[1].toFixed(6)}° E
              </span>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {toDMS(metrics.centroid[0], true)}, {toDMS(metrics.centroid[1], false)}
              </div>
            </div>

            <button
              onClick={handleCopyCoord}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
              title="Copy GPS coordinates"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Quick Action Buttons (Google Maps Style) */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={onZoomTo}
              className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Zoom To</span>
            </button>

            <button
              onClick={handleOpenGoogleMaps}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Directions</span>
            </button>

            <button
              onClick={() => exportToCSV([feature], `survey_plot_${plotName}.csv`)}
              className="py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
