"""
=======================================================
  TEST FUNCIONAL DE ALERTAS — SaaS Gestión de Flotas
=======================================================

Este script simula puntos GPS que violan distintas reglas
de alerta para verificar que el sistema las genera y las
muestra correctamente en el frontend.

Flujo:
  1. Se conecta a la DB de Django directamente.
  2. Obtiene (o crea) un vehículo y reglas de alerta de prueba.
  3. Envía puntos GPS simulados que disparan cada tipo de alerta.
  4. Verifica que los objetos Alert fueron creados en la DB.

USO:
  cd vehiculos_api
  python manage.py shell < ../vehiculos_admin_frontend/test_alerts.py

  (o) copiar contenido y ejecutar en `python manage.py shell`
"""
import os, sys, django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

# Necesitamos estar en el directorio correcto
api_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'vehiculos_api')
if os.path.isdir(api_dir):
    sys.path.insert(0, api_dir)

django.setup()

from django.utils import timezone
from datetime import timedelta
from apps.fleet.models import Vehicle
from apps.tenants.models import Tenant
from apps.alerts.models import AlertRule, Alert
from apps.alerts.tasks import evaluate_alerts

# ─── Colores para terminal ────────────────────────────────────
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

def header(text):
    print(f"\n{BOLD}{CYAN}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}  {text}{RESET}")
    print(f"{BOLD}{CYAN}{'='*60}{RESET}")

def ok(text):
    print(f"  {GREEN}✓{RESET} {text}")

def fail(text):
    print(f"  {RED}✗{RESET} {text}")

def info(text):
    print(f"  {YELLOW}ℹ{RESET} {text}")

# ─── 1. Setup: Tenant y Vehículo ────────────────────────────────
header("SETUP — Preparando datos de prueba")

tenant = Tenant.objects.first()
if not tenant:
    tenant = Tenant.objects.create(name="Tenant de Prueba")
    info(f"Creado nuevo Tenant: {tenant.name}")
else:
    info(f"Usando Tenant existente: {tenant.name}")

vehicle = Vehicle.objects.filter(tenant=tenant).first()
if not vehicle:
    vehicle = Vehicle.objects.create(
        tenant=tenant,
        plate='TEST-001',
        brand='Toyota',
        model='Hilux',
        year=2024,
        device_id='TRACKER-TEST-001',
        status='active'
    )
    info(f"Creado vehículo de prueba: {vehicle.plate}")
else:
    info(f"Usando vehículo existente: {vehicle.plate} (ID: {vehicle.id})")

# Limpiar alertas previas de prueba para este vehículo
alerts_before = Alert.objects.filter(vehicle=vehicle).count()
info(f"Alertas existentes para {vehicle.plate}: {alerts_before}")

# ─── 2. Crear Reglas de Prueba ──────────────────────────────────
header("REGLAS — Creando/Verificando reglas de alerta")

# Resetear cooldowns para permitir que las alertas se disparen
AlertRule.objects.filter(tenant=tenant).update(last_triggered=None)

# Regla 1: Exceso de velocidad > 100 km/h
rule_speed, created = AlertRule.objects.get_or_create(
    tenant=tenant,
    alert_type='SPEEDING',
    vehicle=None,
    defaults={
        'threshold': 100.0,
        'cooldown_minutes': 1,
        'is_active': True
    }
)
if created:
    ok(f"Regla SPEEDING creada (límite: {rule_speed.threshold} km/h)")
else:
    rule_speed.last_triggered = None
    rule_speed.is_active = True
    rule_speed.save()
    ok(f"Regla SPEEDING existente (límite: {rule_speed.threshold} km/h) — cooldown reseteado")

# Regla 2: Ralentí excesivo
rule_idle, created = AlertRule.objects.get_or_create(
    tenant=tenant,
    alert_type='IDLE_TOO_LONG',
    vehicle=None,
    defaults={
        'threshold': 10.0,
        'cooldown_minutes': 1,
        'is_active': True
    }
)
if created:
    ok(f"Regla IDLE_TOO_LONG creada (límite: {rule_idle.threshold} min)")
else:
    rule_idle.last_triggered = None
    rule_idle.is_active = True
    rule_idle.save()
    ok(f"Regla IDLE_TOO_LONG existente — cooldown reseteado")

# Regla 3: Uso fuera de horario (permitido de 08:00 a 18:00)
from datetime import time as dt_time
rule_hours, created = AlertRule.objects.get_or_create(
    tenant=tenant,
    alert_type='OFF_HOURS_USAGE',
    vehicle=None,
    defaults={
        'schedule_start': dt_time(8, 0),
        'schedule_end': dt_time(18, 0),
        'cooldown_minutes': 1,
        'is_active': True
    }
)
if created:
    ok(f"Regla OFF_HOURS_USAGE creada (permitido: 08:00 - 18:00)")
else:
    rule_hours.last_triggered = None
    rule_hours.is_active = True
    rule_hours.save()
    ok(f"Regla OFF_HOURS_USAGE existente — cooldown reseteado")

# ─── 3. TEST 1: Exceso de Velocidad ────────────────────────────
header("TEST 1 — Exceso de Velocidad")

alerts_count_before = Alert.objects.filter(vehicle=vehicle).count()

# Punto GPS con velocidad excesiva
data_speeding = {
    'speed': 135,
    'lat': -36.82699,
    'lng': -73.04977,
    'heading': 90.0,
    'ignition': True,
    'timestamp': timezone.now().isoformat()
}
info(f"Enviando punto GPS con velocidad: {data_speeding['speed']} km/h (límite: {rule_speed.threshold})")

result = evaluate_alerts(vehicle.id, data_speeding)

alerts_count_after = Alert.objects.filter(vehicle=vehicle).count()
new_alerts = alerts_count_after - alerts_count_before

if new_alerts > 0:
    alert = Alert.objects.filter(vehicle=vehicle).order_by('-timestamp').first()
    ok(f"¡ALERTA DISPARADA! → {alert.message}")
    ok(f"Total alertas nuevas: {new_alerts}")
else:
    fail("No se generó alerta de velocidad. Verifica las reglas.")

# ─── 4. TEST 2: Ralentí Excesivo ───────────────────────────────
header("TEST 2 — Ralentí Excesivo (Motor encendido, velocidad 0)")

# Resetear cooldown del idle
rule_idle.last_triggered = None
rule_idle.save()

alerts_count_before = Alert.objects.filter(vehicle=vehicle).count()

data_idle = {
    'speed': 0,
    'lat': -36.82699,
    'lng': -73.04977,
    'heading': 0.0,
    'ignition': True,  # Motor encendido
    'timestamp': timezone.now().isoformat()
}
info(f"Enviando punto GPS: velocidad=0, ignition=True (motor encendido)")

result = evaluate_alerts(vehicle.id, data_idle)

alerts_count_after = Alert.objects.filter(vehicle=vehicle).count()
new_alerts = alerts_count_after - alerts_count_before

if new_alerts > 0:
    alert = Alert.objects.filter(vehicle=vehicle).order_by('-timestamp').first()
    ok(f"¡ALERTA DISPARADA! → {alert.message}")
else:
    fail("No se generó alerta de ralentí. Verifica la regla IDLE_TOO_LONG.")

# ─── 5. TEST 3: Punto normal (NO debería disparar alertas) ─────
header("TEST 3 — Velocidad Normal (NO debe disparar)")

# Resetear cooldowns
AlertRule.objects.filter(tenant=tenant).update(last_triggered=None)

alerts_count_before = Alert.objects.filter(vehicle=vehicle).count()

data_normal = {
    'speed': 60,
    'lat': -36.82699,
    'lng': -73.04977,
    'heading': 180.0,
    'ignition': True,
    'timestamp': timezone.now().isoformat()
}
info(f"Enviando punto GPS con velocidad normal: {data_normal['speed']} km/h")

result = evaluate_alerts(vehicle.id, data_normal)

alerts_count_after = Alert.objects.filter(vehicle=vehicle).count()
new_alerts = alerts_count_after - alerts_count_before

if new_alerts == 0:
    ok("Correcto: no se generaron alertas para velocidad normal.")
else:
    fail(f"Se generaron {new_alerts} alertas inesperadas.")

# ─── 6. TEST 4: Cooldown (segunda alerta rápida NO debe disparar) ──
header("TEST 4 — Cooldown (segunda alerta consecutiva)")

# Primera alerta de velocidad (resetear cooldown primero)
rule_speed.last_triggered = None
rule_speed.save()

data_fast1 = {
    'speed': 120,
    'lat': -36.82699,
    'lng': -73.04977,
    'ignition': True,
    'timestamp': timezone.now().isoformat()
}
info("Primer punto excesivo...")
result1 = evaluate_alerts(vehicle.id, data_fast1)
first_count = len(result1.get('alerts_created', []))

data_fast2 = {
    'speed': 130,
    'lat': -36.82699,
    'lng': -73.04977,
    'ignition': True,
    'timestamp': timezone.now().isoformat()
}
info("Segundo punto excesivo inmediatamente después...")
result2 = evaluate_alerts(vehicle.id, data_fast2)
second_count = len(result2.get('alerts_created', []))

if first_count > 0 and second_count == 0:
    ok("Correcto: el cooldown bloqueó la segunda alerta consecutiva.")
elif first_count == 0:
    fail("La primera alerta no se disparó.")
else:
    fail(f"El cooldown no funcionó. Se generaron {second_count} alertas en la segunda evaluación.")

# ─── RESUMEN ───────────────────────────────────────────────────
header("RESUMEN FINAL")

total_alerts = Alert.objects.filter(vehicle=vehicle).count()
info(f"Total de alertas para {vehicle.plate}: {total_alerts}")

recent = Alert.objects.filter(vehicle=vehicle).order_by('-timestamp')[:5]
print()
for a in recent:
    read_status = f"{GREEN}Leída{RESET}" if a.is_read else f"{YELLOW}Sin leer{RESET}"
    print(f"  [{a.timestamp.strftime('%H:%M:%S')}] {a.message}  ({read_status})")

print(f"\n{BOLD}{GREEN}{'='*60}{RESET}")
print(f"{BOLD}{GREEN}  ✓ Pruebas completadas. Revisa la bandeja de alertas en el frontend.{RESET}")
print(f"{BOLD}{GREEN}{'='*60}{RESET}\n")
