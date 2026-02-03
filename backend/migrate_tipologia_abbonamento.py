#!/usr/bin/env python3
"""
Script di migrazione per aggiungere il campo tipologia_abbonamento alla tabella clubs
"""

import sys
import os

# Aggiungi il percorso della directory backend al Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text

def migrate():
    app = create_app()

    with app.app_context():
        try:
            # Per SQLite, proviamo ad aggiungere la colonna direttamente
            # Se esiste già, SQLite darà un errore che cattureremo
            try:
                db.session.execute(text(
                    "ALTER TABLE clubs ADD COLUMN tipologia_abbonamento VARCHAR(20)"
                ))
                db.session.commit()
                print("✓ Colonna 'tipologia_abbonamento' aggiunta con successo alla tabella clubs")
            except Exception as e:
                if "duplicate column name" in str(e).lower():
                    print("✓ La colonna 'tipologia_abbonamento' esiste già")
                else:
                    raise

        except Exception as e:
            print(f"✗ Errore durante la migrazione: {str(e)}")
            db.session.rollback()
            sys.exit(1)

if __name__ == '__main__':
    migrate()
