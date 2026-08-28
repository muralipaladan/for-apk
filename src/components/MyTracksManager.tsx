import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Navigation,
  Clock,
  Activity,
  Maximize2,
  FileCode,
  Globe,
  Share2,
  X,
  Compass,
  FileSpreadsheet,
  MapPin,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  Mountain
} from 'lucide-react';
import { RecordedTrack, TrackPoint, GPSPosition, TrackWaypoint } from '../types';
import {
  formatDuration,
  exportTrackToGPX,
  exportTrackToKML,
  exportTrackToCSV,
  exportToGeoJSON
} from '../utils/geoUtils';

interface MyTracksManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isRecording: boolean;
  isPaused: boolean;
  currentTrackPoints: TrackPoint[];
  currentWaypoints?: TrackWaypoint[];
  startTime: number | null;
  onStartRecording: (trackName?: string) => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopAndSaveTrack: (trackName?: string) => void;
  onDiscardRecording: () => void;
  onAddWaypoint: (name: string, category?: 'marker' | 'pillar' | 'start' | 'stop' | 'photo' | 'note') => void;
  savedTracks: RecordedTrack[];
  onDeleteTrack: (trackId: string) => void;
  visibleTrackIds: string[];
  onToggleTrackVisibility: (trackId: string) => void;
  gpsPosition: GPSPosition | null;
}

export const MyTracksManager: React.FC<MyTracksManagerProps> = ({
  isOpen,
  onClose,
  isRecording,
  isPaused,
  currentTrackPoints,
  currentWaypoints = [],
  startTime,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopAndSaveTrack,
  onDiscardRecording,
  onAddWaypoint,
  savedTracks,
  onDeleteTrack,
  visibleTrackIds,
  onToggleTrackVisibility,
  gpsPosition
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [trackNameInput, setTrackNameInput] = useState('');
  const [activeTab, setActiveTab] = useState<'stats' | 'chart' | 'waypoints' | 'history'>('stats');

  // Waypoint creation state
  const [waypointNameInput, setWaypointNameInput] = useState('');
  const [waypointCategory, setWaypointCategory] = useState<'pillar' | 'marker' | 'note' | 'photo'>('pillar');
  const [showWaypointForm, setShowWaypointForm] = useState(false);

  // Selected saved track for inspecting in history tab
  const [selectedSavedTrack, setSelectedSavedTrack] = useState<RecordedTrack | null>(null);

  // Elapsed timer ticker when recording
  useEffect(() => {
    let interval: any = null;
    if (isRecording && !isPaused && startTime) {
      interval = setInterval(() => {
        const secs = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(secs);
      }, 1000);
    } else if (!isRecording) {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, startTime]);

  // Points to inspect: either current live track or selected saved track
  const pointsToInspect = selectedSavedTrack ? selectedSavedTrack.points : currentTrackPoints;
  const isInspectingSaved = !!selectedSavedTrack;

  // Calculate live/selected track comprehensive telemetry metrics
  const trackMetrics = React.useMemo(() => {
    if (pointsToInspect.length < 1) {
      return {
        distanceM: 0,
        maxSpeedKmh: 0,
        avgSpeedKmh: 0,
        currentSpeedKmh: 0,
        minElevM: 0,
        maxElevM: 0,
        elevGainM: 0,
        elevLossM: 0,
        paceMinPerKm: '0:00'
      };
    }

    let dist = 0;
    let maxSpeed = 0;
    let minAlt = Infinity;
    let maxAlt = -Infinity;
    let gain = 0;
    let loss = 0;

    for (let i = 0; i < pointsToInspect.length; i++) {
      const p = pointsToInspect[i];
      if (p.speed) {
        const sKmh = p.speed * 3.6;
        if (sKmh > maxSpeed) maxSpeed = sKmh;
      }
      if (p.altitude != null) {
        if (p.altitude < minAlt) minAlt = p.altitude;
        if (p.altitude > maxAlt) maxAlt = p.altitude;
      }

      if (i > 0) {
        const prev = pointsToInspect[i - 1];
        const R = 6371000;
        const dLat = ((p.lat - prev.lat) * Math.PI) / 180;
        const dLon = ((p.lng - prev.lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((prev.lat * Math.PI) / 180) * Math.cos((p.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const segmentDist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        dist += segmentDist;

        if (p.altitude != null && prev.altitude != null) {
          const diff = p.altitude - prev.altitude;
          if (diff > 0) gain += diff;
          else loss += Math.abs(diff);
        }
      }
    }

    const durationSecs = isInspectingSaved ? selectedSavedTrack!.durationSeconds : elapsedSeconds;
    const avgSpeed = durationSecs > 0 ? (dist / 1000) / (durationSecs / 3600) : 0;
    const currentSpeed = gpsPosition?.speed ? gpsPosition.speed * 3.6 : 0;

    // Pace calculation (min/km)
    let paceStr = '--';
    if (dist > 50 && durationSecs > 0) {
      const secPerKm = durationSecs / (dist / 1000);
      const paceMin = Math.floor(secPerKm / 60);
      const paceSec = Math.floor(secPerKm % 60);
      paceStr = `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec}`;
    }

    return {
      distanceM: dist,
      maxSpeedKmh: maxSpeed,
      avgSpeedKmh: avgSpeed,
      currentSpeedKmh: currentSpeed,
      minElevM: minAlt === Infinity ? 0 : minAlt,
      maxElevM: maxAlt === -Infinity ? 0 : maxAlt,
      elevGainM: gain,
      elevLossM: loss,
      paceMinPerKm: paceStr
    };
  }, [pointsToInspect, isInspectingSaved, selectedSavedTrack, elapsedSeconds, gpsPosition]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Classic Google My Tracks Title Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  Google My Tracks GPS
                </h2>
                {isRecording && !isInspectingSaved && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600 text-white tracking-wider animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    REC
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">Cadastral field survey recorder & GPX/KML/CSV logger</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isInspectingSaved && (
              <button
                onClick={() => setSelectedSavedTrack(null)}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Back to Live
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Minimize to Map HUD"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Google My Tracks Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Telemetry</span>
          </button>

          <button
            onClick={() => setActiveTab('chart')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'chart'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Elevation</span>
          </button>

          <button
            onClick={() => setActiveTab('waypoints')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'waypoints'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Waypoints ({isInspectingSaved ? (selectedSavedTrack?.waypoints?.length || 0) : currentWaypoints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>History ({savedTracks.length})</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* TAB 1: Classic My Tracks Telemetry Dashboard */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              {isInspectingSaved && (
                <div className="p-3 rounded-2xl bg-blue-950/40 border border-blue-800/60 text-xs text-blue-200 flex items-center justify-between">
                  <span>Viewing saved track: <strong>{selectedSavedTrack?.name}</strong></span>
                  <span className="text-slate-400 font-mono">{new Date(selectedSavedTrack!.startTime).toLocaleDateString()}</span>
                </div>
              )}

              {/* Primary Digital Gauges (Classic My Tracks Large Digits) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Time</span>
                  <span className="text-2xl font-black text-white font-mono mt-1">
                    {formatDuration(isInspectingSaved ? selectedSavedTrack!.durationSeconds : elapsedSeconds)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    {pointsToInspect.length} GPS Fixes
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Distance</span>
                  <span className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {trackMetrics.distanceM >= 1000
                      ? `${(trackMetrics.distanceM / 1000).toFixed(2)} km`
                      : `${trackMetrics.distanceM.toFixed(0)} m`}
                  </span>
                  <span className="text-[10px] text-emerald-500/80 mt-1">
                    {(trackMetrics.distanceM * 3.28084).toFixed(0)} feet
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    {isInspectingSaved ? 'Max Speed' : 'Current Speed'}
                  </span>
                  <span className="text-2xl font-black text-cyan-400 font-mono mt-1">
                    {isInspectingSaved ? trackMetrics.maxSpeedKmh.toFixed(1) : trackMetrics.currentSpeedKmh.toFixed(1)}
                    <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
                  </span>
                  <span className="text-[10px] text-cyan-500/80 mt-1">
                    Pace: {trackMetrics.paceMinPerKm}/km
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Speed</span>
                  <span className="text-2xl font-black text-amber-400 font-mono mt-1">
                    {trackMetrics.avgSpeedKmh.toFixed(1)}
                    <span className="text-xs font-normal text-slate-400 ml-1">km/h</span>
                  </span>
                  <span className="text-[10px] text-amber-500/80 mt-1">
                    Max: {trackMetrics.maxSpeedKmh.toFixed(1)} km/h
                  </span>
                </div>
              </div>

              {/* Secondary Telemetry: Altitude, Gain, Loss, GPS Coordinates */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Current Elev</div>
                  <div className="text-lg font-extrabold text-white font-mono mt-0.5">
                    {gpsPosition?.altitude != null ? `${gpsPosition.altitude.toFixed(1)} m` : '--'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Elev Gain</div>
                  <div className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                    +{trackMetrics.elevGainM.toFixed(1)} m
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Min / Max Elev</div>
                  <div className="text-xs font-extrabold text-slate-300 font-mono mt-1">
                    {trackMetrics.minElevM.toFixed(0)}m / {trackMetrics.maxElevM.toFixed(0)}m
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">GPS Precision</div>
                  <div className="text-xs font-extrabold text-blue-400 font-mono mt-1">
                    {gpsPosition ? `±${gpsPosition.accuracy.toFixed(1)}m` : 'Waiting fix'}
                  </div>
                </div>
              </div>

              {/* Live Status Banner */}
              {!isInspectingSaved && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isRecording && !isPaused ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
                    <span className="text-slate-300 font-medium">
                      {isRecording ? (isPaused ? 'Tracking Paused' : 'Live Tracking Karuvarakundu Terrain...') : 'Ready to record surveyor track'}
                    </span>
                  </div>
                  {gpsPosition && (
                    <span className="text-slate-400 font-mono text-[11px]">
                      {gpsPosition.lat.toFixed(5)}°N, {gpsPosition.lng.toFixed(5)}°E
                    </span>
                  )}
                </div>
              )}

              {/* Track Name Input when ready to start */}
              {!isRecording && !isInspectingSaved && (
                <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                  <label className="block text-xs font-bold text-slate-300">Track Name / Survey Tag</label>
                  <input
                    type="text"
                    placeholder={`e.g. Ward 12 Boundary Run - ${new Date().toLocaleDateString()}`}
                    value={trackNameInput}
                    onChange={(e) => setTrackNameInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500 transition"
                  />
                </div>
              )}

              {/* Big Bottom Action Controls (Google My Tracks Classic) */}
              {!isInspectingSaved && (
                <div className="pt-2">
                  {!isRecording ? (
                    <button
                      onClick={() => {
                        onStartRecording(trackNameInput.trim() || undefined);
                        setTrackNameInput('');
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 active:scale-98 transition"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>START RECORDING TRACK (● REC)</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          const name = prompt('Enter Waypoint Name / Pillar #:', `Point ${currentWaypoints.length + 1}`);
                          if (name) onAddWaypoint(name, 'pillar');
                        }}
                        className="py-3 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                      >
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span>Add Marker</span>
                      </button>

                      {isPaused ? (
                        <button
                          onClick={onResumeRecording}
                          className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <button
                          onClick={onPauseRecording}
                          className="py-3 px-3 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition"
                        >
                          <Pause className="w-4 h-4 fill-current" />
                          <span>Pause</span>
                        </button>
                      )}

                      <button
                        onClick={() => onStopAndSaveTrack()}
                        className="py-3 px-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        <span>Stop & Save</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Elevation & Speed Profile Chart */}
          {activeTab === 'chart' && (
            <div className="space-y-4">
              <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mountain className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Elevation Profile</h3>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Gain: +{trackMetrics.elevGainM.toFixed(0)}m / Loss: -{trackMetrics.elevLossM.toFixed(0)}m
                  </span>
                </div>

                {/* SVG Elevation Chart */}
                {pointsToInspect.length >= 2 ? (
                  <div className="h-44 w-full bg-slate-900/90 rounded-2xl p-2 border border-slate-800 relative flex flex-col justify-between">
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>Max: {trackMetrics.maxElevM.toFixed(0)}m</span>
                      <span>Min: {trackMetrics.minElevM.toFixed(0)}m</span>
                    </div>

                    <svg className="w-full h-28 overflow-visible">
                      <defs>
                        <linearGradient id="elevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Elevation curve */}
                      {(() => {
                        const pts = pointsToInspect.filter((p) => p.altitude != null);
                        if (pts.length < 2) return null;
                        const min = trackMetrics.minElevM;
                        const range = Math.max(1, trackMetrics.maxElevM - min);
                        const width = 100;
                        const height = 90;

                        const polyPoints = pts
                          .map((p, idx) => {
                            const x = (idx / (pts.length - 1)) * 100;
                            const y = height - (((p.altitude || min) - min) / range) * (height - 10);
                            return `${x},${y}`;
                          })
                          .join(' ');

                        const areaPoints = `0,${height} ${polyPoints} 100,${height}`;

                        return (
                          <>
                            <polygon points={areaPoints} fill="url(#elevGrad)" />
                            <polyline
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="2.5"
                              points={polyPoints}
                            />
                          </>
                        );
                      })()}
                    </svg>

                    <div className="text-[10px] text-slate-500 flex justify-between font-mono">
                      <span>0.0 km</span>
                      <span>{(trackMetrics.distanceM / 1000).toFixed(2)} km</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-xs text-slate-500 text-center p-4">
                    Record GPS points with altitude to visualize elevation profile.
                  </div>
                )}
              </div>

              {/* Speed Summary Box */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Avg Speed</div>
                  <div className="text-sm font-bold text-amber-400 font-mono mt-0.5">{trackMetrics.avgSpeedKmh.toFixed(1)} km/h</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Max Speed</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">{trackMetrics.maxSpeedKmh.toFixed(1)} km/h</div>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Pace</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">{trackMetrics.paceMinPerKm}/km</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Waypoints & Markers */}
          {activeTab === 'waypoints' && (
            <div className="space-y-4">
              {!isInspectingSaved && isRecording && (
                <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Drop Waypoint Marker</span>
                    <button
                      onClick={() => setShowWaypointForm(!showWaypointForm)}
                      className="text-xs text-amber-400 font-semibold"
                    >
                      {showWaypointForm ? 'Hide' : '+ Add Waypoint'}
                    </button>
                  </div>

                  {showWaypointForm && (
                    <div className="space-y-3 pt-2">
                      <input
                        type="text"
                        placeholder="e.g. Survey Stone #12 / Boundary Tree"
                        value={waypointNameInput}
                        onChange={(e) => setWaypointNameInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />

                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { id: 'pillar', label: '🪨 Pillar' },
                          { id: 'marker', label: '📍 Corner' },
                          { id: 'note', label: '📝 Note' },
                          { id: 'photo', label: '📸 Photo' }
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setWaypointCategory(c.id as any)}
                            className={`py-1.5 px-2 rounded-xl text-[11px] font-bold text-center transition ${
                              waypointCategory === c.id
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          onAddWaypoint(waypointNameInput.trim() || `Waypoint ${currentWaypoints.length + 1}`, waypointCategory);
                          setWaypointNameInput('');
                          setShowWaypointForm(false);
                        }}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
                      >
                        Save Current GPS Waypoint
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Waypoints List */}
              <div className="space-y-2">
                {((isInspectingSaved ? selectedSavedTrack?.waypoints : currentWaypoints) || []).length > 0 ? (
                  ((isInspectingSaved ? selectedSavedTrack?.waypoints : currentWaypoints) || []).map((w, idx) => (
                    <div
                      key={w.id || idx}
                      className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-white">{w.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {w.lat.toFixed(6)}°, {w.lng.toFixed(6)}°
                            {w.altitude != null && ` | ${w.altitude.toFixed(0)}m`}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(w.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No waypoints marked along this track yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Saved Tracks History & Instant Export */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {savedTracks.length > 0 ? (
                savedTracks.map((track) => {
                  const isVisible = visibleTrackIds.includes(track.id);
                  return (
                    <div
                      key={track.id}
                      className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-white">{track.name}</h4>
                          <p className="text-[11px] text-slate-400">
                            {new Date(track.startTime).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>

                        {/* Visibility on Map Toggle */}
                        <button
                          onClick={() => onToggleTrackVisibility(track.id)}
                          className={`p-2 rounded-xl transition flex items-center gap-1.5 text-xs font-bold ${
                            isVisible
                              ? 'bg-blue-600/30 border border-blue-500 text-blue-400'
                              : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                          title={isVisible ? 'Visible on map' : 'Hidden on map'}
                        >
                          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          <span>{isVisible ? 'On Map' : 'Show'}</span>
                        </button>
                      </div>

                      {/* Track stats chips */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-900/60 p-2.5 rounded-xl">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                          <div className="font-bold text-emerald-400 font-mono">
                            {(track.totalDistanceMeters / 1000).toFixed(2)} km
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Duration</div>
                          <div className="font-bold text-white font-mono">
                            {formatDuration(track.durationSeconds)}
                          </div>
                        </div>

                        <div>
                          <div className="text-[10px] text-slate-400 uppercase">Fixes / Wpts</div>
                          <div className="font-bold text-cyan-400 font-mono">
                            {track.points.length} / {track.waypoints?.length || 0}
                          </div>
                        </div>
                      </div>

                      {/* Export Format Actions (Classic Google My Tracks formats) */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <button
                          onClick={() => exportTrackToGPX(track)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 flex items-center gap-1 transition"
                          title="Export standard GPS Exchange format"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>GPX</span>
                        </button>

                        <button
                          onClick={() => exportTrackToKML(track)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-blue-300 flex items-center gap-1 transition"
                          title="Export Google Earth KML"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>KML</span>
                        </button>

                        <button
                          onClick={() => exportTrackToCSV(track)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1 transition"
                          title="Export Excel / CSV spreadsheet"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>CSV (Excel)</span>
                        </button>

                        <button
                          onClick={() => exportToGeoJSON(track as any, `${track.name}.geojson`)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-purple-300 flex items-center gap-1 transition"
                          title="Export GeoJSON GIS"
                        >
                          <FileCode className="w-3.5 h-3.5" />
                          <span>GeoJSON</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedSavedTrack(track);
                            setActiveTab('stats');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 flex items-center gap-1 ml-auto transition"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => onDeleteTrack(track.id)}
                          className="p-1.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 transition"
                          title="Delete track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p>No saved tracks found. Click "Start Recording Track" to log your first cadastral survey path.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
