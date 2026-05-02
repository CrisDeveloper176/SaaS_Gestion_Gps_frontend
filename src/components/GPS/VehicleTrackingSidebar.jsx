import React, { useState } from 'react';
import VehicleTrackingCard from './VehicleTrackingCard';

export default function VehicleTrackingSidebar({ vehicles, onVehicleClick }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar vehículos activos
  const activeVehicles = Object.values(vehicles).filter(v => v.status === 'active' && v.last_location);
  
  // Filtrar por término de búsqueda
  const filteredVehicles = activeVehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="glass-card" style={{ 
      width: '280px', 
      minWidth: '280px',
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px',
      marginLeft: '16px',
      overflow: 'hidden'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '12px' }}>Vehículos Activos</h2>
        <input
          type="text"
          placeholder="Buscar por patente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.3s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        paddingRight: '8px'
      }} className="custom-scrollbar">
        {filteredVehicles.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>
            No se encontraron vehículos activos.
          </p>
        ) : (
          filteredVehicles.map(vehicle => (
            <VehicleTrackingCard 
              key={vehicle.plate} 
              vehicle={vehicle} 
              onClick={() => onVehicleClick(vehicle)}
            />
          ))
        )}
      </div>
    </div>
  );
}
