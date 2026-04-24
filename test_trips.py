"""
Test de Historial de Rutas — Genera viajes y puntos GPS de prueba
para visualizar en el frontend.
"""
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.utils import timezone
from datetime import timedelta
import random
import math
from apps.fleet.models import Vehicle
from apps.tenants.models import Tenant
from apps.gps.models import GpsPoint, Trip

GREEN = '\033[92m'
CYAN = '\033[96m'
YELLOW = '\033[93m'
BOLD = '\033[1m'
RESET = '\033[0m'

def header(text):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {text}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

def ok(text):
    print(f"  {GREEN}+{RESET} {text}")

def info(text):
    print(f"  {YELLOW}i{RESET} {text}")

# ── Setup ──────────────────────────────────────────────────────
header("SETUP")

tenant = Tenant.objects.get(id=2)
info(f"Tenant: {tenant.name}")

vehicle = Vehicle.objects.filter(tenant=tenant).first()
if not vehicle:
    print("No hay vehiculos en este tenant")
    sys.exit()
info(f"Vehiculo: {vehicle.plate} (ID: {vehicle.id})")

# ── Viaje 1: Ruta urbana corta (Concepcion centro) ───────────
header("VIAJE 1 — Ruta urbana corta (~3 km)")

now = timezone.now()
trip1_start = now - timedelta(hours=5)

base_lat = -36.82699
base_lng = -73.04977

trip1 = Trip.objects.create(
    vehicle=vehicle,
    start_time=trip1_start,
    end_time=trip1_start + timedelta(minutes=18),
    start_lat=base_lat,
    start_lng=base_lng,
    end_lat=base_lat + 0.015,
    end_lng=base_lng + 0.012,
    max_speed=65.0,
    avg_speed=38.5,
    distance_meters=3200,
    duration=timedelta(minutes=18)
)
ok(f"Trip creado: ID={trip1.id}")

points1 = []
for i in range(20):
    t = i / 19.0
    lat = base_lat + t * 0.015 + random.uniform(-0.0005, 0.0005)
    lng = base_lng + t * 0.012 + random.uniform(-0.0005, 0.0005)
    speed = random.uniform(20, 65) if i > 0 and i < 19 else 0
    ts = trip1_start + timedelta(seconds=i * 57)
    
    points1.append(GpsPoint(
        vehicle=vehicle,
        trip=trip1,
        lat=lat,
        lng=lng,
        speed=round(speed, 1),
        heading=random.uniform(0, 360),
        timestamp=ts,
        ignition=True
    ))

GpsPoint.objects.bulk_create(points1)
ok(f"  {len(points1)} puntos GPS creados")

# ── Viaje 2: Ruta interurbana (mas rapida, mas larga) ────────
header("VIAJE 2 — Ruta interurbana (~12 km)")

trip2_start = now - timedelta(hours=3)

trip2 = Trip.objects.create(
    vehicle=vehicle,
    start_time=trip2_start,
    end_time=trip2_start + timedelta(minutes=25),
    start_lat=base_lat,
    start_lng=base_lng,
    end_lat=base_lat - 0.06,
    end_lng=base_lng + 0.08,
    max_speed=110.0,
    avg_speed=72.4,
    distance_meters=12500,
    duration=timedelta(minutes=25)
)
ok(f"Trip creado: ID={trip2.id}")

points2 = []
for i in range(30):
    t = i / 29.0
    lat = base_lat - t * 0.06 + random.uniform(-0.001, 0.001)
    lng = base_lng + t * 0.08 + random.uniform(-0.001, 0.001)
    
    if i == 0 or i == 29:
        speed = 0
    elif i < 5:
        speed = random.uniform(20, 50)
    elif i < 25:
        speed = random.uniform(70, 110)
    else:
        speed = random.uniform(20, 50)
    
    ts = trip2_start + timedelta(seconds=i * 50)
    
    points2.append(GpsPoint(
        vehicle=vehicle,
        trip=trip2,
        lat=lat,
        lng=lng,
        speed=round(speed, 1),
        heading=random.uniform(100, 200),
        timestamp=ts,
        ignition=True
    ))

GpsPoint.objects.bulk_create(points2)
ok(f"  {len(points2)} puntos GPS creados")

# ── Viaje 3: Ruta con exceso de velocidad ────────────────────
header("VIAJE 3 — Ruta con exceso de velocidad (~8 km)")

trip3_start = now - timedelta(hours=1)

trip3 = Trip.objects.create(
    vehicle=vehicle,
    start_time=trip3_start,
    end_time=trip3_start + timedelta(minutes=12),
    start_lat=base_lat + 0.01,
    start_lng=base_lng - 0.02,
    end_lat=base_lat - 0.04,
    end_lng=base_lng + 0.03,
    max_speed=145.0,
    avg_speed=95.3,
    distance_meters=8100,
    duration=timedelta(minutes=12)
)
ok(f"Trip creado: ID={trip3.id}")

points3 = []
for i in range(25):
    t = i / 24.0
    lat = (base_lat + 0.01) - t * 0.05 + random.uniform(-0.0008, 0.0008)
    lng = (base_lng - 0.02) + t * 0.05 + random.uniform(-0.0008, 0.0008)
    
    if i == 0 or i == 24:
        speed = 0
    elif 8 <= i <= 18:
        speed = random.uniform(100, 145)
    else:
        speed = random.uniform(40, 80)
    
    ts = trip3_start + timedelta(seconds=i * 29)
    
    points3.append(GpsPoint(
        vehicle=vehicle,
        trip=trip3,
        lat=lat,
        lng=lng,
        speed=round(speed, 1),
        heading=random.uniform(130, 230),
        timestamp=ts,
        ignition=True
    ))

GpsPoint.objects.bulk_create(points3)
ok(f"  {len(points3)} puntos GPS creados")

# ── Resumen ──────────────────────────────────────────────────
header("RESUMEN")

total_trips = Trip.objects.filter(vehicle__tenant=tenant).count()
total_points = GpsPoint.objects.filter(vehicle__tenant=tenant).count()

info(f"Total viajes en {tenant.name}: {total_trips}")
info(f"Total puntos GPS: {total_points}")

print()
for trip in Trip.objects.filter(vehicle__tenant=tenant).order_by('-start_time')[:5]:
    status = "Completado" if trip.end_time else "En curso"
    print(f"  [{trip.start_time.strftime('%H:%M')}] {trip.vehicle.plate} | "
          f"{trip.distance_meters/1000:.1f} km | "
          f"Max: {trip.max_speed:.0f} km/h | "
          f"{status}")

print(f"\n{BOLD}{GREEN}{'='*60}{RESET}")
print(f"{BOLD}{GREEN}  Listo! Revisa el Historial de Rutas en el frontend.{RESET}")
print(f"{BOLD}{GREEN}{'='*60}{RESET}\n")
