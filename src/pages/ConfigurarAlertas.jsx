import { useState, useEffect } from 'react';
import { getAlertRules, createAlertRule, updateAlertRule, deleteAlertRule, getVehicles } from '../api/axios';
import { Settings, Plus, Edit2, Trash2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConfigurarAlertas() {
  const [rules, setRules] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal / Form state (in-place for simplicity, could be a separate modal component)
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [formData, setFormData] = useState({
    alert_type: 'SPEEDING',
    vehicle_id: '',
    threshold: '',
    schedule_start: '',
    schedule_end: '',
    cooldown_minutes: 5,
    is_active: true
  });

  const fetchRulesAndVehicles = async () => {
    setLoading(true);
    try {
      const [rulesRes, vehRes] = await Promise.all([
        getAlertRules(),
        getVehicles({ limit: 1000 })
      ]);
      setRules(rulesRes.data.results || []);
      setVehicles(vehRes.data.results || []);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar reglas de alertas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRulesAndVehicles();
  }, []);

  const handleOpenForm = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        alert_type: rule.alert_type,
        vehicle_id: rule.vehicle ? rule.vehicle : '',
        threshold: rule.threshold || '',
        schedule_start: rule.schedule_start || '',
        schedule_end: rule.schedule_end || '',
        cooldown_minutes: rule.cooldown_minutes,
        is_active: rule.is_active
      });
    } else {
      setEditingRule(null);
      setFormData({
        alert_type: 'SPEEDING',
        vehicle_id: '',
        threshold: '',
        schedule_start: '',
        schedule_end: '',
        cooldown_minutes: 5,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        vehicle: formData.vehicle_id ? parseInt(formData.vehicle_id) : null,
        threshold: (formData.alert_type !== 'OFF_HOURS_USAGE' && formData.alert_type !== 'GEOFENCE_EXIT') ? parseFloat(formData.threshold) : null,
        schedule_start: formData.alert_type === 'OFF_HOURS_USAGE' ? formData.schedule_start : null,
        schedule_end: formData.alert_type === 'OFF_HOURS_USAGE' ? formData.schedule_end : null
      };
      
      if (editingRule) {
        await updateAlertRule(editingRule.id, payload);
        toast.success('Regla actualizada');
      } else {
        await createAlertRule(payload);
        toast.success('Regla creada exitosamente');
      }
      handleCloseForm();
      fetchRulesAndVehicles();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || 'Error al guardar la regla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta regla?')) {
      try {
        await deleteAlertRule(id);
        toast.success('Regla eliminada');
        fetchRulesAndVehicles();
      } catch (err) {
        console.error(err);
        toast.error('Error al eliminar');
      }
    }
  };

  const getAlertTypeName = (type) => {
    const types = {
      'SPEEDING': 'Exceso de Velocidad',
      'IDLE_TOO_LONG': 'Ralentí Excesivo',
      'GEOFENCE_EXIT': 'Salida de Geocerca',
      'OFF_HOURS_USAGE': 'Uso Fuera de Horario'
    };
    return types[type] || type;
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 24, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
            <ShieldAlert color="var(--accent-primary)" />
            Reglas de Alertas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Configura los parámetros para que el sistema genere notificaciones automáticamente.
          </p>
        </div>
        <button onClick={() => handleOpenForm()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Nueva Regla
        </button>
      </div>

      {showForm && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: 24, padding: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>{editingRule ? 'Editar Regla' : 'Crear Nueva Regla'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            
            <div className="form-group">
              <label className="form-label">Tipo de Alerta</label>
              <select name="alert_type" value={formData.alert_type} onChange={handleChange} className="form-control" required style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <option value="SPEEDING" style={{ background: '#1e1e24', color: '#fff' }}>Exceso de Velocidad</option>
                <option value="IDLE_TOO_LONG" style={{ background: '#1e1e24', color: '#fff' }}>Ralentí Excesivo</option>
                <option value="GEOFENCE_EXIT" style={{ background: '#1e1e24', color: '#fff' }}>Salida de Geocerca</option>
                <option value="OFF_HOURS_USAGE" style={{ background: '#1e1e24', color: '#fff' }}>Uso Fuera de Horario</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Aplicar a Vehículo (Opcional)</label>
              <select name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} className="form-control" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                <option value="" style={{ background: '#1e1e24', color: '#fff' }}>-- Todos los vehículos de la flota --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} style={{ background: '#1e1e24', color: '#fff' }}>{v.plate} - {v.alias || 'Sin alias'}</option>
                ))}
              </select>
            </div>

            {formData.alert_type === 'OFF_HOURS_USAGE' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Hora de Inicio (Permitido)</label>
                  <input type="time" name="schedule_start" value={formData.schedule_start} onChange={handleChange} className="form-control" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Hora de Fin (Permitido)</label>
                  <input type="time" name="schedule_end" value={formData.schedule_end} onChange={handleChange} className="form-control" required />
                </div>
              </>
            ) : formData.alert_type !== 'GEOFENCE_EXIT' ? (
              <div className="form-group">
                <label className="form-label">Valor Límite (Threshold)</label>
                <input 
                  type="number" 
                  name="threshold" 
                  value={formData.threshold} 
                  onChange={handleChange} 
                  className="form-control" 
                  placeholder={formData.alert_type === 'SPEEDING' ? "Ej. 100 (km/h)" : "Ej. 15 (minutos)"} 
                  required 
                  step="0.1"
                />
              </div>
            ) : null}

            <div className="form-group">
              <label className="form-label">Cooldown (minutos)</label>
              <input 
                type="number" 
                name="cooldown_minutes" 
                value={formData.cooldown_minutes} 
                onChange={handleChange} 
                className="form-control" 
                placeholder="Evita spam de alertas repetidas" 
                required 
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12 }}>
              <input 
                type="checkbox" 
                name="is_active" 
                checked={formData.is_active} 
                onChange={handleChange} 
                id="is_active_checkbox"
                style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="is_active_checkbox" style={{ color: 'var(--text-primary)', cursor: 'pointer' }}>
                Regla Activa
              </label>
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button type="button" onClick={handleCloseForm} className="btn btn-secondary" style={{ background: 'transparent', border: '1px solid var(--border-light)' }}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Regla'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Tipo</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Vehículo</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Límite</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>Estado</th>
              <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando reglas...</td>
              </tr>
            ) : rules.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay reglas configuradas</td>
              </tr>
            ) : (
              rules.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {getAlertTypeName(r.alert_type)}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                    {r.vehicle ? (() => {
                       const v = vehicles.find(v => v.id === r.vehicle);
                       return v ? v.plate : `ID: ${r.vehicle}`;
                    })() : 'Toda la flota'}
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {r.alert_type === 'OFF_HOURS_USAGE' 
                      ? `${r.schedule_start?.slice(0, 5) || '--:--'} a ${r.schedule_end?.slice(0, 5) || '--:--'}`
                      : r.alert_type === 'GEOFENCE_EXIT' 
                        ? 'Inmediato'
                        : `${r.threshold} ${r.alert_type === 'SPEEDING' ? 'km/h' : 'minutos'}`}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                      background: r.is_active ? 'var(--accent-secondary-glow)' : 'rgba(239, 68, 68, 0.15)',
                      color: r.is_active ? 'var(--accent-secondary)' : '#ef4444'
                    }}>
                      {r.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenForm(r)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginRight: 12, padding: 4 }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(r.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
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
