import L from 'leaflet';

/**
 * Fixes the broken default Leaflet marker icons in Webpack/Vite bundled environments.
 * Call this ONCE at module level in any file that uses react-leaflet markers.
 * Extracted to avoid duplication across Geocercas.jsx and HistorialRutas.jsx.
 */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
