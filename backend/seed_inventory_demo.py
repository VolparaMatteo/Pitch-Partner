#!/usr/bin/env python3
"""
PITCH PARTNER - Inventory Demo Data Seed Script
================================================
Crea asset inventario REALISTICI per Club Demo.
Eseguire con: python seed_inventory_demo.py
"""

from app import create_app, db
from app.models import Club, InventoryCategory, InventoryAsset, AssetPricingTier
from datetime import datetime
import json

def main():
    app = create_app()

    with app.app_context():
        print("\n" + "="*60)
        print("PITCH PARTNER - SEED INVENTARIO DEMO")
        print("="*60)

        # Trova Club Demo
        club = Club.query.filter_by(nome='Club Demo').first()
        if not club:
            print("ERRORE: Club Demo non trovato!")
            return

        club_id = club.id
        print(f"\nClub trovato: {club.nome} (ID: {club_id})")

        # Pulizia dati esistenti
        print("\nPulizia dati inventario esistenti...")
        AssetPricingTier.query.filter(
            AssetPricingTier.asset_id.in_(
                db.session.query(InventoryAsset.id).filter_by(club_id=club_id)
            )
        ).delete(synchronize_session=False)
        InventoryAsset.query.filter_by(club_id=club_id).delete()
        InventoryCategory.query.filter_by(club_id=club_id).delete()
        db.session.commit()
        print("Pulizia completata!")

        # ============================================
        # CATEGORIE INVENTARIO
        # ============================================
        print("\nCreazione categorie...")

        categories_data = [
            {
                'nome': 'LED Boards',
                'codice': 'led',
                'descrizione': 'Pannelli LED perimetrali e display digitali',
                'icona': 'tv',
                'colore': '#3B82F6',
                'ordine': 1
            },
            {
                'nome': 'Jersey & Kit',
                'codice': 'jersey',
                'descrizione': 'Spazi sulla divisa ufficiale e kit da gioco',
                'icona': 'shirt',
                'colore': '#10B981',
                'ordine': 2
            },
            {
                'nome': 'Digital',
                'codice': 'digital',
                'descrizione': 'Spazi digitali, social media e contenuti online',
                'icona': 'globe',
                'colore': '#8B5CF6',
                'ordine': 3
            },
            {
                'nome': 'Hospitality',
                'codice': 'hospitality',
                'descrizione': 'Esperienze VIP, skybox e biglietti premium',
                'icona': 'users',
                'colore': '#F59E0B',
                'ordine': 4
            },
            {
                'nome': 'Broadcast',
                'codice': 'broadcast',
                'descrizione': 'Visibilità TV, interviste e contenuti broadcast',
                'icona': 'video',
                'colore': '#EF4444',
                'ordine': 5
            },
            {
                'nome': 'Stadium',
                'codice': 'stadium',
                'descrizione': 'Naming rights, cartellonistica fissa e branding strutturale',
                'icona': 'cube',
                'colore': '#6366F1',
                'ordine': 6
            }
        ]

        categories = {}
        for cat_data in categories_data:
            cat = InventoryCategory(
                club_id=club_id,
                **cat_data
            )
            db.session.add(cat)
            db.session.flush()
            categories[cat_data['codice']] = cat
            print(f"  - Categoria: {cat.nome}")

        db.session.commit()

        # ============================================
        # ASSETS INVENTARIO
        # ============================================
        print("\nCreazione assets...")

        assets_data = [
            # LED BOARDS
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
                    {'nome': 'Coppa Italia', 'codice': 'coppa', 'prezzo': 6500, 'durata_tipo': 'partita'},
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
                'in_evidenza': False,
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
                'descrizione': 'Pannello LED posizionato dietro la porta lato Curva Sud. Visibilità complementare al LED Curva Nord.',
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
                'in_evidenza': False,
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
                'descrizione': 'Pannello LED lungo il settore Distinti. Visibilità durante le riprese laterali e nei replay.',
                'descrizione_breve': 'LED perimetrale settore Distinti',
                'tipo': 'fisico',
                'posizione': 'Bordo campo - Distinti',
                'dimensioni': '48m x 1m',
                'specifiche_tecniche': json.dumps({
                    'risoluzione': 'Full HD',
                    'pixel_pitch': '12mm',
                    'luminosita': '5000 nits'
                }),
                'prezzo_listino': 55000,
                'prezzo_minimo': 42000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'led,distinti',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 3000, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 5500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            },

            # JERSEY & KIT
            {
                'category': 'jersey',
                'codice': 'JRS-FRONT-001',
                'nome': 'Main Shirt Sponsor - Fronte Maglia',
                'descrizione': 'Posizione principale sulla parte frontale della maglia da gioco. Massima visibilità garantita in ogni inquadratura. Include tutte le maglie (home, away, third) e divise allenamento.',
                'descrizione_breve': 'Sponsor principale fronte maglia',
                'tipo': 'fisico',
                'posizione': 'Fronte maglia - Centro petto',
                'dimensioni': '20cm x 8cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Stampa termosaldata',
                    'colori_disponibili': 'Pantone illimitati',
                    'include': 'Home, Away, Third, Training Kit'
                }),
                'prezzo_listino': 350000,
                'prezzo_minimo': 280000,
                'quantita_totale': 1,
                'disponibile': False,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'maglia,premium,main sponsor,esclusivo',
                'note_interne': 'Venduto a TechCorp per stagione 2024/25',
                'categorie_escluse': json.dumps(['bevande', 'automotive']),
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 350000, 'durata_tipo': 'stagione'},
                    {'nome': 'Biennale', 'codice': 'biennale', 'prezzo': 630000, 'durata_tipo': 'anno'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-BACK-001',
                'nome': 'Back Shirt Sponsor - Retro Maglia',
                'descrizione': 'Posizione sulla parte posteriore della maglia, sotto il numero. Visibilità eccellente durante le esultanze e le riprese da dietro.',
                'descrizione_breve': 'Sponsor retro maglia sotto numero',
                'tipo': 'fisico',
                'posizione': 'Retro maglia - Sotto numero',
                'dimensioni': '18cm x 6cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Stampa termosaldata',
                    'colori_disponibili': 'Pantone illimitati',
                    'include': 'Home, Away, Third'
                }),
                'prezzo_listino': 120000,
                'prezzo_minimo': 95000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'maglia,retro,premium',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 120000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SLV-001',
                'nome': 'Sleeve Sponsor - Manica Destra',
                'descrizione': 'Logo sponsor sulla manica destra della maglia. Ottima visibilità nelle riprese laterali e nelle foto ufficiali.',
                'descrizione_breve': 'Sponsor manica destra',
                'tipo': 'fisico',
                'posizione': 'Manica destra',
                'dimensioni': '10cm x 8cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Patch ricamata',
                    'colori_disponibili': 'Max 4 colori'
                }),
                'prezzo_listino': 75000,
                'prezzo_minimo': 60000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'maglia,manica',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 75000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SLV-002',
                'nome': 'Sleeve Sponsor - Manica Sinistra',
                'descrizione': 'Logo sponsor sulla manica sinistra della maglia.',
                'descrizione_breve': 'Sponsor manica sinistra',
                'tipo': 'fisico',
                'posizione': 'Manica sinistra',
                'dimensioni': '10cm x 8cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Patch ricamata',
                    'colori_disponibili': 'Max 4 colori'
                }),
                'prezzo_listino': 75000,
                'prezzo_minimo': 60000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'maglia,manica',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 75000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-SHORT-001',
                'nome': 'Shorts Sponsor',
                'descrizione': 'Logo sponsor sui pantaloncini da gioco, lato destro.',
                'descrizione_breve': 'Sponsor pantaloncini',
                'tipo': 'fisico',
                'posizione': 'Pantaloncini - Lato destro',
                'dimensioni': '8cm x 6cm',
                'specifiche_tecniche': json.dumps({
                    'materiale': 'Stampa termosaldata'
                }),
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'pantaloncini',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'jersey',
                'codice': 'JRS-TRN-001',
                'nome': 'Training Kit Sponsor',
                'descrizione': 'Logo sponsor su tutto il kit da allenamento: maglie, felpe, giacche. Visibilità durante allenamenti aperti e conferenze stampa.',
                'descrizione_breve': 'Sponsor kit allenamento completo',
                'tipo': 'fisico',
                'posizione': 'Kit allenamento completo',
                'dimensioni': 'Varie posizioni',
                'prezzo_listino': 55000,
                'prezzo_minimo': 40000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'allenamento,training',
                'pricing_tiers': [
                    {'nome': 'Stagione Completa', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            },

            # DIGITAL
            {
                'category': 'digital',
                'codice': 'DIG-WEB-001',
                'nome': 'Banner Homepage Sito Ufficiale',
                'descrizione': 'Banner prominente nella homepage del sito ufficiale del club. Posizione above the fold, visibile senza scroll. Include analytics mensili e A/B testing.',
                'descrizione_breve': 'Banner premium homepage sito club',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'formato': '970x250px / 728x90px responsive',
                    'peso_max': '150KB',
                    'formati': 'JPG, PNG, GIF, HTML5',
                    'impressions_stimate': '500.000/mese'
                }),
                'prezzo_listino': 3500,
                'prezzo_minimo': 2500,
                'quantita_totale': 3,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'digital,web,banner',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 3500, 'durata_tipo': 'mese'},
                    {'nome': 'Trimestrale', 'codice': 'trimestrale', 'prezzo': 9000, 'durata_tipo': 'mese'},
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 30000, 'durata_tipo': 'anno'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-SOCIAL-001',
                'nome': 'Pacchetto Social Media - Post Dedicati',
                'descrizione': 'Pacchetto di 4 post dedicati al mese sui canali social ufficiali (Instagram, Facebook, Twitter/X, TikTok). Include creazione contenuto, pubblicazione e report analytics.',
                'descrizione_breve': '4 post social dedicati/mese',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'canali': 'Instagram, Facebook, X, TikTok',
                    'frequenza': '4 post/mese',
                    'formati': 'Immagine, Video, Carosello, Story',
                    'reach_stimato': '200.000+ per post'
                }),
                'prezzo_listino': 8000,
                'prezzo_minimo': 6000,
                'quantita_totale': 5,
                'quantita_disponibile': 3,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'digital,social,instagram,facebook',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 8000, 'durata_tipo': 'mese'},
                    {'nome': 'Semestrale', 'codice': 'semestrale', 'prezzo': 42000, 'durata_tipo': 'mese'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-NEWS-001',
                'nome': 'Newsletter Sponsorizzata',
                'descrizione': 'Inserimento sponsor nella newsletter settimanale del club. Include banner + articolo dedicato. Database: 85.000 iscritti.',
                'descrizione_breve': 'Sponsorizzazione newsletter settimanale',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'subscribers': '85.000',
                    'open_rate': '32%',
                    'click_rate': '4.5%',
                    'frequenza': 'Settimanale'
                }),
                'prezzo_listino': 2500,
                'prezzo_minimo': 1800,
                'quantita_totale': 4,
                'quantita_disponibile': 4,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'digital,newsletter,email',
                'pricing_tiers': [
                    {'nome': 'Singola Uscita', 'codice': 'singola', 'prezzo': 2500, 'durata_tipo': 'partita'},
                    {'nome': 'Mensile (4 uscite)', 'codice': 'mensile', 'prezzo': 8000, 'durata_tipo': 'mese'}
                ]
            },
            {
                'category': 'digital',
                'codice': 'DIG-APP-001',
                'nome': 'In-App Advertising',
                'descrizione': 'Spazi pubblicitari nell\'app ufficiale del club. Include banner, interstitial e push notification sponsorizzate.',
                'descrizione_breve': 'Pubblicità in-app ufficiale',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'downloads': '120.000+',
                    'MAU': '45.000',
                    'formati': 'Banner, Interstitial, Native, Push'
                }),
                'prezzo_listino': 4500,
                'prezzo_minimo': 3500,
                'quantita_totale': 3,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'digital,app,mobile',
                'pricing_tiers': [
                    {'nome': 'Mensile', 'codice': 'mensile', 'prezzo': 4500, 'durata_tipo': 'mese'}
                ]
            },

            # HOSPITALITY
            {
                'category': 'hospitality',
                'codice': 'HSP-SKY-001',
                'nome': 'Skybox Premium - 12 posti',
                'descrizione': 'Skybox esclusivo con 12 posti, vista panoramica sul campo. Include: catering gourmet, open bar, hostess dedicata, parcheggio VIP, accesso area hospitality.',
                'descrizione_breve': 'Skybox 12 posti con catering premium',
                'tipo': 'esperienza',
                'posizione': 'Tribuna Centrale - Livello 3',
                'specifiche_tecniche': json.dumps({
                    'capacita': '12 persone',
                    'servizi': 'Catering, Open Bar, Hostess, Parcheggio VIP',
                    'vista': 'Panoramica centrale',
                    'TV': '2x 65" 4K'
                }),
                'prezzo_listino': 8500,
                'prezzo_minimo': 7000,
                'quantita_totale': 6,
                'quantita_disponibile': 4,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'hospitality,vip,skybox,premium',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 8500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 15000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione (19 partite)', 'codice': 'stagione', 'prezzo': 140000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-SKY-002',
                'nome': 'Skybox Business - 8 posti',
                'descrizione': 'Skybox business con 8 posti. Include: catering, bevande, hostess.',
                'descrizione_breve': 'Skybox 8 posti business',
                'tipo': 'esperienza',
                'posizione': 'Tribuna Centrale - Livello 2',
                'specifiche_tecniche': json.dumps({
                    'capacita': '8 persone',
                    'servizi': 'Catering, Bevande, Hostess',
                    'TV': '1x 55" 4K'
                }),
                'prezzo_listino': 5500,
                'prezzo_minimo': 4500,
                'quantita_totale': 8,
                'quantita_disponibile': 5,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'hospitality,vip,skybox',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 5500, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 9500, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 90000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-TBL-001',
                'nome': 'Tavolo Lounge VIP - 4 posti',
                'descrizione': 'Tavolo nella lounge VIP con vista campo. Aperitivo e cena inclusi.',
                'descrizione_breve': 'Tavolo 4 posti lounge VIP',
                'tipo': 'esperienza',
                'posizione': 'Lounge VIP - Piano Terra',
                'prezzo_listino': 1800,
                'prezzo_minimo': 1400,
                'quantita_totale': 20,
                'quantita_disponibile': 12,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'hospitality,lounge,tavolo',
                'pricing_tiers': [
                    {'nome': 'Partita Standard', 'codice': 'standard', 'prezzo': 1800, 'durata_tipo': 'partita'},
                    {'nome': 'Derby', 'codice': 'derby', 'prezzo': 3200, 'durata_tipo': 'partita'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-EXP-001',
                'nome': 'Player Escort Experience',
                'descrizione': 'Esperienza bambino accompagnatore giocatori. Il bambino entra in campo mano nella mano con un giocatore. Include: divisa ufficiale, foto ricordo, incontro giocatori.',
                'descrizione_breve': 'Bambino accompagnatore giocatori',
                'tipo': 'esperienza',
                'prezzo_listino': 1500,
                'prezzo_minimo': 1200,
                'quantita_totale': 11,
                'quantita_disponibile': 8,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'esperienza,bambini,escort',
                'pricing_tiers': [
                    {'nome': 'Singola', 'codice': 'singola', 'prezzo': 1500, 'durata_tipo': 'partita'}
                ]
            },
            {
                'category': 'hospitality',
                'codice': 'HSP-TOUR-001',
                'nome': 'Stadium Tour Privato',
                'descrizione': 'Tour esclusivo dello stadio per gruppi fino a 20 persone. Include: spogliatoi, tunnel, bordo campo, sala stampa, museo.',
                'descrizione_breve': 'Tour privato stadio (max 20 pax)',
                'tipo': 'esperienza',
                'prezzo_listino': 800,
                'prezzo_minimo': 600,
                'quantita_totale': 10,
                'quantita_disponibile': 10,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'esperienza,tour,stadio',
                'pricing_tiers': [
                    {'nome': 'Tour Singolo', 'codice': 'singolo', 'prezzo': 800, 'durata_tipo': 'partita'}
                ]
            },

            # BROADCAST
            {
                'category': 'broadcast',
                'codice': 'BRC-INT-001',
                'nome': 'Backdrop Interviste Post-Partita',
                'descrizione': 'Logo sponsor sul backdrop delle interviste post-partita. Massima visibilità su tutti i canali TV e streaming.',
                'descrizione_breve': 'Logo su backdrop interviste',
                'tipo': 'misto',
                'posizione': 'Mixed Zone',
                'dimensioni': '80cm x 60cm',
                'prezzo_listino': 35000,
                'prezzo_minimo': 28000,
                'quantita_totale': 4,
                'quantita_disponibile': 2,
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
                'codice': 'BRC-CONF-001',
                'nome': 'Backdrop Sala Stampa',
                'descrizione': 'Logo sponsor sul backdrop della sala stampa per conferenze pre e post partita.',
                'descrizione_breve': 'Logo backdrop sala stampa',
                'tipo': 'misto',
                'posizione': 'Sala Stampa',
                'dimensioni': '60cm x 45cm',
                'prezzo_listino': 25000,
                'prezzo_minimo': 20000,
                'quantita_totale': 6,
                'quantita_disponibile': 3,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'tv,conferenza,stampa',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 25000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'broadcast',
                'codice': 'BRC-VTR-001',
                'nome': 'Virtual Advertising - Bordo Campo Virtuale',
                'descrizione': 'Pubblicità virtuale inserita in post-produzione sul bordo campo per le trasmissioni internazionali.',
                'descrizione_breve': 'Adv virtuale bordo campo',
                'tipo': 'digitale',
                'specifiche_tecniche': json.dumps({
                    'mercati': 'Internazionali (esclusa Italia)',
                    'visibilita': '10 minuti effettivi/partita'
                }),
                'prezzo_listino': 15000,
                'prezzo_minimo': 12000,
                'quantita_totale': 4,
                'quantita_disponibile': 4,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'virtual,broadcast,internazionale',
                'pricing_tiers': [
                    {'nome': 'Partita', 'codice': 'partita', 'prezzo': 15000, 'durata_tipo': 'partita'},
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 250000, 'durata_tipo': 'stagione'}
                ]
            },

            # STADIUM
            {
                'category': 'stadium',
                'codice': 'STD-GATE-001',
                'nome': 'Naming Ingresso Tribuna VIP',
                'descrizione': 'Naming rights dell\'ingresso Tribuna VIP. Include: insegna luminosa, tappeto brandizzato, hostess in divisa sponsor.',
                'descrizione_breve': 'Naming ingresso VIP',
                'tipo': 'fisico',
                'posizione': 'Ingresso Tribuna VIP',
                'dimensioni': 'Insegna 3m x 0.8m',
                'prezzo_listino': 45000,
                'prezzo_minimo': 35000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'naming,stadio,vip',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 45000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-PANEL-001',
                'nome': 'Pannello Fisso Esterno Stadio',
                'descrizione': 'Pannello pubblicitario fisso sulla facciata esterna dello stadio. Visibilità 24/7.',
                'descrizione_breve': 'Cartellone esterno stadio',
                'tipo': 'fisico',
                'posizione': 'Facciata esterna - Lato Nord',
                'dimensioni': '6m x 3m',
                'prezzo_listino': 28000,
                'prezzo_minimo': 22000,
                'quantita_totale': 4,
                'quantita_disponibile': 2,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'pannello,esterno,fisso',
                'pricing_tiers': [
                    {'nome': 'Annuale', 'codice': 'annuale', 'prezzo': 28000, 'durata_tipo': 'anno'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-SEAT-001',
                'nome': 'Brandizzazione Seggiolini Settore',
                'descrizione': 'Brandizzazione completa seggiolini di un settore. Ideale per creare mosaici e pattern visibili dalle riprese aeree.',
                'descrizione_breve': 'Brand seggiolini settore',
                'tipo': 'fisico',
                'posizione': 'Settore a scelta',
                'specifiche_tecniche': json.dumps({
                    'seggiolini': '2000-3000 per settore',
                    'materiale': 'Cover brandizzate removibili'
                }),
                'prezzo_listino': 18000,
                'prezzo_minimo': 14000,
                'quantita_totale': 8,
                'quantita_disponibile': 6,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': False,
                'tags': 'seggiolini,stadio,settore',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 18000, 'durata_tipo': 'stagione'}
                ]
            },
            {
                'category': 'stadium',
                'codice': 'STD-TUNNEL-001',
                'nome': 'Tunnel Sponsor',
                'descrizione': 'Brandizzazione completa del tunnel di ingresso giocatori. Visibilità garantita in ogni pre-partita televisivo.',
                'descrizione_breve': 'Branding tunnel giocatori',
                'tipo': 'fisico',
                'posizione': 'Tunnel ingresso campo',
                'prezzo_listino': 55000,
                'prezzo_minimo': 45000,
                'quantita_totale': 1,
                'disponibile': True,
                'visibile_marketplace': True,
                'in_evidenza': True,
                'tags': 'tunnel,premium,tv',
                'pricing_tiers': [
                    {'nome': 'Stagione', 'codice': 'stagione', 'prezzo': 55000, 'durata_tipo': 'stagione'}
                ]
            }
        ]

        for asset_data in assets_data:
            cat_code = asset_data.pop('category')
            pricing_tiers_data = asset_data.pop('pricing_tiers', [])

            # Handle categorie_escluse if present
            if 'categorie_escluse' not in asset_data:
                asset_data['categorie_escluse'] = None

            asset = InventoryAsset(
                club_id=club_id,
                category_id=categories[cat_code].id,
                **asset_data
            )
            db.session.add(asset)
            db.session.flush()

            # Add pricing tiers
            for i, tier_data in enumerate(pricing_tiers_data):
                tier = AssetPricingTier(
                    asset_id=asset.id,
                    ordine=i,
                    **tier_data
                )
                db.session.add(tier)

            print(f"  - {asset.codice}: {asset.nome}")

        db.session.commit()

        # Stats
        print("\n" + "="*60)
        print("RIEPILOGO")
        print("="*60)
        cat_count = InventoryCategory.query.filter_by(club_id=club_id).count()
        asset_count = InventoryAsset.query.filter_by(club_id=club_id).count()
        tier_count = AssetPricingTier.query.filter(
            AssetPricingTier.asset_id.in_(
                db.session.query(InventoryAsset.id).filter_by(club_id=club_id)
            )
        ).count()

        total_value = db.session.query(db.func.sum(InventoryAsset.prezzo_listino)).filter_by(club_id=club_id).scalar() or 0
        available_count = InventoryAsset.query.filter_by(club_id=club_id, disponibile=True).count()

        print(f"  Categorie create: {cat_count}")
        print(f"  Asset creati: {asset_count}")
        print(f"  Pricing tiers creati: {tier_count}")
        print(f"  Asset disponibili: {available_count}")
        print(f"  Valore totale listino: €{total_value:,.0f}")
        print("\n SEED COMPLETATO CON SUCCESSO!")


if __name__ == '__main__':
    main()
