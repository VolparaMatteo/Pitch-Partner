#!/usr/bin/env python3
"""
Script per testare il login del club
"""
from app import create_app, db
from app.models import Club
import requests
import json

def test_database_club():
    """Verifica che il club esista nel database con la password corretta"""
    app = create_app()
    
    with app.app_context():
        club = Club.query.filter_by(email="info@fcstellamare.it").first()
        
        if not club:
            print("❌ Club non trovato nel database")
            return False
        
        print(f"✅ Club trovato: {club.nome}")
        print(f"   Email: {club.email}")
        print(f"   Password hash presente: {'Sì' if club.password_hash else 'No'}")
        
        # Test password
        test_password = "Stellamare2024!"
        if club.check_password(test_password):
            print(f"✅ Password '{test_password}' verificata correttamente nel database")
        else:
            print(f"❌ Password '{test_password}' NON corrisponde nel database")
            
        return True

def test_api_login():
    """Testa il login tramite API"""
    base_url = "http://localhost:5000"
    
    credentials = {
        "email": "info@fcstellamare.it",
        "password": "Stellamare2024!"
    }
    
    print("\n📡 Test login via API...")
    print(f"   URL: {base_url}/api/club/login")
    print(f"   Payload: {json.dumps(credentials, indent=2)}")
    
    try:
        response = requests.post(
            f"{base_url}/api/club/login",
            json=credentials,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login riuscito!")
            data = response.json()
            if 'access_token' in data:
                print(f"   Token ricevuto: {data['access_token'][:20]}...")
        else:
            print("❌ Login fallito")
            try:
                error_data = response.json()
                print(f"   Errore: {error_data}")
            except:
                print(f"   Response: {response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Impossibile connettersi al server. Assicurati che Flask sia in esecuzione su http://localhost:5000")
    except Exception as e:
        print(f"❌ Errore durante il test: {e}")

def check_all_clubs():
    """Lista tutti i club nel database"""
    app = create_app()
    
    with app.app_context():
        clubs = Club.query.all()
        print(f"\n📋 Club nel database ({len(clubs)} totali):")
        for club in clubs:
            print(f"   - {club.nome}: {club.email}")

if __name__ == "__main__":
    print("🔐 Test Login Club")
    print("=" * 50)
    
    # Test 1: Verifica nel database
    test_database_club()
    
    # Test 2: Lista tutti i club
    check_all_clubs()
    
    # Test 3: Test API login
    test_api_login()