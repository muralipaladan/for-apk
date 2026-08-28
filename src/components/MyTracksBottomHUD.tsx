import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  MapPin,
  Maximize2,
  TrendingUp,
  Activity,
  Compass
} from 'lucide-react';
import { TrackPoint, GPSPosition, TrackWaypoint } from '../types';
import { formatDuration } from '../utils/geoUtils';

interface MyTracksBottomHUDProps {
  isRecording: boolean;
  isPaused: boolean;
  currentTrackPoints: TrackPoint[];
  currentWaypoints?: TrackWaypoint[];
  startTime: number | null;
  gpsPosition: GPSPosition | null;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopAndSaveTrack: () => void;
  onOpenFullDashboard: () => void;
  onAddWaypoint: (name: string, category?: 'marker' | 'pillar' | 'start' | 'stop' | 'photo' | 'note') => void;
}

export const MyTracksBottomHUD: React.FC<MyTracksBottomHUDProps> = ({
  isRecording,
  isPaused,
  currentTrackPoints,
  currentWaypoints = [],
  startTime,
  gpsPosition,
  onPauseRecording,
  onResumeRecording,
  onStopAndSaveTrack,
  onOpenFullDashboard,
  onAddWaypoint
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showWaypointDialog, setShowWaypointDialog] = useState(false);
  const [waypointName, setWaypointName] = useState('');
  const [waypointCat, setWaypointCat] = useState<'marker' | 'pillar' | 'photo' | 'note'>('pillar');

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

  // Live Distance calculation
  const liveDistanceMeters = React.useMemo(() => {
    if (currentTrackPoints.length < 2) return 0;
    let dist = 0;
    for (let i = 0; i < currentTrackPoints.length - 1; i++) {
      const p1 = currentTrackPoints[i];
      const p2 = currentTrackPoints[i + 1];
      const R = 6371000;
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      dist += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    return dist;
  }, [currentTrackPoints]);

  const currentSpeedKmh = gpsPosition?.speed ? (gpsPosition.speed * 3.6).toFixed(1) : '0.0';
  const altitudeM = gpsPosition?.altitude != null ? `${gpsPosition.altitude.toFixed(0)}m` : '--';

  if (!isRecording) return null;

  return (
    <>
      {/* Google My Tracks Floating Mobile HUD */}
      <div className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:w-[460px] z-40 bg-slate-950/95 backdrop-blur-md border border-red-500/40 rounded-3xl p-3 shadow-2xl text-white animate-in slide-in-from-bottom-5 duration-200">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {!isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isPaused ? 'bg-amber-400' : 'bg-red-500'}`}></span>
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-red-400">
              {isPaused ? 'PAUSED' : 'MY TRACKS RECORDING'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {currentTrackPoints.length} pts
            </span>
          </div>

          <button
            onClick={onOpenFullDashboard}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-950/50 border border-blue-800/60 px-2.5 py-1 rounded-full font-bold transition"
            title="Open Full Stats & Elevation Chart"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Dashboard</span>
            <Maximize2 className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        {/* Real-time Telemetry Cards */}
        <div className="grid grid-cols-4 gap-2 my-2.5 text-center">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Time</div>
            <div className="text-sm font-extrabold font-mono text-white mt-0.5">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Distance</div>
            <div className="text-sm font-extrabold font-mono text-emerald-400 mt-0.5">
              {liveDistanceMeters >= 1000
                ? `${(liveDistanceMeters / 1000).toFixed(2)}km`
                : `${liveDistanceMeters.toFixed(0)}m`}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Speed</div>
            <div className="text-sm font-extrabold font-mono text-cyan-400 mt-0.5">
              {currentSpeedKmh} <span className="text-[9px] font-normal text-slate-400">km/h</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1.5">
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Elevation</div>
            <div className="text-sm font-extrabold font-mono text-amber-400 mt-0.5">
              {altitudeM}
            </div>
          </div>
        </div>

        {/* Quick Action Touch Bar */}
        <div className="flex items-center gap-2 pt-1">
          {/* Add Waypoint Pin */}
          <button
            onClick={() => setShowWaypointDialog(true)}
            className="flex-1 py-2 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
            title="Mark Survey Point / Pillar"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Mark Point ({currentWaypoints.length})</span>
          </button>

          {/* Pause / Resume */}
          {isPaused ? (
            <button
              onClick={onResumeRecording}
              className="py-2 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
              title="Resume Tracking"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={onPauseRecording}
              className="py-2 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
              title="Pause Tracking"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </button>
          )}

          {/* Stop & Save */}
          <button
            onClick={onStopAndSaveTrack}
            className="py-2 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            title="Finish & Save Track"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop</span>
          </button>
        </div>
      </div>

      {/* Quick Add Waypoint Modal */}
      {showWaypointDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl p-5 max-w-sm w-full shadow-2xl text-white space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Add Track Waypoint</h3>
                <p className="text-[11px] text-slate-400">Save current GPS point as milestone</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Waypoint Name / Label</label>
              <input
                type="text"
                placeholder="e.g. Survey Stone #12 / Boundary Corner"
                value={waypointName}
                onChange={(e) => setWaypointName(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Point Category</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pillar', label: '🪨 Survey Pillar' },
                  { id: 'marker', label: '📍 Boundary Corner' },
                  { id: 'note', label: '📝 Field Note' },
                  { id: 'photo', label: '📸 Reference Point' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setWaypointCat(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-left transition ${
                      waypointCat === item.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowWaypointDialog(false);
                  setWaypointName('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onAddWaypoint(waypointName.trim() || `Point ${currentWaypoints.length + 1}`, waypointCat);
                  setShowWaypointDialog(false);
                  setWaypointName('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg transition"
              >
                Save Waypoint
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
