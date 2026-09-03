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
    url = "https://api.openai.com/v1/models"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {key}"})
    try:
        with urllib.request.urlopen(req) as res:
            out = json.loads(res.read().decode("utf-8"))
            models = [m["id"] for m in out.get("data", [])]
            print("AVAILABLE OPENAI MODELS:")
            for model in models[:10]:
                print(f" - {model}")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"OPENAI HTTP ERROR ({e.code}): {error_body}")
    except Exception as e:
        print("LIST MODELS ERROR:", str(e))