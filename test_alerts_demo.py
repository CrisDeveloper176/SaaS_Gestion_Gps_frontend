import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
django.setup()

from django.utils import timezone
from apps.fleet.models import Vehicle
from apps.tenants.models import Tenant
from apps.alerts.models import AlertRule, Alert
from apps.alerts.tasks import evaluate_alerts

tenant = Tenant.objects.get(id=2)
print(f'Usando tenant: {tenant.name}')

vehicle = Vehicle.objects.filter(tenant=tenant).first()
if not vehicle:
    print('No hay vehiculos en Empresa Demo')
    sys.exit()
print(f'Vehiculo: {vehicle.plate} (ID: {vehicle.id})')

AlertRule.objects.filter(tenant=tenant).update(last_triggered=None)

rule, created = AlertRule.objects.get_or_create(
    tenant=tenant, alert_type='SPEEDING', vehicle=None,
    defaults={'threshold': 100.0, 'cooldown_minutes': 1, 'is_active': True}
)
if not created:
    rule.last_triggered = None
    rule.save()
print(f'Regla SPEEDING: threshold={rule.threshold}')

rule2, created = AlertRule.objects.get_or_create(
    tenant=tenant, alert_type='IDLE_TOO_LONG', vehicle=None,
    defaults={'threshold': 10.0, 'cooldown_minutes': 1, 'is_active': True}
)
if not created:
    rule2.last_triggered = None
    rule2.save()

data1 = {'speed': 135, 'lat': -36.82, 'lng': -73.04, 'ignition': True, 'timestamp': timezone.now().isoformat()}
r1 = evaluate_alerts(vehicle.id, data1)
print(f'TEST 1 Velocidad: alertas={len(r1["alerts_created"])}')

rule2.refresh_from_db()
rule2.last_triggered = None
rule2.save()

data2 = {'speed': 0, 'lat': -36.82, 'lng': -73.04, 'ignition': True, 'timestamp': timezone.now().isoformat()}
r2 = evaluate_alerts(vehicle.id, data2)
print(f'TEST 2 Ralenti: alertas={len(r2["alerts_created"])}')

rule.refresh_from_db()
rule.last_triggered = None
rule.save()

data3 = {'speed': 150, 'lat': -36.82, 'lng': -73.04, 'ignition': True, 'timestamp': timezone.now().isoformat()}
r3 = evaluate_alerts(vehicle.id, data3)
print(f'TEST 3 Velocidad alta: alertas={len(r3["alerts_created"])}')

total = Alert.objects.filter(rule__tenant=tenant).count()
print(f'Total alertas en {tenant.name}: {total}')
for a in Alert.objects.filter(rule__tenant=tenant).order_by('-timestamp')[:5]:
    print(f'  [{a.timestamp.strftime("%H:%M:%S")}] {a.message}')

print('LISTO - revisa la bandeja de alertas en el frontend')
