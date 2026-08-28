import React, { useState, useMemo } from 'react';
import {
  Search,
  Layers,
  MapPin,
  Ruler,
  FileText,
  Download,
  Upload,
  Plus,
  Trash2,
  Phone,
  User,
  Sliders,
  CheckCircle2,
  X,
  Compass,
  CornerDownRight,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  BaseMapStyle,
  LayerVisibility,
  LayerOpacity,
  GeoJSONCollection,
  GeoJSONFeature,
  WardInfo,
  FieldNote,
  MeasurePoint
} from '../types';
import { getFeatureMetrics, formatLandArea, exportToGeoJSON, exportToCSV, exportFieldNotesCSV } from '../utils/geoUtils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'search' | 'wards' | 'layers' | 'measure' | 'notes' | 'export';
  setActiveTab: (tab: 'search' | 'wards' | 'layers' | 'measure' | 'notes' | 'export') => void;
  surveyData: GeoJSONCollection;
  boundaryData: GeoJSONCollection;
  wardRegistry: WardInfo[];
  selectedFeature: GeoJSONFeature | null;
  onSelectFeature: (f: GeoJSONFeature | null) => void;
  baseMapStyle: BaseMapStyle;
  setBaseMapStyle: (s: BaseMapStyle) => void;
  layerVisibility: LayerVisibility;
  setLayerVisibility: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  layerOpacity: LayerOpacity;
  setLayerOpacity: React.Dispatch<React.SetStateAction<LayerOpacity>>;
  activeWardFilter: number | null;
  setActiveWardFilter: (wardNo: number | null) => void;
  fieldNotes: FieldNote[];
  onSelectNote: (note: FieldNote) => void;
  onDeleteNote: (id: string) => void;
  onOpenAddNoteModal: () => void;
  measureMode: 'none' | 'distance' | 'area';
  setMeasureMode: (mode: 'none' | 'distance' | 'area') => void;
  measurePoints: MeasurePoint[];
  onClearMeasure: () => void;
  onUndoMeasurePoint: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  surveyData,
  boundaryData,
  wardRegistry,
  selectedFeature,
  onSelectFeature,
  baseMapStyle,
  setBaseMapStyle,
  layerVisibility,
  setLayerVisibility,
  layerOpacity,
  setLayerOpacity,
  activeWardFilter,
  setActiveWardFilter,
  fieldNotes,
  onSelectNote,
  onDeleteNote,
  onOpenAddNoteModal,
  measureMode,
  setMeasureMode,
  measurePoints,
  onClearMeasure,
  onUndoMeasurePoint,
  searchQuery,
  setSearchQuery,
  onFileUpload
}) => {
  // Filtered Survey Plots
  const filteredPlots = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return surveyData.features.filter((f) => {
      const name = String(f.properties?.name || f.properties?.ORIG_FID || f.id || '');
      const ward = String(f.properties?.Ward_Name || f.properties?.Ward_No || '');
      const matchesSearch = !q || name.toLowerCase().includes(q) || ward.toLowerCase().includes(q);

      if (activeWardFilter) {
        const matchesWard = ward.includes(String(activeWardFilter));
        return matchesSearch && matchesWard;
      }
      return matchesSearch;
    });
  }, [surveyData, searchQuery, activeWardFilter]);

  // Tab definitions
  const tabs = [
    { id: 'search', label: 'Search & Plots', icon: Search },
    { id: 'wards', label: 'Wards (24)', icon: FileText },
    { id: 'layers', label: 'Layers & Style', icon: Layers },
    { id: 'measure', label: 'Measure', icon: Ruler },
    { id: 'notes', label: 'Field Notes', icon: MapPin },
    { id: 'export', label: 'Import/Export', icon: Download },
  ] as const;

  return (
    <aside
      className={`fixed lg:static top-16 bottom-0 left-0 z-30 w-80 sm:w-96 bg-slate-900/98 backdrop-blur-lg border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Navigation Tabs Bar */}
      <div className="flex border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto shrink-0 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: SEARCH & SURVEY PLOTS */}
        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Search Survey Plot Number / Ward Name
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. 1, 82, 137, Mullara, Kalkundu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Active Ward Filter Chip */}
            {activeWardFilter && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Filtered: Ward {activeWardFilter}</span>
                </div>
                <button
                  onClick={() => setActiveWardFilter(null)}
                  className="text-xs hover:text-white text-emerald-400"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Plots Count & List */}
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Matching Survey Plots:</span>
              <span className="font-semibold text-emerald-400">{filteredPlots.length}</span>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredPlots.slice(0, 100).map((plot, idx) => {
                const name = plot.properties?.name || plot.properties?.ORIG_FID || plot.id || String(idx + 1);
                const isSelected = selectedFeature?.id === plot.id;
                const metrics = getFeatureMetrics(plot);
                const areaInfo = formatLandArea(metrics.areaSqM);
                const uniqueKey = `plot-item-${plot.id ?? 'p'}-${plot.properties?.ORIG_FID ?? ''}-${idx}`;

                return (
                  <div
                    key={uniqueKey}
                    onClick={() => onSelectFeature(plot)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/70 text-amber-200'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">Plot #{name}</span>
                        {plot.properties?.Ward_Name && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                            {plot.properties.Ward_Name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        <span>{areaInfo.cents}</span> • <span>{(metrics.perimeterM).toFixed(1)}m perimeter</span>
                      </div>
                    </div>
                    <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                );
              })}

              {filteredPlots.length > 100 && (
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-800/30 rounded-lg">
                  Showing first 100 of {filteredPlots.length} survey plots. Narrow search to find specific plots.
                </div>
              )}

              {filteredPlots.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/30 rounded-lg">
                  No survey plots found matching "{searchQuery}".
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: WARDS (24) */}
        {activeTab === 'wards' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Karuvarakundu Wards (24):</span>
              {activeWardFilter && (
                <button
                  onClick={() => setActiveWardFilter(null)}
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Show All Wards
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
              {wardRegistry.map((ward) => {
                const isFiltered = activeWardFilter === ward.wardNo;
                const areaInfo = formatLandArea(ward.shapeArea);

                return (
                  <div
                    key={ward.wardNo}
                    onClick={() => setActiveWardFilter(isFiltered ? null : ward.wardNo)}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      isFiltered
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 shadow-md'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center">
                          {ward.wardNo}
                        </span>
                        <span className="font-semibold text-xs text-white">{ward.wardName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/70 text-slate-300 font-mono">
                        {ward.remarks || 'Ward'}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-[11px] text-slate-400 border-t border-slate-700/40 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          Surveyor:
                        </span>
                        <span className="text-slate-200 font-medium">{ward.surveyor}</span>
                      </div>

                      {ward.mobNo && ward.mobNo !== 'N/A' && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            Contact:
                          </span>
                          <a
                            href={`tel:${ward.mobNo}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-emerald-400 hover:underline font-mono"
                          >
                            {ward.mobNo}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-0.5">
                        <span>Ward Area:</span>
                        <span className="text-slate-300 font-mono">{areaInfo.acres}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: LAYERS & MAP STYLING */}
        {activeTab === 'layers' && (
          <div className="space-y-5">
            {/* Base Map Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">Base Map Provider</label>
                <span className="text-[10px] text-emerald-400 font-semibold uppercase">Google Maps Engine</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'googleHybrid', name: 'Google Hybrid', icon: '🛰️', desc: 'Satellite + Labels' },
                  { id: 'googleRoadmap', name: 'Google Maps', icon: '🗺️', desc: 'Official Standard' },
                  { id: 'googleSatellite', name: 'Google Satellite', icon: '🌍', desc: 'Pure Imagery' },
                  { id: 'googleTerrain', name: 'Google Terrain', icon: '⛰️', desc: 'Elevation & Contours' },
                  { id: 'osm', name: 'OpenStreetMap', icon: '🌐', desc: 'Community Map' },
                  { id: 'cartoDark', name: 'Carto Dark', icon: '🌑', desc: 'High Contrast' },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setBaseMapStyle(style.id as BaseMapStyle)}
                    className={`p-2.5 rounded-lg border text-left text-xs font-medium flex flex-col gap-0.5 transition ${
                      baseMapStyle === style.id
                        ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>{style.icon}</span>
                      <span className="truncate">{style.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 pl-5">{style.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Visibility Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">GIS Layer Visibility</label>
              <div className="space-y-1.5 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60">
                {[
                  { key: 'boundary', label: 'Panchayat Outer Boundary', count: '1 Poly' },
                  { key: 'surveyLines', label: 'Cadastral Survey Lines', count: '1,044 Plots' },
                  { key: 'surveyLabels', label: 'Survey Plot Number Labels', count: 'Interactive' },
                  { key: 'fieldNotes', label: 'Surveyor Field Notes', count: `${fieldNotes.length} Notes` },
                  { key: 'gpsTracking', label: 'Surveyor Live GPS Track', count: 'Live' },
                ].map((item) => {
                  const isVisible = layerVisibility[item.key as keyof LayerVisibility];
                  return (
                    <div
                      key={item.key}
                      onClick={() =>
                        setLayerVisibility((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof LayerVisibility],
                        }))
                      }
                      className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/50 cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-slate-500" />
                        )}
                        <span className={isVisible ? 'text-slate-200 font-medium' : 'text-slate-400'}>
                          {item.label}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Opacity Sliders */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-200">Layer Opacity & Styling</label>
              <div className="space-y-3 bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Survey Lines Stroke</span>
                    <span>{Math.round(layerOpacity.surveyLines * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.surveyLines}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, surveyLines: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Survey Plot Fill</span>
                    <span>{Math.round(layerOpacity.surveyFill * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.05"
                    value={layerOpacity.surveyFill}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, surveyFill: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Panchayat Boundary Stroke</span>
                    <span>{Math.round(layerOpacity.boundaryStroke * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={layerOpacity.boundaryStroke}
                    onChange={(e) =>
                      setLayerOpacity((prev) => ({ ...prev, boundaryStroke: parseFloat(e.target.value) }))
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEASUREMENT TOOLS */}
        {activeTab === 'measure' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Interactive GIS Measurement Tool</label>
              <p className="text-xs text-slate-400">
                Click on the map to place vertices and measure linear boundary distances or calculate polygon land areas in real-time.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMeasureMode(measureMode === 'distance' ? 'none' : 'distance')}
                className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  measureMode === 'distance'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Ruler className="w-4 h-4" />
                <span>Linear Distance</span>
              </button>

              <button
                onClick={() => setMeasureMode(measureMode === 'area' ? 'none' : 'area')}
                className={`p-3 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                  measureMode === 'area'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Polygon Area</span>
              </button>
            </div>

            {/* Measurement Status */}
            {measureMode !== 'none' && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300">
                    Mode: {measureMode === 'distance' ? 'Measuring Distance' : 'Measuring Area'}
                  </span>
                  <span className="text-amber-400 font-mono">{measurePoints.length} Points</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={onUndoMeasurePoint}
                    disabled={measurePoints.length === 0}
                    className="flex-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-40 transition"
                  >
                    Undo Last Point
                  </button>
                  <button
                    onClick={onClearMeasure}
                    disabled={measurePoints.length === 0}
                    className="py-1.5 px-3 rounded bg-red-900/50 hover:bg-red-800/70 text-red-300 text-xs font-medium disabled:opacity-40 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Kerala Unit Reference Table */}
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 space-y-2">
              <span className="text-xs font-bold text-slate-300">Kerala Land Unit Quick Reference</span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400 font-mono">
                <div>1 Cent = 40.47 m²</div>
                <div>1 Cent = 435.6 sq ft</div>
                <div>1 Acre = 100 Cents</div>
                <div>1 Acre = 4,046.86 m²</div>
                <div>1 Are = 2.47 Cents</div>
                <div>1 Hectare = 2.47 Acres</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FIELD NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Surveyor Field Notes</span>
              <button
                onClick={onOpenAddNoteModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {fieldNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300 cursor-pointer space-y-1.5 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white">{note.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="p-1 text-slate-500 hover:text-red-400 transition"
                      title="Delete Note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{note.description}</p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-700/40">
                    <span className="font-mono">{note.lat.toFixed(5)}, {note.lng.toFixed(5)}</span>
                    <span>{note.timestamp}</span>
                  </div>
                </div>
              ))}

              {fieldNotes.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/30 rounded-lg">
                  No field notes yet. Click "Add Note" or tap any point on the map while surveyor note mode is active.
                </div>
              )}
            </div>

            {fieldNotes.length > 0 && (
              <button
                onClick={() => exportFieldNotesCSV(fieldNotes)}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Field Notes to CSV</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 6: DATA IMPORT & EXPORT */}
        {activeTab === 'export' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-200">Export GIS Layers</label>
              <p className="text-xs text-slate-400">
                Download parsed cadastral survey plots and boundary data in GeoJSON and CSV formats.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => exportToGeoJSON(surveyData, 'karuvarakundu_survey_lines.geojson')}
                className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Survey Lines (GeoJSON)</span>
                </span>
                <span className="text-[10px] text-slate-400">1,044 Features</span>
              </button>

              <button
                onClick={() => exportToCSV(surveyData.features, 'karuvarakundu_survey_plots_summary.csv')}
                className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-400" />
                  <span>Survey Plots Table (CSV)</span>
                </span>
                <span className="text-[10px] text-slate-400">Area & Perimeter</span>
              </button>

              <button
                onClick={() => exportToGeoJSON(boundaryData, 'karuvarakundu_panchayat_boundary.geojson')}
                className="w-full p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-between transition"
              >
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Panchayat Boundary (GeoJSON)</span>
                </span>
                <span className="text-[10px] text-slate-400">Outer Ring</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-200">Import Custom KML / GeoJSON</label>
              <label className="w-full p-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-800/40 hover:bg-slate-800/70 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition">
                <Upload className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-medium text-slate-200">Upload KML or GeoJSON</span>
                <span className="text-[10px] text-slate-400">Add custom survey plots or road alignments</span>
                <input
                  type="file"
                  accept=".kml,.geojson,.json"
                  onChange={onFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
