import React from 'react';
import { MapPin, Navigation, Compass, Layers, Ruler, Search, FileText, Globe } from 'lucide-react';
import { GPSPosition, BaseMapStyle } from '../types';
import { toDMS } from '../utils/geoUtils';

interface HeaderProps {
  gpsPosition: GPSPosition | null;
  isGpsActive: boolean;
  onToggleGps: () => void;
  followGps: boolean;
  onToggleFollowGps: () => void;
  activeTab: 'search' | 'wards' | 'layers' | 'measure' | 'notes' | 'export';
  setActiveTab: (tab: 'search' | 'wards' | 'layers' | 'measure' | 'notes' | 'export') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  hoverCoord: { lat: number; lng: number } | null;
  onOpenWardDirectory: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  gpsPosition,
  isGpsActive,
  onToggleGps,
  followGps,
  onToggleFollowGps,
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  hoverCoord,
  onOpenWardDirectory,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between z-20 shrink-0">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 lg:hidden border border-slate-700 transition"
          title="Toggle Navigation Menu"
        >
          <Layers className="w-5 h-5 text-emerald-400" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Karuvarakundu GIS
              </h1>
              <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
                Cadastral Survey Map
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Malappuram District, Kerala • 24 Wards & Cadastre
            </p>
          </div>
        </div>
      </div>

      {/* Center Live Coordinates / Search */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Quick Search */}
        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Plot # / Ward..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!sidebarOpen) setSidebarOpen(true);
              setActiveTab('search');
            }}
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Live Coordinate Display */}
        {hoverCoord && (
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center gap-2 text-xs font-mono text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {hoverCoord.lat.toFixed(5)}°N, {hoverCoord.lng.toFixed(5)}°E
            </span>
            <span className="text-[10px] text-slate-400">
              ({toDMS(hoverCoord.lat, true)}, {toDMS(hoverCoord.lng, false)})
            </span>
          </div>
        )}
      </div>

      {/* Right Controls: Wards, GPS, Tabs */}
      <div className="flex items-center gap-2">
        {/* Ward Registry Button */}
        <button
          onClick={onOpenWardDirectory}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Ward Registry (24)</span>
        </button>

        {/* GPS Live Tracking Button */}
        <button
          onClick={onToggleGps}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
            isGpsActive
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
          title={isGpsActive ? 'Disable GPS Surveyor Tracking' : 'Enable Live GPS Surveyor Location'}
        >
          <Navigation className={`w-3.5 h-3.5 ${isGpsActive ? 'animate-pulse text-white' : 'text-slate-400'}`} />
          <span className="hidden md:inline">{isGpsActive ? 'GPS Active' : 'GPS Track'}</span>
        </button>

        {isGpsActive && (
          <button
            onClick={onToggleFollowGps}
            className={`p-1.5 rounded-lg text-xs border transition ${
              followGps
                ? 'bg-teal-600 text-white border-teal-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Auto-Center Map on GPS Location"
          >
            <Compass className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
