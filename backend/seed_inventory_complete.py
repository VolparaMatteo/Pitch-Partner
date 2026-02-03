#!/usr/bin/env python3
"""
PITCH PARTNER - Complete Inventory Demo Data Seed Script
=========================================================
Crea dati inventario COMPLETI e REALISTICI per Club Demo.
Include: Categorie, Asset, Pricing, Allocazioni, Disponibilità, Pacchetti, Esclusività

Eseguire con: python seed_inventory_complete.py
"""

from app import create_app, db
from app.models import (
    Club, Sponsor, InventoryCategory, InventoryAsset, AssetPricingTier,
    AssetAvailability, AssetAllocation, AssetPackage, AssetPackageItem,
    CategoryExclusivity
)
from datetime import datetime, date, timedelta
import json

def main():
    app = create_app()

    with app.app_context():
        print("\n" + "="*70)
        print("PITCH PARTNER - SEED INVENTARIO COMPLETO")
        print("="*70)

        # Trova Club Demo
        club = Club.query.filter_by(nome='Club Demo').first()
        if not club:
            print("ERRORE: Club Demo non trovato!")
            return

        club_id = club.id
        print(f"\nClub trovato: {club.nome} (ID: {club_id})")

        # Trova Sponsor esistenti
        sponsors = Sponsor.query.filter_by(club_id=club_id).all()
        print(f"Sponsor trovati: {len(sponsors)}")

        # Se non ci sono sponsor, ne creiamo alcuni demo
        if len(sponsors) < 5:
            print("\nCreazione sponsor demo...")
            demo_sponsors = [
                {'ragione_sociale': 'TechCorp Solutions', 'settore': 'Technology', 'email': 'sponsor@techcorp.demo'},
                {'ragione_sociale': 'Banca Centrale', 'settore': 'Banking', 'email': 'sponsor@bancacentrale.demo'},
                {'ragione_sociale': 'AutoMotive Plus', 'settore': 'Automotive', 'email': 'sponsor@automotive.demo'},
                {'ragione_sociale': 'FreshDrink Co.', 'settore': 'Beverage', 'email': 'sponsor@freshdrink.demo'},
                {'ragione_sociale': 'SportWear Italia', 'settore': 'Apparel', 'email': 'sponsor@sportwear.demo'},
                {'ragione_sociale': 'TeleMedia Group', 'settore': 'Media', 'email': 'sponsor@telemedia.demo'},
                {'ragione_sociale': 'EnergyPower', 'settore': 'Energy', 'email': 'sponsor@energypower.demo'},
            ]
            for sp_data in demo_sponsors:
                existing = Sponsor.query.filter_by(club_id=club_id, ragione_sociale=sp_data['ragione_sociale']).first()
                if not existing:
                    sp = Sponsor(club_id=club_id, **sp_data, stato='active')
                    db.session.add(sp)
            db.session.commit()
            sponsors = Sponsor.query.filter_by(club_id=club_id).all()
            print(f"  Sponsor totali: {len(sponsors)}")

        sponsor_map = {s.ragione_sociale: s for s in sponsors}

        # Pulizia dati esistenti (ordine corretto per foreign keys)
        print("\nPulizia dati inventario esistenti...")

        # 1. Package Items
        AssetPackageItem.query.filter(
            AssetPackageItem.package_id.in_(
                db.session.query(AssetPackage.id).filter_by(club_id=club_id)
            )
        ).delete(synchronize_session=False)

        # 2. Packages
        AssetPackage.query.filter_by(club_id=club_id).delete()

        # 3. Allocations
        AssetAllocation.query.filter_by(club_id=club_id).delete()

        # 4. Availability
        AssetAvailability.query.filter_by(club_id=club_id).delete()

        # 5. Pricing Tiers
        AssetPricingTier.query.filter(
            AssetPricingTier.asset_id.in_(
                db.session.query(InventoryAsset.id).filter_by(club_id=club_id)
            )
        ).delete(synchronize_session=False)

        # 6. Exclusivities
        CategoryExclusivity.query.filter_by(club_id=club_id).delete()

        # 7. Assets
        InventoryAsset.query.filter_by(club_id=club_id).delete()

        # 8. Categories
        InventoryCategory.query.filter_by(club_id=club_id).delete()

        db.session.commit()
        print("Pulizia completata!")

        # ============================================
        # CATEGORIE INVENTARIO
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE CATEGORIE")
        print("-"*50)

        categories_data = [
            {
                'nome': 'LED Boards',
                'codice': 'led',
                'descrizione': 'Pannelli LED perimetrali e display digitali ad alta visibilità durante le partite',
                'icona': 'led',
                'colore': '#3B82F6',
                'ordine': 1
            },
            {
                'nome': 'Jersey & Kit',
                'codice': 'jersey',
                'descrizione': 'Spazi sulla divisa ufficiale e kit da gioco della prima squadra',
                'icona': 'jersey',
                'colore': '#10B981',
                'ordine': 2
            },
            {
                'nome': 'Digital',
                'codice': 'digital',
                'descrizione': 'Spazi digitali, social media, app e contenuti online',
                'icona': 'digital',
                'colore': '#8B5CF6',
                'ordine': 3
            },
            {
                'nome': 'Hospitality',
                'codice': 'hospitality',
                'descrizione': 'Esperienze VIP, skybox, biglietti premium e pacchetti esclusivi',
                'icona': 'hospitality',
                'colore': '#F59E0B',
                'ordine': 4
            },
            {
                'nome': 'Broadcast',
                'codice': 'broadcast',
                'descrizione': 'Visibilità TV, interviste, conferenze stampa e contenuti broadcast',
                'icona': 'broadcast',
                'colore': '#EF4444',
                'ordine': 5
            },
            {
                'nome': 'Stadium',
                'codice': 'stadium',
                'descrizione': 'Naming rights, cartellonistica fissa, branding strutturale e spazi stadio',
                'icona': 'naming',
                'colore': '#6366F1',
                'ordine': 6
            }
        ]

        categories = {}
        for cat_data in categories_data:
            cat = InventoryCategory(club_id=club_id, **cat_data)
            db.session.add(cat)
            db.session.flush()
            categories[cat_data['codice']] = cat
            print(f"  + Categoria: {cat.nome} ({cat.codice})")

        db.session.commit()

        # ============================================
        # ASSETS INVENTARIO
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE ASSETS")
        print("-"*50)

        assets_data = [
            # === LED BOARDS ===
            {
                'category': 'led',
                'codice': 'LED-TRB-001',
                'nome': 'LED Board Tribuna Centrale',
                'descrizione': 'Pannello LED ad alta definizione posizionato lungo il bordo campo lato tribuna centrale. Visibilità garantita durante tutte le riprese televisive. Risoluzione 4K, aggiornamento contenuti in tempo reale.',
                'descrizione_breve': 'LED perimetrale tribuna centrale - massima visibilità TV',
                'tipo': 'fisico',
                'posizione': 'Bordo campo - Tribuna Centrale',
                'dimensioni': '96m x 1m',
                'specifiche_tecniche': json.dumps({
                    'risoluzione': '4K UHD',
                    'pixel_pitch': '10mm',
                    'luminosita': '6000 nits',
                    'refresh_rate': '3840Hz',
                    'angolo_visione': '160°'
                }),
                'prezzo_listino': 85000,
                'prezzo_minimo': 70000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'led,premium,tv,visibilita',
                'note_interne': 'Asset premium - priorità sponsor principali',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 4500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 8500, 'durata_tipo': 'partita'},
                    {'nome': 'Champions League', 'codice': 'champions', 'prezzo': 12000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 85000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'led',
                'codice': 'LED-CRV-001',
                'nome': 'LED Board Curva Nord',
                'descrizione': 'Pannello LED posizionato dietro la porta lato Curva Nord. Ottima visibilità durante le azioni offensive. Ideale per brand che vogliono associarsi ai momenti di goal.',
                'descrizione_breve': 'LED dietro porta Curva Nord',
                'tipo': 'fisico',
                'posizione': 'Dietro porta - Curva Nord',
                'dimensioni': '12m x 1m',
                'specifiche_tecniche': json.dumps({
                    'risoluzione': 'Full HD',
                    'pixel_pitch': '12mm',
                    'luminosita': '5500 nits'
                }),
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'led,curva,goal',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 2500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 4500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'led',
                'codice': 'LED-CRV-002',
                'nome': 'LED Board Curva Sud',
                'descrizione': 'Pannello LED posizionato dietro la porta lato Curva Sud.',
                'descrizione_breve': 'LED dietro porta Curva Sud',
                'tipo': 'fisico',
                'posizione': 'Dietro porta - Curva Sud',
                'dimensioni': '12m x 1m',
                'specifiche_tecniche': json.dumps({
                    'risoluzione': 'Full HD',
                    'pixel_pitch': '12mm',
                    'luminosita': '5500 nits'
                }),
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'led,curva,goal',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 2500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 4500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'led',
                'codice': 'LED-DST-001',
                'nome': 'LED Board Distinti',
                'descrizione': 'Pannello LED lungo il settore Distinti.',
                'descrizione_breve': 'LED perimetrale settore Distinti',
                'tipo': 'fisico',
                'posizione': 'Bordo campo - Distinti',
                'dimensioni': '48m x 1m',
                'prezzo_listino': 55000,
                'prezzo_minimo': 42000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'led,distinti',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 3000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'led',
                'codice': 'LED-MXZ-001',
                'nome': 'LED Maxischermo Nord',
                'descrizione': 'Maxischermo LED in Curva Nord per replay e contenuti sponsor.',
                'descrizione_breve': 'Maxischermo Curva Nord',
                'tipo': 'fisico',
                'posizione': 'Curva Nord - Alto',
                'dimensioni': '15m x 8m',
                'prezzo_listino': 25000,
                'prezzo_minimo': 20000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'led,maxischermo,replay',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'partita', 'prezzo': 1500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 25000, 'durata_tipo': 'stagione'}
                ]
            },

            # === JERSEY & KIT ===
            {
                'category': 'jersey',
                'codice': 'JRS-FRONT-001',
                'nome': 'Main Shirt Sponsor - Fronte Maglia',
                'descrizione': 'Posizione principale sulla parte frontale della maglia da gioco. Massima visibilità garantita in ogni inquadratura.',
                'descrizione_breve': 'Sponsor principale fronte maglia',
                'tipo': 'fisico',
                'posizione': 'Fronte maglia - Centro petto',
                'dimensioni': '20cm x 8cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Stampa termosaldata',
                    'colori': 'Pantone illimitati',
                    'include': 'Home, Away, Third, Training Kit'
                }),
                'prezzo_listino': 350000,
                'prezzo_minimo': 280000,
                'quantita_totale': 1,
                'disponibile': False,  # Occupato
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'maglia,premium,main sponsor,esclusivo',
                'note_interne': 'Venduto a TechCorp per stagione 2024/25',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 350000, 'durata_tipo': 'stagione'},
                    {'nome': 'Biennale', 'codice': 'biennale', 'prezzo': 630000, 'durata_tipo': 'anno', 'durata_valore': 2}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-BACK-001',
                'nome': 'Back Shirt Sponsor - Retro Maglia',
                'descrizione': 'Posizione sulla parte posteriore della maglia, sotto il numero.',
                'descrizione_breve': 'Sponsor retro maglia sotto numero',
                'tipo': 'fisico',
                'posizione': 'Retro maglia - Sotto numero',
                'dimensioni': '18cm x 6cm',
                'prezzo_listino': 120000,
                'prezzo_minimo': 95000,
                'quantita_totale': 1,
                'disponibile': False,  # Occupato
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'maglia,retro,premium',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 120000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SLV-DX',
                'nome': 'Sleeve Sponsor - Manica Destra',
                'descrizione': 'Logo sponsor sulla manica destra della maglia.',
                'descrizione_breve': 'Sponsor manica destra',
                'tipo': 'fisico',
                'posizione': 'Manica destra',
                'dimensioni': '10cm x 8cm',
                'prezzo_listino': 75000,
                'prezzo_minimo': 60000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'maglia,manica',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 75000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SLV-SX',
                'nome': 'Sleeve Sponsor - Manica Sinistra',
                'descrizione': 'Logo sponsor sulla manica sinistra della maglia.',
                'descrizione_breve': 'Sponsor manica sinistra',
                'tipo': 'fisico',
                'posizione': 'Manica sinistra',
                'dimensioni': '10cm x 8cm',
                'prezzo_listino': 75000,
                'prezzo_minimo': 60000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'maglia,manica',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 75000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SHORT',
                'nome': 'Shorts Sponsor',
                'descrizione': 'Logo sponsor sui pantaloncini da gioco.',
                'descrizione_breve': 'Sponsor pantaloncini',
                'tipo': 'fisico',
                'posizione': 'Pantaloncini - Lato destro',
                'dimensioni': '8cm x 6cm',
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'pantaloncini',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-TRN',
                'nome': 'Training Kit Sponsor',
                'descrizione': 'Logo su tutto il kit da allenamento.',
                'descrizione_breve': 'Sponsor kit allenamento',
                'tipo': 'fisico',
                'posizione': 'Kit allenamento completo',
                'dimensioni': 'Varie posizioni',
                'prezzo_listino': 55000,
                'prezzo_minimo': 40000,
                'quantita_totale': 1,
                'disponibile': False,  # Occupato
                'visibile_marketplace': True,
                'tags': 'allenamento,training',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            },

            # === DIGITAL ===
            {
                'category': 'digital',
                'codice': 'DIG-WEB-HP',
                'nome': 'Banner Homepage Sito Ufficiale',
                'descrizione': 'Banner prominente nella homepage del sito ufficiale.',
                'descrizione_breve': 'Banner premium homepage',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'formato': '970x250px / 728x90px',
                    'peso_max': '150KB',
                    'impressions': '500.000/mese'
                }),
                'prezzo_listino': 3500,
                'prezzo_minimo': 2500,
                'quantita_totale': 3,
                'quantita_disponibile': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'digital,web,banner',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 3500, 'durata_tipo': 'mese'},
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 30000, 'durata_tipo': 'anno'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-SOCIAL',
                'nome': 'Pacchetto Social Media',
                'descrizione': '4 post dedicati al mese sui canali social ufficiali.',
                'descrizione_breve': '4 post social dedicati/mese',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'canali': 'Instagram, Facebook, X, TikTok',
                    'frequenza': '4 post/mese',
                    'reach': '200.000+ per post'
                }),
                'prezzo_listino': 8000,
                'prezzo_minimo': 6000,
                'quantita_totale': 5,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'digital,social,instagram',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 8000, 'durata_tipo': 'mese'},
                    {'nome': 'Semestrale', 'codice': 'semestrale', 'prezzo': 42000, 'durata_tipo': 'mese', 'durata_valore': 6}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-NEWS',
                'nome': 'Newsletter Sponsorizzata',
                'descrizione': 'Inserimento nella newsletter settimanale del club.',
                'descrizione_breve': 'Sponsorizzazione newsletter',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'subscribers': '85.000',
                    'open_rate': '32%',
                    'click_rate': '4.5%'
                }),
                'prezzo_listino': 2500,
                'prezzo_minimo': 1800,
                'quantita_totale': 4,
                'quantita_disponibile': 3,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'digital,newsletter,email',
                'pricing_tiers': [
                    {'nome': 'Singola', 'codice': 'singola', 'prezzo': 2500, 'durata_tipo': 'partita'},
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 8000, 'durata_tipo': 'mese'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-APP',
                'nome': 'In-App Advertising',
                'descrizione': 'Spazi pubblicitari nell\'app ufficiale del club.',
                'descrizione_breve': 'Pubblicità in-app',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'downloads': '120.000+',
                    'MAU': '45.000',
                    'formati': 'Banner, Interstitial, Native'
                }),
                'prezzo_listino': 4500,
                'prezzo_minimo': 3500,
                'quantita_totale': 3,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'digital,app,mobile',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 4500, 'durata_tipo': 'mese'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-YT',
                'nome': 'YouTube Channel Sponsor',
                'descrizione': 'Sponsorizzazione canale YouTube ufficiale con intro/outro branded.',
                'descrizione_breve': 'Sponsor canale YouTube',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'subscribers': '250.000+',
                    'views_mese': '1.5M',
                    'include': 'Intro 5s, Outro 10s, Menzione'
                }),
                'prezzo_listino': 12000,
                'prezzo_minimo': 9000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'digital,youtube,video',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 12000, 'durata_tipo': 'mese'},
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 120000, 'durata_tipo': 'anno'}
                ]
            },

            # === HOSPITALITY ===
            {
                'category': 'hospitality',
                'codice': 'HSP-SKY-PREM',
                'nome': 'Skybox Premium - 12 posti',
                'descrizione': 'Skybox esclusivo con 12 posti, vista panoramica. Include catering gourmet e open bar.',
                'descrizione_breve': 'Skybox 12 posti premium',
                'tipo': 'esperienza',
                'posizione': 'Tribuna Centrale - Livello 3',
                'specifiche_tecniche': json.dumps({
                    'capacita': '12 persone',
                    'servizi': 'Catering Gourmet, Open Bar, Hostess, Parcheggio VIP',
                    'TV': '2x 65" 4K'
                }),
                'prezzo_listino': 8500,
                'prezzo_minimo': 7000,
                'quantita_totale': 6,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'hospitality,vip,skybox,premium',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 8500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 15000, 'durata_tipo': 'partita'},
                    {'nome': 'Champions League', 'codice': 'champions', 'prezzo': 22000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 140000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-SKY-BUS',
                'nome': 'Skybox Business - 8 posti',
                'descrizione': 'Skybox business con 8 posti.',
                'descrizione_breve': 'Skybox 8 posti business',
                'tipo': 'esperienza',
                'posizione': 'Tribuna Centrale - Livello 2',
                'prezzo_listino': 5500,
                'prezzo_minimo': 4500,
                'quantita_totale': 8,
                'quantita_disponibile': 4,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'hospitality,skybox',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'standard', 'prezzo': 5500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 9500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 90000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-LOUNGE',
                'nome': 'Tavolo Lounge VIP - 4 posti',
                'descrizione': 'Tavolo nella lounge VIP con vista campo.',
                'descrizione_breve': 'Tavolo 4 posti lounge VIP',
                'tipo': 'esperienza',
                'posizione': 'Lounge VIP - Piano Terra',
                'prezzo_listino': 1800,
                'prezzo_minimo': 1400,
                'quantita_totale': 20,
                'quantita_disponibile': 8,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'hospitality,lounge',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'standard', 'prezzo': 1800, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 3200, 'durata_tipo': 'partita'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-ESCORT',
                'nome': 'Player Escort Experience',
                'descrizione': 'Bambino accompagnatore giocatori.',
                'descrizione_breve': 'Bambino accompagnatore',
                'tipo': 'esperienza',
                'prezzo_listino': 1500,
                'prezzo_minimo': 1200,
                'quantita_totale': 11,
                'quantita_disponibile': 6,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'esperienza,bambini',
                'pricing_tiers': [
                    {'nome': 'Singola', 'codice': 'singola', 'prezzo': 1500, 'durata_tipo': 'partita'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-TOUR',
                'nome': 'Stadium Tour Privato',
                'descrizione': 'Tour esclusivo dello stadio per gruppi fino a 20 persone.',
                'descrizione_breve': 'Tour privato stadio',
                'tipo': 'esperienza',
                'prezzo_listino': 800,
                'prezzo_minimo': 600,
                'quantita_totale': 10,
                'quantita_disponibile': 10,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'esperienza,tour',
                'pricing_tiers': [
                    {'nome': 'Tour', 'codice': 'singolo', 'prezzo': 800, 'durata_tipo': 'partita'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-MEET',
                'nome': 'Meet & Greet Giocatori',
                'descrizione': 'Incontro esclusivo con 3 giocatori della prima squadra. Foto e autografi.',
                'descrizione_breve': 'Incontro con giocatori',
                'tipo': 'esperienza',
                'prezzo_listino': 5000,
                'prezzo_minimo': 4000,
                'quantita_totale': 4,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'esperienza,vip,giocatori',
                'pricing_tiers': [
                    {'nome': 'Sessione', 'codice': 'singola', 'prezzo': 5000, 'durata_tipo': 'partita'}
                ]
            },

            # === BROADCAST ===
            {
                'category': 'broadcast',
                'codice': 'BRC-INT-001',
                'nome': 'Backdrop Interviste Post-Partita',
                'descrizione': 'Logo sponsor sul backdrop delle interviste.',
                'descrizione_breve': 'Logo backdrop interviste',
                'tipo': 'misto',
                'posizione': 'Mixed Zone',
                'dimensioni': '80cm x 60cm',
                'prezzo_listino': 35000,
                'prezzo_minimo': 28000,
                'quantita_totale': 4,
                'quantita_disponibile': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'tv,interviste,broadcast',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 35000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'broadcast',
                'codice': 'BRC-CONF',
                'nome': 'Backdrop Sala Stampa',
                'descrizione': 'Logo sul backdrop della sala stampa.',
                'descrizione_breve': 'Logo sala stampa',
                'tipo': 'misto',
                'posizione': 'Sala Stampa',
                'dimensioni': '60cm x 45cm',
                'prezzo_listino': 25000,
                'prezzo_minimo': 20000,
                'quantita_totale': 6,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'tv,conferenza',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 25000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'broadcast',
                'codice': 'BRC-VTR',
                'nome': 'Virtual Advertising',
                'descrizione': 'Pubblicità virtuale per trasmissioni internazionali.',
                'descrizione_breve': 'Adv virtuale bordo campo',
                'tipo': 'digitale',
                'prezzo_listino': 15000,
                'prezzo_minimo': 12000,
                'quantita_totale': 4,
                'quantita_disponibile': 4,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'virtual,broadcast',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'partita', 'prezzo': 15000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 250000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'broadcast',
                'codice': 'BRC-RADIO',
                'nome': 'Radio Match Sponsor',
                'descrizione': 'Sponsorizzazione radiocronaca ufficiale.',
                'descrizione_breve': 'Sponsor radiocronaca',
                'tipo': 'digitale',
                'prezzo_listino': 8000,
                'prezzo_minimo': 6000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'radio,broadcast',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'partita', 'prezzo': 500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 8000, 'durata_tipo': 'stagione'}
                ]
            },

            # === STADIUM ===
            {
                'category': 'stadium',
                'codice': 'STD-NAMING',
                'nome': 'Stadium Naming Rights',
                'descrizione': 'Naming rights completi dello stadio.',
                'descrizione_breve': 'Naming rights stadio',
                'tipo': 'fisico',
                'posizione': 'Intero stadio',
                'prezzo_listino': 5000000,
                'prezzo_minimo': 4000000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'naming,premium,stadio',
                'pricing_tiers': [
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 5000000, 'durata_tipo': 'anno'},
                    {'nome': 'Decennale', 'codice': 'decennale', 'prezzo': 40000000, 'durata_tipo': 'anno', 'durata_valore': 10}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-GATE-VIP',
                'nome': 'Naming Ingresso VIP',
                'descrizione': 'Naming rights ingresso Tribuna VIP.',
                'descrizione_breve': 'Naming ingresso VIP',
                'tipo': 'fisico',
                'posizione': 'Ingresso Tribuna VIP',
                'dimensioni': 'Insegna 3m x 0.8m',
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'naming,vip',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-PANEL',
                'nome': 'Pannello Fisso Esterno',
                'descrizione': 'Pannello pubblicitario sulla facciata esterna.',
                'descrizione_breve': 'Cartellone esterno',
                'tipo': 'fisico',
                'posizione': 'Facciata esterna',
                'dimensioni': '6m x 3m',
                'prezzo_listino': 28000,
                'prezzo_minimo': 22000,
                'quantita_totale': 4,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'pannello,esterno',
                'pricing_tiers': [
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 28000, 'durata_tipo': 'anno'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-SEAT',
                'nome': 'Brandizzazione Seggiolini',
                'descrizione': 'Brandizzazione completa seggiolini di un settore.',
                'descrizione_breve': 'Brand seggiolini settore',
                'tipo': 'fisico',
                'posizione': 'Settore a scelta',
                'prezzo_listino': 18000,
                'prezzo_minimo': 14000,
                'quantita_totale': 8,
                'quantita_disponibile': 5,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'seggiolini,stadio',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 18000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-TUNNEL',
                'nome': 'Tunnel Sponsor',
                'descrizione': 'Brandizzazione tunnel ingresso giocatori.',
                'descrizione_breve': 'Branding tunnel giocatori',
                'tipo': 'fisico',
                'posizione': 'Tunnel ingresso campo',
                'prezzo_listino': 55000,
                'prezzo_minimo': 45000,
                'quantita_totale': 1,
                'disponibile': False,  # Occupato
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'tunnel,premium,tv',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-BENCH',
                'nome': 'Panchine Sponsor',
                'descrizione': 'Brandizzazione panchine riserve e staff.',
                'descrizione_breve': 'Branding panchine',
                'tipo': 'fisico',
                'posizione': 'Bordo campo',
                'prezzo_listino': 35000,
                'prezzo_minimo': 28000,
                'quantita_totale': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'tags': 'panchine,tv',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 35000, 'durata_tipo': 'stagione'}
                ]
            }
        ]

        # Crea assets
        assets = {}
        for asset_data in assets_data:
            cat_code = asset_data.pop('category')
            pricing_tiers_data = asset_data.pop('pricing_tiers', [])

            if 'categorie_escluse' not in asset_data:
                asset_data['categorie_escluse'] = None
            if 'specifiche_tecniche' not in asset_data:
                asset_data['specifiche_tecniche'] = None
            if 'quantita_disponibile' not in asset_data:
                asset_data['quantita_disponibile'] = asset_data.get('quantita_totale', 1)

            asset = InventoryAsset(
                club_id=club_id,
                category_id=categories[cat_code].id,
                **asset_data
            )
            db.session.add(asset)
            db.session.flush()
            assets[asset_data['codice']] = asset

            # Add pricing tiers
            for i, tier_data in enumerate(pricing_tiers_data):
                tier = AssetPricingTier(
                    asset_id=asset.id,
                    ordine=i,
                    **tier_data
                )
                db.session.add(tier)

            print(f"  + {asset.codice}: {asset.nome}")

        db.session.commit()

        # ============================================
        # ALLOCAZIONI
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE ALLOCAZIONI")
        print("-"*50)

        current_year = datetime.now().year
        season_current = f"{current_year}-{current_year + 1}"
        season_prev = f"{current_year - 1}-{current_year}"

        # Mapping sponsor esistenti
        # ID 51: Banca Popolare del Territorio (Banking)
        # ID 52: AutoItalia Concessionaria (Automotive)
        # ID 53: Pizzeria Da Giovanni (Food)
        # ID 54: TechSolutions Italia (Tech)
        # ID 55: Assicurazioni Futuro (Insurance)
        # ID 56: SportWear Pro (Apparel)

        allocations_data = [
            # TechSolutions Italia - Main Sponsor
            {
                'asset_code': 'JRS-FRONT-001',
                'sponsor_name': 'TechSolutions Italia',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 350000,
                'status': 'attiva',
                'note': 'Contratto Main Sponsor - Rinnovo automatico con aumento 5%'
            },
            {
                'asset_code': 'JRS-TRN',
                'sponsor_name': 'TechSolutions Italia',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 55000,
                'status': 'attiva',
                'note': 'Incluso nel pacchetto Main Sponsor'
            },
            {
                'asset_code': 'LED-TRB-001',
                'sponsor_name': 'TechSolutions Italia',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 85000,
                'status': 'attiva',
                'note': 'LED premium tribuna centrale'
            },
            # Banca Popolare del Territorio - Back Sponsor
            {
                'asset_code': 'JRS-BACK-001',
                'sponsor_name': 'Banca Popolare del Territorio',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 120000,
                'status': 'attiva',
                'esclusivita_categoria': True,
                'categoria_merceologica': 'banking',
                'note': 'Esclusività settore bancario'
            },
            {
                'asset_code': 'BRC-CONF',
                'sponsor_name': 'Banca Popolare del Territorio',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 25000,
                'status': 'attiva'
            },
            # SportWear Pro - Tunnel e Sleeve
            {
                'asset_code': 'STD-TUNNEL',
                'sponsor_name': 'SportWear Pro',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 55000,
                'status': 'attiva',
                'note': 'Tunnel ingresso giocatori'
            },
            {
                'asset_code': 'JRS-SLV-DX',
                'sponsor_name': 'SportWear Pro',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 75000,
                'status': 'attiva',
                'note': 'Manica destra'
            },
            # Pizzeria Da Giovanni - LED e Digital
            {
                'asset_code': 'LED-CRV-001',
                'sponsor_name': 'Pizzeria Da Giovanni',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 45000,
                'status': 'attiva',
                'esclusivita_categoria': True,
                'categoria_merceologica': 'food'
            },
            {
                'asset_code': 'DIG-SOCIAL',
                'sponsor_name': 'Pizzeria Da Giovanni',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'quantita': 2,
                'prezzo_concordato': 48000,
                'status': 'attiva',
                'note': '2 slot social media'
            },
            # Assicurazioni Futuro - Skybox e Hospitality
            {
                'asset_code': 'HSP-SKY-PREM',
                'sponsor_name': 'Assicurazioni Futuro',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'quantita': 2,
                'prezzo_concordato': 280000,
                'status': 'attiva',
                'note': '2 Skybox Premium per stagione'
            },
            {
                'asset_code': 'HSP-LOUNGE',
                'sponsor_name': 'Assicurazioni Futuro',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'quantita': 5,
                'prezzo_concordato': 32000,
                'status': 'attiva',
                'note': '5 tavoli lounge per stagione'
            },
            # AutoItalia - LED e Broadcast
            {
                'asset_code': 'BRC-INT-001',
                'sponsor_name': 'AutoItalia Concessionaria',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'quantita': 2,
                'prezzo_concordato': 70000,
                'status': 'attiva',
                'note': '2 posizioni backdrop interviste'
            },
            {
                'asset_code': 'LED-CRV-002',
                'sponsor_name': 'AutoItalia Concessionaria',
                'stagione': season_current,
                'data_inizio': date(current_year, 7, 1),
                'data_fine': date(current_year + 1, 6, 30),
                'prezzo_concordato': 45000,
                'status': 'attiva',
                'esclusivita_categoria': True,
                'categoria_merceologica': 'automotive'
            },
            # Historical allocations (previous season - concluded)
            {
                'asset_code': 'JRS-FRONT-001',
                'sponsor_name': 'TechSolutions Italia',
                'stagione': season_prev,
                'data_inizio': date(current_year - 1, 7, 1),
                'data_fine': date(current_year, 6, 30),
                'prezzo_concordato': 320000,
                'status': 'conclusa',
                'note': 'Stagione precedente completata'
            },
            {
                'asset_code': 'JRS-BACK-001',
                'sponsor_name': 'Banca Popolare del Territorio',
                'stagione': season_prev,
                'data_inizio': date(current_year - 1, 7, 1),
                'data_fine': date(current_year, 6, 30),
                'prezzo_concordato': 110000,
                'status': 'conclusa'
            },
            {
                'asset_code': 'LED-TRB-001',
                'sponsor_name': 'Pizzeria Da Giovanni',
                'stagione': season_prev,
                'data_inizio': date(current_year - 1, 7, 1),
                'data_fine': date(current_year, 6, 30),
                'prezzo_concordato': 75000,
                'status': 'conclusa',
                'note': 'Non rinnovato - passato a TechSolutions'
            },
            {
                'asset_code': 'STD-TUNNEL',
                'sponsor_name': 'AutoItalia Concessionaria',
                'stagione': season_prev,
                'data_inizio': date(current_year - 1, 7, 1),
                'data_fine': date(current_year, 6, 30),
                'prezzo_concordato': 50000,
                'status': 'conclusa',
                'note': 'Non rinnovato - passato a SportWear Pro'
            }
        ]

        for alloc_data in allocations_data:
            asset_code = alloc_data.pop('asset_code')
            sponsor_name = alloc_data.pop('sponsor_name')

            asset = assets.get(asset_code)
            sponsor = sponsor_map.get(sponsor_name)

            if asset and sponsor:
                alloc = AssetAllocation(
                    asset_id=asset.id,
                    club_id=club_id,
                    sponsor_id=sponsor.id,
                    quantita=alloc_data.pop('quantita', 1),
                    **alloc_data
                )
                db.session.add(alloc)
                print(f"  + {asset_code} -> {sponsor_name} ({alloc_data.get('stagione')})")
            else:
                print(f"  ! Skipped: {asset_code} / {sponsor_name}")

        db.session.commit()

        # ============================================
        # DISPONIBILITÀ STAGIONALE
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE DISPONIBILITÀ STAGIONALE")
        print("-"*50)

        for code, asset in assets.items():
            avail = AssetAvailability(
                asset_id=asset.id,
                club_id=club_id,
                stagione=season_current,
                data_inizio=date(current_year, 7, 1),
                data_fine=date(current_year + 1, 6, 30),
                disponibile=asset.disponibile,
                quantita_disponibile=asset.quantita_disponibile or asset.quantita_totale,
                quantita_allocata=asset.quantita_totale - (asset.quantita_disponibile or asset.quantita_totale),
                prezzo_stagionale=asset.prezzo_listino
            )
            db.session.add(avail)

        print(f"  + Disponibilità creata per {len(assets)} assets")
        db.session.commit()

        # ============================================
        # PACCHETTI
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE PACCHETTI")
        print("-"*50)

        packages_data = [
            {
                'nome': 'Gold Partner Package',
                'codice': 'gold',
                'descrizione': 'Pacchetto premium per Main Sponsor con massima visibilità su tutti i canali.',
                'descrizione_breve': 'Pacchetto Main Sponsor premium',
                'livello': 'main',
                'prezzo_listino': 550000,
                'prezzo_scontato': 480000,
                'sconto_percentuale': 12.7,
                'colore': '#F59E0B',
                'visibile_marketplace': True,
                'in_evidenza': True,
                'items': [
                    {'code': 'JRS-FRONT-001', 'quantita': 1},
                    {'code': 'LED-TRB-001', 'quantita': 1},
                    {'code': 'BRC-INT-001', 'quantita': 1},
                    {'code': 'DIG-SOCIAL', 'quantita': 1},
                    {'code': 'HSP-SKY-PREM', 'quantita': 1}
                ]
            },
            {
                'nome': 'Silver Partner Package',
                'codice': 'silver',
                'descrizione': 'Pacchetto Official Partner con ottima visibilità e hospitality.',
                'descrizione_breve': 'Pacchetto Official Partner',
                'livello': 'official',
                'prezzo_listino': 280000,
                'prezzo_scontato': 250000,
                'sconto_percentuale': 10.7,
                'colore': '#9CA3AF',
                'visibile_marketplace': True,
                'in_evidenza': True,
                'items': [
                    {'code': 'JRS-BACK-001', 'quantita': 1},
                    {'code': 'LED-CRV-001', 'quantita': 1},
                    {'code': 'BRC-CONF', 'quantita': 1},
                    {'code': 'HSP-SKY-BUS', 'quantita': 1}
                ]
            },
            {
                'nome': 'Bronze Partner Package',
                'codice': 'bronze',
                'descrizione': 'Pacchetto entry-level per partner con budget contenuto.',
                'descrizione_breve': 'Pacchetto entry-level',
                'livello': 'standard',
                'prezzo_listino': 120000,
                'prezzo_scontato': 100000,
                'sconto_percentuale': 16.7,
                'colore': '#92400E',
                'visibile_marketplace': True,
                'items': [
                    {'code': 'JRS-SLV-DX', 'quantita': 1},
                    {'code': 'LED-DST-001', 'quantita': 1},
                    {'code': 'DIG-WEB-HP', 'quantita': 1}
                ]
            },
            {
                'nome': 'Digital Only Package',
                'codice': 'digital',
                'descrizione': 'Pacchetto focalizzato sulla presenza digitale.',
                'descrizione_breve': 'Presenza digital completa',
                'livello': 'standard',
                'prezzo_listino': 35000,
                'prezzo_scontato': 28000,
                'sconto_percentuale': 20,
                'colore': '#8B5CF6',
                'visibile_marketplace': True,
                'items': [
                    {'code': 'DIG-WEB-HP', 'quantita': 1},
                    {'code': 'DIG-SOCIAL', 'quantita': 1},
                    {'code': 'DIG-NEWS', 'quantita': 1},
                    {'code': 'DIG-APP', 'quantita': 1}
                ]
            },
            {
                'nome': 'Hospitality Experience',
                'codice': 'hospitality',
                'descrizione': 'Pacchetto esperienze VIP per tutta la stagione.',
                'descrizione_breve': 'Esperienze VIP stagionali',
                'livello': 'premium',
                'prezzo_listino': 200000,
                'prezzo_scontato': 175000,
                'sconto_percentuale': 12.5,
                'colore': '#F59E0B',
                'visibile_marketplace': True,
                'items': [
                    {'code': 'HSP-SKY-PREM', 'quantita': 1},
                    {'code': 'HSP-LOUNGE', 'quantita': 2},
                    {'code': 'HSP-ESCORT', 'quantita': 2},
                    {'code': 'HSP-MEET', 'quantita': 1}
                ]
            }
        ]

        for pkg_data in packages_data:
            items_data = pkg_data.pop('items')

            pkg = AssetPackage(
                club_id=club_id,
                attivo=True,
                **pkg_data
            )
            db.session.add(pkg)
            db.session.flush()

            for i, item_data in enumerate(items_data):
                asset = assets.get(item_data['code'])
                if asset:
                    pkg_item = AssetPackageItem(
                        package_id=pkg.id,
                        asset_id=asset.id,
                        quantita=item_data['quantita'],
                        ordine=i
                    )
                    db.session.add(pkg_item)

            print(f"  + {pkg.nome} ({len(items_data)} items)")

        db.session.commit()

        # ============================================
        # ESCLUSIVITÀ CATEGORIA
        # ============================================
        print("\n" + "-"*50)
        print("CREAZIONE ESCLUSIVITÀ")
        print("-"*50)

        exclusivities_data = [
            {
                'categoria_merceologica': 'banking',
                'nome_display': 'Settore Bancario e Finanziario',
                'descrizione': 'Esclusività per banche, assicurazioni e servizi finanziari',
                'sponsor_name': 'Banca Popolare del Territorio',
                'valore': 200000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'food',
                'nome_display': 'Food & Ristorazione',
                'descrizione': 'Esclusività per ristoranti, pizzerie e food delivery',
                'sponsor_name': 'Pizzeria Da Giovanni',
                'valore': 100000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'automotive',
                'nome_display': 'Automotive',
                'descrizione': 'Esclusività per case automobilistiche e concessionarie',
                'sponsor_name': 'AutoItalia Concessionaria',
                'valore': 180000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'technology',
                'nome_display': 'Tecnologia e IT',
                'descrizione': 'Esclusività per aziende tech, software, hardware',
                'sponsor_name': 'TechSolutions Italia',
                'valore': 250000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'insurance',
                'nome_display': 'Assicurazioni',
                'descrizione': 'Esclusività per compagnie assicurative',
                'sponsor_name': 'Assicurazioni Futuro',
                'valore': 150000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'apparel',
                'nome_display': 'Abbigliamento Sportivo',
                'descrizione': 'Esclusività per brand di abbigliamento sportivo',
                'sponsor_name': 'SportWear Pro',
                'valore': 180000,
                'attiva': True
            },
            {
                'categoria_merceologica': 'beverage',
                'nome_display': 'Bevande e Soft Drinks',
                'descrizione': 'Esclusività per bevande analcoliche, energy drink, acqua minerale',
                'sponsor_name': None,
                'valore': 150000,
                'attiva': False
            },
            {
                'categoria_merceologica': 'energy',
                'nome_display': 'Energia',
                'descrizione': 'Esclusività per fornitori energia e utilities',
                'sponsor_name': None,
                'valore': 120000,
                'attiva': False
            },
            {
                'categoria_merceologica': 'telecom',
                'nome_display': 'Telecomunicazioni',
                'descrizione': 'Esclusività per operatori telefonici e internet',
                'sponsor_name': None,
                'valore': 180000,
                'attiva': False
            }
        ]

        for excl_data in exclusivities_data:
            sponsor_name = excl_data.pop('sponsor_name')
            sponsor = sponsor_map.get(sponsor_name) if sponsor_name else None

            excl = CategoryExclusivity(
                club_id=club_id,
                sponsor_id=sponsor.id if sponsor else None,
                stagione=season_current if sponsor else None,
                data_inizio=date(current_year, 7, 1) if sponsor else None,
                data_fine=date(current_year + 1, 6, 30) if sponsor else None,
                **excl_data
            )
            db.session.add(excl)
            status = f"-> {sponsor_name}" if sponsor else "(disponibile)"
            print(f"  + {excl_data['categoria_merceologica']}: {excl_data['nome_display']} {status}")

        db.session.commit()

        # ============================================
        # RIEPILOGO FINALE
        # ============================================
        print("\n" + "="*70)
        print("RIEPILOGO SEED COMPLETATO")
        print("="*70)

        cat_count = InventoryCategory.query.filter_by(club_id=club_id).count()
        asset_count = InventoryAsset.query.filter_by(club_id=club_id).count()
        tier_count = AssetPricingTier.query.filter(
            AssetPricingTier.asset_id.in_(
                db.session.query(InventoryAsset.id).filter_by(club_id=club_id)
            )
        ).count()
        alloc_count = AssetAllocation.query.filter_by(club_id=club_id).count()
        alloc_active = AssetAllocation.query.filter_by(club_id=club_id, status='attiva').count()
        pkg_count = AssetPackage.query.filter_by(club_id=club_id).count()
        excl_count = CategoryExclusivity.query.filter_by(club_id=club_id).count()
        excl_active = CategoryExclusivity.query.filter_by(club_id=club_id, attiva=True).count()

        total_value = db.session.query(db.func.sum(InventoryAsset.prezzo_listino)).filter_by(club_id=club_id).scalar() or 0
        available_count = InventoryAsset.query.filter_by(club_id=club_id, disponibile=True).count()
        allocated_value = db.session.query(db.func.sum(AssetAllocation.prezzo_concordato)).filter_by(club_id=club_id, status='attiva').scalar() or 0

        print(f"""
  CATEGORIE:      {cat_count}
  ASSETS:         {asset_count} ({available_count} disponibili)
  PRICING TIERS:  {tier_count}
  ALLOCAZIONI:    {alloc_count} ({alloc_active} attive)
  PACCHETTI:      {pkg_count}
  ESCLUSIVITÀ:    {excl_count} ({excl_active} assegnate)

  VALORI:
  - Valore catalogo:  €{total_value:,.0f}
  - Valore allocato:  €{allocated_value:,.0f}
  - Revenue rate:     {(allocated_value/total_value*100) if total_value else 0:.1f}%
""")
        print("="*70)
        print(" SEED COMPLETATO CON SUCCESSO!")
        print("="*70 + "\n")


if __name__ == '__main__':
    main()
