import React from 'react';
import { X, Layers, Check, Map, Compass, Sliders } from 'lucide-react';
import { BaseMapStyle, LayerVisibility, LayerOpacity } from '../types';

interface GoogleMapsLayerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  baseMapStyle: BaseMapStyle;
  setBaseMapStyle: (style: BaseMapStyle) => void;
  layerVisibility: LayerVisibility;
  setLayerVisibility: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  layerOpacity: LayerOpacity;
  setLayerOpacity: React.Dispatch<React.SetStateAction<LayerOpacity>>;
}

export const GoogleMapsLayerMenu: React.FC<GoogleMapsLayerMenuProps> = ({
  isOpen,
  onClose,
  baseMapStyle,
  setBaseMapStyle,
  layerVisibility,
  setLayerVisibility,
  layerOpacity,
  setLayerOpacity
}) => {
  if (!isOpen) return null;

  const baseMapOptions: { id: BaseMapStyle; label: string; icon: string; desc: string }[] = [
    { id: 'googleHybrid', label: 'Google Hybrid', icon: '🛰️', desc: 'Satellite + Roads & Labels' },
    { id: 'googleRoadmap', label: 'Google Maps', icon: '🗺️', desc: 'Standard Street Vector Map' },
    { id: 'googleSatellite', label: 'Google Satellite', icon: '🌍', desc: 'High-Res Aerial Imagery' },
    { id: 'googleTerrain', label: 'Google Terrain', icon: '⛰️', desc: 'Topographic Contours' },
    { id: 'osm', label: 'OpenStreetMap', icon: '🌐', desc: 'Standard Open Street Map' },
    { id: 'cartoDark', label: 'Carto Dark', icon: '🌑', desc: 'Night High-Contrast' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Map Type & Details</h3>
              <p className="text-[11px] text-slate-400">Google Maps layers & Karuvarakundu KML overlays</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Base Map Type */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              Base Map Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {baseMapOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setBaseMapStyle(opt.id)}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col gap-0.5 transition ${
                    baseMapStyle === opt.id
                      ? 'bg-blue-600/25 border-blue-500 text-white ring-1 ring-blue-500/50'
                      : 'bg-slate-800/60 border-slate-700/70 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{opt.icon}</span>
                    {baseMapStyle === opt.id && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                  <span className="font-bold text-xs mt-1 text-white">{opt.label}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Map Details / Overlays */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2.5">
              Survey Overlays & Details
            </label>
            <div className="space-y-2">
              {/* Survey Numbers on Map */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔢</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Survey Numbers on Map</span>
                    <span className="text-[10px] text-slate-400">Display cadastral plot numbers directly over land parcels</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.surveyNumbers}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, surveyNumbers: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>

              {/* Survey Lines KML */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📐</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Cadastral Survey Lines</span>
                    <span className="text-[10px] text-slate-400">1,044 Karuvarakundu cadastral survey plots</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.surveyLines}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, surveyLines: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>

              {/* Boundary KML */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🗺️</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Panchayat Outer Boundary</span>
                    <span className="text-[10px] text-slate-400">Karuvarakundu Grama Panchayat outline</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.boundary}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, boundary: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>

              {/* Live GPS Blue Dot */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔵</span>
                  <div>
                    <span className="text-xs font-bold text-white block">GPS Blue Dot & Compass</span>
                    <span className="text-[10px] text-slate-400">Real-time surveyor location & orientation</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.gpsTracking}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, gpsTracking: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>

              {/* Recorded GPS Tracks */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔴</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Recorded GPS Tracks</span>
                    <span className="text-[10px] text-slate-400">Google My Tracks surveyor paths</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.recordedTracks}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, recordedTracks: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>

              {/* Field Notes */}
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 cursor-pointer hover:bg-slate-800 transition">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📌</span>
                  <div>
                    <span className="text-xs font-bold text-white block">Surveyor Field Notes</span>
                    <span className="text-[10px] text-slate-400">Boundary markers, pillars, disputed points</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={layerVisibility.fieldNotes}
                  onChange={(e) => setLayerVisibility((prev) => ({ ...prev, fieldNotes: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
