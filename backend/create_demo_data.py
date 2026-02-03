#!/usr/bin/env python3
"""
Script per creare dati demo completi per FC Stellamare
Club di calcio fittizio con sponsor, contratti, eventi, e tutto il resto
"""

from app import create_app, db
from app.models import *
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
import random
import uuid

app = create_app()

def clear_demo_data():
    """Rimuove i dati di test esistenti"""

    print("🗑️  Rimozione dati esistenti...")

    # Trova e rimuovi il club di prova
    club_prova = Club.query.filter_by(email='prova@prova.com').first()
    if club_prova:
        db.session.delete(club_prova)
        db.session.commit()
        print("✅ Club di prova rimosso")

def create_demo_club():
    """Crea il club FC Stellamare con dati completi"""

    print("\n⚽ Creazione FC Stellamare...")

    # Controlla se esiste già
    existing = Club.query.filter_by(email='info@fcstellamare.it').first()
    if existing:
        print("❌ FC Stellamare esiste già!")
        return existing

    club = Club(
        # Dati anagrafici
        nome='FC Stellamare',
        tipologia='Calcio',
        codice_fiscale='12345678901',
        partita_iva='01234567890',
        numero_affiliazione='LND-12345',

        # Contatti
        indirizzo_sede_legale='Via dello Sport 15, 20100 Milano MI',
        indirizzo_sede_operativa='Stadio Comunale "Riviera", Via Marittima 88, 20100 Milano MI',
        email='info@fcstellamare.it',
        telefono='+39 02 1234567',
        sito_web='https://www.fcstellamare.it',

        # Referente
        referente_nome='Marco',
        referente_cognome='Benedetti',
        referente_ruolo='Direttore Generale',
        referente_contatto='m.benedetti@fcstellamare.it',

        # Info operative
        numero_tesserati=450,
        categoria_campionato='Serie C Girone A',

        # Social
        facebook='https://facebook.com/fcstellamare',
        instagram='https://instagram.com/fcstellamare',
        tiktok='https://tiktok.com/@fcstellamare',
        pubblico_medio=3500,

        # Abbonamento
        nome_abbonamento='Professional',
        costo_abbonamento=299.00,
        tipologia_abbonamento='annuale',
        data_scadenza_licenza=datetime.now() + timedelta(days=350),
        account_attivo=True,

        created_at=datetime.now() - timedelta(days=180),
    )

    club.set_password('stellamare2024')

    db.session.add(club)
    db.session.commit()

    print(f"✅ Club creato: {club.nome} (ID: {club.id})")
    return club


def create_demo_sponsors(club):
    """Crea 5 sponsor fittizi con profili completi"""

    print("\n🏢 Creazione sponsor...")

    sponsors_data = [
        {
            'ragione_sociale': 'TechVision Solutions S.r.l.',
            'partita_iva': '11223344556',
            'codice_fiscale': '11223344556',
            'settore_merceologico': 'Informatica e Tecnologia',
            'indirizzo_sede': 'Via Innovation 42, 20121 Milano MI',
            'email': 'sponsor@techvision.it',
            'telefono': '+39 02 9876543',
            'sito_web': 'https://www.techvisionsolutions.it',
            'facebook': 'https://facebook.com/techvisionsolutions',
            'instagram': 'https://instagram.com/techvision_it',
            'linkedin': 'https://linkedin.com/company/techvision-solutions',
            'referente_nome': 'Laura',
            'referente_cognome': 'Ferretti',
            'referente_ruolo': 'Marketing Manager',
            'referente_contatto': 'l.ferretti@techvision.it',
            'password': 'techvision2024',
            'profile': {
                'descrizione': 'Leader nel settore IT con focus su soluzioni cloud e cybersecurity per PMI',
                'dimensione': 'PMI',
                'target': 'B2B',
                'anno': 2015,
                'interessi': ['eventi_congiunti', 'campagne_social', 'merchandising']
            }
        },
        {
            'ragione_sociale': 'Banca Riviera S.p.A.',
            'partita_iva': '22334455667',
            'codice_fiscale': '22334455667',
            'settore_merceologico': 'Servizi Finanziari',
            'indirizzo_sede': 'Piazza Mercato 8, 20122 Milano MI',
            'email': 'marketing@bancariviera.it',
            'telefono': '+39 02 5555777',
            'sito_web': 'https://www.bancariviera.it',
            'facebook': 'https://facebook.com/bancariviera',
            'instagram': 'https://instagram.com/banca_riviera',
            'linkedin': 'https://linkedin.com/company/banca-riviera',
            'twitter': 'https://twitter.com/bancariviera',
            'referente_nome': 'Alessandro',
            'referente_cognome': 'Moretti',
            'referente_ruolo': 'Responsabile Comunicazione',
            'referente_contatto': 'a.moretti@bancariviera.it',
            'password': 'bancariviera2024',
            'profile': {
                'descrizione': 'Banca territoriale con focus su famiglie e imprese locali',
                'dimensione': 'Grande Impresa',
                'target': 'B2C',
                'anno': 1978,
                'interessi': ['eventi_congiunti', 'promo_incrociate']
            }
        },
        {
            'ragione_sociale': 'SportMax Italia S.r.l.',
            'partita_iva': '33445566778',
            'codice_fiscale': '33445566778',
            'settore_merceologico': 'Abbigliamento Sportivo',
            'indirizzo_sede': 'Via Atleti 23, 20089 Rozzano MI',
            'email': 'partnership@sportmax.it',
            'telefono': '+39 02 3334455',
            'sito_web': 'https://www.sportmaxitalia.it',
            'facebook': 'https://facebook.com/sportmaxitalia',
            'instagram': 'https://instagram.com/sportmax_italia',
            'tiktok': 'https://tiktok.com/@sportmax_ita',
            'linkedin': 'https://linkedin.com/company/sportmax-italia',
            'referente_nome': 'Giulia',
            'referente_cognome': 'Santoro',
            'referente_ruolo': 'Brand Partnership Manager',
            'referente_contatto': 'g.santoro@sportmax.it',
            'password': 'sportmax2024',
            'profile': {
                'descrizione': 'Produzione e distribuzione abbigliamento tecnico per sport outdoor e indoor',
                'dimensione': 'PMI',
                'target': 'B2C',
                'anno': 2010,
                'interessi': ['eventi_congiunti', 'campagne_social', 'merchandising', 'promo_incrociate']
            }
        },
        {
            'ragione_sociale': 'Delizie del Gusto S.p.A.',
            'partita_iva': '44556677889',
            'codice_fiscale': '44556677889',
            'settore_merceologico': 'Alimentare e Bevande',
            'indirizzo_sede': 'Viale Produzione 67, 20900 Monza MB',
            'email': 'marketing@deliziedegusto.it',
            'telefono': '+39 039 8887766',
            'sito_web': 'https://www.deliziedegusto.it',
            'facebook': 'https://facebook.com/deliziedegusto',
            'instagram': 'https://instagram.com/delizie_del_gusto',
            'referente_nome': 'Roberto',
            'referente_cognome': 'Colombo',
            'referente_ruolo': 'Direttore Marketing',
            'referente_contatto': 'r.colombo@deliziedegusto.it',
            'password': 'delizie2024',
            'profile': {
                'descrizione': 'Produzione e distribuzione prodotti alimentari biologici e premium',
                'dimensione': 'Grande Impresa',
                'target': 'B2B2C',
                'anno': 1995,
                'interessi': ['eventi_congiunti', 'promo_incrociate']
            }
        },
        {
            'ragione_sociale': 'AutoElite Motors S.r.l.',
            'partita_iva': '55667788990',
            'codice_fiscale': '55667788990',
            'settore_merceologico': 'Automotive',
            'indirizzo_sede': 'Via Concessionaria 101, 20090 Segrate MI',
            'email': 'info@autoelitemotors.it',
            'telefono': '+39 02 7778899',
            'sito_web': 'https://www.autoelitemotors.it',
            'facebook': 'https://facebook.com/autoelitemotors',
            'instagram': 'https://instagram.com/autoelite_motors',
            'linkedin': 'https://linkedin.com/company/autoelite-motors',
            'referente_nome': 'Stefano',
            'referente_cognome': 'Ricci',
            'referente_ruolo': 'Responsabile Sponsorizzazioni',
            'referente_contatto': 's.ricci@autoelitemotors.it',
            'password': 'autoelite2024',
            'profile': {
                'descrizione': 'Concessionaria multimarca con focus su veicoli premium ed elettrici',
                'dimensione': 'PMI',
                'target': 'B2C',
                'anno': 2005,
                'interessi': ['eventi_congiunti', 'merchandising']
            }
        }
    ]

    sponsors = []
    for data in sponsors_data:
        sponsor = Sponsor(
            club_id=club.id,
            ragione_sociale=data['ragione_sociale'],
            partita_iva=data['partita_iva'],
            codice_fiscale=data['codice_fiscale'],
            settore_merceologico=data['settore_merceologico'],
            indirizzo_sede=data['indirizzo_sede'],
            email=data['email'],
            telefono=data['telefono'],
            sito_web=data['sito_web'],
            facebook=data.get('facebook'),
            instagram=data.get('instagram'),
            tiktok=data.get('tiktok'),
            linkedin=data.get('linkedin'),
            twitter=data.get('twitter'),
            referente_nome=data['referente_nome'],
            referente_cognome=data['referente_cognome'],
            referente_ruolo=data['referente_ruolo'],
            referente_contatto=data['referente_contatto'],
            account_attivo=True,
            created_at=datetime.now() - timedelta(days=random.randint(30, 150))
        )
        sponsor.set_password(data['password'])
        db.session.add(sponsor)
        db.session.flush()

        # Crea profilo sponsor network
        profile_data = data['profile']
        profile = SponsorProfile(
            sponsor_id=sponsor.id,
            descrizione_pubblica=profile_data['descrizione'],
            dimensione_azienda=profile_data['dimensione'],
            target_audience=profile_data['target'],
            anno_fondazione=profile_data['anno'],
            interesse_eventi_congiunti='eventi_congiunti' in profile_data['interessi'],
            interesse_campagne_social='campagne_social' in profile_data['interessi'],
            interesse_promo_incrociate='promo_incrociate' in profile_data['interessi'],
            interesse_merchandising='merchandising' in profile_data['interessi'],
            visibile_rete_sponsor=True,
            permetti_messaggi=True
        )
        db.session.add(profile)

        sponsors.append(sponsor)
        print(f"  ✅ {sponsor.ragione_sociale} (ID: {sponsor.id})")

    db.session.commit()
    print(f"✅ Creati {len(sponsors)} sponsor")
    return sponsors


def create_demo_contracts(club, sponsors):
    """Crea 7 contratti con asset e checklist"""

    print("\n📝 Creazione contratti...")

    # Ricarica sponsor dalla sessione
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    contracts_data = [
        {
            'sponsor_idx': 0,  # TechVision
            'nome': 'Main Sponsor Maglia 2024/25',
            'compenso': 150000.00,
            'data_inizio': datetime.now() - timedelta(days=60),
            'data_fine': datetime.now() + timedelta(days=305),
            'descrizione': 'Sponsorizzazione principale con logo su maglia home e away, LED perimetrali, hospitality',
            'status': 'attivo',
            'assets': [
                {'categoria': 'LED', 'nome': 'LED Perimetrale lato tribuna', 'quantita': 20, 'status': 'in_corso'},
                {'categoria': 'Social Media', 'nome': 'Post Instagram - 2 al mese', 'quantita': 24, 'status': 'in_corso'},
                {'categoria': 'Branding', 'nome': 'Logo Maglia Home', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Branding', 'nome': 'Logo Maglia Away', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Hospitality', 'nome': 'Business Box - 10 posti a partita', 'quantita': 19, 'status': 'in_corso'},
            ],
            'checklist': [
                {'titolo': 'Consegna loghi hi-res', 'completato': True, 'assegnato_a': 'sponsor'},
                {'titolo': 'Approvazione design maglia', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Installazione LED stadio', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Report mensile social media', 'completato': False, 'assegnato_a': 'club', 'scadenza': 30},
            ]
        },
        {
            'sponsor_idx': 1,  # Banca Riviera
            'nome': 'Premium Partner 2024/25',
            'compenso': 80000.00,
            'data_inizio': datetime.now() - timedelta(days=90),
            'data_fine': datetime.now() + timedelta(days=275),
            'descrizione': 'Partnership premium con naming rights tribuna VIP, LED, eventi speciali',
            'status': 'attivo',
            'assets': [
                {'categoria': 'LED', 'nome': 'LED Bordo campo', 'quantita': 12, 'status': 'in_corso'},
                {'categoria': 'Branding', 'nome': 'Naming Tribuna VIP', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Eventi', 'nome': 'Fan Day - Stand promozionale', 'quantita': 2, 'status': 'da_consegnare'},
                {'categoria': 'Social Media', 'nome': 'Storia Instagram pre-partita', 'quantita': 19, 'status': 'in_corso'},
            ],
            'checklist': [
                {'titolo': 'Contratto firmato', 'completato': True, 'assegnato_a': 'sponsor'},
                {'titolo': 'Insegna tribuna VIP installata', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Pianificazione eventi Fan Day', 'completato': False, 'assegnato_a': 'club', 'scadenza': 15},
            ]
        },
        {
            'sponsor_idx': 2,  # SportMax
            'nome': 'Technical Partner 2024/25',
            'compenso': 60000.00,
            'data_inizio': datetime.now() - timedelta(days=120),
            'data_fine': datetime.now() + timedelta(days=245),
            'descrizione': 'Fornitura abbigliamento tecnico squadra e staff, merchandising co-branded',
            'status': 'attivo',
            'assets': [
                {'categoria': 'Merchandise', 'nome': 'Fornitura divise gara', 'quantita': 3, 'status': 'completato'},
                {'categoria': 'Merchandise', 'nome': 'Abbigliamento allenamento', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Branding', 'nome': 'Logo tecnico maglia', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Social Media', 'nome': 'Contenuti TikTok mensili', 'quantita': 12, 'status': 'in_corso'},
                {'categoria': 'Eventi', 'nome': 'Store popup stadio', 'quantita': 19, 'status': 'in_corso'},
            ],
            'checklist': [
                {'titolo': 'Consegna divise prima squadra', 'completato': True, 'assegnato_a': 'sponsor'},
                {'titolo': 'Setup store popup', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Calendario shooting merchandising', 'completato': False, 'assegnato_a': 'club', 'scadenza': 20},
            ]
        },
        {
            'sponsor_idx': 3,  # Delizie del Gusto
            'nome': 'Official Food Partner 2024/25',
            'compenso': 45000.00,
            'data_inizio': datetime.now() - timedelta(days=45),
            'data_fine': datetime.now() + timedelta(days=320),
            'descrizione': 'Partner ufficiale food & beverage con esclusiva punti ristoro stadio',
            'status': 'attivo',
            'assets': [
                {'categoria': 'Branding', 'nome': 'Pannelli punti ristoro', 'quantita': 8, 'status': 'completato'},
                {'categoria': 'Sampling', 'nome': 'Degustazioni pre-partita', 'quantita': 19, 'status': 'in_corso'},
                {'categoria': 'LED', 'nome': 'LED angolo campo', 'quantita': 8, 'status': 'in_corso'},
                {'categoria': 'Social Media', 'nome': 'Post Facebook settimanali', 'quantita': 40, 'status': 'in_corso'},
            ],
            'checklist': [
                {'titolo': 'Accordo esclusiva punti ristoro', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Installazione branding chioschi', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Menu degustazioni approvato', 'completato': True, 'assegnato_a': 'sponsor'},
                {'titolo': 'Report vendite mensile', 'completato': False, 'assegnato_a': 'club', 'scadenza': 25},
            ]
        },
        {
            'sponsor_idx': 4,  # AutoElite
            'nome': 'Mobility Partner 2024/25',
            'compenso': 35000.00,
            'data_inizio': datetime.now() - timedelta(days=30),
            'data_fine': datetime.now() + timedelta(days=335),
            'descrizione': 'Partner mobilità con fornitura auto ufficiali e test drive events',
            'status': 'attivo',
            'assets': [
                {'categoria': 'Branding', 'nome': 'Logo sul parcheggio VIP', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Eventi', 'nome': 'Test Drive Events', 'quantita': 3, 'status': 'da_consegnare'},
                {'categoria': 'LED', 'nome': 'LED ingresso stadio', 'quantita': 6, 'status': 'in_corso'},
                {'categoria': 'Meet & Greet', 'nome': 'Meet con giocatori', 'quantita': 2, 'status': 'da_consegnare'},
            ],
            'checklist': [
                {'titolo': 'Fornitura auto staff tecnico', 'completato': True, 'assegnato_a': 'sponsor'},
                {'titolo': 'Pianificazione test drive', 'completato': False, 'assegnato_a': 'club', 'scadenza': 45},
                {'titolo': 'Calendario meet & greet', 'completato': False, 'assegnato_a': 'club', 'scadenza': 60},
            ]
        },
        {
            'sponsor_idx': 0,  # TechVision - secondo contratto
            'nome': 'Digital Innovation Partnership',
            'compenso': 25000.00,
            'data_inizio': datetime.now() - timedelta(days=15),
            'data_fine': datetime.now() + timedelta(days=350),
            'descrizione': 'Partnership innovazione digitale per app mobile e fan engagement',
            'status': 'attivo',
            'assets': [
                {'categoria': 'Social Media', 'nome': 'Campagne digital pre-partita', 'quantita': 19, 'status': 'in_corso'},
                {'categoria': 'Altro', 'nome': 'Sviluppo App Mobile', 'quantita': 1, 'status': 'da_consegnare'},
                {'categoria': 'Eventi', 'nome': 'Demo zone tecnologia stadio', 'quantita': 5, 'status': 'da_consegnare'},
            ],
            'checklist': [
                {'titolo': 'Briefing app mobile', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Wireframe app approvati', 'completato': False, 'assegnato_a': 'sponsor', 'scadenza': 30},
                {'titolo': 'Setup demo zone', 'completato': False, 'assegnato_a': 'club', 'scadenza': 90},
            ]
        },
        {
            'sponsor_idx': 2,  # SportMax - secondo contratto
            'nome': 'Youth Academy Partnership',
            'compenso': 18000.00,
            'data_inizio': datetime.now() - timedelta(days=10),
            'data_fine': datetime.now() + timedelta(days=355),
            'descrizione': 'Sponsorizzazione settore giovanile con fornitura materiale tecnico',
            'status': 'attivo',
            'assets': [
                {'categoria': 'Merchandise', 'nome': 'Divise settore giovanile', 'quantita': 5, 'status': 'in_corso'},
                {'categoria': 'Branding', 'nome': 'Logo campo allenamento', 'quantita': 1, 'status': 'completato'},
                {'categoria': 'Eventi', 'nome': 'Clinic tecnici giovani', 'quantita': 4, 'status': 'da_consegnare'},
            ],
            'checklist': [
                {'titolo': 'Accordo settore giovanile', 'completato': True, 'assegnato_a': 'club'},
                {'titolo': 'Taglie divise giovani', 'completato': False, 'assegnato_a': 'sponsor', 'scadenza': 20},
                {'titolo': 'Calendario clinic', 'completato': False, 'assegnato_a': 'club', 'scadenza': 40},
            ]
        }
    ]

    contracts = []
    for data in contracts_data:
        sponsor = sponsors[data['sponsor_idx']]

        contract = HeadOfTerms(
            club_id=club.id,
            sponsor_id=sponsor.id,
            nome_contratto=data['nome'],
            compenso=data['compenso'],
            data_inizio=data['data_inizio'],
            data_fine=data['data_fine'],
            descrizione=data['descrizione'],
            status=data['status'],
            created_at=data['data_inizio']
        )
        db.session.add(contract)
        db.session.flush()

        # Crea asset
        for asset_data in data['assets']:
            asset = Asset(
                head_of_terms_id=contract.id,
                categoria=asset_data['categoria'],
                nome=asset_data['nome'],
                quantita_totale=asset_data.get('quantita'),
                quantita_utilizzata=asset_data.get('quantita', 0) if asset_data['status'] == 'completato' else random.randint(0, asset_data.get('quantita', 10) // 2),
                status=asset_data['status'],
                valore=data['compenso'] / len(data['assets'])
            )
            db.session.add(asset)

        # Crea checklist
        for idx, check_data in enumerate(data['checklist']):
            checklist = Checklist(
                head_of_terms_id=contract.id,
                titolo=check_data['titolo'],
                descrizione=f"Task importante per il contratto {data['nome']}",
                assegnato_a=check_data['assegnato_a'],
                completato=check_data['completato'],
                scadenza=(datetime.now() + timedelta(days=check_data['scadenza'])).date() if 'scadenza' in check_data else None,
                completato_il=datetime.now() - timedelta(days=random.randint(1, 30)) if check_data['completato'] else None,
                creato_da='club',
                creato_da_user=club.email
            )
            db.session.add(checklist)

        contracts.append(contract)
        print(f"  ✅ {contract.nome_contratto} - {sponsor.ragione_sociale}")

    db.session.commit()
    print(f"✅ Creati {len(contracts)} contratti con asset e checklist")
    return contracts


def create_demo_matches(club, contracts):
    """Crea calendario partite con attivazioni"""

    print("\n⚽ Creazione calendario partite...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    contracts = [HeadOfTerms.query.get(c.id) for c in contracts]

    # Partite passate e future
    matches_data = [
        # Partite passate
        {'avversario': 'US Montechiaro', 'giorni': -21, 'competizione': 'Serie C', 'luogo': 'casa', 'risultato': (2, 1), 'status': 'conclusa'},
        {'avversario': 'AC Vallebruna', 'giorni': -14, 'competizione': 'Serie C', 'luogo': 'trasferta', 'risultato': (1, 1), 'status': 'conclusa'},
        {'avversario': 'FC Costamare', 'giorni': -7, 'competizione': 'Serie C', 'luogo': 'casa', 'risultato': (3, 0), 'status': 'conclusa'},
        # Partite future
        {'avversario': 'ASD Collina Verde', 'giorni': 3, 'competizione': 'Serie C', 'luogo': 'trasferta', 'status': 'programmata'},
        {'avversario': 'Sporting Laguna', 'giorni': 7, 'competizione': 'Serie C', 'luogo': 'casa', 'status': 'programmata'},
        {'avversario': 'FC Torregrande', 'giorni': 14, 'competizione': 'Coppa Italia Serie C', 'luogo': 'casa', 'status': 'programmata'},
        {'avversario': 'US Pineta', 'giorni': 21, 'competizione': 'Serie C', 'luogo': 'trasferta', 'status': 'programmata'},
        {'avversario': 'Real Boscomare', 'giorni': 28, 'competizione': 'Serie C', 'luogo': 'casa', 'status': 'programmata'},
        {'avversario': 'AC Montalbano', 'giorni': 35, 'competizione': 'Serie C', 'luogo': 'casa', 'status': 'programmata'},
        {'avversario': 'FC Litorale', 'giorni': 42, 'competizione': 'Serie C', 'luogo': 'trasferta', 'status': 'programmata'},
    ]

    matches = []
    for data in matches_data:
        match_date = datetime.now() + timedelta(days=data['giorni'])
        # Le partite di casa sono domenica alle 15:00
        if data['luogo'] == 'casa':
            match_date = match_date.replace(hour=15, minute=0, second=0, microsecond=0)
        else:
            match_date = match_date.replace(hour=14, minute=30, second=0, microsecond=0)

        match = Match(
            club_id=club.id,
            data_ora=match_date,
            avversario=data['avversario'],
            competizione=data['competizione'],
            luogo=data['luogo'],
            stadio='Stadio Comunale Riviera' if data['luogo'] == 'casa' else f'Stadio {data["avversario"]}',
            status=data['status'],
            risultato_casa=data.get('risultato', (None, None))[0] if data['luogo'] == 'casa' else data.get('risultato', (None, None))[1],
            risultato_trasferta=data.get('risultato', (None, None))[1] if data['luogo'] == 'casa' else data.get('risultato', (None, None))[0],
            note=f"Partita di {data['competizione']}"
        )
        db.session.add(match)
        db.session.flush()

        # Aggiungi attivazioni per partite in casa
        if data['luogo'] == 'casa' and len(contracts) > 0:
            # Main sponsor - LED
            if len(contracts) > 0:
                act1 = Activation(
                    match_id=match.id,
                    contract_id=contracts[0].id,  # TechVision main sponsor
                    tipo='LED/Maxischermo',
                    descrizione='Passaggi LED perimetrali TechVision durante partita',
                    stato='eseguita' if data['status'] == 'conclusa' else 'confermata',
                    responsabile='Staff Marketing Club',
                    eseguita=data['status'] == 'conclusa',
                    eseguita_il=match_date if data['status'] == 'conclusa' else None
                )
                db.session.add(act1)

            # Banca - Hospitality
            if len(contracts) > 1:
                act2 = Activation(
                    match_id=match.id,
                    contract_id=contracts[1].id,  # Banca Riviera
                    tipo='Hospitality',
                    descrizione='Accoglienza ospiti Tribuna VIP Banca Riviera',
                    stato='eseguita' if data['status'] == 'conclusa' else 'confermata',
                    responsabile='Responsabile Hospitality',
                    eseguita=data['status'] == 'conclusa',
                    eseguita_il=match_date if data['status'] == 'conclusa' else None
                )
                db.session.add(act2)

            # SportMax - Branding
            if len(contracts) > 2:
                act3 = Activation(
                    match_id=match.id,
                    contract_id=contracts[2].id,  # SportMax
                    tipo='Product Placement',
                    descrizione='Store popup SportMax area ingresso stadio',
                    stato='eseguita' if data['status'] == 'conclusa' else 'confermata',
                    responsabile='Staff Commerciale',
                    eseguita=data['status'] == 'conclusa',
                    eseguita_il=match_date if data['status'] == 'conclusa' else None
                )
                db.session.add(act3)

            # Delizie - Sampling
            if len(contracts) > 3:
                act4 = Activation(
                    match_id=match.id,
                    contract_id=contracts[3].id,  # Delizie del Gusto
                    tipo='Sampling',
                    descrizione='Degustazione prodotti Delizie del Gusto pre-partita',
                    stato='eseguita' if data['status'] == 'conclusa' else 'pianificata',
                    responsabile='Staff Food & Beverage',
                    eseguita=data['status'] == 'conclusa',
                    eseguita_il=match_date if data['status'] == 'conclusa' else None
                )
                db.session.add(act4)

        matches.append(match)
        print(f"  ✅ {match.data_ora.strftime('%d/%m/%Y')} - {match.avversario} ({match.luogo})")

    db.session.commit()
    print(f"✅ Creati {len(matches)} partite con attivazioni")
    return matches


def create_demo_events(club, sponsors):
    """Crea eventi extra calendario"""

    print("\n📆 Creazione eventi...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    events_data = [
        {
            'titolo': 'Conferenza Stampa Nuove Partnership',
            'tipo': 'Ufficio Stampa',
            'giorni_inizio': -5,
            'durata_ore': 2,
            'sponsor_idx': 0,
            'location': 'Sala Stampa Stadio Riviera',
            'indirizzo': 'Via Marittima 88, Milano',
            'descrizione': 'Presentazione ufficiale delle partnership stagionali con conferenza stampa e Q&A',
            'agenda': 'Interventi rappresentanti club e sponsor, presentazione progetti, Q&A giornalisti',
            'max_partecipanti': 50,
            'partecipanti': [
                {'nome': 'Marco Benedetti', 'email': 'info@fcstellamare.it', 'ruolo': 'organizzatore', 'status': 'presente'},
                {'nome': 'Laura Ferretti', 'email': 'sponsor@techvision.it', 'ruolo': 'relatore', 'status': 'presente'},
                {'nome': 'Alessandro Moretti', 'email': 'marketing@bancariviera.it', 'ruolo': 'partecipante', 'status': 'presente'},
            ]
        },
        {
            'titolo': 'Fan Day - Incontro con i Tifosi',
            'tipo': 'Brand Event',
            'giorni_inizio': 10,
            'durata_ore': 4,
            'sponsor_idx': 2,
            'location': 'Piazza Stadio',
            'indirizzo': 'Piazza Riviera, Milano',
            'descrizione': 'Evento aperto ai tifosi con autografi giocatori, stand sponsor, giochi e intrattenimento',
            'agenda': 'Ore 14: apertura stand - Ore 15: meet & greet giocatori - Ore 17: premiazioni contest',
            'max_partecipanti': 500,
            'partecipanti': [
                {'nome': 'Giulia Santoro', 'email': 'partnership@sportmax.it', 'ruolo': 'organizzatore', 'status': 'confermato'},
                {'nome': 'Staff Marketing', 'email': 'marketing@fcstellamare.it', 'ruolo': 'organizzatore', 'status': 'confermato'},
            ]
        },
        {
            'titolo': 'Cena di Gala con Sponsor Premium',
            'tipo': 'Networking',
            'giorni_inizio': 20,
            'durata_ore': 3,
            'sponsor_idx': 1,
            'location': 'Grand Hotel Riviera',
            'indirizzo': 'Viale Lungomare 15, Milano',
            'descrizione': 'Serata esclusiva per ringraziare gli sponsor con cena di gala e networking',
            'agenda': 'Aperitivo di benvenuto, cena, intervento presidente, premiazioni partner',
            'max_partecipanti': 80,
            'partecipanti': [
                {'nome': 'Alessandro Moretti', 'email': 'marketing@bancariviera.it', 'ruolo': 'organizzatore', 'status': 'confermato'},
            ]
        },
        {
            'titolo': 'Open Training Session per Giovani',
            'tipo': 'Formazione',
            'giorni_inizio': 15,
            'durata_ore': 3,
            'sponsor_idx': 2,
            'location': 'Centro Sportivo Stellamare',
            'indirizzo': 'Via Allenamento 10, Milano',
            'descrizione': 'Sessione di allenamento aperta ai giovani con clinic tecnici e meet con giocatori',
            'agenda': 'Riscaldamento, esercitazioni tecniche, partitella, autografi',
            'max_partecipanti': 100,
            'partecipanti': []
        },
        {
            'titolo': 'Meeting Strategico Sponsor Q2',
            'tipo': 'Meeting',
            'giorni_inizio': 30,
            'durata_ore': 2,
            'sponsor_idx': None,
            'modalita': 'online',
            'link_meeting': 'https://meet.google.com/abc-defg-hij',
            'descrizione': 'Incontro trimestrale con tutti gli sponsor per review attivazioni e planning Q2',
            'agenda': 'Review Q1, analytics, pianificazione Q2, feedback sponsor',
            'max_partecipanti': 20,
            'partecipanti': []
        }
    ]

    events = []
    for data in events_data:
        start_time = datetime.now() + timedelta(days=data['giorni_inizio'])
        start_time = start_time.replace(hour=18, minute=0, second=0)
        end_time = start_time + timedelta(hours=data['durata_ore'])

        event = Event(
            club_id=club.id,
            sponsor_id=sponsors[data['sponsor_idx']].id if data.get('sponsor_idx') is not None else None,
            titolo=data['titolo'],
            tipo=data['tipo'],
            data_ora_inizio=start_time,
            data_ora_fine=end_time,
            luogo=data.get('location'),
            indirizzo=data.get('indirizzo'),
            link_online=data.get('link_meeting'),
            modalita='online' if data.get('modalita') == 'online' else 'presenza',
            descrizione=data['descrizione'],
            agenda=data['agenda'],
            max_partecipanti=data['max_partecipanti'],
            status='completato' if data['giorni_inizio'] < 0 else 'confermato'
        )
        db.session.add(event)
        db.session.flush()

        # Aggiungi partecipanti
        for p in data.get('partecipanti', []):
            participant = EventParticipant(
                event_id=event.id,
                nome=p['nome'],
                email=p['email'],
                ruolo=p['ruolo'],
                status=p['status']
            )
            db.session.add(participant)

        events.append(event)
        print(f"  ✅ {event.titolo} - {event.data_ora_inizio.strftime('%d/%m/%Y')}")

    db.session.commit()
    print(f"✅ Creati {len(events)} eventi")
    return events


def create_demo_business_boxes(club, sponsors, matches):
    """Crea business box con inviti"""

    print("\n🎫 Creazione business box...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]
    matches = [Match.query.get(m.id) for m in matches]

    # Crea 3 business box
    boxes_data = [
        {
            'nome': 'Skybox Premium TechVision',
            'sponsor_idx': 0,
            'settore': 'Tribuna Centrale',
            'posti': 12,
            'catering': True,
            'parcheggio': True,
            'meet_and_greet': True,
            'merchandising': True,
            'tipo': 'stagionale'
        },
        {
            'nome': 'VIP Lounge Banca Riviera',
            'sponsor_idx': 1,
            'settore': 'Tribuna Est',
            'posti': 20,
            'catering': True,
            'parcheggio': True,
            'meet_and_greet': False,
            'merchandising': True,
            'tipo': 'stagionale'
        },
        {
            'nome': 'Corporate Box',
            'sponsor_idx': None,
            'settore': 'Tribuna Ovest',
            'posti': 8,
            'catering': True,
            'parcheggio': False,
            'meet_and_greet': False,
            'merchandising': False,
            'tipo': 'per_partita'
        }
    ]

    boxes = []
    for data in boxes_data:
        contract = None
        if data['sponsor_idx'] is not None:
            sponsor = sponsors[data['sponsor_idx']]
            # Trova il primo contratto di questo sponsor
            contract = HeadOfTerms.query.filter_by(sponsor_id=sponsor.id).first()

        box = BusinessBox(
            club_id=club.id,
            sponsor_id=sponsors[data['sponsor_idx']].id if data.get('sponsor_idx') is not None else None,
            contract_id=contract.id if contract else None,
            nome=data['nome'],
            settore=data['settore'],
            numero_posti=data['posti'],
            catering=data['catering'],
            parcheggio=data['parcheggio'],
            meet_and_greet=data['meet_and_greet'],
            merchandising=data['merchandising'],
            tipo=data['tipo']
        )
        db.session.add(box)
        db.session.flush()
        boxes.append(box)
        print(f"  ✅ {box.nome} - {box.numero_posti} posti")

    db.session.commit()

    # Crea inviti per le prossime partite in casa
    print("\n  📨 Creazione inviti business box...")
    invites = []
    home_matches = [m for m in matches if m.luogo == 'casa' and m.status == 'programmata'][:3]

    guests_data = [
        {'nome': 'Giovanni', 'cognome': 'Rossi', 'email': 'g.rossi@example.com', 'telefono': '+39 333 1234567', 'azienda': 'Tech Corp', 'ruolo': 'CEO', 'vip': True},
        {'nome': 'Maria', 'cognome': 'Bianchi', 'email': 'm.bianchi@example.com', 'telefono': '+39 333 2345678', 'azienda': 'Finance Ltd', 'ruolo': 'CFO', 'vip': True},
        {'nome': 'Paolo', 'cognome': 'Verdi', 'email': 'p.verdi@example.com', 'telefono': '+39 333 3456789', 'azienda': 'Sport Inc', 'ruolo': 'Marketing Manager', 'vip': False},
        {'nome': 'Francesca', 'cognome': 'Neri', 'email': 'f.neri@example.com', 'telefono': '+39 333 4567890', 'azienda': 'Food Group', 'ruolo': 'Director', 'vip': False},
        {'nome': 'Andrea', 'cognome': 'Gialli', 'email': 'a.gialli@example.com', 'telefono': '+39 333 5678901', 'azienda': 'Auto Motors', 'ruolo': 'Partner', 'vip': True},
    ]

    for match in home_matches:
        for box in boxes[:2]:  # Solo i primi 2 box
            # Crea 2-3 inviti per box
            num_invites = random.randint(2, 3)
            for i in range(num_invites):
                guest = random.choice(guests_data)
                sponsor = sponsors[0] if box.sponsor_id else sponsors[1]

                invite_code = str(uuid.uuid4())[:8].upper()

                invite = BoxInvite(
                    business_box_id=box.id,
                    match_id=match.id,
                    sponsor_id=sponsor.id,
                    nome=guest['nome'],
                    cognome=guest['cognome'],
                    email=guest['email'],
                    telefono=guest['telefono'],
                    azienda=guest['azienda'],
                    ruolo=guest['ruolo'],
                    codice_invito=invite_code,
                    status='confermato',
                    vip=guest['vip'],
                    parcheggio_richiesto=random.choice([True, False]),
                    badge_nome=f"{guest['nome']} {guest['cognome']}",
                    inviato_il=datetime.now() - timedelta(days=random.randint(5, 15)),
                    confermato_il=datetime.now() - timedelta(days=random.randint(1, 5))
                )
                db.session.add(invite)
                invites.append(invite)

    db.session.commit()
    print(f"  ✅ Creati {len(invites)} inviti")

    return boxes, invites


def create_demo_messages(club, sponsors):
    """Crea messaggi chat Club-Sponsor"""

    print("\n💬 Creazione messaggi chat...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    messages = []

    # Conversazione con TechVision
    conv1 = [
        {'sender': 'club', 'text': 'Buongiorno Laura, come procede la preparazione del materiale per il LED?', 'days_ago': 5},
        {'sender': 'sponsor', 'text': 'Buongiorno Marco! Tutto pronto, invieremo i file hi-res entro domani.', 'days_ago': 5},
        {'sender': 'club', 'text': 'Perfetto, grazie! Per la business box della prossima partita confermate 10 ospiti?', 'days_ago': 3},
        {'sender': 'sponsor', 'text': 'Sì confermati! Vi invio la lista nominativi entro stasera.', 'days_ago': 3},
        {'sender': 'club', 'text': 'Ricevuto, grazie mille!', 'days_ago': 2},
    ]

    for msg_data in conv1:
        msg = Message(
            club_id=club.id,
            sponsor_id=sponsors[0].id,
            sender_type=msg_data['sender'],
            sender_id=club.id if msg_data['sender'] == 'club' else sponsors[0].id,
            sender_name=club.nome if msg_data['sender'] == 'club' else sponsors[0].ragione_sociale,
            testo=msg_data['text'],
            letto=True,
            data_invio=datetime.now() - timedelta(days=msg_data['days_ago']),
            data_lettura=datetime.now() - timedelta(days=msg_data['days_ago']) + timedelta(hours=2)
        )
        db.session.add(msg)
        messages.append(msg)

    # Conversazione con Banca Riviera
    conv2 = [
        {'sender': 'sponsor', 'text': 'Salve, vorremmo organizzare un evento speciale in tribuna VIP. Avete disponibilità?', 'days_ago': 7},
        {'sender': 'club', 'text': 'Certo Alessandro! Che tipo di evento avevate in mente?', 'days_ago': 7},
        {'sender': 'sponsor', 'text': 'Un aperitivo pre-partita per i nostri clienti premium, circa 30 persone.', 'days_ago': 6},
        {'sender': 'club', 'text': 'Perfetto, possiamo organizzarlo per la partita del 15. Vi preparo un preventivo.', 'days_ago': 6},
        {'sender': 'sponsor', 'text': 'Ottimo, grazie!', 'days_ago': 5},
    ]

    for msg_data in conv2:
        msg = Message(
            club_id=club.id,
            sponsor_id=sponsors[1].id,
            sender_type=msg_data['sender'],
            sender_id=club.id if msg_data['sender'] == 'club' else sponsors[1].id,
            sender_name=club.nome if msg_data['sender'] == 'club' else sponsors[1].ragione_sociale,
            testo=msg_data['text'],
            letto=True,
            data_invio=datetime.now() - timedelta(days=msg_data['days_ago']),
            data_lettura=datetime.now() - timedelta(days=msg_data['days_ago']) + timedelta(hours=1)
        )
        db.session.add(msg)
        messages.append(msg)

    # Conversazione con SportMax
    conv3 = [
        {'sender': 'club', 'text': 'Giulia, quando arrivano le nuove divise trasferta?', 'days_ago': 2},
        {'sender': 'sponsor', 'text': 'Saranno consegnate entro venerdì! Tutto secondo programma.', 'days_ago': 2},
        {'sender': 'club', 'text': 'Perfetto! Per il popup store serve altro?', 'days_ago': 1},
        {'sender': 'sponsor', 'text': 'No tutto a posto, porterei anche il merchandising nuovo da mostrare.', 'days_ago': 1},
    ]

    for msg_data in conv3:
        msg = Message(
            club_id=club.id,
            sponsor_id=sponsors[2].id,
            sender_type=msg_data['sender'],
            sender_id=club.id if msg_data['sender'] == 'club' else sponsors[2].id,
            sender_name=club.nome if msg_data['sender'] == 'club' else sponsors[2].ragione_sociale,
            testo=msg_data['text'],
            letto=msg_data['days_ago'] > 1,
            data_invio=datetime.now() - timedelta(days=msg_data['days_ago']),
            data_lettura=datetime.now() - timedelta(days=msg_data['days_ago']) + timedelta(minutes=30) if msg_data['days_ago'] > 1 else None
        )
        db.session.add(msg)
        messages.append(msg)

    db.session.commit()
    print(f"✅ Creati {len(messages)} messaggi")
    return messages


def create_demo_press_publications(club, sponsors):
    """Crea comunicati stampa con reactions e commenti"""

    print("\n📰 Creazione comunicati stampa...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    publications_data = [
        {
            'tipo': 'comunicato',
            'titolo': 'FC Stellamare annuncia le partnership stagionali',
            'contenuto': '''Siamo orgogliosi di annunciare il rinnovo e l'allargamento delle nostre partnership strategiche per la stagione 2024/25.

TechVision Solutions conferma il ruolo di Main Sponsor con presenza sulla maglia ufficiale.
Banca Riviera è il nostro Premium Partner con naming rights della Tribuna VIP.
SportMax Italia è Technical Partner ufficiale per abbigliamento e merchandising.

Queste partnership ci permetteranno di continuare il nostro percorso di crescita e miglioramento.''',
                'categoria': 'partnership',
                'target': 'pubblico',
                'giorni_fa': 15,
                'pubblicato': True,
                'reactions': [
                    {'sponsor_idx': 0, 'tipo': 'love'},
                    {'sponsor_idx': 1, 'tipo': 'like'},
                    {'sponsor_idx': 2, 'tipo': 'celebration'},
                ],
                'commenti': [
                    {'sponsor_idx': 0, 'testo': 'Felici di continuare questa partnership di successo!', 'giorni_fa': 14},
                    {'sponsor_idx': 1, 'testo': 'Orgogliosi di supportare il club anche quest\'anno.', 'giorni_fa': 14},
                ]
            },
            {
                'tipo': 'news',
                'titolo': 'Vittoria importante contro FC Costamare',
                'contenuto': '''Grande prestazione della squadra che conquista 3 punti fondamentali battendo il Costamare 3-0 davanti al pubblico di casa.

Ottima prova di squadra con gol di Martinelli, Santini e Rizzo. Il pubblico ha risposto presente con 3.800 spettatori sugli spalti.

Prossimo impegno domenica prossima in trasferta.''',
                'categoria': 'risultati',
                'target': 'pubblico',
                'giorni_fa': 7,
                'pubblicato': True,
                'reactions': [
                    {'sponsor_idx': 0, 'tipo': 'celebration'},
                    {'sponsor_idx': 2, 'tipo': 'applause'},
                    {'sponsor_idx': 3, 'tipo': 'like'},
                ],
                'commenti': [
                    {'sponsor_idx': 2, 'testo': 'Grande squadra! Avanti così!', 'giorni_fa': 7},
                ]
            },
            {
                'tipo': 'evento',
                'titolo': 'Fan Day il 15 Marzo - Vi aspettiamo!',
                'contenuto': '''Save the date! Il 15 marzo organizziamo il Fan Day in Piazza Stadio.

Programma:
- Ore 14:00: Apertura stand sponsor e area giochi
- Ore 15:00: Meet & Greet con i giocatori
- Ore 16:00: Partita amichevole settore giovanile
- Ore 17:00: Premiazioni e sorteggi

Ingresso libero per tutti i tifosi. Vi aspettiamo numerosi!''',
                'categoria': 'eventi',
                'target': 'pubblico',
                'giorni_fa': 2,
                'pubblicato': True,
                'reactions': [
                    {'sponsor_idx': 1, 'tipo': 'love'},
                    {'sponsor_idx': 2, 'tipo': 'celebration'},
                ],
                'commenti': []
            },
            {
                'tipo': 'comunicato',
                'titolo': 'Report Attivazioni Sponsor - Marzo 2024',
                'contenuto': '''Report mensile delle attivazioni sponsor realizzate nel mese di marzo.

Highlights:
- 4 partite casalinghe con oltre 3.500 spettatori di media
- 15 passaggi LED per i nostri sponsor
- 3 eventi di hospitality VIP
- Oltre 50 post social con menzione sponsor

Grazie a tutti i partner per la collaborazione!''',
                'categoria': 'report',
                'target': 'solo_sponsor',
                'giorni_fa': 5,
                'pubblicato': True,
                'reactions': [
                    {'sponsor_idx': 0, 'tipo': 'interesting'},
                    {'sponsor_idx': 1, 'tipo': 'like'},
                    {'sponsor_idx': 3, 'tipo': 'like'},
                ],
                'commenti': [
                    {'sponsor_idx': 0, 'testo': 'Ottimi risultati, continuiamo così!', 'giorni_fa': 4},
                ]
            }
        ]

        publications = []
        for data in publications_data:
            pub = PressPublication(
                club_id=club.id,
                tipo=data['tipo'],
                titolo=data['titolo'],
                contenuto=data['contenuto'],
                categoria=data['categoria'],
                target_audience=data['target'],
                pubblicata=data['pubblicato'],
                data_pubblicazione=datetime.now() - timedelta(days=data['giorni_fa']) if data['pubblicato'] else None,
                view_count=random.randint(50, 200) if data['pubblicato'] else 0,
                created_at=datetime.now() - timedelta(days=data['giorni_fa'])
            )
            db.session.add(pub)
            db.session.flush()

            # Aggiungi reactions
            for react_data in data.get('reactions', []):
                reaction = PressReaction(
                    publication_id=pub.id,
                    sponsor_id=sponsors[react_data['sponsor_idx']].id,
                    tipo_reaction=react_data['tipo']
                )
                db.session.add(reaction)

            # Aggiungi commenti
            for comment_data in data.get('commenti', []):
                comment = PressComment(
                    publication_id=pub.id,
                    sponsor_id=sponsors[comment_data['sponsor_idx']].id,
                    user_name=sponsors[comment_data['sponsor_idx']].ragione_sociale,
                    commento=comment_data['testo'],
                    created_at=datetime.now() - timedelta(days=comment_data['giorni_fa'])
                )
                db.session.add(comment)

            # Aggiungi views
            for sponsor in sponsors[:3]:
                view = PressView(
                    publication_id=pub.id,
                    sponsor_id=sponsor.id
                )
                db.session.add(view)

            publications.append(pub)
            print(f"  ✅ {pub.titolo}")

        db.session.commit()
        print(f"✅ Creati {len(publications)} comunicati stampa")
        return publications


def create_demo_best_practice_events(admin_id):
    """Crea eventi best practice"""

    print("\n📚 Creazione eventi best practice...")

    events_data = [
        {
            'tipo': 'webinar',
            'titolo': 'ROI nelle Sponsorizzazioni Sportive: Metriche e Best Practice',
            'descrizione': '''Webinar dedicato alla misurazione del ROI nelle sponsorizzazioni sportive.

Scopriremo:
- KPI fondamentali per misurare il ritorno
- Strumenti di analytics e tracking
- Case study di successo
- Q&A con esperti del settore''',
                'giorni_evento': 12,
                'durata': 90,
                'link': 'https://zoom.us/j/123456789',
                'categoria': 'marketing',
                'tags': ['ROI', 'Analytics', 'KPI', 'Metriche'],
                'speakers': [
                    {'nome': 'Dott. Paolo Marchetti', 'ruolo': 'Sport Marketing Consultant', 'bio': 'Esperto in marketing sportivo con 15 anni di esperienza'},
                    {'nome': 'Dott.ssa Elena Rossi', 'ruolo': 'Data Analyst', 'bio': 'Specialista in analytics per sponsorizzazioni sportive'}
                ],
                'max_partecipanti': 100,
                'pubblicato': True
            },
            {
                'tipo': 'workshop',
                'titolo': 'Social Media Strategy per Club Sportivi',
                'descrizione': '''Workshop pratico sulla gestione dei social media per società sportive.

Argomenti:
- Content strategy vincente
- Engagement con i tifosi
- Collaborazioni con sponsor
- Tools e automazioni

Include esercitazioni pratiche e template pronti all'uso.''',
                'giorni_evento': 25,
                'durata': 180,
                'location': 'Hotel Continental Milano',
                'indirizzo': 'Via Manzoni 29, Milano',
                'categoria': 'digital',
                'tags': ['Social Media', 'Content', 'Instagram', 'Facebook'],
                'speakers': [
                    {'nome': 'Marco Bianchi', 'ruolo': 'Social Media Manager', 'bio': 'Gestisce i social di 5 club professionistici'}
                ],
                'max_partecipanti': 30,
                'pubblicato': True
            },
            {
                'tipo': 'seminario',
                'titolo': 'Contratti di Sponsorizzazione: Aspetti Legali',
                'descrizione': '''Seminario sugli aspetti legali e contrattuali delle sponsorizzazioni sportive.

Focus su:
- Clausole fondamentali
- Diritti d'immagine
- Rescissioni e penali
- Casi pratici e giurisprudenza''',
                'giorni_evento': 40,
                'durata': 120,
                'link': 'https://meet.google.com/xyz-abcd-efg',
                'categoria': 'legal',
                'tags': ['Contratti', 'Legal', 'Diritto Sportivo'],
                'speakers': [
                    {'nome': 'Avv. Francesca Neri', 'ruolo': 'Avvocato Sportivo', 'bio': 'Specializzata in diritto sportivo e sponsorizzazioni'}
                ],
                'max_partecipanti': 50,
                'pubblicato': True
            }
        ]

        events = []
        for data in events_data:
            event_date = datetime.now() + timedelta(days=data['giorni_evento'])
            event_date = event_date.replace(hour=15, minute=0)

            event = BestPracticeEvent(
                tipo=data['tipo'],
                titolo=data['titolo'],
                descrizione=data['descrizione'],
                data_evento=event_date,
                durata_minuti=data['durata'],
                location_fisica=data.get('location'),
                link_webinar=data.get('link'),
                speakers=data['speakers'],
                visibile_sponsor=True,
                visibile_club=True,
                categoria=data['categoria'],
                tags=data['tags'],
                max_partecipanti=data['max_partecipanti'],
                abilita_qna=True,
                pubblicato=data['pubblicato'],
                status='pubblicato' if data['pubblicato'] else 'bozza',
                creato_da_admin_id=admin_id
            )
            db.session.add(event)
            db.session.flush()

            events.append(event)
            print(f"  ✅ {event.titolo} - {event.data_evento.strftime('%d/%m/%Y')}")

        db.session.commit()
        print(f"✅ Creati {len(events)} eventi best practice")
        return events


def create_demo_resources(admin_id):
    """Crea categorie e risorse nel portale"""

    print("\n📚 Creazione portale risorse...")

    # Crea categorie
    categories_data = [
        {'nome': 'Marketing & Comunicazione', 'slug': 'marketing', 'icona': '📢', 'ordine': 1},
        {'nome': 'Sponsorizzazioni', 'slug': 'sponsorizzazioni', 'icona': '🤝', 'ordine': 2},
        {'nome': 'Digital & Social Media', 'slug': 'digital', 'icona': '💻', 'ordine': 3},
        {'nome': 'Aspetti Legali', 'slug': 'legal', 'icona': '⚖️', 'ordine': 4},
        {'nome': 'Analytics & ROI', 'slug': 'analytics', 'icona': '📊', 'ordine': 5},
    ]

    categories = []
    for cat_data in categories_data:
        cat = ResourceCategory(
            nome=cat_data['nome'],
            slug=cat_data['slug'],
            descrizione=f"Risorse relative a {cat_data['nome'].lower()}",
            icona=cat_data['icona'],
            ordine=cat_data['ordine'],
            attiva=True
        )
        db.session.add(cat)
        db.session.flush()
        categories.append(cat)
        print(f"  📁 {cat.nome}")

    # Crea risorse
    resources_data = [
        {
            'titolo': 'Guida Completa alle Sponsorizzazioni Sportive 2024',
            'slug': 'guida-sponsorizzazioni-2024',
            'descrizione': 'Manuale completo con best practice, case study e template per gestire sponsorizzazioni sportive in modo professionale.',
            'tipo': 'guida',
            'categoria_idx': 1,
            'tags': ['sponsorship', 'best practice', 'guida'],
            'settori': ['calcio', 'sport'],
            'autore': 'Team Pitch Partner',
            'fonte': 'Pitch Partner',
            'file_type': 'pdf',
            'file_size': 2048,
            'visibilita': 'public',
            'in_evidenza': True,
            'consigliata': True,
            'pubblicata': True
        },
        {
            'titolo': 'Template Contratto Sponsorizzazione',
            'slug': 'template-contratto',
            'descrizione': 'Template editabile di contratto di sponsorizzazione con clausole standard e personalizzabili.',
            'tipo': 'template',
            'categoria_idx': 1,
            'tags': ['contratto', 'template', 'legal'],
            'settori': ['tutti'],
            'autore': 'Avv. Studio Legale Sportivo',
            'fonte': 'Partner Legale',
            'file_type': 'docx',
            'file_size': 512,
            'visibilita': 'sponsor-only',
            'in_evidenza': False,
            'consigliata': True,
            'pubblicata': True
        },
        {
            'titolo': 'Social Media Kit per Club Sportivi',
            'slug': 'social-media-kit',
            'descrizione': 'Kit completo con template grafici, calendario editoriale e best practice per gestire i social media di un club.',
            'tipo': 'toolkit',
            'categoria_idx': 2,
            'tags': ['social media', 'template', 'instagram', 'facebook'],
            'settori': ['calcio', 'basket', 'volley'],
            'autore': 'Dott. Marco Bianchi',
            'fonte': 'Social Media Expert',
            'file_type': 'zip',
            'file_size': 15360,
            'visibilita': 'public',
            'in_evidenza': True,
            'consigliata': True,
            'pubblicata': True
        },
        {
            'titolo': 'Case Study: Campagna ROI SportMax x FC Stellamare',
            'slug': 'case-study-sportmax',
            'descrizione': 'Analisi dettagliata della partnership tra SportMax e FC Stellamare con metriche di ROI e risultati raggiunti.',
            'tipo': 'case-study',
            'categoria_idx': 4,
            'tags': ['case study', 'ROI', 'partnership'],
            'settori': ['calcio'],
            'autore': 'Team Analytics',
            'fonte': 'Pitch Partner',
            'file_type': 'pdf',
            'file_size': 3072,
            'visibilita': 'public',
            'in_evidenza': False,
            'consigliata': False,
            'pubblicata': True
        },
        {
            'titolo': 'Ricerca di Mercato: Sponsorizzazioni Serie C 2024',
            'slug': 'ricerca-serie-c-2024',
            'descrizione': 'Report completo sul mercato delle sponsorizzazioni in Serie C con dati, trend e benchmark di settore.',
            'tipo': 'ricerca',
            'categoria_idx': 0,
            'tags': ['ricerca', 'serie c', 'mercato', 'dati'],
            'settori': ['calcio'],
            'autore': 'Istituto Ricerche Sport',
            'fonte': 'IRS',
            'file_type': 'pdf',
            'file_size': 5120,
            'visibilita': 'premium',
            'in_evidenza': True,
            'consigliata': True,
            'pubblicata': True
        }
    ]

    resources = []
    for res_data in resources_data:
        resource = Resource(
            titolo=res_data['titolo'],
            slug=res_data['slug'],
            descrizione=res_data['descrizione'],
            tipo_risorsa=res_data['tipo'],
            categoria_id=categories[res_data['categoria_idx']].id,
            tags=res_data['tags'],
            settori_interesse=res_data['settori'],
            autore=res_data['autore'],
            fonte=res_data['fonte'],
            file_type=res_data['file_type'],
            file_size_kb=res_data['file_size'],
            visibilita=res_data['visibilita'],
            in_evidenza=res_data['in_evidenza'],
            consigliata=res_data['consigliata'],
            pubblicata=res_data['pubblicata'],
            data_pubblicazione=datetime.now() - timedelta(days=random.randint(10, 60)),
            view_count=random.randint(20, 150),
            download_count=random.randint(5, 50),
            rating_avg=round(random.uniform(4.0, 5.0), 1),
            rating_count=random.randint(3, 15)
        )
        db.session.add(resource)
        resources.append(resource)
        print(f"  📄 {resource.titolo}")

    db.session.commit()
    print(f"✅ Creati {len(categories)} categorie e {len(resources)} risorse")
    return categories, resources


def create_demo_projects(club, sponsors, contracts):
    """Crea progetti con milestone e task"""

    print("\n🎯 Creazione progetti...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]
    contracts = [HeadOfTerms.query.get(c.id) for c in contracts]

    projects_data = [
        {
            'titolo': 'Campagna Social Media 2024/25',
            'descrizione': 'Progetto completo di gestione social media per la stagione con contenuti sponsor-branded',
            'sponsor_idx': 0,
            'contract_idx': 0,
            'data_inizio': -30,
            'data_fine': 330,
            'budget': 15000,
            'status': 'in_corso',
            'team': ['Marketing Manager', 'Social Media Specialist', 'Grafico'],
            'milestones': [
                {'titolo': 'Setup canali e calendario', 'giorni': 15, 'completata': True},
                {'titolo': 'Q1 Content Production', 'giorni': 90, 'completata': True},
                {'titolo': 'Q2 Content Production', 'giorni': 180, 'completata': False},
                {'titolo': 'Q3 Content Production', 'giorni': 270, 'completata': False},
            ]
        },
        {
            'titolo': 'Sviluppo App Mobile FC Stellamare',
            'descrizione': 'Progetto sviluppo applicazione mobile con TechVision per fan engagement e servizi digitali',
            'sponsor_idx': 0,
            'contract_idx': 5,
            'data_inizio': -15,
            'data_fine': 180,
            'budget': 25000,
            'status': 'in_corso',
            'team': ['Project Manager', 'Developer', 'UX Designer'],
            'milestones': [
                {'titolo': 'Discovery e Wireframe', 'giorni': 30, 'completata': True},
                {'titolo': 'Design UI/UX', 'giorni': 60, 'completata': False},
                {'titolo': 'Sviluppo MVP', 'giorni': 120, 'completata': False},
                {'titolo': 'Testing e Launch', 'giorni': 180, 'completata': False},
            ]
        },
        {
            'titolo': 'Evento Fan Day 2024',
            'descrizione': 'Organizzazione evento Fan Day con attivazioni sponsor e intrattenimento',
            'sponsor_idx': 2,
            'contract_idx': 2,
            'data_inizio': -20,
            'data_fine': 25,
            'budget': 8000,
            'status': 'in_corso',
            'team': ['Event Manager', 'Staff Operativo'],
            'milestones': [
                {'titolo': 'Planning e Location', 'giorni': 5, 'completata': True},
                {'titolo': 'Accordi Sponsor e Fornitori', 'giorni': 15, 'completata': True},
                {'titolo': 'Setup e Preparazione', 'giorni': 23, 'completata': False},
                {'titolo': 'Esecuzione Evento', 'giorni': 25, 'completata': False},
            ]
        }
    ]

    projects = []
    for proj_data in projects_data:
        sponsor = sponsors[proj_data['sponsor_idx']]
        contract = contracts[proj_data['contract_idx']]

        project = Project(
            club_id=club.id,
            sponsor_id=sponsor.id,
            contract_id=contract.id,
            titolo=proj_data['titolo'],
            descrizione=proj_data['descrizione'],
            data_inizio=datetime.now() + timedelta(days=proj_data['data_inizio']),
            data_fine_prevista=datetime.now() + timedelta(days=proj_data['data_fine']),
            budget_totale=proj_data['budget'],
            status=proj_data['status'],
            team_members=proj_data['team'],
            visibile_sponsor=True
        )
        db.session.add(project)
        db.session.flush()

        # Crea milestone
        for ms_data in proj_data['milestones']:
            milestone = ProjectMilestone(
                project_id=project.id,
                titolo=ms_data['titolo'],
                descrizione=f"Milestone importante per {proj_data['titolo']}",
                data_scadenza=datetime.now() + timedelta(days=ms_data['giorni']),
                completata=ms_data['completata'],
                data_completamento=datetime.now() if ms_data['completata'] else None
            )
            db.session.add(milestone)

        projects.append(project)
        print(f"  ✅ {project.titolo}")

    db.session.commit()
    print(f"✅ Creati {len(projects)} progetti")
    return projects


def create_demo_budgets(club, sponsors, contracts):
    """Crea budget e transazioni"""

    print("\n💰 Creazione budget...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]
    contracts = [HeadOfTerms.query.get(c.id) for c in contracts]

    # Crea budget principale club
    budget = Budget(
        club_id=club.id,
        nome='Budget Sponsorizzazioni 2024/25',
        descrizione='Budget principale per gestione sponsorizzazioni stagione corrente',
        anno_fiscale=2024,
        budget_totale=400000.00,
        budget_allocato=395000.00,
        budget_speso=125000.00,
        status='attivo',
        data_inizio=datetime.now() - timedelta(days=60),
        data_fine=datetime.now() + timedelta(days=305)
    )
    db.session.add(budget)
    db.session.flush()

    # Crea categorie budget
    categories = [
        {'nome': 'Asset Attivazione', 'budget': 150000, 'speso': 45000},
        {'nome': 'Eventi e Hospitality', 'budget': 80000, 'speso': 25000},
        {'nome': 'Marketing e Comunicazione', 'budget': 70000, 'speso': 20000},
        {'nome': 'Digitale e Tech', 'budget': 60000, 'speso': 25000},
        {'nome': 'Altro', 'budget': 35000, 'speso': 10000},
    ]

    for cat_data in categories:
        cat = BudgetCategory(
            budget_id=budget.id,
            nome=cat_data['nome'],
            budget_allocato=cat_data['budget'],
            budget_speso=cat_data['speso']
        )
        db.session.add(cat)

    # Crea alcune spese
    expenses_data = [
        {'descrizione': 'Installazione LED stadio', 'importo': 15000, 'giorni_fa': 45},
        {'descrizione': 'Produzione divise gara', 'importo': 8000, 'giorni_fa': 30},
        {'descrizione': 'Catering evento inaugurazione', 'importo': 3500, 'giorni_fa': 25},
        {'descrizione': 'Campagna social media Q1', 'importo': 5000, 'giorni_fa': 20},
        {'descrizione': 'Sviluppo app mobile - Fase 1', 'importo': 12000, 'giorni_fa': 10},
    ]

    for exp_data in expenses_data:
        expense = Expense(
            budget_id=budget.id,
            descrizione=exp_data['descrizione'],
            importo=exp_data['importo'],
            data_spesa=datetime.now() - timedelta(days=exp_data['giorni_fa']),
            stato='approvata'
        )
        db.session.add(expense)

    # Crea entrate (pagamenti sponsor)
    for idx, contract in enumerate(contracts[:5]):
        payment = Payment(
            budget_id=budget.id,
            contract_id=contract.id,
            sponsor_id=contract.sponsor_id,
            importo=contract.compenso / 2,  # Prima rata
            tipo='bonifico',
            data_pagamento=datetime.now() - timedelta(days=random.randint(30, 60)),
            stato='completato',
            descrizione=f'Pagamento prima rata {contract.nome_contratto}'
        )
        db.session.add(payment)

    db.session.commit()
    print(f"✅ Budget creato con categorie, spese e entrate")
    return budget


def create_demo_marketplace(club, sponsors):
    """Crea opportunità marketplace"""

    print("\n🛒 Creazione marketplace opportunità...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    opportunities_data = [
        {
            'titolo': 'Co-Marketing Campagna Estiva 2024',
            'descrizione': '''Opportunità di co-marketing per campagna estiva sui social media.

Cerchiamo partner nel settore food & beverage per:
- Campagna Instagram/TikTok congiunta
- Contest e giveaway coordinati
- Cross-promotion sui canali digitali
- Evento lancio estivo

Budget indicativo: €5.000-€8.000
Durata: Giugno-Agosto 2024''',
                'tipo': 'co-marketing',
                'settori': ['food', 'beverage', 'lifestyle'],
                'budget_min': 5000,
                'budget_max': 8000,
                'data_inizio': 60,
                'data_fine': 150,
                'creato_da_idx': 0,
                'status': 'aperta',
                'pubblicata': True
            },
            {
                'titolo': 'Partnership Merchandising Co-Branded',
                'descrizione': '''Cerchiamo partner per linea merchandising co-branded.

Dettagli:
- Produzione linea abbigliamento lifestyle club
- Co-design con sponsor tech/fashion
- Vendita online e in-store
- Revenue sharing 50/50

Investimento stimato: €10.000-€15.000''',
                'tipo': 'product',
                'settori': ['fashion', 'tech', 'retail'],
                'budget_min': 10000,
                'budget_max': 15000,
                'data_inizio': 30,
                'data_fine': 365,
                'creato_da_idx': 2,
                'status': 'aperta',
                'pubblicata': True
            },
            {
                'titolo': 'Sponsor Charity Match per Beneficenza',
                'descrizione': '''Evento charity con partita amichevole e raccolta fondi.

Cerchiamo sponsor per:
- Main sponsor evento
- Stand promozionali
- Visibility sui media locali
- Coinvolgimento community

Budget: €3.000-€5.000''',
                'tipo': 'event',
                'settori': ['tutti'],
                'budget_min': 3000,
                'budget_max': 5000,
                'data_inizio': 45,
                'data_fine': 46,
                'creato_da_idx': None,  # Club
                'status': 'aperta',
                'pubblicata': True
            }
        ]

        opportunities = []
        for opp_data in opportunities_data:
            if opp_data['creato_da_idx'] is not None:
                creator_type = 'sponsor'
                creator_id = sponsors[opp_data['creato_da_idx']].id
            else:
                creator_type = 'club'
                creator_id = club.id

            opp = MarketplaceOpportunity(
                club_id=club.id,
                creatore_type=creator_type,
                creatore_id=creator_id,
                titolo=opp_data['titolo'],
                descrizione=opp_data['descrizione'],
                tipo_opportunita=opp_data['tipo'],
                settori_interesse=opp_data['settori'],
                budget_min=opp_data['budget_min'],
                budget_max=opp_data['budget_max'],
                data_inizio_proposta=datetime.now() + timedelta(days=opp_data['data_inizio']),
                data_fine_proposta=datetime.now() + timedelta(days=opp_data['data_fine']),
                status=opp_data['status'],
                pubblicata=opp_data['pubblicata'],
                data_pubblicazione=datetime.now() - timedelta(days=random.randint(5, 15)),
                view_count=random.randint(10, 50)
            )
            db.session.add(opp)
            db.session.flush()

            # Aggiungi 1-2 applicazioni
            if random.choice([True, False]):
                for applicant_sponsor in sponsors[:2]:
                    if creator_type == 'sponsor' and applicant_sponsor.id == creator_id:
                        continue

                    application = OpportunityApplication(
                        opportunity_id=opp.id,
                        sponsor_id=applicant_sponsor.id,
                        messaggio_candidatura=f'Siamo interessati a questa opportunità. Abbiamo esperienza nel settore e crediamo di poter creare una partnership di successo.',
                        budget_proposto=(opp_data['budget_min'] + opp_data['budget_max']) / 2,
                        status='in_valutazione'
                    )
                    db.session.add(application)

            opportunities.append(opp)
            print(f"  ✅ {opp.titolo}")

        db.session.commit()
        print(f"✅ Creati {len(opportunities)} opportunità marketplace")
        return opportunities


def create_demo_partnerships(sponsors):
    """Crea partnership tra sponsor"""

    print("\n🤝 Creazione partnership sponsor...")

    # Ricarica dalla sessione
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    partnerships_data = [
        {
            'sponsor_from_idx': 0,  # TechVision
            'sponsor_to_idx': 2,    # SportMax
            'tipo': 'co-marketing',
            'titolo': 'App Mobile con E-Commerce Integrato',
            'descrizione': 'Partnership per integrare e-commerce SportMax nell\'app FC Stellamare sviluppata da TechVision',
            'budget': 8000,
            'data_inizio': -15,
            'durata_mesi': 12,
            'status': 'accepted'
        },
        {
            'sponsor_from_idx': 1,  # Banca Riviera
            'sponsor_to_idx': 3,    # Delizie
            'tipo': 'cross-promotion',
            'titolo': 'Promo Incrociata Clienti Premium',
            'descrizione': 'Offerte dedicate ai clienti premium Banca Riviera presso punti vendita Delizie del Gusto',
            'budget': 5000,
            'data_inizio': -30,
            'durata_mesi': 6,
            'status': 'accepted'
        }
    ]

    partnerships = []
    for part_data in partnerships_data:
        sponsor_from = sponsors[part_data['sponsor_from_idx']]
        sponsor_to = sponsors[part_data['sponsor_to_idx']]

        # Crea prima la proposta
        proposal = PartnershipProposal(
            sponsor_mittente_id=sponsor_from.id,
            sponsor_destinatario_id=sponsor_to.id,
            tipo_partnership=part_data['tipo'],
            titolo=part_data['titolo'],
            descrizione=part_data['descrizione'],
            budget_proposto=part_data['budget'],
            durata_mesi=part_data['durata_mesi'],
            status=part_data['status'],
            data_invio=datetime.now() + timedelta(days=part_data['data_inizio']),
            data_risposta=datetime.now() + timedelta(days=part_data['data_inizio'] + 3)
        )
        db.session.add(proposal)
        db.session.flush()

        # Crea la partnership se accettata
        if part_data['status'] == 'accepted':
            partnership = Partnership(
                sponsor1_id=sponsor_from.id,
                sponsor2_id=sponsor_to.id,
                tipo=part_data['tipo'],
                titolo=part_data['titolo'],
                descrizione=part_data['descrizione'],
                budget_totale=part_data['budget'],
                data_inizio=datetime.now() + timedelta(days=part_data['data_inizio']),
                data_fine=datetime.now() + timedelta(days=part_data['data_inizio'] + part_data['durata_mesi'] * 30),
                status='attiva',
                visibilita_pubblica=True
            )
            db.session.add(partnership)
            partnerships.append(partnership)

    db.session.commit()
    print(f"✅ Creati {len(partnerships)} partnership")
    return partnerships


def create_demo_notifications(club, sponsors):
    """Crea notifiche di sistema"""

    print("\n🔔 Creazione notifiche...")

    # Ricarica dalla sessione
    club = Club.query.get(club.id)
    sponsors = [Sponsor.query.get(s.id) for s in sponsors]

    notifications = []

    # Notifiche per club
    club_notifs = [
        {
            'titolo': 'Nuovo messaggio da TechVision Solutions',
            'messaggio': 'Hai ricevuto un nuovo messaggio riguardo al contratto Main Sponsor',
            'tipo': 'message',
            'priorita': 'normale',
            'giorni_fa': 2,
            'letta': False
        },
        {
            'titolo': 'Scadenza milestone progetto',
            'messaggio': 'La milestone "Q2 Content Production" è in scadenza tra 5 giorni',
            'tipo': 'project',
            'priorita': 'alta',
            'giorni_fa': 1,
            'letta': False
        },
        {
            'titolo': 'Nuovo sponsor registrato',
            'messaggio': 'AutoElite Motors ha completato la registrazione',
            'tipo': 'sponsor',
            'priorita': 'normale',
            'giorni_fa': 30,
            'letta': True
        }
    ]

    for notif_data in club_notifs:
        notif = Notification(
            user_type='club',
            user_id=club.id,
            titolo=notif_data['titolo'],
            messaggio=notif_data['messaggio'],
            tipo=notif_data['tipo'],
            priorita=notif_data['priorita'],
            letta=notif_data['letta'],
            data_lettura=datetime.now() - timedelta(days=notif_data['giorni_fa']) if notif_data['letta'] else None,
            created_at=datetime.now() - timedelta(days=notif_data['giorni_fa'])
        )
        db.session.add(notif)
        notifications.append(notif)

    # Notifiche per sponsor (TechVision)
    sponsor_notifs = [
        {
            'sponsor_idx': 0,
            'titolo': 'Nuova attivazione confermata',
            'messaggio': 'Il club ha confermato l\'attivazione LED per la prossima partita',
            'tipo': 'activation',
            'priorita': 'normale',
            'giorni_fa': 3,
            'letta': False
        },
        {
            'sponsor_idx': 0,
            'titolo': 'Invito business box inviato',
            'messaggio': 'I tuoi ospiti hanno ricevuto l\'invito per la partita di domenica',
            'tipo': 'box_invite',
            'priorita': 'normale',
            'giorni_fa': 5,
            'letta': True
        }
    ]

    for notif_data in sponsor_notifs:
        sponsor = sponsors[notif_data['sponsor_idx']]
        notif = Notification(
            user_type='sponsor',
            user_id=sponsor.id,
            titolo=notif_data['titolo'],
            messaggio=notif_data['messaggio'],
            tipo=notif_data['tipo'],
            priorita=notif_data['priorita'],
            letta=notif_data['letta'],
            data_lettura=datetime.now() - timedelta(days=notif_data['giorni_fa']) if notif_data['letta'] else None,
            created_at=datetime.now() - timedelta(days=notif_data['giorni_fa'])
        )
        db.session.add(notif)
        notifications.append(notif)

    db.session.commit()
    print(f"✅ Creati {len(notifications)} notifiche")
    return notifications


def main():
    """Esegue la creazione completa dei dati demo"""
    print("=" * 60)
    print("🚀 CREAZIONE DATI DEMO - FC STELLAMARE")
    print("=" * 60)

    # Pulizia dati esistenti
    # clear_demo_data()

    # Ottieni admin esistente
    admin = Admin.query.first()
    if not admin:
        print("❌ Nessun admin trovato! Esegui prima create_admin.py")
        return
    print(f"✅ Admin trovato: {admin.username}")

    # 1. Crea club
    club = create_demo_club()

    # 2. Crea sponsor
    sponsors = create_demo_sponsors(club)

    # 3. Crea contratti con asset e checklist
    contracts = create_demo_contracts(club, sponsors)

    # 4. Crea partite con attivazioni
    matches = create_demo_matches(club, contracts)

    # 5. Crea eventi
    events = create_demo_events(club, sponsors)

    # 6. Crea business box e inviti
    boxes, invites = create_demo_business_boxes(club, sponsors, matches)

    # 7. Crea messaggi
    messages = create_demo_messages(club, sponsors)

    # 8. Crea comunicati stampa
    publications = create_demo_press_publications(club, sponsors)

    # 9. Crea eventi best practice
    bp_events = create_demo_best_practice_events(admin.id)

    # 10. Crea risorse portale
    categories, resources = create_demo_resources(admin.id)

    # 11. Crea progetti
    projects = create_demo_projects(club, sponsors, contracts)

    # 12. Crea budget
    budget = create_demo_budgets(club, sponsors, contracts)

    # 13. Crea opportunità marketplace
    opportunities = create_demo_marketplace(club, sponsors)

    # 14. Crea partnership
    partnerships = create_demo_partnerships(sponsors)

    # 15. Crea notifiche
    notifications = create_demo_notifications(club, sponsors)

    print("\n" + "=" * 60)
    print("✅ DATI DEMO CREATI CON SUCCESSO!")
    print("=" * 60)
    print(f"""
📊 RIEPILOGO DATI CREATI:

Club:           1 (FC Stellamare)
Sponsor:        {len(sponsors)}
Contratti:      {len(contracts)}
Partite:        {len(matches)}
Eventi:         {len(events)}
Business Box:   {len(boxes)}
Inviti Box:     {len(invites)}
Messaggi:       {len(messages)}
Comunicati:     {len(publications)}
BP Events:      {len(bp_events)}
Risorse:        {len(resources)}
Progetti:       {len(projects)}
Opportunità:    {len(opportunities)}
Partnership:    {len(partnerships)}
Notifiche:      {len(notifications)}

🔐 CREDENZIALI ACCESSO:

CLUB:
Email: info@fcstellamare.it
Password: stellamare2024

SPONSOR (TechVision):
Email: sponsor@techvision.it
Password: techvision2024

SPONSOR (Banca Riviera):
Email: marketing@bancariviera.it
Password: bancariviera2024

SPONSOR (SportMax):
Email: partnership@sportmax.it
Password: sportmax2024

SPONSOR (Delizie del Gusto):
Email: marketing@deliziedegusto.it
Password: delizie2024

SPONSOR (AutoElite):
Email: info@autoelitemotors.it
Password: autoelite2024

ADMIN:
Username: admin
Password: admin123
""")
    print("=" * 60)


if __name__ == '__main__':
    main()
