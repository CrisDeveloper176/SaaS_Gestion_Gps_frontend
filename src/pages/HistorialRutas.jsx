import { useState, useEffect } from 'react';
import { getTrips, getGpsHistory, getVehicles } from '../api/axios';
import { Route as RouteIcon, Search, Navigation, Clock, Gauge, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../utils/leafletFix'; // Shared Leaflet default icon patch

// Colored marker icons via unpkg (reliable CDN, not GitHub raw which is rate-limited)
const startIcon = new L.Icon({
  iconUrl:      'https://unpkg.com/leaflet-color-markers@1.0.0/img/marker-icon-green.png',
  shadowUrl:    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:     [25, 41],
  iconAnchor:   [12, 41],
  popupAnchor:  [1, -34],
  shadowSize:   [41, 41],
});
const endIcon = new L.Icon({
  iconUrl:      'https://unpkg.com/leaflet-color-markers@1.0.0/img/marker-icon-red.png',
  shadowUrl:    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:     [25, 41],
  iconAnchor:   [12, 41],
  popupAnchor:  [1, -34],
  shadowSize:   [41, 41],
});

function formatDuration(isoDuration) {
  if (!isoDuration) return '--';
  // Handle "HH:MM:SS" or "D days, HH:MM:SS" format from DurationField
  const match = isoDuration.match(/(?:(\d+)\s*days?,?\s*)?(\d+):(\d+):(\d+)/);
  if (!match) return isoDuration;
  const days = parseInt(match[1] || 0);
  const hours = parseInt(match[2]) + days * 24;
  const minutes = match[3];
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatDistance(meters) {
  if (!meters) return '--';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/**
 * Returns at most `maxPoints` evenly-distributed samples from an array.
 * Prevents rendering thousands of <CircleMarker> elements for long trips,
 * which would freeze the browser. The polyline uses the full set for accuracy.
 */
function samplePoints(points, maxPoints = 500) {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, i) => i % step === 0);
}

export default function HistorialRutas() {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [tripPoints, setTripPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);

  // Filters
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterVehicle) params.vehicle_id = filterVehicle;
      if (filterDateFrom) params.start_date = filterDateFrom;
      if (filterDateTo) params.end_date = filterDateTo;
      
      const { data } = await getTrips(params);
      setTrips(data.results || []);
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      const { data } = await getVehicles({ limit: 1000 });
      setVehicles(data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchVehicles(); fetchTrips(); }, []);

  const handleSelectTrip = async (trip) => {
    setSelectedTrip(trip);
    setLoadingPoints(true);
    try {
      const { data } = await getGpsHistory({ trip_id: trip.id });
      setTripPoints(data.results || []);
    } catch (err) {
      console.error('Error fetching trip points:', err);
      setTripPoints([]);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTrips();
  };

  const polylinePositions = tripPoints.map(p => [p.lat, p.lng]);

  // Calculate map center from selected trip or default
  const mapCenter = selectedTrip && selectedTrip.start_lat
    ? [selectedTrip.start_lat, selectedTrip.start_lng]
    : [-36.82699, -73.04977];

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <RouteIcon color="var(--accent-primary)" />
            Historial de Rutas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Consulta los viajes realizados por cada vehículo de la flota.
          </p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="glass-card" style={{ padding: 16, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Vehículo</label>
          <select
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
            className="form-control"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
          >
            <option value="" style={{ background: '#1e1e24', color: '#fff' }}>Todos los vehículos</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id} style={{ background: '#1e1e24', color: '#fff' }}>
                {v.plate} - {v.alias || 'Sin alias'}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ minWidth: 160, marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Desde</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="form-control" />
        </div>
        <div className="form-group" style={{ minWidth: 160, marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Hasta</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="form-control" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, height: 42 }}>
          <Search size={16} /> Buscar
        </button>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: selectedTrip ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Trip list */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', maxHeight: selectedTrip ? 560 : 'none' }}>
          <div style={{ overflowY: 'auto', maxHeight: selectedTrip ? 560 : 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 2 }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Vehículo</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Inicio</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Distancia</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 12 }}>Duración</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Cargando viajes...</td></tr>
                ) : trips.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron viajes</td></tr>
                ) : (
                  trips.map(t => (
                    <tr
                      key={t.id}
                      onClick={() => handleSelectTrip(t)}
                      style={{
                        borderBottom: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        background: selectedTrip?.id === t.id ? 'var(--accent-primary-glow)' : 'transparent',
                        transition: 'background 0.2s'
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontFamily: 'monospace', color: 'var(--accent-primary)', fontSize: 13 }}>
                        {t.vehicle_plate}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>
                        {new Date(t.start_time).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 13 }}>
                        {formatDistance(t.distance_meters)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                        {formatDuration(t.duration)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Map + Trip details */}
        {selectedTrip && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                <Navigation size={20} color="var(--accent-primary)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{formatDistance(selectedTrip.distance_meters)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Distancia</div>
              </div>
              <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                <Gauge size={20} color="#f59e0b" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{selectedTrip.max_speed?.toFixed(0) || '--'} <span style={{ fontSize: 12, fontWeight: 400 }}>km/h</span></div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Vel. Máxima</div>
              </div>
              <div className="glass-card" style={{ padding: 16, textAlign: 'center' }}>
                <Clock size={20} color="var(--accent-secondary)" style={{ marginBottom: 8 }} />
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace' }}>{formatDuration(selectedTrip.duration)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Duración</div>
              </div>
            </div>

            {/* Map */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: 12, flex: 1 }}>
              <div style={{ height: 400 }}>
                {loadingPoints ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Cargando ruta...
                  </div>
                ) : (
                  <MapContainer
                    key={selectedTrip.id}
                    center={mapCenter}
                    zoom={14}
                    style={{ height: '100%', width: '100%', borderRadius: 12 }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Route polyline */}
                    {polylinePositions.length >= 2 && (
                      <Polyline
                        positions={polylinePositions}
                        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.8 }}
                      />
                    )}

                    {/* Speed-colored dots — sampled to max 500 points for performance */}
                    {samplePoints(tripPoints).map((p, i) => (
                      <CircleMarker
                        key={i}
                        center={[p.lat, p.lng]}
                        radius={3}
                        pathOptions={{
                          color: p.speed > 100 ? '#ef4444' : p.speed > 60 ? '#f59e0b' : '#10b981',
                          fillColor: p.speed > 100 ? '#ef4444' : p.speed > 60 ? '#f59e0b' : '#10b981',
                          fillOpacity: 0.8
                        }}
                      >
                        <Popup>
                          <strong>{p.speed?.toFixed(0)} km/h</strong><br/>
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Start marker */}
                    {selectedTrip.start_lat && (
                      <Marker position={[selectedTrip.start_lat, selectedTrip.start_lng]} icon={startIcon}>
                        <Popup><strong>🟢 Inicio</strong><br/>{new Date(selectedTrip.start_time).toLocaleString()}</Popup>
                      </Marker>
                    )}
                    {/* End marker */}
                    {selectedTrip.end_lat && (
                      <Marker position={[selectedTrip.end_lat, selectedTrip.end_lng]} icon={endIcon}>
                        <Popup><strong>🔴 Fin</strong><br/>{selectedTrip.end_time ? new Date(selectedTrip.end_time).toLocaleString() : 'En curso'}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                )}
              </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#10b981', marginRight: 4 }} /> &lt;60 km/h</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', marginRight: 4 }} /> 60-100 km/h</span>
              <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#ef4444', marginRight: 4 }} /> &gt;100 km/h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
