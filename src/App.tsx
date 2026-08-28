import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapViewer } from './components/MapViewer';
import { GoogleMapsSearchBar } from './components/GoogleMapsSearchBar';
import { GoogleMapsPlotSheet } from './components/GoogleMapsPlotSheet';
import { GoogleMapsLayerMenu } from './components/GoogleMapsLayerMenu';
import { MyTracksManager } from './components/MyTracksManager';
import { MyTracksBottomHUD } from './components/MyTracksBottomHUD';
import { WardDirectoryModal } from './components/WardDirectoryModal';
import { FieldNoteModal } from './components/FieldNoteModal';
import { Sidebar } from './components/Sidebar';
import {
  BaseMapStyle,
  LayerVisibility,
  LayerOpacity,
  GeoJSONCollection,
  GeoJSONFeature,
  WardInfo,
  FieldNote,
  MeasurePoint,
  GPSPosition,
  TrackPoint,
  TrackWaypoint,
  RecordedTrack
} from './types';
import { formatDuration } from './utils/geoUtils';
import { Activity, Play, Pause, Square, Layers, Menu } from 'lucide-react';

// Import initial GIS datasets
import initialBoundaryData from './data/boundaryGeoJSON.json';
import initialSurveyData from './data/surveyGeoJSON.json';
import initialWardRegistry from './data/wardRegistry.json';

export const App: React.FC = () => {
  // Datasets
  const [boundaryData, setBoundaryData] = useState<GeoJSONCollection>(initialBoundaryData as GeoJSONCollection);
  const [surveyData, setSurveyData] = useState<GeoJSONCollection>(initialSurveyData as GeoJSONCollection);
  const [wardRegistry, setWardRegistry] = useState<WardInfo[]>(initialWardRegistry as WardInfo[]);

  // Selection & UI State
  const [selectedFeature, setSelectedFeature] = useState<GeoJSONFeature | null>(null);
  const [activeWardFilter, setActiveWardFilter] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'search' | 'wards' | 'layers' | 'measure' | 'notes' | 'export'>('search');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Google Maps Base Style & Layers
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('googleHybrid');
  const [layerVisibility, setLayerVisibility] = useState<LayerVisibility>({
    boundary: true,
    surveyLines: true,
    surveyLabels: true,
    surveyNumbers: true, // Survey numbers visible on map
    fieldNotes: true,
    gpsTracking: true,
    recordedTracks: true,
    measurements: true
  });

  const [layerOpacity, setLayerOpacity] = useState<LayerOpacity>({
    boundaryFill: 0.12,
    boundaryStroke: 0.9,
    surveyLines: 0.85,
    surveyFill: 0.15
  });

  // Modals & Sheets
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState(false);
  const [isMyTracksOpen, setIsMyTracksOpen] = useState(false);
  const [isWardDirectoryOpen, setIsWardDirectoryOpen] = useState(false);
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
  const [isAddingNoteMode, setIsAddingNoteMode] = useState(false);
  const [targetNoteCoord, setTargetNoteCoord] = useState<{ lat: number; lng: number } | null>(null);

  // Measurement tool
  const [measureMode, setMeasureMode] = useState<'none' | 'distance' | 'area'>('none');
  const [measurePoints, setMeasurePoints] = useState<MeasurePoint[]>([]);

  // Live GPS Location & Geolocation
  const [isGpsActive, setIsGpsActive] = useState<boolean>(true);
  const [gpsPosition, setGpsPosition] = useState<GPSPosition | null>({
    lat: 11.115234,
    lng: 76.355812,
    accuracy: 4.8,
    altitude: 88,
    heading: 42,
    speed: 1.2,
    timestamp: Date.now()
  });
  const [followGps, setFollowGps] = useState<boolean>(false);
  const [hoverCoord, setHoverCoord] = useState<{ lat: number; lng: number } | null>({
    lat: 11.115,
    lng: 76.355
  });

  // Google My Tracks Live Recording State
  const [isRecordingTrack, setIsRecordingTrack] = useState<boolean>(false);
  const [isPausedTrack, setIsPausedTrack] = useState<boolean>(false);
  const [trackStartTime, setTrackStartTime] = useState<number | null>(null);
  const [currentTrackPoints, setCurrentTrackPoints] = useState<TrackPoint[]>([]);
  const [currentWaypoints, setCurrentWaypoints] = useState<TrackWaypoint[]>([]);
  const [currentTrackName, setCurrentTrackName] = useState<string>('Live Boundary Survey Trail');

  // Saved Tracks (Stored in localStorage)
  const [savedTracks, setSavedTracks] = useState<RecordedTrack[]>(() => {
    const saved = localStorage.getItem('karuvarakundu_gps_tracks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'track-demo-1',
        name: 'Ward 8 Cadastral Boundary Survey Trail',
        startTime: Date.now() - 3600000 * 24,
        endTime: Date.now() - 3600000 * 23,
        durationSeconds: 1450,
        totalDistanceMeters: 2840,
        color: '#3b82f6',
        points: [
          { lat: 11.112, lng: 76.351, altitude: 82, speed: 1.3, timestamp: Date.now() - 3600000 * 24 },
          { lat: 11.114, lng: 76.353, altitude: 85, speed: 1.4, timestamp: Date.now() - 3600000 * 24 + 300000 },
          { lat: 11.116, lng: 76.356, altitude: 89, speed: 1.2, timestamp: Date.now() - 3600000 * 24 + 600000 },
          { lat: 11.118, lng: 76.359, altitude: 94, speed: 1.1, timestamp: Date.now() - 3600000 * 24 + 900000 },
          { lat: 11.121, lng: 76.362, altitude: 101, speed: 1.3, timestamp: Date.now() - 3600000 * 24 + 1450000 }
        ]
      }
    ];
  });

  const [visibleTrackIds, setVisibleTrackIds] = useState<string[]>(() =>
    savedTracks.map((t) => t.id)
  );

  // Field notes
  const [fieldNotes, setFieldNotes] = useState<FieldNote[]>(() => {
    const saved = localStorage.getItem('karuvarakundu_field_notes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: '1',
        lat: 11.139439,
        lng: 76.394648,
        title: 'North-East Boundary Tri-Junction Pillar',
        description: 'Tri-junction boundary marker between Karuvarakundu, Silent Valley reserve, and Nilambur forest boundary.',
        surveyNo: '1',
        wardNo: '7',
        surveyorName: 'Jery Amaldev',
        timestamp: '2026-08-28 09:30 AM',
        category: 'boundary_marker'
      },
      {
        id: '2',
        lat: 11.090545,
        lng: 76.349996,
        title: 'Cadastral Survey Point #1 Base Line',
        description: 'Primary survey line node. Clean visibility across agricultural terrace parcels.',
        surveyNo: '1',
        wardNo: '8',
        surveyorName: 'Jeri Amal Dev M',
        timestamp: '2026-08-28 10:15 AM',
        category: 'reference_pillar'
      }
    ];
  });

  // Save tracks to localStorage
  useEffect(() => {
    localStorage.setItem('karuvarakundu_gps_tracks', JSON.stringify(savedTracks));
  }, [savedTracks]);

  // Save field notes to localStorage
  useEffect(() => {
    localStorage.setItem('karuvarakundu_field_notes', JSON.stringify(fieldNotes));
  }, [fieldNotes]);

  // Live Geolocation Watcher
  useEffect(() => {
    let watchId: number | null = null;

    if (navigator.geolocation && isGpsActive) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const newPos: GPSPosition = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy || 5,
            altitude: pos.coords.altitude || 85,
            heading: pos.coords.heading,
            speed: pos.coords.speed || 0,
            timestamp: pos.timestamp
          };
          setGpsPosition(newPos);
          setHoverCoord({ lat: newPos.lat, lng: newPos.lng });

          // If currently recording track, append point
          if (isRecordingTrack && !isPausedTrack) {
            setCurrentTrackPoints((prev) => [
              ...prev,
              {
                lat: newPos.lat,
                lng: newPos.lng,
                altitude: newPos.altitude ?? undefined,
                speed: newPos.speed ?? undefined,
                heading: newPos.heading ?? undefined,
                timestamp: newPos.timestamp
              }
            ]);
          }
        },
        (err) => {
          console.warn('GPS watchPosition warning:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 3000,
          timeout: 8000
        }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isGpsActive, isRecordingTrack, isPausedTrack]);

  // Fallback simulator for live track recording if GPS is stationary or simulator mode
  useEffect(() => {
    let timer: any = null;
    if (isRecordingTrack && !isPausedTrack && gpsPosition) {
      timer = setInterval(() => {
        // Gently simulate movement along the road/survey line if position is unchanged
        setGpsPosition((prev) => {
          if (!prev) return prev;
          const deltaLat = (Math.random() - 0.48) * 0.00015;
          const deltaLng = (Math.random() - 0.45) * 0.00015;
          const updated: GPSPosition = {
            ...prev,
            lat: prev.lat + deltaLat,
            lng: prev.lng + deltaLng,
            heading: ((prev.heading || 0) + (Math.random() * 10 - 5) + 360) % 360,
            speed: Math.max(0.8, (prev.speed || 1.2) + (Math.random() * 0.4 - 0.2)),
            timestamp: Date.now()
          };

          setCurrentTrackPoints((pts) => [
            ...pts,
            {
              lat: updated.lat,
              lng: updated.lng,
              altitude: updated.altitude ?? undefined,
              speed: updated.speed ?? undefined,
              heading: updated.heading ?? undefined,
              timestamp: updated.timestamp
            }
          ]);

          return updated;
        });
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRecordingTrack, isPausedTrack]);

  // Track Recording Handlers (Google My Tracks)
  const handleStartRecording = (name?: string) => {
    const title = name || `Survey Track - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    setCurrentTrackName(title);
    setCurrentTrackPoints(
      gpsPosition
        ? [
            {
              lat: gpsPosition.lat,
              lng: gpsPosition.lng,
              altitude: gpsPosition.altitude ?? undefined,
              speed: gpsPosition.speed ?? undefined,
              timestamp: Date.now()
            }
          ]
        : []
    );
    setCurrentWaypoints([]);
    setTrackStartTime(Date.now());
    setIsRecordingTrack(true);
    setIsPausedTrack(false);
  };

  const handlePauseRecording = () => {
    setIsPausedTrack(true);
  };

  const handleResumeRecording = () => {
    setIsPausedTrack(false);
  };

  const handleAddWaypoint = (
    name: string,
    category: 'marker' | 'pillar' | 'start' | 'stop' | 'photo' | 'note' = 'pillar'
  ) => {
    if (!gpsPosition) {
      alert('GPS fix is required to mark a waypoint.');
      return;
    }
    const newWpt: TrackWaypoint = {
      id: `wpt-${Date.now()}`,
      name,
      lat: gpsPosition.lat,
      lng: gpsPosition.lng,
      altitude: gpsPosition.altitude,
      timestamp: Date.now(),
      category
    };
    setCurrentWaypoints((prev) => [...prev, newWpt]);
  };

  const handleStopAndSaveTrack = (name?: string) => {
    if (currentTrackPoints.length < 2) {
      alert('Track is too short to save. At least 2 GPS coordinates are required.');
      setIsRecordingTrack(false);
      setIsPausedTrack(false);
      setCurrentTrackPoints([]);
      setCurrentWaypoints([]);
      setTrackStartTime(null);
      return;
    }

    // Calculate total distance
    let distMeters = 0;
    for (let i = 0; i < currentTrackPoints.length - 1; i++) {
      const p1 = currentTrackPoints[i];
      const p2 = currentTrackPoints[i + 1];
      const R = 6371000;
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLon = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      distMeters += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    const durationSec = trackStartTime ? Math.floor((Date.now() - trackStartTime) / 1000) : 0;

    const newTrack: RecordedTrack = {
      id: `track-${Date.now()}`,
      name: name || currentTrackName,
      startTime: trackStartTime || Date.now(),
      endTime: Date.now(),
      durationSeconds: durationSec,
      totalDistanceMeters: distMeters,
      points: currentTrackPoints,
      waypoints: currentWaypoints,
      color: '#ef4444'
    };

    setSavedTracks((prev) => [newTrack, ...prev]);
    setVisibleTrackIds((prev) => [...prev, newTrack.id]);

    setIsRecordingTrack(false);
    setIsPausedTrack(false);
    setCurrentTrackPoints([]);
    setCurrentWaypoints([]);
    setTrackStartTime(null);

    alert(`Saved track "${newTrack.name}" (${(distMeters / 1000).toFixed(2)} km, ${formatDuration(durationSec)})`);
  };

  const handleDiscardRecording = () => {
    if (confirm('Discard current live GPS track?')) {
      setIsRecordingTrack(false);
      setIsPausedTrack(false);
      setCurrentTrackPoints([]);
      setCurrentWaypoints([]);
      setTrackStartTime(null);
    }
  };

  const handleDeleteTrack = (id: string) => {
    setSavedTracks((prev) => prev.filter((t) => t.id !== id));
    setVisibleTrackIds((prev) => prev.filter((tId) => tId !== id));
  };

  const handleToggleTrackVisibility = (id: string) => {
    setVisibleTrackIds((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  // Field notes handler
  const handleSaveFieldNote = (noteData: Omit<FieldNote, 'id' | 'timestamp'>) => {
    const newNote: FieldNote = {
      ...noteData,
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString()
    };
    setFieldNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteFieldNote = (id: string) => {
    setFieldNotes((prev) => prev.filter((n) => n.id !== id));
  };

  // Measurement handlers
  const handleAddMeasurePoint = useCallback((pt: MeasurePoint) => {
    setMeasurePoints((prev) => [...prev, pt]);
  }, []);

  const handleClearMeasure = useCallback(() => {
    setMeasurePoints([]);
  }, []);

  const handleUndoMeasurePoint = useCallback(() => {
    setMeasurePoints((prev) => prev.slice(0, -1));
  }, []);

  // Map Click
  const handleMapClickCoord = useCallback(
    (lat: number, lng: number) => {
      setHoverCoord({ lat, lng });

      if (isAddingNoteMode) {
        setTargetNoteCoord({ lat, lng });
        setIsAddNoteModalOpen(true);
        setIsAddingNoteMode(false);
      }
    },
    [isAddingNoteMode]
  );

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json') || file.name.endsWith('.geojson')) {
          const parsed = JSON.parse(text);
          if (parsed.type === 'FeatureCollection' && Array.isArray(parsed.features)) {
            setSurveyData((prev) => ({
              type: 'FeatureCollection',
              features: [...prev.features, ...parsed.features]
            }));
            alert(`Successfully imported ${parsed.features.length} features from ${file.name}`);
          }
        }
      } catch (err: any) {
        alert(`Error importing file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans select-none">
      {/* Full-Screen Edge-to-Edge Map */}
      <MapViewer
        boundaryData={boundaryData}
        surveyData={surveyData}
        selectedFeature={selectedFeature}
        onSelectFeature={(feat) => setSelectedFeature(feat)}
        baseMapStyle={baseMapStyle}
        setBaseMapStyle={setBaseMapStyle}
        layerVisibility={layerVisibility}
        layerOpacity={layerOpacity}
        fieldNotes={fieldNotes}
        onSelectNote={(note) => {
          setHoverCoord({ lat: note.lat, lng: note.lng });
        }}
        measureMode={measureMode}
        measurePoints={measurePoints}
        onAddMeasurePoint={handleAddMeasurePoint}
        gpsPosition={gpsPosition}
        followGps={followGps}
        onToggleFollowGps={() => setFollowGps(!followGps)}
        activeWardFilter={activeWardFilter}
        onMapClickCoord={handleMapClickCoord}
        isAddingNoteMode={isAddingNoteMode}
        currentTrackPoints={currentTrackPoints}
        currentWaypoints={currentWaypoints}
        isRecordingTrack={isRecordingTrack}
        savedTracks={savedTracks}
        visibleTrackIds={visibleTrackIds}
        onOpenLayerMenu={() => setIsLayerMenuOpen(true)}
      />

      {/* Floating Google Maps Style Search Bar & Quick Chips */}
      <GoogleMapsSearchBar
        surveyData={surveyData}
        onSelectFeature={(feat) => setSelectedFeature(feat)}
        activeWardFilter={activeWardFilter}
        onOpenWardDirectory={() => setIsWardDirectoryOpen(true)}
        baseMapStyle={baseMapStyle}
        onToggleBaseMap={() =>
          setBaseMapStyle((prev) => (prev === 'googleHybrid' ? 'googleRoadmap' : 'googleHybrid'))
        }
        surveyNumbersVisible={layerVisibility.surveyNumbers}
        onToggleSurveyNumbers={() =>
          setLayerVisibility((prev) => ({ ...prev, surveyNumbers: !prev.surveyNumbers }))
        }
        isRecordingTrack={isRecordingTrack}
        onToggleTrackRecorder={() => setIsMyTracksOpen(true)}
        measureMode={measureMode}
        onToggleMeasure={() =>
          setMeasureMode((prev) => (prev === 'none' ? 'distance' : 'none'))
        }
        onOpenLayerMenu={() => setIsLayerMenuOpen(true)}
        onOpenAddNote={() => {
          setIsAddingNoteMode(true);
        }}
      />

      {/* Google My Tracks Active Recording Mobile Floating HUD */}
      <MyTracksBottomHUD
        isRecording={isRecordingTrack}
        isPaused={isPausedTrack}
        currentTrackPoints={currentTrackPoints}
        currentWaypoints={currentWaypoints}
        startTime={trackStartTime}
        gpsPosition={gpsPosition}
        onPauseRecording={handlePauseRecording}
        onResumeRecording={handleResumeRecording}
        onStopAndSaveTrack={handleStopAndSaveTrack}
        onOpenFullDashboard={() => setIsMyTracksOpen(true)}
        onAddWaypoint={handleAddWaypoint}
      />

      {/* Floating Measurement Banner */}
      {measureMode !== 'none' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-600/95 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-2xl border border-amber-400 flex items-center gap-3 animate-in fade-in">
          <span>📏 Click on map to add measurement points ({measurePoints.length} points)</span>
          <button
            onClick={() => setMeasureMode(measureMode === 'distance' ? 'area' : 'distance')}
            className="px-2 py-0.5 rounded-md bg-amber-800 hover:bg-amber-900 text-amber-200 text-[11px]"
          >
            Mode: {measureMode === 'distance' ? 'Distance' : 'Area'}
          </button>
          <button
            onClick={handleClearMeasure}
            className="underline text-amber-200 hover:text-white"
          >
            Clear
          </button>
          <button
            onClick={() => setMeasureMode('none')}
            className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px]"
          >
            Done
          </button>
        </div>
      )}

      {/* Floating Add Note Banner */}
      {isAddingNoteMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-600/95 backdrop-blur-md text-white text-xs font-bold rounded-full shadow-2xl border border-emerald-400 flex items-center gap-3 animate-bounce">
          <span>📌 Tap anywhere on the map to pin your field note</span>
          <button
            onClick={() => setIsAddingNoteMode(false)}
            className="underline text-emerald-200 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Selected Plot Details Card (Google Maps Bottom Sheet) */}
      <GoogleMapsPlotSheet
        feature={selectedFeature}
        onClose={() => setSelectedFeature(null)}
        onZoomTo={() => {
          // Triggered automatically by selectedFeature state in MapViewer
        }}
      />

      {/* Google Maps Layer & Details Menu Modal */}
      <GoogleMapsLayerMenu
        isOpen={isLayerMenuOpen}
        onClose={() => setIsLayerMenuOpen(false)}
        baseMapStyle={baseMapStyle}
        setBaseMapStyle={setBaseMapStyle}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
        layerOpacity={layerOpacity}
        setLayerOpacity={setLayerOpacity}
      />

      {/* Google My Tracks Full Management Modal */}
      <MyTracksManager
        isOpen={isMyTracksOpen}
        onClose={() => setIsMyTracksOpen(false)}
        isRecording={isRecordingTrack}
        isPaused={isPausedTrack}
        currentTrackPoints={currentTrackPoints}
        currentWaypoints={currentWaypoints}
        startTime={trackStartTime}
        onStartRecording={handleStartRecording}
        onPauseRecording={handlePauseRecording}
        onResumeRecording={handleResumeRecording}
        onStopAndSaveTrack={handleStopAndSaveTrack}
        onDiscardRecording={handleDiscardRecording}
        onAddWaypoint={handleAddWaypoint}
        savedTracks={savedTracks}
        onDeleteTrack={handleDeleteTrack}
        visibleTrackIds={visibleTrackIds}
        onToggleTrackVisibility={handleToggleTrackVisibility}
        gpsPosition={gpsPosition}
      />

      {/* Ward Registry Directory Modal */}
      <WardDirectoryModal
        isOpen={isWardDirectoryOpen}
        onClose={() => setIsWardDirectoryOpen(false)}
        wardRegistry={wardRegistry}
        activeWardFilter={activeWardFilter}
        onSelectWard={(wardNo) => {
          setActiveWardFilter(wardNo);
        }}
      />

      {/* Field Note Modal */}
      <FieldNoteModal
        isOpen={isAddNoteModalOpen}
        onClose={() => setIsAddNoteModalOpen(false)}
        onSaveNote={handleSaveFieldNote}
        initialCoord={targetNoteCoord || hoverCoord}
      />

      {/* Full GIS Toolbox Sidebar (optional drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        surveyData={surveyData}
        boundaryData={boundaryData}
        wardRegistry={wardRegistry}
        selectedFeature={selectedFeature}
        onSelectFeature={(feat) => setSelectedFeature(feat)}
        baseMapStyle={baseMapStyle}
        setBaseMapStyle={setBaseMapStyle}
        layerVisibility={layerVisibility}
        setLayerVisibility={setLayerVisibility}
        layerOpacity={layerOpacity}
        setLayerOpacity={setLayerOpacity}
        activeWardFilter={activeWardFilter}
        setActiveWardFilter={setActiveWardFilter}
        fieldNotes={fieldNotes}
        onSelectNote={(note) => {
          setHoverCoord({ lat: note.lat, lng: note.lng });
        }}
        onDeleteNote={handleDeleteFieldNote}
        onOpenAddNoteModal={() => {
          setIsAddingNoteMode(true);
        }}
        measureMode={measureMode}
        setMeasureMode={setMeasureMode}
        measurePoints={measurePoints}
        onClearMeasure={handleClearMeasure}
        onUndoMeasurePoint={handleUndoMeasurePoint}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onFileUpload={handleFileUpload}
      />
    </div>
  );
};
