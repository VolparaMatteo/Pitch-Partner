#!/usr/bin/env python3
"""
Test login via API sulla porta corretta
"""
import requests
import json

def test_login():
    # Porta corretta per Flask
    base_url = "http://localhost:5003"
    
    credentials = {
        "email": "info@fcstellamare.it",
        "password": "Stellamare2024!"
    }
    
    print("🔐 Test Login API")
    print("-" * 40)
    print(f"URL: {base_url}/api/club/login")
    print(f"Credenziali: {json.dumps(credentials, indent=2)}")
    print("-" * 40)
    
    try:
        response = requests.post(
            f"{base_url}/api/club/login",
            json=credentials,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ LOGIN RIUSCITO!")
            data = response.json()
            print(f"\nRisposta completa:")
            print(json.dumps(data, indent=2))
            
            if 'access_token' in data:
                print(f"\n🎫 Token JWT ricevuto (primi 50 caratteri):")
                print(f"   {data['access_token'][:50]}...")
        else:
            print(f"❌ Login fallito con codice: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Errore: {error_data}")
            except:
                print(f"Response body: {response.text}")
    
    except requests.exceptions.ConnectionError as e:
        print(f"❌ Impossibile connettersi al server sulla porta 5003")
        print(f"   Errore: {e}")
    except Exception as e:
        print(f"❌ Errore inaspettato: {e}")

if __name__ == "__main__":
    test_login()