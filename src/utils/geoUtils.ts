import { GeoJSONFeature, GeoJSONCollection, FieldNote, RecordedTrack } from '../types';

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius of the Earth in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total perimeter/length of coordinates in meters
 */
export function calculatePerimeter(coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += getDistanceMeters(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
  }
  return total;
}

/**
 * Calculates geodesic area of a polygon in square meters
 */
export function calculatePolygonAreaSqM(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  
  const R = 6378137; // WGS84 major axis
  let total = 0;
  const len = coords.length;

  for (let i = 0; i < len; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % len];
    const lat1 = (p1[1] * Math.PI) / 180;
    const lat2 = (p2[1] * Math.PI) / 180;
    const lon1 = (p1[0] * Math.PI) / 180;
    const lon2 = (p2[0] * Math.PI) / 180;

    total += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  const area = Math.abs((total * R * R) / 2.0);
  return area;
}

/**
 * Calculate geometry area and perimeter from GeoJSON Feature
 */
export function getFeatureMetrics(feature: GeoJSONFeature): { areaSqM: number; perimeterM: number; centroid: [number, number] } {
  let areaSqM = 0;
  let perimeterM = 0;
  let lats: number[] = [];
  let lngs: number[] = [];

  const extractCoords = (geom: any) => {
    if (geom.type === 'Polygon') {
      const ring = geom.coordinates[0] || [];
      areaSqM += calculatePolygonAreaSqM(ring);
      perimeterM += calculatePerimeter(ring);
      ring.forEach((pt: [number, number]) => {
        lngs.push(pt[0]);
        lats.push(pt[1]);
      });
    } else if (geom.type === 'MultiPolygon') {
      geom.coordinates.forEach((poly: [number, number][][]) => {
        const ring = poly[0] || [];
        areaSqM += calculatePolygonAreaSqM(ring);
        perimeterM += calculatePerimeter(ring);
        ring.forEach((pt: [number, number]) => {
          lngs.push(pt[0]);
          lats.push(pt[1]);
        });
      });
    } else if (geom.type === 'LineString') {
      perimeterM += calculatePerimeter(geom.coordinates);
      geom.coordinates.forEach((pt: [number, number]) => {
        lngs.push(pt[0]);
        lats.push(pt[1]);
      });
    } else if (geom.type === 'MultiLineString') {
      geom.coordinates.forEach((line: [number, number][]) => {
        perimeterM += calculatePerimeter(line);
        line.forEach((pt: [number, number]) => {
          lngs.push(pt[0]);
          lats.push(pt[1]);
        });
      });
    }
  };

  if (feature.geometry) {
    extractCoords(feature.geometry);
  }

  const centroid: [number, number] = [
    lats.length > 0 ? lats.reduce((a, b) => a + b, 0) / lats.length : 11.12,
    lngs.length > 0 ? lngs.reduce((a, b) => a + b, 0) / lngs.length : 76.35,
  ];

  return { areaSqM, perimeterM, centroid };
}

/**
 * Convert Square Meters into Indian Land Units (Cents, Acres, Ares, Sq.Ft)
 */
export function formatLandArea(sqMeters: number): {
  sqMeters: string;
  cents: string;
  acres: string;
  ares: string;
  sqFeet: string;
  hectares: string;
} {
  const cents = sqMeters / 40.468564224;
  const acres = sqMeters / 4046.8564224;
  const ares = sqMeters / 100;
  const sqFeet = sqMeters * 10.7639104;
  const hectares = sqMeters / 10000;

  return {
    sqMeters: sqMeters.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' m²',
    cents: cents.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Cents',
    acres: acres.toLocaleString('en-IN', { maximumFractionDigits: 3 }) + ' Acres',
    ares: ares.toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Ares',
    sqFeet: sqFeet.toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' sq ft',
    hectares: hectares.toLocaleString('en-IN', { maximumFractionDigits: 4 }) + ' Ha'
  };
}

/**
 * Format Decimal Degrees to DMS (Degrees Minutes Seconds)
 */
export function toDMS(coordinate: number, isLat: boolean): string {
  const absolute = Math.abs(coordinate);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

  const direction = isLat
    ? coordinate >= 0 ? 'N' : 'S'
    : coordinate >= 0 ? 'E' : 'W';

  return `${degrees}°${minutes}'${seconds}" ${direction}`;
}

/**
 * Export FeatureCollection to GeoJSON file download
 */
export function exportToGeoJSON(collection: GeoJSONCollection, filename = 'karuvarakundu_gis_export.geojson') {
  const jsonStr = JSON.stringify(collection, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Features to CSV coordinates
 */
export function exportToCSV(features: GeoJSONFeature[], filename = 'survey_plots_summary.csv') {
  const headers = ['Plot Name / Survey No', 'Ward', 'Area (Sq.Meters)', 'Area (Cents)', 'Area (Acres)', 'Perimeter (Meters)', 'Centroid Lat', 'Centroid Lng'];
  const rows = features.map(f => {
    const metrics = getFeatureMetrics(f);
    const cents = (metrics.areaSqM / 40.468564224).toFixed(2);
    const acres = (metrics.areaSqM / 4046.8564224).toFixed(3);
    const name = f.properties?.name || f.properties?.ORIG_FID || f.id || 'N/A';
    const ward = f.properties?.Ward_Name || f.properties?.Ward_No || 'N/A';
    return [
      `"${name}"`,
      `"${ward}"`,
      metrics.areaSqM.toFixed(2),
      cents,
      acres,
      metrics.perimeterM.toFixed(2),
      metrics.centroid[0].toFixed(6),
      metrics.centroid[1].toFixed(6)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Field Notes to CSV
 */
export function exportFieldNotesCSV(notes: FieldNote[], filename = 'surveyor_field_notes.csv') {
  const headers = ['ID', 'Title', 'Category', 'Description', 'Survey No', 'Ward No', 'Surveyor', 'Latitude', 'Longitude', 'Timestamp'];
  const rows = notes.map(n => [
    `"${n.id}"`,
    `"${n.title.replace(/"/g, '""')}"`,
    `"${n.category}"`,
    `"${n.description.replace(/"/g, '""')}"`,
    `"${n.surveyNo || ''}"`,
    `"${n.wardNo || ''}"`,
    `"${n.surveyorName || ''}"`,
    n.lat.toFixed(7),
    n.lng.toFixed(7),
    `"${n.timestamp}"`
  ].join(','));

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Recorded Track to standard GPX format
 */
export function exportTrackToGPX(track: RecordedTrack, filename?: string) {
  const name = filename || `${track.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.gpx`;
  const timeStr = new Date(track.startTime).toISOString();

  const trkpts = track.points
    .map(
      (p) => `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}">
        ${p.altitude != null ? `<ele>${p.altitude.toFixed(1)}</ele>` : ''}
        <time>${new Date(p.timestamp).toISOString()}</time>
        ${p.speed != null ? `<speed>${p.speed.toFixed(2)}</speed>` : ''}
      </trkpt>`
    )
    .join('\n');

  const wptStr = track.waypoints && track.waypoints.length > 0
    ? track.waypoints
        .map(
          (w) => `  <wpt lat="${w.lat.toFixed(7)}" lon="${w.lng.toFixed(7)}">
    ${w.altitude != null ? `<ele>${w.altitude.toFixed(1)}</ele>` : ''}
    <time>${new Date(w.timestamp).toISOString()}</time>
    <name>${w.name}</name>
    <desc>${w.description || ''}</desc>
    <type>${w.category || 'marker'}</type>
  </wpt>`
        )
        .join('\n')
    : '';

  const gpxContent = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Google My Tracks GIS Survey" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${track.name}</name>
    <time>${timeStr}</time>
  </metadata>
${wptStr ? wptStr + '\n' : ''}  <trk>
    <name>${track.name}</name>
    <desc>Survey Boundary Track - Dist: ${(track.totalDistanceMeters / 1000).toFixed(2)} km, Duration: ${Math.round(track.durationSeconds / 60)} min</desc>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

  const blob = new Blob([gpxContent], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export Recorded Track to KML format (Google Earth compatible)
 */
export function exportTrackToKML(track: RecordedTrack, filename?: string) {
  const name = filename || `${track.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.kml`;
  const coordsStr = track.points
    .map((p) => `${p.lng.toFixed(7)},${p.lat.toFixed(7)},${p.altitude != null ? p.altitude.toFixed(1) : '0'}`)
    .join(' ');

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${track.name}</name>
    <description>Distance: ${(track.totalDistanceMeters / 1000).toFixed(2)} km, Duration: ${Math.round(track.durationSeconds / 60)} min</description>
    <Style id="trackStyle">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${track.name}</name>
      <styleUrl>#trackStyle</styleUrl>
      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <altitudeMode>clampToGround</altitudeMode>
        <coordinates>
          ${coordsStr}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Format track time duration (seconds -> HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => (n < 10 ? '0' + n : n.toString());
  if (h > 0) {
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }
  return `${pad(m)}:${pad(s)}`;
}

/**
 * Export Recorded Track to CSV / Excel spreadsheet format (Google My Tracks style)
 */
export function exportTrackToCSV(track: RecordedTrack, filename?: string) {
  const name = filename || `${track.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
  const headers = ['Index', 'Timestamp_ISO', 'Time_Local', 'Latitude', 'Longitude', 'Altitude_m', 'Speed_kmh', 'Heading_deg', 'Type', 'Notes'];
  
  const rows: string[] = [];
  rows.push(headers.join(','));

  // Add waypoints if any
  if (track.waypoints && track.waypoints.length > 0) {
    track.waypoints.forEach((w, idx) => {
      rows.push(
        [
          `WPT_${idx + 1}`,
          `"${new Date(w.timestamp).toISOString()}"`,
          `"${new Date(w.timestamp).toLocaleString('en-IN')}"`,
          w.lat.toFixed(7),
          w.lng.toFixed(7),
          w.altitude != null ? w.altitude.toFixed(1) : '',
          '',
          '',
          `"Waypoint (${w.category || 'marker'})"`,
          `"${(w.name + (w.description ? ' - ' + w.description : '')).replace(/"/g, '""')}"`
        ].join(',')
      );
    });
  }

  // Add track points
  track.points.forEach((p, idx) => {
    rows.push(
      [
        idx + 1,
        `"${new Date(p.timestamp).toISOString()}"`,
        `"${new Date(p.timestamp).toLocaleString('en-IN')}"`,
        p.lat.toFixed(7),
        p.lng.toFixed(7),
        p.altitude != null ? p.altitude.toFixed(1) : '',
        p.speed != null ? (p.speed * 3.6).toFixed(2) : '',
        p.heading != null ? p.heading.toFixed(1) : '',
        '"TrackPoint"',
        '""'
      ].join(',')
    );
  });

  const csvContent = rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
