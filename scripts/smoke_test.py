#!/usr/bin/env python3
"""
Smoke test for Académie Les Hirondelles API.
Usage: python3 scripts/smoke_test.py [base_url]
"""
import sys, json, urllib.request, urllib.error

BASE_URL = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'http://localhost:3000'

ACCOUNTS = [
    ('SUPER_ADMIN', 'admin@hirondelles-musique.fr',      'Admin1234!'),
    ('TEACHER',     'h.marchand@hirondelles-musique.fr', 'Teacher1234!'),
    ('PARENT',      'f.martin@famille.fr',               'Parent1234!'),
    ('STUDENT',     'sandrine.beaumont@email.fr',        'Student1234!'),
]

G = '\033[92m'; R = '\033[91m'; Y = '\033[93m'; E = '\033[0m'
def ok(m):   print(f"  {G}✓{E} {m}")
def fail(m): print(f"  {R}✗{E} {m}")

def api(method, path, token=None, body=None):
    url = f"{BASE_URL}/api{path}"
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = f'Bearer {token}'
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read())
        except: return e.code, {}
    except Exception as ex:
        return 0, {'error': str(ex)}

def check(label, method, path, token):
    status, body = api(method, path, token)
    ok_status = status in (200, 201)
    payload = body.get('data', body) if isinstance(body, dict) else body
    if ok_status:
        count = ''
        if isinstance(payload, list): count = f' ({len(payload)} items)'
        elif isinstance(payload, dict) and 'data' in payload: count = f' ({len(payload["data"])} items)'
        elif isinstance(payload, dict) and 'total' in payload: count = f' (total={payload["total"]})'
        ok(f"{method} {path}{count}")
        return True
    else:
        fail(f"{method} {path}  → HTTP {status}  {str(body)[:120]}")
        return False

total = passed = 0

for role, email, password in ACCOUNTS:
    print(f"\n{'='*60}\n  {Y}{role}{E}  ({email})\n{'='*60}")

    status, body = api('POST', '/auth/login', body={'email': email, 'password': password})
    payload = body.get('data', body) if isinstance(body, dict) else {}
    token = payload.get('accessToken')
    user = payload.get('user', {})
    if not token:
        fail(f"LOGIN FAILED — HTTP {status}")
        continue
    ok(f"Login → role={user.get('role')}, name={user.get('profile', {}).get('firstName', '?')}")

    # Common endpoints for all roles
    endpoints = [
        ('GET', '/auth/profile'),
        ('GET', '/scheduling/calendar?start=2026-01-01&end=2026-01-31'),
        ('GET', '/events'),
        ('GET', '/messaging/conversations'),
        ('GET', '/notifications'),
    ]

    if role in ('SUPER_ADMIN', 'TEACHER'):
        endpoints += [
            ('GET', '/teachers'),
            ('GET', '/teachers?page=1&limit=5'),
            ('GET', '/students'),
            ('GET', '/students?page=1&limit=5&search=Martin'),
            ('GET', '/courses'),
            ('GET', '/rooms'),
            ('GET', '/families'),
            ('GET', '/billing/invoices'),
            ('GET', '/vacations?year=2026'),
        ]
    elif role == 'PARENT':
        endpoints += [
            ('GET', '/students'),
            ('GET', '/courses'),
            ('GET', '/billing/invoices'),
        ]

    for method, path in endpoints:
        total += 1
        if check(path, method, path, token): passed += 1

print(f"\n{'='*60}")
color = G if passed == total else R
print(f"  {color}Results: {passed}/{total} passed{E}")
print(f"{'='*60}\n")
sys.exit(0 if passed == total else 1)
