import os
import urllib.request
import urllib.error
import json
from dotenv import load_dotenv

load_dotenv("backend/.env")
load_dotenv(".env")

# OpenAI API key is loaded from the environment.
key = os.getenv("OPENAI_API_KEY")

if not key:
    print("Error: OPENAI_API_KEY .env file me nahi mili!")
else:
    url = "https://api.openai.com/v1/chat/completions"
    payload = {
        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        "messages": [{"role": "user", "content": 'Return JSON: {"status": "ok"}'}],
        "response_format": {"type": "json_object"}
    }

    req = urllib.request.Request(
        url, 
        data=json.dumps(payload).encode("utf-8"), 
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {key}"}
    )
    
    try:
        with urllib.request.urlopen(req) as res:
            out = json.loads(res.read().decode("utf-8"))
            text = out["choices"][0]["message"]["content"]
            print("REAL OPENAI CONNECTION SUCCESS:", text.strip())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"REAL OPENAI HTTP ERROR ({e.code}): {error_body}")
    except Exception as e:
        print("REAL OPENAI CONNECTION ERROR:", str(e))