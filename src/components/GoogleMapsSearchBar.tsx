import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Layers, Radio, Ruler, MapPin, Navigation, Compass, ChevronRight, Check } from 'lucide-react';
import { GeoJSONCollection, GeoJSONFeature, BaseMapStyle } from '../types';
import { getFeatureMetrics, formatLandArea } from '../utils/geoUtils';

interface GoogleMapsSearchBarProps {
  surveyData: GeoJSONCollection;
  onSelectFeature: (feature: GeoJSONFeature | null) => void;
  activeWardFilter: number | null;
  onOpenWardDirectory: () => void;
  baseMapStyle: BaseMapStyle;
  onToggleBaseMap: () => void;
  surveyNumbersVisible: boolean;
  onToggleSurveyNumbers: () => void;
  isRecordingTrack: boolean;
  onToggleTrackRecorder: () => void;
  measureMode: 'none' | 'distance' | 'area';
  onToggleMeasure: () => void;
  onOpenLayerMenu: () => void;
  onOpenAddNote: () => void;
}

export const GoogleMapsSearchBar: React.FC<GoogleMapsSearchBarProps> = ({
  surveyData,
  onSelectFeature,
  activeWardFilter,
  onOpenWardDirectory,
  baseMapStyle,
  onToggleBaseMap,
  surveyNumbersVisible,
  onToggleSurveyNumbers,
  isRecordingTrack,
  onToggleTrackRecorder,
  measureMode,
  onToggleMeasure,
  onOpenLayerMenu,
  onOpenAddNote
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter survey plots based on query
  const searchResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const matches: { feature: GeoJSONFeature; name: string; ward: string; cents: string }[] = [];

    for (const feature of surveyData.features) {
      const name = String(feature.properties?.name || feature.properties?.ORIG_FID || feature.id || '');
      const ward = String(feature.properties?.Ward_Name || feature.properties?.Ward_No || '');

      // Check if matches query
      if (name.toLowerCase() === q || name.toLowerCase().startsWith(q) || name.toLowerCase().includes(q) || ward.toLowerCase().includes(q)) {
        const metrics = getFeatureMetrics(feature);
        const areaInfo = formatLandArea(metrics.areaSqM);
        matches.push({
          feature,
          name,
          ward: ward || 'Karuvarakundu',
          cents: areaInfo.cents
        });
        if (matches.length >= 15) break;
      }
    }

    // Sort exact matches first
    return matches.sort((a, b) => {
      if (a.name === q && b.name !== q) return -1;
      if (b.name === q && a.name !== q) return 1;
      const numA = parseInt(a.name, 10);
      const numB = parseInt(b.name, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.name.localeCompare(b.name);
    });
  }, [query, surveyData]);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (feat: GeoJSONFeature) => {
    onSelectFeature(feat);
    setIsFocused(false);
    const plotName = feat.properties?.name || feat.id || '';
    setQuery(`Plot #${plotName}`);
  };

  return (
    <div ref={dropdownRef} className="absolute top-3 left-3 right-3 sm:left-4 sm:right-auto sm:w-[410px] z-30 flex flex-col gap-2 pointer-events-auto">
      {/* Google Maps Style Search Card */}
      <div className="bg-slate-900/95 text-white backdrop-blur-md rounded-full shadow-2xl border border-slate-700/80 flex items-center px-3.5 py-1.5 transition-all focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        <div className="text-blue-400 p-1.5 flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          placeholder="Search Survey No. (e.g. 82, 137, 1)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsFocused(true);
          }}
          onFocus={() => setIsFocused(true)}
          className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none px-2 font-medium"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery('');
              setIsFocused(false);
              onSelectFeature(null);
            }}
            className="p-1 text-slate-400 hover:text-white rounded-full transition"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}

        <div className="h-5 w-[1px] bg-slate-700 mx-1.5" />

        <button
          onClick={onOpenLayerMenu}
          className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Google Maps Layers & Overlays"
        >
          <Layers className="w-5 h-5 text-emerald-400" />
        </button>
      </div>

      {/* Autocomplete Search Dropdown */}
      {isFocused && query.trim().length > 0 && (
        <div className="bg-slate-900/98 backdrop-blur-xl border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden max-h-[320px] overflow-y-auto divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-150">
          {searchResults.length > 0 ? (
            searchResults.map((item, idx) => (
              <div
                key={`${item.name}-${idx}`}
                onClick={() => handleSelect(item.feature)}
                className="p-3 hover:bg-blue-600/20 cursor-pointer flex items-center justify-between transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center group-hover:scale-105 transition">
                    #{item.name}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>Survey Plot #{item.name}</span>
                      <span className="text-[11px] font-normal text-emerald-400">({item.cents})</span>
                    </div>
                    <div className="text-xs text-slate-400">{item.ward}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
                  <span>View</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-slate-400">
              No survey plot found matching "<span className="text-white font-semibold">{query}</span>"
            </div>
          )}
        </div>
      )}

      {/* Quick Action Chips (Google Maps Style Horizontal Scroll) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
        {/* Base Map Toggle Chip */}
        <button
          onClick={onToggleBaseMap}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border flex items-center gap-1.5 transition ${
            baseMapStyle === 'googleHybrid'
              ? 'bg-blue-600/90 border-blue-400 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>🛰️</span>
          <span>{baseMapStyle === 'googleHybrid' ? 'Google Hybrid' : 'Google Maps'}</span>
        </button>

        {/* Survey Numbers Visible Chip */}
        <button
          onClick={onToggleSurveyNumbers}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border flex items-center gap-1.5 transition ${
            surveyNumbersVisible
              ? 'bg-amber-500/90 border-amber-300 text-slate-950 font-bold'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <span>🔢</span>
          <span>Survey #s {surveyNumbersVisible ? 'ON' : 'OFF'}</span>
        </button>

        {/* Google My Tracks Record Chip */}
        <button
          onClick={onToggleTrackRecorder}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border flex items-center gap-1.5 transition ${
            isRecordingTrack
              ? 'bg-red-600 border-red-400 text-white recording-dot-pulse'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className={isRecordingTrack ? 'animate-pulse' : ''}>🔴</span>
          <span>{isRecordingTrack ? 'Recording Track...' : 'Record Track'}</span>
        </button>

        {/* Ward Directory Chip */}
        <button
          onClick={onOpenWardDirectory}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border flex items-center gap-1.5 transition ${
            activeWardFilter
              ? 'bg-emerald-600 border-emerald-400 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span>📍</span>
          <span>{activeWardFilter ? `Ward #${activeWardFilter}` : 'Wards (24)'}</span>
        </button>

        {/* Measure Tool Chip */}
        <button
          onClick={onToggleMeasure}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md shadow-md border flex items-center gap-1.5 transition ${
            measureMode !== 'none'
              ? 'bg-amber-600 border-amber-400 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>{measureMode !== 'none' ? 'Measuring...' : 'Measure'}</span>
        </button>

        {/* Field Notes Chip */}
        <button
          onClick={onOpenAddNote}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-900/90 border border-slate-700 text-slate-200 hover:bg-slate-800 backdrop-blur-md shadow-md flex items-center gap-1.5 transition"
        >
          <span>📌</span>
          <span>Field Note</span>
        </button>
      </div>
    </div>
  );
};
