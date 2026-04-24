import { useState, useEffect, useRef, useCallback } from 'react';
import { getGeofences, createGeofence, updateGeofence, deleteGeofence } from '../api/axios';
import { MapPin, Plus, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Polygon, Circle, useMapEvents, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

// Component to draw polygons by clicking on the map
function DrawingLayer({ isDrawing, drawingType, points, setPoints, circleCenter, setCircleCenter }) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      const { lat, lng } = e.latlng;
      if (drawingType === 'POLYGON') {
        setPoints(prev => [...prev, [lat, lng]]);
      } else if (drawingType === 'CIRCLE') {
        if (!circleCenter) {
          setCircleCenter([lat, lng]);
        }
      }
    }
  });
  return null;
}

export default function Geocercas() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingType, setDrawingType] = useState('POLYGON');
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(500);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    shape_type: 'POLYGON',
    color: '#3b82f6',
    is_active: true
  });

  const fetchGeofences = async () => {
    setLoading(true);
    try {
      const { data } = await getGeofences();
      setGeofences(data.results || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar geocercas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGeofences(); }, []);

  const resetDrawing = () => {
    setDrawnPoints([]);
    setCircleCenter(null);
    setCircleRadius(500);
    setIsDrawing(false);
  };

  const handleOpenForm = (geofence = null) => {
    if (geofence) {
      setEditingGeofence(geofence);
      setFormData({
        name: geofence.name,
        shape_type: geofence.shape_type,
        color: geofence.color,
        is_active: geofence.is_active
      });
      if (geofence.shape_type === 'POLYGON') {
        setDrawnPoints(geofence.coordinates || []);
        setDrawingType('POLYGON');
      } else {
        setCircleCenter([geofence.center_lat, geofence.center_lng]);
        setCircleRadius(geofence.radius_meters || 500);
        setDrawingType('CIRCLE');
      }
    } else {
      setEditingGeofence(null);
      setFormData({ name: '', shape_type: 'POLYGON', color: '#3b82f6', is_active: true });
      resetDrawing();
      setDrawingType('POLYGON');
    }
    setShowForm(true);
    setIsDrawing(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGeofence(null);
    resetDrawing();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.shape_type === 'POLYGON' && drawnPoints.length < 3) {
      toast.error('Dibuja al menos 3 puntos en el mapa para crear un polígono');
      return;
    }
    if (formData.shape_type === 'CIRCLE' && !circleCenter) {
      toast.error('Haz clic en el mapa para definir el centro del círculo');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        coordinates: formData.shape_type === 'POLYGON' ? drawnPoints : [],
        center_lat: formData.shape_type === 'CIRCLE' ? circleCenter[0] : null,
        center_lng: formData.shape_type === 'CIRCLE' ? circleCenter[1] : null,
        radius_meters: formData.shape_type === 'CIRCLE' ? circleRadius : null,
      };

      if (editingGeofence) {
        await updateGeofence(editingGeofence.id, payload);
        toast.success('Geocerca actualizada');
      } else {
        await createGeofence(payload);
        toast.success('Geocerca creada');
      }
      handleCloseForm();
      fetchGeofences();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar geocerca');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta geocerca?')) {
      try {
        await deleteGeofence(id);
        toast.success('Geocerca eliminada');
        fetchGeofences();
      } catch (err) {
        toast.error('Error al eliminar');
      }
    }
  };

  const handleShapeTypeChange = (type) => {
    setFormData(prev => ({ ...prev, shape_type: type }));
    setDrawingType(type);
    resetDrawing();
    setIsDrawing(true);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <MapPin color="var(--accent-primary)" />
            Geocercas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Define zonas geográficas y recibe alertas cuando los vehículos entren o salgan.
          </p>
        </div>
        <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Nueva Geocerca
        </button>
      </div>

      {/* Mapa */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24, borderRadius: 12 }}>
        <div style={{ height: 500 }}>
          <MapContainer
            center={[-36.82699, -73.04977]}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: 12 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DrawingLayer
              isDrawing={isDrawing}
              drawingType={drawingType}
              points={drawnPoints}
              setPoints={setDrawnPoints}
              circleCenter={circleCenter}
              setCircleCenter={setCircleCenter}
            />

            {/* Render existing geofences */}
            {geofences.filter(g => g.is_active).map(g => (
              g.shape_type === 'POLYGON' && g.coordinates?.length >= 3 ? (
                <Polygon
                  key={g.id}
                  positions={g.coordinates}
                  pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.2, weight: 2 }}
                >
                  <Popup>
                    <strong>{g.name}</strong>
                  </Popup>
                </Polygon>
              ) : g.shape_type === 'CIRCLE' && g.center_lat ? (
                <Circle
                  key={g.id}
                  center={[g.center_lat, g.center_lng]}
                  radius={g.radius_meters}
                  pathOptions={{ color: g.color, fillColor: g.color, fillOpacity: 0.2, weight: 2 }}
                >
                  <Popup>
                    <strong>{g.name}</strong><br/>Radio: {g.radius_meters}m
                  </Popup>
                </Circle>
              ) : null
            ))}

            {/* Drawing preview */}
            {isDrawing && drawingType === 'POLYGON' && drawnPoints.length >= 2 && (
              <Polygon
                positions={drawnPoints}
                pathOptions={{ color: formData.color, fillColor: formData.color, fillOpacity: 0.3, weight: 2, dashArray: '5, 10' }}
              />
            )}
            {isDrawing && drawingType === 'POLYGON' && drawnPoints.map((p, i) => (
              <Marker key={i} position={p}>
                <Popup>Punto {i + 1}</Popup>
              </Marker>
            ))}
            {isDrawing && drawingType === 'CIRCLE' && circleCenter && (
              <Circle
                center={circleCenter}
                radius={circleRadius}
                pathOptions={{ color: formData.color, fillColor: formData.color, fillOpacity: 0.3, weight: 2, dashArray: '5, 10' }}
              />
            )}
            {isDrawing && drawingType === 'CIRCLE' && circleCenter && (
              <Marker position={circleCenter}>
                <Popup>Centro del círculo</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Drawing instructions / form */}
      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: 24, padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>
            {editingGeofence ? 'Editar Geocerca' : 'Crear Nueva Geocerca'}
          </h2>

          {isDrawing && (
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
              fontSize: 14,
              color: 'var(--text-secondary)'
            }}>
              {drawingType === 'POLYGON'
                ? `🖱️ Haz clic en el mapa para dibujar los vértices del polígono (${drawnPoints.length} puntos colocados, mínimo 3)`
                : circleCenter
                  ? `✅ Centro definido. Ajusta el radio abajo.`
                  : `🖱️ Haz clic en el mapa para definir el centro del círculo`
              }
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="form-control"
                placeholder="Ej. Base Central, Zona Prohibida"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Forma</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('POLYGON')}
                  style={{
                    flex: 1, padding: '10px', border: '1px solid',
                    borderColor: drawingType === 'POLYGON' ? 'var(--accent-primary)' : 'var(--border-light)',
                    background: drawingType === 'POLYGON' ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer', fontSize: 13
                  }}
                >
                  ⬡ Polígono
                </button>
                <button
                  type="button"
                  onClick={() => handleShapeTypeChange('CIRCLE')}
                  style={{
                    flex: 1, padding: '10px', border: '1px solid',
                    borderColor: drawingType === 'CIRCLE' ? 'var(--accent-primary)' : 'var(--border-light)',
                    background: drawingType === 'CIRCLE' ? 'rgba(59,130,246,0.15)' : 'transparent',
                    color: 'var(--text-primary)', borderRadius: 8, cursor: 'pointer', fontSize: 13
                  }}
                >
                  ⬤ Círculo
                </button>
              </div>
            </div>

            {drawingType === 'CIRCLE' && (
              <div className="form-group">
                <label className="form-label">Radio (metros): {circleRadius}m</label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="50"
                  value={circleRadius}
                  onChange={e => setCircleRadius(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  <span>100m</span><span>10km</span>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                    style={{
                      width: 32, height: 32, borderRadius: '50%', background: c,
                      border: formData.color === c ? '3px solid white' : '2px solid transparent',
                      cursor: 'pointer', boxShadow: formData.color === c ? `0 0 10px ${c}` : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {drawingType === 'POLYGON' && drawnPoints.length > 0 && (
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <button
                  type="button"
                  onClick={() => setDrawnPoints(prev => prev.slice(0, -1))}
                  style={{
                    background: 'transparent', border: '1px solid var(--border-light)',
                    color: 'var(--text-secondary)', padding: '8px 16px', borderRadius: 8,
                    cursor: 'pointer', fontSize: 13
                  }}
                >
                  ↩ Deshacer último punto ({drawnPoints.length} puntos)
                </button>
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={handleCloseForm} className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Geocerca'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de geocercas */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Color</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Nombre</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Tipo</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Detalle</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Estado</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando geocercas...</td></tr>
            ) : geofences.length === 0 ? (
              <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay geocercas configuradas</td></tr>
            ) : (
              geofences.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: g.color, boxShadow: `0 0 8px ${g.color}40` }} />
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>{g.name}</td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                    {g.shape_type === 'POLYGON' ? '⬡ Polígono' : '⬤ Círculo'}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13 }}>
                    {g.shape_type === 'POLYGON'
                      ? `${g.coordinates?.length || 0} vértices`
                      : `Radio: ${g.radius_meters}m`}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: g.is_active ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: g.is_active ? 'var(--accent-secondary)' : '#ef4444'
                    }}>
                      {g.is_active ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenForm(g)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(g.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
