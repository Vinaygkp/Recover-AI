import urllib.request
import urllib.error
import json

BASE_URL = "http://localhost:8000"

def req_json(url, data=None, headers=None):
    if headers is None: 
        headers = {}
    if data:
        encoded = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        encoded = None
    req = urllib.request.Request(url, data=encoded, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode('utf-8'))

print("=== GUEST UNAUTHENTICATED COPILOT QUERY ===")
status, res = req_json(f"{BASE_URL}/api/ai/copilot", {
    "message": "how are you"
})
print(f"STATUS CODE: {status}")
print(json.dumps(res, indent=2))