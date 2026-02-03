#!/usr/bin/env python3
"""
Script per verificare e correggere lo stato del club
"""
from app import create_app, db
from app.models import Club
from datetime import datetime, timedelta

def check_and_fix_club(email):
    """Verifica e corregge lo stato del club"""
    app = create_app()
    
    with app.app_context():
        club = Club.query.filter_by(email=email).first()
        
        if not club:
            print(f"❌ Club con email '{email}' non trovato")
            return
        
        print(f"\n📊 Stato del Club: {club.nome}")
        print("=" * 50)
        
        # Verifica tutti i campi rilevanti
        print(f"✉️  Email: {club.email}")
        print(f"🔐 Password hash presente: {'✅ Sì' if club.password_hash else '❌ No'}")
        print(f"✅ Account attivo: {'✅ Sì' if club.account_attivo else '❌ No'}")
        print(f"📅 Data scadenza licenza: {club.data_scadenza_licenza}")
        
        # Verifica se la licenza è valida
        if club.data_scadenza_licenza:
            if club.data_scadenza_licenza < datetime.utcnow():
                print(f"❌ Licenza SCADUTA (scaduta il {club.data_scadenza_licenza})")
            else:
                print(f"✅ Licenza valida fino al {club.data_scadenza_licenza}")
        else:
            print(f"⚠️  Nessuna data di scadenza licenza impostata")
        
        print(f"📦 Tipo abbonamento: {club.tipologia_abbonamento or 'Non specificato'}")
        print(f"💰 Nome abbonamento: {club.nome_abbonamento or 'Non specificato'}")
        
        # Correzione automatica
        print("\n🔧 Applicazione correzioni...")
        
        corrections_made = False
        
        # Attiva l'account se non è attivo
        if not club.account_attivo:
            club.account_attivo = True
            corrections_made = True
            print("   ✅ Account attivato")
        
        # Estendi la licenza se è scaduta o mancante
        if not club.data_scadenza_licenza or club.data_scadenza_licenza < datetime.utcnow():
            # Imposta la scadenza a 1 anno da oggi
            club.data_scadenza_licenza = datetime.utcnow() + timedelta(days=365)
            corrections_made = True
            print(f"   ✅ Licenza estesa fino al {club.data_scadenza_licenza}")
        
        # Imposta abbonamento di default se mancante
        if not club.tipologia_abbonamento:
            club.tipologia_abbonamento = "annuale"
            corrections_made = True
            print("   ✅ Impostato abbonamento annuale")
        
        if corrections_made:
            try:
                db.session.commit()
                print("\n✅ Tutte le correzioni sono state salvate con successo!")
            except Exception as e:
                db.session.rollback()
                print(f"\n❌ Errore durante il salvataggio: {e}")
        else:
            print("\n✅ Nessuna correzione necessaria, il club è già configurato correttamente")

if __name__ == "__main__":
    print("🔐 Verifica e Correzione Stato Club")
    print("-" * 50)
    
    check_and_fix_club("info@fcstellamare.it")