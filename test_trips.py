import os
import sys
import django

api_dir = r"c:\Users\cristobal\Desktop\proyectos portafolio\Pythonapi\vehiculos_api"
sys.path.insert(0, api_dir)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.gps.services import _is_stopped, haversine_meters, STOP_THRESHOLD, STOP_DRIFT_METERS
from apps.gps.models import Trip, GpsPoint

vehicle_id = 1 # Assuming DEMO-02 has ID 1, we can get it
from apps.fleet.models import Vehicle
vehicle_id = Vehicle.objects.get(plate='DEMO-02').id

unassigned = list(
    GpsPoint.objects
    .filter(vehicle_id=vehicle_id, trip__isnull=True)
    .order_by("timestamp")
)

active_trip = Trip.objects.filter(vehicle_id=vehicle_id, end_time__isnull=True).order_by("-start_time").first()

if active_trip:
    unassigned = [p for p in unassigned if p.timestamp >= active_trip.start_time]

stopped_points = [p for p in unassigned if _is_stopped(p)]
moving_points = [p for p in unassigned if not _is_stopped(p)]

print(f"Moving points: {len(moving_points)}")
print(f"Stopped points: {len(stopped_points)}")

if stopped_points:
    first_stopped = stopped_points[0]
t = Trip.objects.first()
print(f"Trip {t.id} points: {GpsPoint.objects.filter(trip=t).count()}")
for p in GpsPoint.objects.filter(trip=t).order_by('timestamp')[:5]:
    print(f"  Point {p.id}: {p.timestamp} - {p.lat}, {p.lng}")
print("...")
for p in GpsPoint.objects.filter(trip=t).order_by('timestamp').reverse()[:5]:
    print(f"  Point {p.id}: {p.timestamp} - {p.lat}, {p.lng}")
