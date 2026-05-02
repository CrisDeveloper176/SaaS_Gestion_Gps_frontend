import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getVehicles } from '../api/axios';
import { useWebSocket } from '../context/WebSocketContext';
import '../utils/leafletFix'; // Applies the Leaflet default icon patch
import VehicleTrackingSidebar from '../components/GPS/VehicleTrackingSidebar';

// Custom icon for vehicles — color reflects active/inactive status
const createCarIcon = (status) =>
  L.divIcon({
    className: 'custom-car-icon',
    html: `<div style="
      background: ${status === 'active' ? 'var(--accent-secondary)' : '#ef4444'};
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: var(--shadow-md);
      transition: background-color 0.3s ease;
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

export default function GPS() {
  const { subscribe } = useWebSocket();
  const [vehicles, setVehicles] = useState({});
  const pollInterval = useRef(null);
  const mapRef = useRef(null);
  const [lockedVehicle, setLockedVehicle] = useState(null);

  const handleVehicleClick = (vehicle) => {
    if (mapRef.current && vehicle.last_location) {
      setLockedVehicle(vehicle.plate);
      mapRef.current.flyTo(
        [vehicle.last_location.lat, vehicle.last_location.lon],
        16, // Zoom level
        { duration: 1.5 }
      );
    }
  };

  // Follow the locked vehicle when its location changes
  const lockedLocation = lockedVehicle ? vehicles[lockedVehicle]?.last_location : null;
  useEffect(() => {
    if (lockedLocation && mapRef.current) {
      mapRef.current.panTo([lockedLocation.lat, lockedLocation.lon], {
        animate: true,
        duration: 0.5
      });
    }
  }, [lockedLocation?.lat, lockedLocation?.lon]);

  // ── Initial vehicle load ───────────────────────────────────────────────
  const fetchInitialLocations = async () => {
    try {
      const { data } = await getVehicles();
      setVehicles((prev) => {
        const updated = { ...prev };
        data.results?.forEach((v) => {
          // Merge API data. We only preserve the existing last_location if it's newer 
          // than what the API just gave us (to prevent "jumping back" if a WS message 
          // arrived just after the API response was generated).
          const existing = prev[v.plate]?.last_location;
          const incoming = v.last_location;
          
          let finalLocation = incoming;
          if (existing && incoming && existing.timestamp > incoming.timestamp) {
            finalLocation = existing;
          }

          updated[v.plate] = {
            ...v,
            last_location: finalLocation || existing || null,
          };
        });
        return updated;
      });
    } catch (err) {
      console.error('Error fetching initial vehicle locations:', err);
    }
  };

  useEffect(() => {
    fetchInitialLocations();

    // ── Subscribe to vehicle_update messages via shared WebSocket ─────────
    const unsubscribe = subscribe('vehicle_update', (data) => {
      console.log('📡 WS Update received:', data);
      const { plate, location } = data.data ?? {};
      
      if (!plate || !location) {
        console.warn('📡 WS Update ignored: missing plate or location', data);
        return;
      }

      setVehicles((prev) => ({
        ...prev,
        [plate]: {
          ...prev[plate],
          plate,
          last_location: {
            lat: location.latitude,
            lon: location.longitude,
            speed: location.speed,
            timestamp: location.timestamp,
          },
        },
      }));
    });

    // ── Background polling fallback (always runs at 15s) ─────────────────
    // Ensures vehicles with no WS updates (e.g. parked) stay current.
    // The WS subscription above overrides with live data when available.
    pollInterval.current = setInterval(() => {
      fetchInitialLocations();
    }, 15000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval.current);
    };
  }, [subscribe]);

  const center = [-33.4489, -70.6693]; // Default: Santiago, Chile

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Tracking en Tiempo Real</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Monitoreo en vivo de la ubicación y telemetría de la flota usando WebSockets.
        </p>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <div className="glass-card" style={{ flex: 1, padding: 8, position: 'relative', zIndex: 0 }}>
          {lockedVehicle && (
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
              <button 
                onClick={() => setLockedVehicle(null)}
                style={{
                  background: 'var(--accent-primary, #3b82f6)', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 12px', 
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 'bold'
                }}
              >
                <span>🔒 Siguiendo: {lockedVehicle}</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>(Click para soltar)</span>
              </button>
            </div>
          )}
          <MapContainer 
            center={center} 
            zoom={11} 
            style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            ref={mapRef}
          >
            <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {Object.values(vehicles).map((v) => {
            if (!v.last_location) return null;
            return (
              <Marker
                key={v.plate}
                position={[v.last_location.lat, v.last_location.lon]}
                icon={createCarIcon(v.status)}
              >
                <Popup className="dark-popup">
                  <div style={{ padding: 4 }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: 14 }}>Vehículo: {v.plate}</h3>
                    <p style={{ margin: '4px 0', fontSize: 12 }}>
                      <strong>Velocidad:</strong> {v.last_location.speed != null ? Number(v.last_location.speed).toFixed(2) : 'N/A'} km/h
                    </p>
                    {v.last_location.timestamp && (
                      <p style={{ margin: '4px 0', fontSize: 12, color: '#888' }}>
                        {new Date(v.last_location.timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
          </MapContainer>
        </div>

        <VehicleTrackingSidebar vehicles={vehicles} onVehicleClick={handleVehicleClick} />
      </div>
    </div>
  );
}
