#!/usr/bin/env python3
"""
PITCH PARTNER - Complete Demo Data Seed Script
===============================================
Crea dati demo COMPLETI per club@demo.com.
Eseguire con: cd backend && python seed_demo_data.py
"""

from app import create_app, db
from app.models import (
    Club, Sponsor, Lead, HeadOfTerms, Asset,
    InventoryCategory, InventoryAsset, AssetAllocation,
    Proposal, ProposalItem, ProposalTemplate,
    ContactPerson, LeadActivity, LeadStageHistory,
    SponsorActivity, Catalog, Note, Tag
)
from datetime import datetime, timedelta
from decimal import Decimal
import random
import secrets
import json

def clean_club_data(club_id):
    """Elimina tutti i dati esistenti per il club"""
    print("\n" + "="*60)
    print("PULIZIA DATI ESISTENTI")
    print("="*60)

    # Catalogs - elimina prima le associazioni
    try:
        db.session.execute(db.text(f"""
            DELETE FROM catalog_assets
            WHERE catalog_id IN (SELECT id FROM catalogs WHERE club_id = {club_id})
        """))
        db.session.commit()
    except:
        db.session.rollback()

    # Ordine corretto per rispettare FK
    tables = [
        ('catalogs', f'club_id = {club_id}'),
        ('proposal_items', f'proposal_id IN (SELECT id FROM proposals WHERE club_id = {club_id})'),
        ('proposal_versions', f'proposal_id IN (SELECT id FROM proposals WHERE club_id = {club_id})'),
        ('proposal_tracking', f'proposal_id IN (SELECT id FROM proposals WHERE club_id = {club_id})'),
        ('proposals', f'club_id = {club_id}'),
        ('proposal_templates', f'club_id = {club_id}'),
        ('asset_allocations', f'club_id = {club_id}'),
        ('asset_availabilities', f'club_id IN (SELECT club_id FROM inventory_assets WHERE club_id = {club_id})'),
        ('asset_pricing_tiers', f'asset_id IN (SELECT id FROM inventory_assets WHERE club_id = {club_id})'),
        ('inventory_assets', f'club_id = {club_id}'),
        ('inventory_categories', f'club_id = {club_id}'),
        ('checklists', f'head_of_terms_id IN (SELECT id FROM head_of_terms WHERE club_id = {club_id})'),
        ('assets', f'head_of_terms_id IN (SELECT id FROM head_of_terms WHERE club_id = {club_id})'),
        ('head_of_terms', f'club_id = {club_id}'),
        ('lead_activities', f'club_id = {club_id}'),
        ('lead_stage_history', f'lead_id IN (SELECT id FROM leads WHERE club_id = {club_id})'),
        ('lead_products', f'lead_id IN (SELECT id FROM leads WHERE club_id = {club_id})'),
        ('lead_documents', f'lead_id IN (SELECT id FROM leads WHERE club_id = {club_id})'),
        ('crm_notes', f'club_id = {club_id}'),
        ('contact_persons', f'club_id = {club_id}'),
        ('lead_tags', f'lead_id IN (SELECT id FROM leads WHERE club_id = {club_id})'),
        ('leads', f'club_id = {club_id}'),
        ('sponsor_activities', f'club_id = {club_id}'),
        ('sponsors', f'club_id = {club_id}'),
        ('tags', f'club_id = {club_id}'),
    ]

    for table, condition in tables:
        try:
            result = db.session.execute(db.text(f"DELETE FROM {table} WHERE {condition}"))
            db.session.commit()
            if result.rowcount > 0:
                print(f"  - {table}: {result.rowcount} record eliminati")
        except Exception as e:
            db.session.rollback()

    print("  Pulizia completata!")


def create_inventory_categories(club_id):
    """Crea categorie inventario"""
    print("\n" + "="*60)
    print("CREAZIONE CATEGORIE INVENTARIO")
    print("="*60)

    categories_data = [
        {'nome': 'LED & Digital', 'codice': 'LED', 'descrizione': 'Spazi LED e contenuti digitali', 'icona': 'FaDesktop', 'colore': '#3B82F6'},
        {'nome': 'Branding Maglia', 'codice': 'MAGLIA', 'descrizione': 'Sponsorship su divise ufficiali', 'icona': 'FaTshirt', 'colore': '#EF4444'},
        {'nome': 'Hospitality', 'codice': 'HOSP', 'descrizione': 'Esperienze VIP e hospitality', 'icona': 'FaGlassCheers', 'colore': '#F59E0B'},
        {'nome': 'Social Media', 'codice': 'SOCIAL', 'descrizione': 'Contenuti e visibilita social', 'icona': 'FaInstagram', 'colore': '#EC4899'},
        {'nome': 'Naming Rights', 'codice': 'NAMING', 'descrizione': 'Diritti di denominazione', 'icona': 'FaBuilding', 'colore': '#8B5CF6'},
        {'nome': 'Stadio', 'codice': 'STADIO', 'descrizione': 'Asset fisici nello stadio', 'icona': 'FaFutbol', 'colore': '#10B981'},
    ]

    categories = {}
    for i, data in enumerate(categories_data):
        cat = InventoryCategory(
            club_id=club_id,
            ordine=i,
            **data
        )
        db.session.add(cat)
        db.session.flush()
        categories[data['nome']] = cat
        print(f"  + {data['nome']}")

    db.session.commit()
    return categories


def create_inventory_assets(club_id, categories):
    """Crea asset inventario"""
    print("\n" + "="*60)
    print("CREAZIONE ASSET INVENTARIO")
    print("="*60)

    assets_data = [
        # LED & Digital
        {'cat': 'LED & Digital', 'codice': 'LED-001', 'nome': 'LED Bordocampo Principale',
         'descrizione': 'Spazio LED premium 100m lungo il lato campo principale con visibilita TV garantita. Rotazione ogni 8 minuti durante la partita.',
         'tipo': 'fisico', 'posizione': 'Lato campo TV', 'dimensioni': '100m x 1m',
         'prezzo_listino': 50000, 'prezzo_minimo': 40000, 'quantita_totale': 10, 'quantita_disponibile': 7},

        {'cat': 'LED & Digital', 'codice': 'LED-002', 'nome': 'LED Bordocampo Secondario',
         'descrizione': 'Spazio LED 80m sul lato opposto, ottima visibilita per pubblico presente.',
         'tipo': 'fisico', 'posizione': 'Lato tribuna', 'dimensioni': '80m x 1m',
         'prezzo_listino': 25000, 'prezzo_minimo': 20000, 'quantita_totale': 8, 'quantita_disponibile': 5},

        {'cat': 'LED & Digital', 'codice': 'LED-003', 'nome': 'Maxischermo Intervallo',
         'descrizione': 'Spot video 30 secondi sul maxischermo durante intervallo e pre-partita.',
         'tipo': 'digitale', 'prezzo_listino': 15000, 'prezzo_minimo': 12000,
         'quantita_totale': 6, 'quantita_disponibile': 4},

        {'cat': 'LED & Digital', 'codice': 'LED-004', 'nome': 'Virtual Billboard',
         'descrizione': 'Cartellone virtuale inserito nelle trasmissioni TV con tecnologia overlay.',
         'tipo': 'digitale', 'prezzo_listino': 35000, 'prezzo_minimo': 28000,
         'quantita_totale': 4, 'quantita_disponibile': 3},

        # Branding Maglia
        {'cat': 'Branding Maglia', 'codice': 'MAGLIA-001', 'nome': 'Main Sponsor Fronte',
         'descrizione': 'Posizione premium: logo principale sul petto della maglia. Massima visibilita in ogni inquadratura.',
         'tipo': 'fisico', 'posizione': 'Centro petto', 'dimensioni': '20cm x 15cm',
         'prezzo_listino': 250000, 'prezzo_minimo': 200000, 'quantita_totale': 1, 'quantita_disponibile': 0},

        {'cat': 'Branding Maglia', 'codice': 'MAGLIA-002', 'nome': 'Back Sponsor',
         'descrizione': 'Logo sulla schiena della maglia sotto il numero. Visibilita durante le azioni di gioco.',
         'tipo': 'fisico', 'posizione': 'Schiena', 'dimensioni': '15cm x 10cm',
         'prezzo_listino': 100000, 'prezzo_minimo': 80000, 'quantita_totale': 1, 'quantita_disponibile': 1},

        {'cat': 'Branding Maglia', 'codice': 'MAGLIA-003', 'nome': 'Sleeve Sponsor',
         'descrizione': 'Logo sulla manica destra della maglia.',
         'tipo': 'fisico', 'posizione': 'Manica destra', 'dimensioni': '8cm x 8cm',
         'prezzo_listino': 50000, 'prezzo_minimo': 40000, 'quantita_totale': 2, 'quantita_disponibile': 1},

        {'cat': 'Branding Maglia', 'codice': 'MAGLIA-004', 'nome': 'Training Kit Sponsor',
         'descrizione': 'Logo su tutto il kit di allenamento: maglie, pantaloncini, tute.',
         'tipo': 'fisico', 'posizione': 'Kit allenamento', 'dimensioni': '10cm x 8cm',
         'prezzo_listino': 30000, 'prezzo_minimo': 25000, 'quantita_totale': 1, 'quantita_disponibile': 1},

        # Hospitality
        {'cat': 'Hospitality', 'codice': 'HOSP-001', 'nome': 'Sky Box Premium (10 posti)',
         'descrizione': 'Sky box esclusivo con: vista panoramica, catering gourmet, open bar, parcheggio VIP, hostess dedicata.',
         'tipo': 'esperienza', 'posizione': 'Tribuna Centrale Livello 3',
         'prezzo_listino': 3000, 'prezzo_minimo': 2500, 'quantita_totale': 5, 'quantita_disponibile': 3},

        {'cat': 'Hospitality', 'codice': 'HOSP-002', 'nome': 'Business Lounge',
         'descrizione': 'Accesso alla Business Lounge: buffet premium, open bar, networking area, posto tribuna.',
         'tipo': 'esperienza', 'posizione': 'Area VIP',
         'prezzo_listino': 250, 'prezzo_minimo': 200, 'quantita_totale': 100, 'quantita_disponibile': 75},

        {'cat': 'Hospitality', 'codice': 'HOSP-003', 'nome': 'Meet & Greet Giocatori',
         'descrizione': 'Incontro esclusivo post-partita con 2 giocatori a scelta. Include foto e autografi.',
         'tipo': 'esperienza', 'prezzo_listino': 5000, 'prezzo_minimo': 4000,
         'quantita_totale': 2, 'quantita_disponibile': 2},

        {'cat': 'Hospitality', 'codice': 'HOSP-004', 'nome': 'Mascotte Experience',
         'descrizione': 'Il figlio dello sponsor accompagna la squadra in campo come mascotte. Include kit completo.',
         'tipo': 'esperienza', 'prezzo_listino': 2000, 'prezzo_minimo': 1500,
         'quantita_totale': 1, 'quantita_disponibile': 1},

        # Social Media
        {'cat': 'Social Media', 'codice': 'SOCIAL-001', 'nome': 'Pacchetto Instagram (10 post)',
         'descrizione': '10 post brandizzati sul profilo Instagram ufficiale. Include approvazione contenuti.',
         'tipo': 'digitale', 'prezzo_listino': 8000, 'prezzo_minimo': 6000,
         'quantita_totale': 5, 'quantita_disponibile': 4},

        {'cat': 'Social Media', 'codice': 'SOCIAL-002', 'nome': 'Pacchetto Stories (20)',
         'descrizione': '20 stories Instagram con menzione e tag sponsor. Reach medio 50k.',
         'tipo': 'digitale', 'prezzo_listino': 5000, 'prezzo_minimo': 4000,
         'quantita_totale': 10, 'quantita_disponibile': 8},

        {'cat': 'Social Media', 'codice': 'SOCIAL-003', 'nome': 'Video TikTok (5 video)',
         'descrizione': '5 video TikTok brandizzati con giocatori. Formato trending, potenziale virale.',
         'tipo': 'digitale', 'prezzo_listino': 12000, 'prezzo_minimo': 10000,
         'quantita_totale': 3, 'quantita_disponibile': 2},

        {'cat': 'Social Media', 'codice': 'SOCIAL-004', 'nome': 'YouTube Integration',
         'descrizione': 'Integrazione sponsor in 10 video YouTube: highlights, interviste, dietro le quinte.',
         'tipo': 'digitale', 'prezzo_listino': 15000, 'prezzo_minimo': 12000,
         'quantita_totale': 2, 'quantita_disponibile': 2},

        # Naming Rights
        {'cat': 'Naming Rights', 'codice': 'NAMING-001', 'nome': 'Naming Stadio',
         'descrizione': 'Diritto di denominazione dello stadio per la stagione. Include segnaletica esterna e comunicazioni ufficiali.',
         'tipo': 'misto', 'prezzo_listino': 500000, 'prezzo_minimo': 400000,
         'quantita_totale': 1, 'quantita_disponibile': 1},

        {'cat': 'Naming Rights', 'codice': 'NAMING-002', 'nome': 'Naming Training Center',
         'descrizione': 'Diritto di denominazione del centro sportivo. Include cartellonistica e comunicazioni.',
         'tipo': 'misto', 'prezzo_listino': 150000, 'prezzo_minimo': 120000,
         'quantita_totale': 1, 'quantita_disponibile': 1},

        {'cat': 'Naming Rights', 'codice': 'NAMING-003', 'nome': 'Naming Curva Sud',
         'descrizione': 'Denominazione della Curva Sud dello stadio.',
         'tipo': 'misto', 'prezzo_listino': 75000, 'prezzo_minimo': 60000,
         'quantita_totale': 1, 'quantita_disponibile': 1},

        # Stadio
        {'cat': 'Stadio', 'codice': 'STADIO-001', 'nome': 'Backdrop Interviste',
         'descrizione': 'Logo sul backdrop ufficiale per interviste pre e post partita. Massima esposizione media.',
         'tipo': 'fisico', 'posizione': 'Mixed Zone',
         'prezzo_listino': 40000, 'prezzo_minimo': 32000, 'quantita_totale': 6, 'quantita_disponibile': 4},

        {'cat': 'Stadio', 'codice': 'STADIO-002', 'nome': 'Bandierine Corner',
         'descrizione': 'Logo sulle bandierine dei calci d angolo. 4 bandierine brandizzate.',
         'tipo': 'fisico', 'posizione': 'Angoli campo',
         'prezzo_listino': 10000, 'prezzo_minimo': 8000, 'quantita_totale': 1, 'quantita_disponibile': 1},

        {'cat': 'Stadio', 'codice': 'STADIO-003', 'nome': 'Seggiolini Brandizzati',
         'descrizione': '500 seggiolini con logo sponsor in tribuna centrale.',
         'tipo': 'fisico', 'posizione': 'Tribuna Centrale',
         'prezzo_listino': 20000, 'prezzo_minimo': 15000, 'quantita_totale': 4, 'quantita_disponibile': 3},
    ]

    assets = []
    for data in assets_data:
        cat_name = data.pop('cat')
        asset = InventoryAsset(
            club_id=club_id,
            category_id=categories[cat_name].id,
            disponibile=data.get('quantita_disponibile', 1) > 0,
            visibile_marketplace=True,
            attivo=True,
            **data
        )
        db.session.add(asset)
        db.session.flush()
        assets.append(asset)
        print(f"  + [{data['codice']}] {data['nome']}")

    db.session.commit()
    return assets


def create_sponsors_and_contracts(club_id, assets):
    """Crea sponsor con contratti attivi"""
    print("\n" + "="*60)
    print("CREAZIONE SPONSOR E CONTRATTI")
    print("="*60)

    sponsors_data = [
        {
            'ragione_sociale': 'TechCorp Italia SpA',
            'partita_iva': 'IT12345678901',
            'settore_merceologico': 'Tecnologia',
            'email': 'sponsor@techcorp.it',
            'telefono': '+39 02 12345678',
            'sito_web': 'https://www.techcorp.it',
            'referente_nome': 'Marco', 'referente_cognome': 'Rossi',
            'referente_ruolo': 'Marketing Director',
            'indirizzo_sede': 'Via Roma 100, 20100 Milano',
            'contract': {
                'nome': 'Main Sponsor 2024-2025',
                'compenso': 250000,
                'status': 'attivo',
                'assets': [
                    ('Branding', 'Logo Maglia Fronte', 200000, 'in_corso'),
                    ('LED', 'LED Bordocampo 50m', 30000, 'completato'),
                    ('Social', 'Pacchetto Social Gold', 20000, 'da_consegnare'),
                ]
            }
        },
        {
            'ragione_sociale': 'Banca Finanza Piu',
            'partita_iva': 'IT98765432109',
            'settore_merceologico': 'Bancario/Finanziario',
            'email': 'partnership@bancafinanza.it',
            'telefono': '+39 06 87654321',
            'sito_web': 'https://www.bancafinanza.it',
            'referente_nome': 'Giulia', 'referente_cognome': 'Bianchi',
            'referente_ruolo': 'Head of Sponsorship',
            'indirizzo_sede': 'Piazza Duomo 1, 20100 Milano',
            'contract': {
                'nome': 'Premium Partner 2024-2025',
                'compenso': 100000,
                'status': 'attivo',
                'assets': [
                    ('Hospitality', 'Sky Box Stagionale', 50000, 'completato'),
                    ('LED', 'LED Curva Sud', 25000, 'in_corso'),
                    ('Branding', 'Logo Manica', 25000, 'completato'),
                ]
            }
        },
        {
            'ragione_sociale': 'AutoDrive Motors',
            'partita_iva': 'IT11223344556',
            'settore_merceologico': 'Automotive',
            'email': 'marketing@autodrive.it',
            'telefono': '+39 011 9876543',
            'sito_web': 'https://www.autodrive.it',
            'referente_nome': 'Luca', 'referente_cognome': 'Ferrari',
            'referente_ruolo': 'Brand Manager',
            'indirizzo_sede': 'Corso Torino 50, 10100 Torino',
            'contract': {
                'nome': 'Official Car Partner',
                'compenso': 75000,
                'status': 'attivo',
                'assets': [
                    ('Branding', 'Logo Backdrop Interviste', 40000, 'completato'),
                    ('Social', 'Content Partnership', 35000, 'in_corso'),
                ]
            }
        },
    ]

    sponsors = []
    contracts = []

    for sp_data in sponsors_data:
        contract_info = sp_data.pop('contract')

        # Crea sponsor
        sponsor = Sponsor(club_id=club_id, account_attivo=True, **sp_data)
        sponsor.set_password('demo123')
        db.session.add(sponsor)
        db.session.flush()
        sponsors.append(sponsor)

        # Crea contatto principale
        contact = ContactPerson(
            club_id=club_id,
            sponsor_id=sponsor.id,
            nome=sp_data['referente_nome'],
            cognome=sp_data['referente_cognome'],
            ruolo=sp_data['referente_ruolo'],
            email=sp_data['email'],
            telefono=sp_data['telefono'],
            ruolo_decisionale='decisore',
            is_referente_principale=True
        )
        db.session.add(contact)

        # Crea contratto
        contract = HeadOfTerms(
            club_id=club_id,
            sponsor_id=sponsor.id,
            nome_contratto=f"{contract_info['nome']} - {sponsor.ragione_sociale}",
            compenso=contract_info['compenso'],
            descrizione=f"Contratto di sponsorizzazione {contract_info['nome']}",
            data_inizio=datetime(2024, 7, 1),
            data_fine=datetime(2025, 6, 30),
            status=contract_info['status']
        )
        db.session.add(contract)
        db.session.flush()
        contracts.append(contract)

        # Crea asset del contratto
        for cat, nome, valore, status in contract_info['assets']:
            asset = Asset(
                head_of_terms_id=contract.id,
                categoria=cat,
                nome=nome,
                descrizione=f"{nome} per {sponsor.ragione_sociale}",
                quantita_totale=1,
                quantita_utilizzata=0,
                valore=valore,
                status=status
            )
            db.session.add(asset)

        # Crea attivita sponsor
        activities = [
            ('meeting', 'Kick-off meeting stagione', 60),
            ('email', 'Invio materiali grafici', 45),
            ('chiamata', 'Review mensile', 15),
        ]
        for tipo, titolo, days_ago in activities:
            act = SponsorActivity(
                sponsor_id=sponsor.id,
                club_id=club_id,
                tipo=tipo,
                titolo=titolo,
                descrizione=f"Attivita con {sponsor.ragione_sociale}",
                data_attivita=datetime.now() - timedelta(days=days_ago),
                esito='positivo',
                creato_da='Club Demo'
            )
            db.session.add(act)

        print(f"  + {sponsor.ragione_sociale} ({contract_info['compenso']:,} EUR)")

    db.session.commit()
    return sponsors, contracts


def create_leads(club_id):
    """Crea lead nella pipeline"""
    print("\n" + "="*60)
    print("CREAZIONE LEADS PIPELINE")
    print("="*60)

    leads_data = [
        # CALDI - Alta probabilita
        {'ragione_sociale': 'FoodExpress Srl', 'settore': 'Food & Beverage',
         'email': 'info@foodexpress.it', 'telefono': '+39 02 11111111',
         'referente_nome': 'Andrea', 'referente_cognome': 'Verdi', 'referente_ruolo': 'CEO',
         'status': 'negoziazione', 'valore_stimato': 80000, 'probabilita_chiusura': 75,
         'fonte': 'referral', 'priorita': 3,
         'note': 'Molto interessati. Hanno richiesto proposta personalizzata per pacchetto hospitality + LED.'},

        {'ragione_sociale': 'SportWear Pro', 'settore': 'Abbigliamento Sportivo',
         'email': 'partnership@sportwear.it', 'telefono': '+39 055 22222222',
         'referente_nome': 'Chiara', 'referente_cognome': 'Neri', 'referente_ruolo': 'Marketing Manager',
         'status': 'proposta_inviata', 'valore_stimato': 120000, 'probabilita_chiusura': 60,
         'fonte': 'evento', 'priorita': 3,
         'note': 'Proposta da 120k inviata il 15/01. In attesa di feedback dal board.'},

        # TIEPIDI - Media probabilita
        {'ragione_sociale': 'Energia Verde SpA', 'settore': 'Energia',
         'email': 'sponsor@energiaverde.it', 'telefono': '+39 06 33333333',
         'referente_nome': 'Paolo', 'referente_cognome': 'Gialli', 'referente_ruolo': 'Dir. Comunicazione',
         'status': 'in_trattativa', 'valore_stimato': 150000, 'probabilita_chiusura': 40,
         'fonte': 'cold_call', 'priorita': 2,
         'note': 'Interessati ma budget limitato per questa stagione. Valutano per 2025-2026.'},

        {'ragione_sociale': 'TelecomNet Italia', 'settore': 'Telecomunicazioni',
         'email': 'marketing@telecomnet.it', 'telefono': '+39 02 44444444',
         'referente_nome': 'Sara', 'referente_cognome': 'Blu', 'referente_ruolo': 'Brand Lead',
         'status': 'in_trattativa', 'valore_stimato': 200000, 'probabilita_chiusura': 35,
         'fonte': 'website', 'priorita': 2,
         'note': 'Contatto iniziale molto positivo. Stanno valutando diverse opzioni nel calcio.'},

        # FREDDI - Bassa probabilita
        {'ragione_sociale': 'Farmacia Centrale', 'settore': 'Farmaceutico',
         'email': 'info@farmaciacentrale.it', 'telefono': '+39 02 55555555',
         'referente_nome': 'Dott. Roberto', 'referente_cognome': 'Bianchi',
         'status': 'contattato', 'valore_stimato': 30000, 'probabilita_chiusura': 20,
         'fonte': 'referral', 'priorita': 1},

        {'ragione_sociale': 'Hotel Luxury Resort', 'settore': 'Hospitality',
         'email': 'direzione@luxuryresort.it', 'telefono': '+39 02 66666666',
         'referente_nome': 'Maria', 'referente_cognome': 'Rosa', 'referente_ruolo': 'GM',
         'status': 'nuovo', 'valore_stimato': 50000, 'probabilita_chiusura': 10,
         'fonte': 'social', 'priorita': 1},

        {'ragione_sociale': 'Assicurazioni Sicure', 'settore': 'Assicurativo',
         'email': 'corporate@assicurazionisicure.it', 'telefono': '+39 02 77777777',
         'referente_nome': 'Giovanni', 'referente_cognome': 'Grigi', 'referente_ruolo': 'Dir. Marketing',
         'status': 'nuovo', 'valore_stimato': 90000, 'probabilita_chiusura': 15,
         'fonte': 'evento', 'priorita': 2,
         'note': 'Incontrati a evento networking. Da ricontattare.'},

        # PERSO - per statistiche
        {'ragione_sociale': 'OldTech Solutions', 'settore': 'Tecnologia',
         'email': 'info@oldtech.it', 'telefono': '+39 02 88888888',
         'referente_nome': 'Franco', 'referente_cognome': 'Marroni',
         'status': 'perso', 'valore_stimato': 40000, 'probabilita_chiusura': 0,
         'fonte': 'cold_call', 'priorita': 1,
         'motivo_perdita': 'Budget non disponibile per il 2024'},
    ]

    leads = []
    for data in leads_data:
        settore = data.pop('settore')
        lead = Lead(
            club_id=club_id,
            settore_merceologico=settore,
            **data
        )
        db.session.add(lead)
        db.session.flush()
        leads.append(lead)

        # Contatto
        if data.get('referente_nome'):
            contact = ContactPerson(
                club_id=club_id,
                lead_id=lead.id,
                nome=data.get('referente_nome', ''),
                cognome=data.get('referente_cognome', ''),
                ruolo=data.get('referente_ruolo', ''),
                email=data['email'],
                telefono=data.get('telefono'),
                ruolo_decisionale='decisore' if data.get('priorita', 1) >= 2 else 'influencer',
                is_referente_principale=True
            )
            db.session.add(contact)

        # Attivita
        if data['status'] != 'nuovo':
            act = LeadActivity(
                lead_id=lead.id,
                club_id=club_id,
                tipo='chiamata',
                titolo='Primo contatto',
                data_attivita=datetime.now() - timedelta(days=30),
                esito='positivo',
                creato_da='Club Demo'
            )
            db.session.add(act)

        if data['status'] in ['in_trattativa', 'proposta_inviata', 'negoziazione']:
            act2 = LeadActivity(
                lead_id=lead.id,
                club_id=club_id,
                tipo='meeting',
                titolo='Meeting conoscitivo',
                data_attivita=datetime.now() - timedelta(days=20),
                esito='positivo',
                creato_da='Club Demo'
            )
            db.session.add(act2)

        print(f"  + {data['ragione_sociale']} [{data['status']}] ({data['valore_stimato']:,} EUR)")

    db.session.commit()
    return leads


def create_proposals(club_id, leads, assets):
    """Crea proposte"""
    print("\n" + "="*60)
    print("CREAZIONE PROPOSTE")
    print("="*60)

    proposals = []

    # Proposta 1: Inviata a lead SportWear Pro
    lead1 = next((l for l in leads if l.ragione_sociale == 'SportWear Pro'), None)
    if lead1:
        p1 = Proposal(
            club_id=club_id,
            lead_id=lead1.id,
            codice='PROP-2024-001',
            titolo=f'Partnership Premium {lead1.ragione_sociale}',
            messaggio_introduttivo='Pacchetto completo sponsorship stagione 2024-2025 con focus su branding e hospitality.',
            stato='inviata',
            valore_totale=120000,
            sconto_percentuale=10,
            valore_finale=108000,
            data_scadenza=datetime.now() + timedelta(days=30),
            data_invio=datetime.now() - timedelta(days=5),
            link_condivisione=secrets.token_urlsafe(16),
            link_attivo=True,
            visualizzazioni=12,
            destinatario_azienda=lead1.ragione_sociale,
            destinatario_email=lead1.email,
            versione_corrente=1
        )
        db.session.add(p1)
        db.session.flush()
        proposals.append(p1)

        # Items
        items = [
            ('LED & Digital', 'LED Bordocampo Principale', 2, 50000, 'LED-001'),
            ('Social Media', 'Pacchetto Instagram (10 post)', 1, 8000, 'SOCIAL-001'),
            ('Hospitality', 'Sky Box Premium', 4, 3000, 'HOSP-001'),
        ]
        for i, (gruppo, nome, qty, prezzo, codice) in enumerate(items):
            asset = next((a for a in assets if a.codice == codice), None)
            item = ProposalItem(
                proposal_id=p1.id,
                asset_id=asset.id if asset else None,
                gruppo=gruppo,
                tipo=gruppo,
                nome_display=nome,
                ordine=i,
                selezionato=True,
                quantita=qty,
                prezzo_unitario=prezzo,
                valore_totale=qty * prezzo
            )
            db.session.add(item)

        print(f"  + {p1.codice}: {p1.titolo} (108,000 EUR) - INVIATA")

    # Proposta 2: In trattativa con FoodExpress
    lead2 = next((l for l in leads if l.ragione_sociale == 'FoodExpress Srl'), None)
    if lead2:
        p2 = Proposal(
            club_id=club_id,
            lead_id=lead2.id,
            codice='PROP-2024-002',
            titolo=f'Proposta Hospitality {lead2.ragione_sociale}',
            messaggio_introduttivo='Focus su hospitality e visibilita LED per il settore food.',
            stato='in_trattativa',
            valore_totale=80000,
            sconto_percentuale=5,
            valore_finale=76000,
            data_scadenza=datetime.now() + timedelta(days=45),
            data_invio=datetime.now() - timedelta(days=10),
            data_risposta=datetime.now() - timedelta(days=3),
            link_condivisione=secrets.token_urlsafe(16),
            link_attivo=True,
            visualizzazioni=8,
            destinatario_azienda=lead2.ragione_sociale,
            destinatario_email=lead2.email,
            versione_corrente=2
        )
        db.session.add(p2)
        db.session.flush()
        proposals.append(p2)

        items2 = [
            ('LED & Digital', 'LED Bordocampo Secondario', 3, 25000, 'LED-002'),
            ('Hospitality', 'Business Lounge', 20, 250, 'HOSP-002'),
        ]
        for i, (gruppo, nome, qty, prezzo, codice) in enumerate(items2):
            asset = next((a for a in assets if a.codice == codice), None)
            item = ProposalItem(
                proposal_id=p2.id,
                asset_id=asset.id if asset else None,
                gruppo=gruppo,
                tipo=gruppo,
                nome_display=nome,
                ordine=i,
                selezionato=True,
                quantita=qty,
                prezzo_unitario=prezzo,
                valore_totale=qty * prezzo
            )
            db.session.add(item)

        print(f"  + {p2.codice}: {p2.titolo} (76,000 EUR) - IN TRATTATIVA")

    # Proposta 3: Bozza template
    p3 = Proposal(
        club_id=club_id,
        codice='PROP-2024-003',
        titolo='Template Pacchetto Bronze',
        messaggio_introduttivo='Proposta entry-level per nuovi sponsor.',
        stato='bozza',
        valore_totale=35000,
        valore_finale=35000,
        data_scadenza=datetime.now() + timedelta(days=60),
        link_condivisione=secrets.token_urlsafe(16),
        link_attivo=False,
        versione_corrente=1
    )
    db.session.add(p3)
    db.session.flush()
    proposals.append(p3)

    items3 = [
        ('LED & Digital', 'LED Bordocampo Secondario', 1, 25000, 'LED-002'),
        ('Social Media', 'Pacchetto Stories (20)', 2, 5000, 'SOCIAL-002'),
    ]
    for i, (gruppo, nome, qty, prezzo, codice) in enumerate(items3):
        asset = next((a for a in assets if a.codice == codice), None)
        item = ProposalItem(
            proposal_id=p3.id,
            asset_id=asset.id if asset else None,
            gruppo=gruppo,
            tipo=gruppo,
            nome_display=nome,
            ordine=i,
            selezionato=True,
            quantita=qty,
            prezzo_unitario=prezzo,
            valore_totale=qty * prezzo
        )
        db.session.add(item)

    print(f"  + {p3.codice}: {p3.titolo} (35,000 EUR) - BOZZA")

    # Proposta 4: Accettata (pronta per conversione)
    p4 = Proposal(
        club_id=club_id,
        codice='PROP-2024-004',
        titolo='Pacchetto Silver - Assicurazioni Sicure',
        messaggio_introduttivo='Proposta accettata, pronta per diventare contratto.',
        stato='accettata',
        valore_totale=90000,
        sconto_percentuale=15,
        valore_finale=76500,
        data_scadenza=datetime.now() + timedelta(days=15),
        data_invio=datetime.now() - timedelta(days=20),
        data_risposta=datetime.now() - timedelta(days=5),
        data_accettazione=datetime.now() - timedelta(days=5),
        link_condivisione=secrets.token_urlsafe(16),
        link_attivo=True,
        visualizzazioni=15,
        destinatario_azienda='Assicurazioni Sicure',
        destinatario_email='corporate@assicurazionisicure.it',
        versione_corrente=1
    )
    db.session.add(p4)
    db.session.flush()
    proposals.append(p4)

    items4 = [
        ('LED & Digital', 'LED Bordocampo Principale', 1, 50000, 'LED-001'),
        ('Branding Maglia', 'Training Kit Sponsor', 1, 30000, 'MAGLIA-004'),
        ('Social Media', 'Video TikTok (5 video)', 1, 12000, 'SOCIAL-003'),
    ]
    for i, (gruppo, nome, qty, prezzo, codice) in enumerate(items4):
        asset = next((a for a in assets if a.codice == codice), None)
        item = ProposalItem(
            proposal_id=p4.id,
            asset_id=asset.id if asset else None,
            gruppo=gruppo,
            tipo=gruppo,
            nome_display=nome,
            ordine=i,
            selezionato=True,
            quantita=qty,
            prezzo_unitario=prezzo,
            valore_totale=qty * prezzo
        )
        db.session.add(item)

    print(f"  + {p4.codice}: {p4.titolo} (76,500 EUR) - ACCETTATA")

    db.session.commit()
    return proposals


def create_catalogs(club_id, assets):
    """Crea cataloghi pubblici"""
    print("\n" + "="*60)
    print("CREAZIONE CATALOGHI")
    print("="*60)

    catalogs_data = [
        {
            'nome': 'Catalogo Sponsorship 2024-2025',
            'descrizione': 'Catalogo completo di tutte le opportunita di sponsorizzazione per la stagione sportiva 2024-2025.',
            'messaggio_benvenuto': 'Benvenuto! Scopri tutte le opportunita di partnership con il nostro club e trova il pacchetto perfetto per la tua azienda.',
            'messaggio_footer': 'Per informazioni personalizzate e pacchetti su misura, contattaci. Il nostro team commerciale sara lieto di assisterti.',
            'email_contatto': 'sponsorship@clubdemo.it',
            'telefono_contatto': '+39 02 12345678',
            'mostra_prezzi': True,
            'mostra_disponibilita': True,
            'attivo': True,
            'filter': lambda a: True,  # Tutti
        },
        {
            'nome': 'Pacchetti Premium & Exclusive',
            'descrizione': 'Selezione esclusiva degli asset piu prestigiosi per partner di alto livello.',
            'messaggio_benvenuto': 'Benvenuto nella nostra selezione premium. Asset esclusivi per partner che vogliono il massimo.',
            'email_contatto': 'premium@clubdemo.it',
            'mostra_prezzi': True,
            'mostra_disponibilita': False,
            'attivo': True,
            'filter': lambda a: a.prezzo_listino and a.prezzo_listino >= 40000,
        },
        {
            'nome': 'Digital & Social Package',
            'descrizione': 'Focus su visibilita digitale e presenza sui social media del club.',
            'messaggio_benvenuto': 'Raggiungi il nostro pubblico digitale! Oltre 500k follower sui nostri canali social.',
            'mostra_prezzi': True,
            'mostra_disponibilita': True,
            'attivo': True,
            'filter': lambda a: a.tipo == 'digitale' or 'Social' in (a.category.nome if a.category else ''),
        },
    ]

    catalogs = []
    for cat_data in catalogs_data:
        filter_func = cat_data.pop('filter')

        catalog = Catalog(
            club_id=club_id,
            public_token=secrets.token_urlsafe(16),
            colore_primario='#1A1A1A',
            colore_secondario='#85FF00',
            **cat_data
        )
        db.session.add(catalog)
        db.session.flush()

        # Associa asset filtrati
        filtered = [a for a in assets if filter_func(a)]
        for asset in filtered:
            catalog.assets.append(asset)

        catalogs.append(catalog)
        print(f"  + {cat_data['nome']} ({len(filtered)} asset)")

    db.session.commit()
    return catalogs


def create_tags(club_id):
    """Crea tag per categorizzare lead"""
    print("\n" + "="*60)
    print("CREAZIONE TAGS")
    print("="*60)

    tags = [
        ('Hot Lead', '#EF4444'),
        ('VIP', '#F59E0B'),
        ('Locale', '#3B82F6'),
        ('Nazionale', '#8B5CF6'),
        ('Follow-up Urgente', '#10B981'),
        ('Rinnovo', '#EC4899'),
    ]

    for nome, colore in tags:
        tag = Tag(club_id=club_id, nome=nome, colore=colore)
        db.session.add(tag)
        print(f"  + {nome}")

    db.session.commit()


def main():
    app = create_app()

    with app.app_context():
        print("\n" + "="*60)
        print("PITCH PARTNER - SEED DATI DEMO")
        print("="*60)

        # Trova club@demo.com
        club = Club.query.filter_by(email='club@demo.com').first()
        if not club:
            print("\n[ERRORE] Club con email 'club@demo.com' non trovato!")
            print("Assicurati che il club esista nel database.")
            return

        print(f"\nClub trovato: {club.nome} (ID: {club.id})")

        # Pulisci dati esistenti
        clean_club_data(club.id)

        # Crea tutti i dati
        create_tags(club.id)
        categories = create_inventory_categories(club.id)
        assets = create_inventory_assets(club.id, categories)
        sponsors, contracts = create_sponsors_and_contracts(club.id, assets)
        leads = create_leads(club.id)
        proposals = create_proposals(club.id, leads, assets)
        catalogs = create_catalogs(club.id, assets)

        # Riepilogo
        print("\n" + "="*60)
        print("RIEPILOGO DATI CREATI")
        print("="*60)
        print(f"""
  - Categorie Inventario: {len(categories)}
  - Asset Inventario: {len(assets)}
  - Sponsor: {len(sponsors)}
  - Contratti Attivi: {len(contracts)}
  - Lead Pipeline: {len(leads)}
  - Proposte: {len(proposals)}
  - Cataloghi Pubblici: {len(catalogs)}
""")

        print("="*60)
        print("SEED COMPLETATO CON SUCCESSO!")
        print("="*60)
        print(f"""
CREDENZIALI DI ACCESSO:

  CLUB:
    Email: club@demo.com
    Password: (invariata)

  SPONSOR:
    - sponsor@techcorp.it / demo123
    - partnership@bancafinanza.it / demo123
    - marketing@autodrive.it / demo123

URLS CATALOGHI PUBBLICI:
""")
        for cat in catalogs:
            print(f"  - {cat.nome}: /catalog/{cat.public_token}")

        print("\n" + "="*60)


if __name__ == '__main__':
    main()
