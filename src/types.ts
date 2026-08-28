export interface WardInfo {
  wardNo: number;
  wardName: string;
  surveyor: string;
  mobNo: string;
  shapeArea: number;
  remarks: string;
  district: string;
  lsgd: string;
  lsgdType: string;
  origFid: string;
}

export interface GeoFeatureProperty {
  name?: string;
  id?: string;
  ORIG_FID?: string;
  District?: string;
  LSGD?: string;
  Lsgd_Type?: string;
  Mob_No?: string;
  Remarks?: string;
  Shape_Area?: string;
  Shape_Leng?: string;
  Surveyor?: string;
  Ward_Name?: string;
  Ward_No?: string;
  [key: string]: any;
}

export interface GeoJSONGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString' | 'Point';
  coordinates: any;
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string;
  properties: GeoFeatureProperty;
  geometry: GeoJSONGeometry;
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export type BaseMapStyle =
  | 'googleHybrid'
  | 'googleRoadmap'
  | 'googleSatellite'
  | 'googleTerrain'
  | 'satellite'
  | 'osm'
  | 'terrain'
  | 'cartoDark'
  | 'cartoLight';

export interface LayerVisibility {
  boundary: boolean;
  surveyLines: boolean;
  surveyNumbers: boolean;
  surveyLabels?: boolean;
  fieldNotes: boolean;
  gpsTracking: boolean;
  measurements: boolean;
  recordedTracks: boolean;
}

export interface LayerOpacity {
  boundaryFill: number;
  boundaryStroke: number;
  surveyLines: number;
  surveyFill: number;
}

export interface TrackWaypoint {
  id: string;
  name: string;
  description?: string;
  lat: number;
  lng: number;
  altitude?: number | null;
  timestamp: number;
  category?: 'marker' | 'pillar' | 'start' | 'stop' | 'photo' | 'note';
}

export interface TrackPoint {
  lat: number;
  lng: number;
  altitude?: number | null;
  speed?: number | null;
  heading?: number | null;
  timestamp: number;
}

export interface RecordedTrack {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  durationSeconds: number;
  totalDistanceMeters: number;
  avgSpeedKmh?: number;
  maxSpeedKmh?: number;
  points: TrackPoint[];
  waypoints?: TrackWaypoint[];
  color?: string;
  notes?: string;
}

export interface FieldNote {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  surveyNo?: string;
  wardNo?: string;
  surveyorName?: string;
  timestamp: string;
  category: 'boundary_marker' | 'disputed_point' | 'reference_pillar' | 'road_access' | 'general';
}

export interface MeasurePoint {
  lat: number;
  lng: number;
}

export interface GPSPosition {
  lat: number;
  lng: number;
  accuracy: number;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface SelectedFeatureInfo {
  feature: GeoJSONFeature;
  type: 'boundary' | 'survey' | 'custom';
  calculatedAreaSqM: number;
  calculatedPerimeterM: number;
  centroid: [number, number];
}
