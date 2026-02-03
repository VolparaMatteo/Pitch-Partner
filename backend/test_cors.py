import requests
import sys

BASE_URL = "http://localhost:5003/api/pitchy/context"
ORIGIN = "http://localhost:3000"

def test_options_request():
    print(f"Testing OPTIONS request to {BASE_URL}...")
    headers = {
        "Origin": ORIGIN,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization, Content-Type"
    }
    try:
        response = requests.options(BASE_URL, headers=headers)
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
        
        if 'Access-Control-Allow-Origin' in response.headers:
            if response.headers['Access-Control-Allow-Origin'] == ORIGIN or response.headers['Access-Control-Allow-Origin'] == '*':
                print("✅ CORS Headers present in OPTIONS response.")
                return True
            else:
                print(f"❌ CORS Header present but incorrect: {response.headers['Access-Control-Allow-Origin']}")
                return False
        else:
            print("❌ Missing Access-Control-Allow-Origin header in OPTIONS response.")
            return False
    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

if __name__ == "__main__":
    print("--- STARTING CORS TEST ---")
    success = test_options_request()
    print("--- END CORS TEST ---")
    if not success:
        sys.exit(1)
