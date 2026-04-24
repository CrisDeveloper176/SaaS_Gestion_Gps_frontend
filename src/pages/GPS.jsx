import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getVehicles } from '../api/axios';
import { useAuth } from '../context/AuthContext';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for moving vehicles
const createCarIcon = (status) => L.divIcon({
  className: 'custom-car-icon',
  html: `<div style="
    background: ${status === 'active' ? 'var(--accent-secondary)' : '#ef4444'};
    width: 16px; height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: var(--shadow-md);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export default function GPS() {
  const { token } = useAuth(); // or from localStorage directly if token isn't in context
  const [vehicles, setVehicles] = useState({});
  const ws = useRef(null);

  useEffect(() => {
    // 1. Fetch initial locations for all vehicles
    const fetchInitialLocations = async () => {
      try {
        const { data } = await getVehicles();
        const vMap = {};
        data.results?.forEach(v => {
          // Assuming the API returns last_location or we just initialize them
          // If no last_location in vehicle serializer, we'll wait for the WS to populate them
          if (v.last_location) {
             vMap[v.plate] = v;
          } else {
             // Mock start location somewhere in the world (e.g. Santiago, Chile)
             vMap[v.plate] = { ...v, last_location: { lat: -33.4489, lon: -70.6693, speed: 0 } };
          }
        });
        setVehicles(vMap);
      } catch (err) {
        console.error("Error fetching initial vehicles", err);
      }
    };
    
    fetchInitialLocations();

    // 2. Connect to WebSocket
    const accessToken = localStorage.getItem('access_token');
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`ws://localhost:8000/ws/tracking/?token=${accessToken}`);

    ws.current.onopen = () => {
      console.log('Connected to Tracking WebSocket');
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'vehicle_update') {
        const { vehicle_id, plate, location } = data.data;
        
        setVehicles(prev => ({
          ...prev,
          [plate]: {
            ...prev[plate],
            id: vehicle_id,
            plate: plate,
            last_location: {
              lat: location.latitude,
              lon: location.longitude,
              speed: location.speed,
              timestamp: location.timestamp
            }
          }
        }));
      }
    };

    ws.current.onerror = (err) => console.error('WebSocket Error', err);
    ws.current.onclose = () => console.log('WebSocket Closed');

    // Polling Fallback (1.5 segundos) por si el WebSocket falla o no hay Redis
    const interval = setInterval(fetchInitialLocations, 1500);

    return () => {
      clearInterval(interval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

  const center = [-33.4489, -70.6693]; // Default center

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Tracking en Tiempo Real</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Monitoreo en vivo de la ubicación y telemetría de la flota usando WebSockets.
        </p>
      </div>
      
      <div className="glass-card" style={{ flex: 1, padding: 8, position: 'relative', zIndex: 0 }}>
        <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
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
                    <p style={{ margin: '4px 0', fontSize: 12 }}><strong>Velocidad:</strong> {v.last_location.speed} km/h</p>
                    <p style={{ margin: '4px 0', fontSize: 12, color: '#888' }}>
                      {new Date(v.last_location.timestamp).toLocaleString()}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  );
}
