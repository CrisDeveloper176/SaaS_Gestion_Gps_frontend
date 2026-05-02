# Fleet SaaS — Frontend GPS

> **SaaS Multi-tenant · Tracking en Tiempo Real · React Edition**  
> v1.0 · 2026

Frontend para un sistema de gestión de flotas con tracking GPS en tiempo real. Construido con React + Vite, consume la API REST y WebSockets del [backend Django](https://github.com/CrisDeveloper176/SaaS_Gestion_GPS).

---

## Tabla de Contenidos

- [Stack Tecnológico](#stack-tecnológico)
- [Features](#features)
- [Arquitectura del Frontend](#arquitectura-del-frontend)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Variables de Entorno](#variables-de-entorno)
- [Instalación](#instalación)
- [Repositorio Backend](#repositorio-backend)

---

## Stack Tecnológico

| Componente         | Tecnología                              |
|--------------------|-----------------------------------------|
| Framework          | React 18                                |
| Bundler            | Vite                                    |
| Lenguaje           | JavaScript (ES2022+)                    |
| Mapas              | Leaflet / React-Leaflet                 |
| Tiempo Real        | WebSockets nativos (Django Channels)    |
| Autenticación      | JWT (access + refresh token)            |
| HTTP Client        | Axios                                   |
| Estilos            | CSS Modules                             |
| Linting            | ESLint                                  |

---

## Features

- **Mapa en tiempo real** — visualización de vehículos con posición actualizada vía WebSocket
- **Multi-tenant** — cada organización ve únicamente su propia flota
- **Gestión de vehículos** — listado, detalle y estado en tiempo real por vehículo
- **Gestión de conductores** — asignación de conductores a vehículos
- **Historial de rutas** — visualización de trips pasados sobre el mapa
- **Alertas** — notificaciones de exceso de velocidad, geofence, tiempo de ralentí y más
- **Geofences** — visualización de zonas geográficas configuradas por tenant
- **Analíticas** — dashboard con métricas de flota (km recorridos, tiempo activo, etc.)
- **Autenticación JWT** — login, refresh automático de tokens y logout con blacklist

---

## Arquitectura del Frontend

El frontend se comunica con el backend a través de dos canales:

```
┌─────────────────────────────────────────┐
│              React App                  │
│                                         │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │  REST API    │  │   WebSocket     │  │
│  │  (Axios)     │  │   (ws://)       │  │
│  └──────┬───────┘  └────────┬────────┘  │
│         │                   │           │
└─────────┼───────────────────┼───────────┘
          │                   │
          ▼                   ▼
   Django REST API     Django Channels
   /api/vehicles/      ws/tracking/
   /api/trips/
   /api/alerts/
```

**Flujo de autenticación:**
1. Login → recibe `access_token` (15 min) + `refresh_token` (7 días)
2. Axios interceptor adjunta `Authorization: Bearer <token>` en cada request
3. Al expirar el access token, se renueva automáticamente con el refresh token
4. Logout invalida el refresh token en el backend (blacklist)

**Flujo WebSocket:**
1. Al autenticarse, se abre conexión `wss://api/ws/tracking/?token=<jwt>`
2. El cliente envía `subscribe_fleet` para recibir updates de toda la flota del tenant
3. Los mensajes `vehicle_update` actualizan los marcadores en el mapa en tiempo real
4. Los mensajes `alert_triggered` muestran notificaciones al usuario

---

## Estructura del Proyecto

```
src/
├── assets/                  # Imágenes, íconos, fuentes
├── components/
│   ├── Map/                 # Componente de mapa (Leaflet)
│   │   ├── VehicleMarker.jsx
│   │   ├── RouteLayer.jsx
│   │   └── GeofenceLayer.jsx
│   ├── Vehicles/            # Listado y detalle de vehículos
│   ├── Drivers/             # Gestión de conductores
│   ├── Alerts/              # Panel de alertas
│   ├── Analytics/           # Dashboard de métricas
│   └── UI/                  # Componentes reutilizables
├── hooks/
│   ├── useWebSocket.js      # Hook para conexión WebSocket
│   ├── useVehicles.js
│   └── useAlerts.js
├── services/
│   ├── api.js               # Instancia Axios + interceptores JWT
│   ├── vehicles.js
│   ├── trips.js
│   ├── alerts.js
│   └── analytics.js
├── context/
│   ├── AuthContext.jsx      # Estado de autenticación global
│   └── TenantContext.jsx    # Contexto del tenant activo
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Vehicles.jsx
│   ├── Trips.jsx
│   ├── Alerts.jsx
│   └── Analytics.jsx
├── utils/
│   ├── token.js             # Helpers JWT (decode, expiración)
│   └── geo.js               # Utilidades geográficas
├── App.jsx
└── main.jsx
```

---

## Variables de Entorno

Crea un archivo `.env` en la raíz basado en `.env.example`:

```env
# URL base de la API REST
VITE_API_URL=http://localhost:8000/api

# URL del WebSocket
VITE_WS_URL=ws://localhost:8000/ws
```

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/CrisDeveloper176/SaaS_Gestion_Gps_frontend.git
cd SaaS_Gestion_Gps_frontend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Levantar en desarrollo
npm run dev
```

La app estará disponible en `http://localhost:5173`

> **Requisito:** El backend debe estar corriendo. Ver instrucciones en el [repositorio backend](https://github.com/CrisDeveloper176/SaaS_Gestion_GPS).

---

## Repositorio Backend

Este frontend consume la API del backend Django:

🔗 **[SaaS\_Gestion\_GPS — Backend](https://github.com/CrisDeveloper176/SaaS_Gestion_GPS)**

Stack backend: Python 3.12 · Django 5 · DRF · Django Channels · PostgreSQL + TimescaleDB · Redis · Celery · Docker

---

*Fleet SaaS Frontend v1.0 · React Edition · 2026*
