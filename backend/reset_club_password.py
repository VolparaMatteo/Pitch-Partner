#!/usr/bin/env python3
"""
Script per reimpostare la password di un club
"""
from app import create_app, db
from app.models import Club
from werkzeug.security import generate_password_hash
import sys

def reset_club_password(email, new_password):
    """
    Reimposta la password per un club specificato
    """
    app = create_app()
    
    with app.app_context():
        # Trova il club per email
        club = Club.query.filter_by(email=email).first()
        
        if not club:
            print(f"❌ Club con email '{email}' non trovato nel database.")
            return False
        
        print(f"✅ Club trovato: {club.nome}")
        
        # Imposta la nuova password
        club.set_password(new_password)
        
        try:
            db.session.commit()
            print(f"✅ Password reimpostata con successo per il club '{club.nome}'")
            print(f"   Email: {email}")
            print(f"   Nuova password: {new_password}")
            return True
        except Exception as e:
            db.session.rollback()
            print(f"❌ Errore durante il salvataggio: {e}")
            return False

if __name__ == "__main__":
    # Email del club da reimpostare
    club_email = "info@fcstellamare.it"
    
    # Nuova password (puoi cambiarla con quella desiderata)
    new_password = "Stellamare2024!"
    
    print(f"\n🔐 Reimpostazione password per il club: {club_email}")
    print("-" * 50)
    
    success = reset_club_password(club_email, new_password)
    
    if success:
        print("\n✅ Operazione completata con successo!")
        print("\n📋 Credenziali di accesso:")
        print(f"   Email: {club_email}")
        print(f"   Password: {new_password}")
        print("\n⚠️  Ricorda di comunicare la nuova password al club in modo sicuro.")
    else:
        print("\n❌ Operazione fallita. Verifica i dettagli sopra.")