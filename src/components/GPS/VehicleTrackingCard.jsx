import React from 'react';

export default function VehicleTrackingCard({ vehicle, onClick }) {
  const { plate, status, last_location } = vehicle;
  
  // Format the last update time
  const timeString = last_location?.timestamp 
    ? new Date(last_location.timestamp).toLocaleTimeString() 
    : 'Desconocido';

  // Determine indicator color
  const indicatorColor = status === 'active' ? 'var(--accent-secondary)' : '#ef4444';

  return (
    <div 
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        borderLeft: `4px solid ${indicatorColor}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateX(4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{plate}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: indicatorColor,
            boxShadow: `0 0 8px ${indicatorColor}`
          }}></div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
        <div>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Velocidad</span>
          <span style={{ fontSize: '16px', fontWeight: '500' }}>
            {last_location?.speed != null ? `${Number(last_location.speed).toFixed(2)} km/h` : 'N/A'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Última vez</span>
          <span style={{ fontSize: '14px' }}>{timeString}</span>
        </div>
      </div>
    </div>
  );
}
