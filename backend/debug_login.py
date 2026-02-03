#!/usr/bin/env python3
"""
Script di debug dettagliato per il login
"""
from app import create_app, db
from app.models import Club
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime

def debug_club_auth(email, password):
    """Debug dettagliato del processo di autenticazione"""
    app = create_app()
    
    with app.app_context():
        print(f"\n🔍 DEBUG LOGIN per: {email}")
        print("=" * 60)
        
        # 1. Verifica esistenza club
        club = Club.query.filter_by(email=email).first()
        if not club:
            print(f"❌ Club con email '{email}' NON TROVATO nel database")
            return
        
        print(f"✅ Club trovato: {club.nome}")
        
        # 2. Debug password
        print(f"\n🔐 DEBUG PASSWORD:")
        print(f"   Password fornita: {password}")
        print(f"   Hash nel DB: {club.password_hash[:50]}...")
        
        # 3. Test password con metodo del modello
        if club.check_password(password):
            print(f"   ✅ check_password() -> TRUE")
        else:
            print(f"   ❌ check_password() -> FALSE")
            
        # 4. Test diretto con werkzeug
        direct_check = check_password_hash(club.password_hash, password)
        print(f"   Test diretto werkzeug: {'✅ PASS' if direct_check else '❌ FAIL'}")
        
        # 5. Genera nuovo hash per confronto
        new_hash = generate_password_hash(password, method='pbkdf2:sha256')
        print(f"   Nuovo hash generato: {new_hash[:50]}...")
        
        # 6. Verifica stato account
        print(f"\n📊 STATO ACCOUNT:")
        print(f"   Account attivo: {'✅' if club.account_attivo else '❌'}")
        print(f"   Data scadenza: {club.data_scadenza_licenza}")
        print(f"   Licenza valida: {'✅' if club.is_licenza_valida() else '❌'}")
        
        # 7. Test con diverse password comuni
        print(f"\n🧪 TEST PASSWORD ALTERNATIVE:")
        test_passwords = [
            "Stellamare2024!",
            "stellamare2024!",
            "Stellamare2024",
            "password",
            "123456"
        ]
        
        for test_pwd in test_passwords:
            result = club.check_password(test_pwd)
            print(f"   '{test_pwd}': {'✅ MATCH' if result else '❌ NO MATCH'}")
        
        # 8. Reimposta password e verifica
        print(f"\n🔄 REIMPOSTAZIONE PASSWORD:")
        print(f"   Reimpostando password a: {password}")
        club.set_password(password)
        db.session.commit()
        
        # Ricarica dal database
        club = Club.query.filter_by(email=email).first()
        new_check = club.check_password(password)
        print(f"   Dopo reimpostazione: {'✅ FUNZIONA' if new_check else '❌ NON FUNZIONA'}")
        
        return new_check

if __name__ == "__main__":
    email = "info@fcstellamare.it"
    password = "Stellamare2024!"
    
    print("🔐 DEBUG DETTAGLIATO LOGIN CLUB")
    print("-" * 60)
    
    result = debug_club_auth(email, password)
    
    print("\n" + "=" * 60)
    if result:
        print("✅ AUTENTICAZIONE DOVREBBE FUNZIONARE")
        print(f"\nCredenziali corrette:")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
    else:
        print("❌ PROBLEMA DI AUTENTICAZIONE RILEVATO")