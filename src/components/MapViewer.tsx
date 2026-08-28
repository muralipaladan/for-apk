import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  BaseMapStyle,
  LayerVisibility,
  LayerOpacity,
  GeoJSONCollection,
  GeoJSONFeature,
  FieldNote,
  MeasurePoint,
  GPSPosition,
  TrackPoint,
  TrackWaypoint,
  RecordedTrack
} from '../types';
import { getFeatureMetrics, formatLandArea, getDistanceMeters, calculatePolygonAreaSqM } from '../utils/geoUtils';
import { Navigation, Compass, Layers, Crosshair } from 'lucide-react';

interface MapViewerProps {
  boundaryData: GeoJSONCollection;
  surveyData: GeoJSONCollection;
  selectedFeature: GeoJSONFeature | null;
  onSelectFeature: (feature: GeoJSONFeature | null) => void;
  baseMapStyle: BaseMapStyle;
  setBaseMapStyle?: (style: BaseMapStyle) => void;
  layerVisibility: LayerVisibility;
  layerOpacity: LayerOpacity;
  fieldNotes: FieldNote[];
  onSelectNote: (note: FieldNote) => void;
  measureMode: 'none' | 'distance' | 'area';
  measurePoints: MeasurePoint[];
  onAddMeasurePoint: (pt: MeasurePoint) => void;
  gpsPosition: GPSPosition | null;
  followGps: boolean;
  onToggleFollowGps: () => void;
  activeWardFilter: number | null;
  onMapClickCoord: (lat: number, lng: number) => void;
  isAddingNoteMode: boolean;
  currentTrackPoints: TrackPoint[];
  currentWaypoints?: TrackWaypoint[];
  isRecordingTrack: boolean;
  savedTracks: RecordedTrack[];
  visibleTrackIds: string[];
  onOpenLayerMenu?: () => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  boundaryData,
  surveyData,
  selectedFeature,
  onSelectFeature,
  baseMapStyle,
  setBaseMapStyle,
  layerVisibility,
  layerOpacity,
  fieldNotes,
  onSelectNote,
  measureMode,
  measurePoints,
  onAddMeasurePoint,
  gpsPosition,
  followGps,
  onToggleFollowGps,
  activeWardFilter,
  onMapClickCoord,
  isAddingNoteMode,
  currentTrackPoints,
  currentWaypoints = [],
  isRecordingTrack,
  savedTracks,
  visibleTrackIds,
  onOpenLayerMenu
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<{ [key: string]: L.LayerGroup | L.TileLayer }>({});

  // Layer Groups
  const boundaryLayerGroupRef = useRef<L.GeoJSON | null>(null);
  const surveyLayerGroupRef = useRef<L.GeoJSON | null>(null);
  const surveyLabelsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const selectedFeatureLayerRef = useRef<L.GeoJSON | null>(null);
  const fieldNotesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const gpsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const measureLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTrackLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const savedTracksLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Karuvarakundu default center: ~11.115° N, 76.355° E
    const map = L.map(mapContainerRef.current, {
      center: [11.115, 76.355],
      zoom: 14,
      minZoom: 9,
      maxZoom: 22,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Scale control
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(map);

    // Setup Tile Layers - Google Maps & Hybrid as Primary
    const googleHybridLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      maxZoom: 22,
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Google Maps Hybrid'
    });

    const googleRoadmapLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 22,
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Google Maps Standard'
    });

    const googleSatelliteLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 22,
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Google Satellite'
    });

    const googleTerrainLayer = L.tileLayer('https://mt{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['0', '1', '2', '3'],
      attribution: 'Google Terrain'
    });

    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    });

    const satelliteLayer = L.layerGroup([
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }),
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        opacity: 0.85
      })
    ]);

    const terrainLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17
    });

    const cartoDarkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    });

    const cartoLightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    });

    baseLayersRef.current = {
      googleHybrid: googleHybridLayer,
      googleRoadmap: googleRoadmapLayer,
      googleSatellite: googleSatelliteLayer,
      googleTerrain: googleTerrainLayer,
      satellite: satelliteLayer,
      osm: osmLayer,
      terrain: terrainLayer,
      cartoDark: cartoDarkLayer,
      cartoLight: cartoLightLayer
    };

    // Default to Google Hybrid
    googleHybridLayer.addTo(map);

    // Init sub layer groups
    surveyLabelsLayerGroupRef.current = L.layerGroup().addTo(map);
    fieldNotesLayerGroupRef.current = L.layerGroup().addTo(map);
    gpsLayerGroupRef.current = L.layerGroup().addTo(map);
    measureLayerGroupRef.current = L.layerGroup().addTo(map);
    currentTrackLayerGroupRef.current = L.layerGroup().addTo(map);
    savedTracksLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Handle map clicks
    map.on('click', (e: L.LeafletMouseEvent) => {
      onMapClickCoord(e.latlng.lat, e.latlng.lng);
      if (measureMode !== 'none') {
        onAddMeasurePoint({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Base Map Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseLayersRef.current).forEach((layer) => {
      if (map.hasLayer(layer)) {
        map.removeLayer(layer);
      }
    });

    const currentBase = baseLayersRef.current[baseMapStyle];
    if (currentBase) {
      currentBase.addTo(map);
    }
  }, [baseMapStyle]);

  // Update Boundary Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (boundaryLayerGroupRef.current) {
      map.removeLayer(boundaryLayerGroupRef.current);
      boundaryLayerGroupRef.current = null;
    }

    if (!layerVisibility.boundary || !boundaryData.features.length) return;

    const boundaryLayer = L.geoJSON(boundaryData as any, {
      style: {
        color: '#10b981',
        weight: 3.5,
        opacity: layerOpacity.boundaryStroke,
        fillColor: '#059669',
        fillOpacity: layerOpacity.boundaryFill,
        dashArray: '6, 4'
      },
      onEachFeature: (feature, layer) => {
        const metrics = getFeatureMetrics(feature as GeoJSONFeature);
        const areaInfo = formatLandArea(metrics.areaSqM);
        const tooltipContent = `
          <div class="p-1">
            <div class="font-bold text-emerald-400">Karuvarakundu Grama Panchayat</div>
            <div class="text-xs text-slate-300">Total Area: ${areaInfo.acres} (${areaInfo.sqMeters})</div>
            <div class="text-[10px] text-slate-400">Perimeter: ${(metrics.perimeterM / 1000).toFixed(2)} km</div>
          </div>
        `;
        layer.bindTooltip(tooltipContent, {
          className: 'custom-survey-tooltip',
          sticky: true
        });

        layer.on({
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectFeature(feature as GeoJSONFeature);
          }
        });
      }
    });

    boundaryLayer.addTo(map);
    boundaryLayerGroupRef.current = boundaryLayer;

    // Initial fit bounds
    if (boundaryLayer.getBounds().isValid()) {
      map.fitBounds(boundaryLayer.getBounds(), { padding: [30, 30] });
    }
  }, [boundaryData, layerVisibility.boundary, layerOpacity.boundaryFill, layerOpacity.boundaryStroke]);

  // Update Survey Lines Layer & Survey Numbers Badges
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (surveyLayerGroupRef.current) {
      map.removeLayer(surveyLayerGroupRef.current);
      surveyLayerGroupRef.current = null;
    }

    const labelsGroup = surveyLabelsLayerGroupRef.current;
    if (labelsGroup) {
      labelsGroup.clearLayers();
    }

    if (!surveyData.features.length) return;

    // Filter survey lines if ward filter is applied
    const filteredFeatures = activeWardFilter
      ? surveyData.features.filter((f) => {
          const wardStr = f.properties?.Ward_No || f.properties?.Ward_Name;
          if (!wardStr) return true;
          return String(wardStr).includes(String(activeWardFilter));
        })
      : surveyData.features;

    // 1. Render Polygons if visible
    if (layerVisibility.surveyLines) {
      const surveyLayer = L.geoJSON({ type: 'FeatureCollection', features: filteredFeatures } as any, {
        style: (feature) => {
          const isSelected = selectedFeature && selectedFeature.id === feature?.id;
          return {
            color: isSelected ? '#fbbf24' : '#ef4444',
            weight: isSelected ? 3 : 1.5,
            opacity: layerOpacity.surveyLines,
            fillColor: isSelected ? '#f59e0b' : '#ef4444',
            fillOpacity: isSelected ? 0.4 : layerOpacity.surveyFill
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties?.name || feature.properties?.ORIG_FID || feature.id || 'Plot';
          const metrics = getFeatureMetrics(feature as GeoJSONFeature);
          const areaInfo = formatLandArea(metrics.areaSqM);

          layer.bindTooltip(
            `<span class="font-bold text-amber-300">Plot #${name}</span> <span class="text-[10px] text-slate-300">(${areaInfo.cents})</span>`,
            {
              className: 'custom-survey-tooltip',
              permanent: false,
              sticky: true
            }
          );

          layer.on({
            mouseover: (e) => {
              const target = e.target;
              target.setStyle({
                weight: 2.8,
                color: '#38bdf8',
                fillOpacity: 0.35
              });
              target.bringToFront();
            },
            mouseout: (e) => {
              surveyLayer.resetStyle(e.target);
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              onSelectFeature(feature as GeoJSONFeature);
            }
          });
        }
      });

      surveyLayer.addTo(map);
      surveyLayerGroupRef.current = surveyLayer;
    }

    // 2. Render Survey Number Badges directly on map
    if (layerVisibility.surveyNumbers && labelsGroup) {
      filteredFeatures.forEach((feat) => {
        const plotName = feat.properties?.name || feat.properties?.ORIG_FID || feat.id;
        if (!plotName) return;

        const metrics = getFeatureMetrics(feat);
        if (isNaN(metrics.centroid[0]) || isNaN(metrics.centroid[1])) return;

        const isSelected = selectedFeature && selectedFeature.id === feat.id;

        const labelIcon = L.divIcon({
          className: 'survey-number-label-container',
          html: `<span class="survey-number-badge ${isSelected ? 'active' : ''}">${plotName}</span>`,
          iconSize: [36, 18],
          iconAnchor: [18, 9]
        });

        const labelMarker = L.marker([metrics.centroid[0], metrics.centroid[1]], {
          icon: labelIcon,
          interactive: true
        });

        labelMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectFeature(feat);
        });

        labelMarker.addTo(labelsGroup);
      });
    }
  }, [
    surveyData,
    layerVisibility.surveyLines,
    layerVisibility.surveyNumbers,
    layerOpacity.surveyLines,
    layerOpacity.surveyFill,
    activeWardFilter,
    selectedFeature
  ]);

  // Selected Feature Highlighting & Zooming
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedFeatureLayerRef.current) {
      map.removeLayer(selectedFeatureLayerRef.current);
      selectedFeatureLayerRef.current = null;
    }

    if (!selectedFeature) return;

    const highlightLayer = L.geoJSON(selectedFeature as any, {
      style: {
        color: '#fbbf24',
        weight: 3.5,
        opacity: 1,
        fillColor: '#f59e0b',
        fillOpacity: 0.45,
        dashArray: '3, 3'
      }
    });

    highlightLayer.addTo(map);
    selectedFeatureLayerRef.current = highlightLayer;

    if (highlightLayer.getBounds().isValid()) {
      map.fitBounds(highlightLayer.getBounds(), {
        padding: [80, 80],
        maxZoom: 18,
        animate: true
      });
    }
  }, [selectedFeature]);

  // Render Google Maps Authentic Live Blue Dot & Accuracy Circle
  useEffect(() => {
    const group = gpsLayerGroupRef.current;
    const map = mapInstanceRef.current;
    if (!group || !map) return;
    group.clearLayers();

    if (!layerVisibility.gpsTracking || !gpsPosition) return;

    // 1. Google Maps Light Blue Accuracy Circle
    L.circle([gpsPosition.lat, gpsPosition.lng], {
      radius: Math.max(gpsPosition.accuracy, 6),
      color: '#4285f4',
      fillColor: '#4285f4',
      fillOpacity: 0.15,
      weight: 1.2
    }).addTo(group);

    // 2. Google Maps Blue Dot with Heading Cone & Pulsing Ring
    const googleBlueDotIcon = L.divIcon({
      className: 'custom-google-blue-dot-container',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="google-pulse-ring"></div>
          <div class="google-blue-dot"></div>
          ${
            gpsPosition.heading !== null
              ? `<div class="google-heading-cone" style="transform: rotate(${gpsPosition.heading}deg);"></div>`
              : ''
          }
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    const marker = L.marker([gpsPosition.lat, gpsPosition.lng], { icon: googleBlueDotIcon }).addTo(group);
    marker.bindTooltip(
      `<div class="p-1 font-bold text-blue-400 text-xs">My Live GPS Location<br/><span class="text-[10px] text-slate-300 font-normal">Accuracy: ±${gpsPosition.accuracy.toFixed(1)}m</span></div>`,
      { className: 'custom-survey-tooltip', direction: 'top' }
    );

    if (followGps) {
      map.panTo([gpsPosition.lat, gpsPosition.lng], { animate: true });
    }
  }, [gpsPosition, layerVisibility.gpsTracking, followGps]);

  // Render Live Recorded Track (Google My Tracks)
  useEffect(() => {
    const group = currentTrackLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (currentTrackPoints.length < 1) return;

    const latlngs = currentTrackPoints.map((p) => [p.lat, p.lng] as [number, number]);

    // Draw Starting Point Flag
    if (latlngs.length > 0) {
      const startIcon = L.divIcon({
        className: 'track-start-icon',
        html: `
          <div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
            <span style="color: white; font-size: 10px; font-weight: bold;">🚩</span>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11]
      });
      L.marker(latlngs[0], { icon: startIcon }).bindTooltip('Track Start', { className: 'custom-survey-tooltip' }).addTo(group);
    }

    // Draw Live Track Polyline (Vibrant Red with glow)
    if (latlngs.length >= 2) {
      // Glow underlay
      L.polyline(latlngs, {
        color: '#ef4444',
        weight: 6,
        opacity: 0.4
      }).addTo(group);

      // Core line
      L.polyline(latlngs, {
        color: '#dc2626',
        weight: 3.5,
        opacity: 0.95
      }).addTo(group);
    }

    // Render Track Waypoints / Milestone Pins
    if (currentWaypoints && currentWaypoints.length > 0) {
      currentWaypoints.forEach((wpt, index) => {
        const wptIcon = L.divIcon({
          className: 'track-wpt-icon',
          html: `
            <div style="background: #f59e0b; color: #0f172a; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              ${index + 1}
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });

        L.marker([wpt.lat, wpt.lng], { icon: wptIcon })
          .bindTooltip(`<div class="p-1 font-bold text-amber-300 text-xs">#${index + 1} ${wpt.name}</div>`, {
            className: 'custom-survey-tooltip'
          })
          .addTo(group);
      });
    }
  }, [currentTrackPoints, currentWaypoints]);

  // Render Saved Historical Tracks
  useEffect(() => {
    const group = savedTracksLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layerVisibility.recordedTracks) return;

    savedTracks.forEach((track) => {
      if (!visibleTrackIds.includes(track.id)) return;
      if (track.points.length < 2) return;

      const latlngs = track.points.map((p) => [p.lat, p.lng] as [number, number]);

      const poly = L.polyline(latlngs, {
        color: track.color || '#3b82f6',
        weight: 3.5,
        opacity: 0.85
      });

      poly.bindTooltip(
        `<div class="p-1 font-bold text-white text-xs">${track.name}<br/><span class="text-[10px] text-emerald-400">${(track.totalDistanceMeters / 1000).toFixed(2)} km</span></div>`,
        { className: 'custom-survey-tooltip' }
      );

      poly.addTo(group);

      // Render Saved Track Waypoints if any
      if (track.waypoints && track.waypoints.length > 0) {
        track.waypoints.forEach((wpt, index) => {
          const wptIcon = L.divIcon({
            className: 'track-wpt-icon',
            html: `
              <div style="background: #3b82f6; color: white; width: 18px; height: 18px; border-radius: 50%; border: 1.5px solid white; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 800; box-shadow: 0 2px 4px rgba(0,0,0,0.4);">
                ${index + 1}
              </div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
          });

          L.marker([wpt.lat, wpt.lng], { icon: wptIcon })
            .bindTooltip(`<div class="p-1 font-bold text-blue-300 text-xs">${wpt.name}</div>`, {
              className: 'custom-survey-tooltip'
            })
            .addTo(group);
        });
      }
    });
  }, [savedTracks, visibleTrackIds, layerVisibility.recordedTracks]);

  // Render Field Notes Layer
  useEffect(() => {
    const group = fieldNotesLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layerVisibility.fieldNotes) return;

    fieldNotes.forEach((note) => {
      const getCategoryColor = (cat: string) => {
        switch (cat) {
          case 'boundary_marker':
            return '#10b981';
          case 'disputed_point':
            return '#ef4444';
          case 'reference_pillar':
            return '#3b82f6';
          case 'road_access':
            return '#f59e0b';
          default:
            return '#8b5cf6';
        }
      };

      const color = getCategoryColor(note.category);

      const customIcon = L.divIcon({
        className: 'custom-field-note-icon',
        html: `
          <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.4); cursor: pointer;">
            <span style="color: white; font-size: 11px; font-weight: bold;">📌</span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([note.lat, note.lng], { icon: customIcon });
      marker.bindTooltip(
        `<div class="p-1"><div class="font-bold text-emerald-400">${note.title}</div><div class="text-[10px] text-slate-300">${note.category.replace('_', ' ').toUpperCase()}</div></div>`,
        { className: 'custom-survey-tooltip', direction: 'top' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectNote(note);
      });

      marker.addTo(group);
    });
  }, [fieldNotes, layerVisibility.fieldNotes]);

  // Render Measurement Tool Polyline / Polygon & Markers
  useEffect(() => {
    const group = measureLayerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (measurePoints.length === 0) return;

    const latlngs = measurePoints.map((p) => [p.lat, p.lng] as [number, number]);

    // Plot vertex dots
    latlngs.forEach((pt, index) => {
      const vertexIcon = L.divIcon({
        className: 'measure-point-icon',
        html: `<div class="w-4 h-4 bg-amber-400 border-2 border-slate-900 rounded-full shadow-md flex items-center justify-center text-[9px] font-bold text-slate-900">${index + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker(pt, { icon: vertexIcon }).addTo(group);
    });

    if (measureMode === 'distance' && latlngs.length >= 2) {
      const line = L.polyline(latlngs, {
        color: '#f59e0b',
        weight: 3.5,
        dashArray: '4, 4'
      }).addTo(group);

      let totalDist = 0;
      for (let i = 0; i < latlngs.length - 1; i++) {
        totalDist += getDistanceMeters(latlngs[i][0], latlngs[i][1], latlngs[i + 1][0], latlngs[i + 1][1]);
      }

      line.bindTooltip(
        `<div class="font-bold text-amber-400">Total Distance: ${totalDist >= 1000 ? (totalDist / 1000).toFixed(2) + ' km' : totalDist.toFixed(1) + ' m'}</div>`,
        { permanent: true, sticky: true, className: 'custom-survey-tooltip' }
      );
    } else if (measureMode === 'area' && latlngs.length >= 3) {
      const polyCoords = latlngs.map((pt) => [pt[1], pt[0]] as [number, number]);
      const area = calculatePolygonAreaSqM(polyCoords);
      const areaInfo = formatLandArea(area);

      const polygon = L.polygon(latlngs, {
        color: '#f59e0b',
        weight: 2.5,
        fillColor: '#fbbf24',
        fillOpacity: 0.35
      }).addTo(group);

      polygon.bindTooltip(
        `<div class="p-1"><div class="font-bold text-amber-300">Measured Area: ${areaInfo.cents}</div><div class="text-[10px] text-slate-300">${areaInfo.acres} (${areaInfo.sqMeters})</div></div>`,
        { permanent: true, sticky: true, className: 'custom-survey-tooltip' }
      );
    }
  }, [measurePoints, measureMode]);

  // Center on Karuvarakundu Boundary
  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (boundaryLayerGroupRef.current && boundaryLayerGroupRef.current.getBounds().isValid()) {
      map.fitBounds(boundaryLayerGroupRef.current.getBounds(), { padding: [30, 30], animate: true });
    } else {
      map.setView([11.115, 76.355], 13);
    }
  };

  // Center on Live GPS Location
  const handleCenterGPS = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (gpsPosition) {
      map.flyTo([gpsPosition.lat, gpsPosition.lng], 17, { animate: true });
    }
    onToggleFollowGps();
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className={`w-full h-full z-0 ${
          measureMode !== 'none' || isAddingNoteMode
            ? 'cursor-crosshair'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* Floating Action Buttons (Google Maps Style on Bottom-Right) */}
      <div className="absolute right-3 bottom-24 sm:bottom-20 z-30 flex flex-col gap-2.5 pointer-events-auto">
        {/* Layers FAB Button */}
        {onOpenLayerMenu && (
          <button
            type="button"
            onClick={onOpenLayerMenu}
            className="w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 shadow-xl flex items-center justify-center transition active:scale-95"
            title="Google Maps Layers & Details"
          >
            <Layers className="w-5 h-5 text-emerald-400" />
          </button>
        )}

        {/* Reset North / Fit Boundary FAB */}
        <button
          type="button"
          onClick={handleResetView}
          className="w-11 h-11 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white backdrop-blur-md border border-slate-700 shadow-xl flex items-center justify-center transition active:scale-95"
          title="Reset View to Karuvarakundu Boundary"
        >
          <Compass className="w-5 h-5 text-slate-300" />
        </button>

        {/* Google Maps My Location Target FAB */}
        <button
          type="button"
          onClick={handleCenterGPS}
          className={`w-12 h-12 rounded-full shadow-2xl flex items-center justify-center transition active:scale-95 border ${
            followGps
              ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/30 animate-pulse'
              : 'bg-white hover:bg-slate-100 text-blue-600 border-slate-300'
          }`}
          title={followGps ? 'Tracking Location (Follow GPS ON)' : 'Center on My GPS Location'}
        >
          <Crosshair className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
