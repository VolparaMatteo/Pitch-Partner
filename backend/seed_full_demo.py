#!/usr/bin/env python3
"""
🚀 SCRIPT DI SEED COMPLETO PER PITCH PARTNER
Questo script resetta il database e popola TUTTE le tabelle con dati realistici
per una demo completa e "perfetta".

ENTITÀ GENERATE:
- 10 Club (incluso "Club Demo")
- 50 Sponsor (distribuiti tra i club)
- Admin
- Contratti, Asset, Checklist
- Partite, Attivazioni
- Eventi (Passati, Futuri)
- Marketplace Opportunities & Applications
- Leads
- Risorse & Best Practices
- Messaggi & Notifiche
"""

from app import create_app, db
from app.models import *
from datetime import datetime, timedelta
import random
import uuid

# --- CONFIGURAZIONE ---
NUM_CLUBS = 10
NUM_SPONSORS = 50
NUM_LEADS_PER_CLUB = 5
NUM_MATCHES_PER_CLUB = 20  # 10 casa, 10 trasferta roughly
YEAR = 2024

# --- DATI DI PARTENZA ---
CITIES = ["Milano", "Roma", "Torino", "Napoli", "Firenze", "Bologna", "Genova", "Verona", "Bari", "Palermo"]
CLUB_ADJECTIVES = ["FC", "AC", "Real", "United", "Sporting", "Virtus", "Olympia", "Dinamo", "Atletico", "Pro"]
SECTORS = [
    "Informatica e Tecnologia", "Servizi Finanziari", "Automotive", "Alimentare e Bevande", 
    "Abbigliamento Sportivo", "Edilizia", "Energia", "Telecomunicazioni", "Turismo", "Salute"
]
COMPANY_SUFFIXES = ["S.r.l.", "S.p.A.", "Group", "Italia", "Solutions", "Systems"]

# Predefined names for variety
FIRST_NAMES = ["Marco", "Laura", "Giulia", "Alessandro", "Roberto", "Stefano", "Francesca", "Paolo", "Elena", "Davide", "Chiara", "Luca"]
LAST_NAMES = ["Rossi", "Bianchi", "Verdi", "Russo", "Ferrari", "Esposito", "Romano", "Colombo", "Ricci", "Marino", "Greco", "Bruno"]

def get_random_date(start_days_ago=365, end_days_ahead=365):
    days = random.randint(-start_days_ago, end_days_ahead)
    return datetime.now() + timedelta(days=days)

def generate_company_name():
    prefixes = ["Tech", "Global", "Nova", "Eco", "Smart", "Future", "Prime", "Elite", "Super", "Master"]
    roots = ["Soft", "Bank", "Car", "Food", "Wear", "Build", "Power", "Tel", "Travel", "Care"]
    return f"{random.choice(prefixes)}{random.choice(roots)} {random.choice(COMPANY_SUFFIXES)}"

def main():
    app = create_app()
    with app.app_context():
        print("🔴 ATTENZIONE: Questo script cancellerà TUTTI i dati nel database.")
        print("⏳ Inizio reset database...")
        
        # Reset totale
        db.drop_all()
        db.create_all()
        print("✅ Database resettato.")

        # ---------------------------------------
        # 1. ADMIN
        # ---------------------------------------
        print("\n👮 Creazione Admin...")
        admin = Admin(username="admin", email="admin@pitchpartner.com")
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin creato: admin / admin123")

        # ---------------------------------------
        # 2. CLUBS
        # ---------------------------------------
        print(f"\n⚽ Creazione {NUM_CLUBS} Club...")
        clubs = []
        
        # Club Demo Principale
        demo_club = Club(
            nome="Club Demo",
            tipologia="Calcio",
            email="club@demo.com",
            indirizzo_sede_legale="Via della Demo 1, Milano",
            indirizzo_sede_operativa="Stadio Demo, Via Sport 10, Milano",
            telefono="+39 02 0000000",
            sito_web="https://www.clubdemo.it",
            referente_nome="Mario",
            referente_cognome="Rossi",
            referente_ruolo="General Manager",
            numero_tesserati=1000,
            categoria_campionato="Serie B",
            facebook="https://fb.com/clubdemo",
            pubblico_medio=5000,
            nome_abbonamento="Premium",
            costo_abbonamento=499.00,
            tipologia_abbonamento="annuale",
            data_scadenza_licenza=datetime.now() + timedelta(days=365),
            account_attivo=True
        )
        demo_club.set_password("password") # Credenziali richieste
        db.session.add(demo_club)
        clubs.append(demo_club)

        # Altri Club Generati
        for i in range(NUM_CLUBS - 1):
            city = CITIES[i % len(CITIES)]
            name = f"{random.choice(CLUB_ADJECTIVES)} {city}"
            club = Club(
                nome=name,
                tipologia="Calcio",
                email=f"info@{name.lower().replace(' ', '')}.it",
                indirizzo_sede_legale=f"Corso {city} {random.randint(1,100)}, {city}",
                telefono=f"+39 0{i} 1234567",
                referente_nome=random.choice(FIRST_NAMES),
                referente_cognome=random.choice(LAST_NAMES),
                referente_ruolo="Presidente",
                numero_tesserati=random.randint(200, 2000),
                categoria_campionato=random.choice(["Serie A", "Serie B", "Serie C", "Eccellenza"]),
                account_attivo=True
            )
            club.set_password("password")
            db.session.add(club)
            clubs.append(club)
        
        db.session.commit()
        print(f"✅ {len(clubs)} Club creati. Club Demo ID: {demo_club.id}")

        # ---------------------------------------
        # 3. SPONSORS
        # ---------------------------------------
        print(f"\n🏢 Creazione {NUM_SPONSORS} Sponsor...")
        sponsors = []
        
        # Assegnazione sponsor ai club: Club Demo ne prende di più
        club_ids_pool = [demo_club.id] * 15 # 15 sponsor per il demo
        for c in clubs[1:]:
             club_ids_pool.extend([c.id] * 4) # ~4 per gli altri (totale ~51)
        
        for i in range(NUM_SPONSORS):
            company_name = generate_company_name()
            sector = random.choice(SECTORS)
            assigned_club_id = club_ids_pool[i] if i < len(club_ids_pool) else demo_club.id
            
            # Email specifica per il primo sponsor del club demo per test facilitato
            email = f"sponsor{i+1}@test.com"
            if assigned_club_id == demo_club.id and i == 0:
                email = "sponsor@demo.com" # Credenziale nota

            sponsor = Sponsor(
                club_id=assigned_club_id,
                ragione_sociale=company_name,
                partita_iva=f"{random.randint(10000000000, 99999999999)}",
                codice_fiscale=f"{random.randint(10000000000, 99999999999)}",
                settore_merceologico=sector,
                indirizzo_sede=f"Via Industria {random.randint(1,99)}, {CITIES[i % len(CITIES)]}",
                email=email,
                telefono=f"+39 333 {random.randint(1000000, 9999999)}",
                sito_web=f"https://www.{company_name.lower().replace(' ', '').replace('.', '')}.com",
                referente_nome=random.choice(FIRST_NAMES),
                referente_cognome=random.choice(LAST_NAMES),
                referente_ruolo="Marketing Director",
                account_attivo=True
            )
            sponsor.set_password("password")
            db.session.add(sponsor)
            
            # Profilo Network
            profile = SponsorProfile(
                sponsor=sponsor,
                descrizione_pubblica=f"Siamo {company_name}, leader nel settore {sector}.",
                dimensione_azienda=random.choice(["PMI", "Grande Impresa", "Startup"]),
                target_audience=random.choice(["B2B", "B2C", "B2B2C"]),
                anno_fondazione=random.randint(1980, 2020),
                interesse_eventi_congiunti=True,
                visibile_rete_sponsor=True
            )
            db.session.add(profile)
            sponsors.append(sponsor)

        db.session.commit()
        print(f"✅ {len(sponsors)} Sponsor creati. Sponsor Demo: sponsor@demo.com")

        # ---------------------------------------
        # 4. CONTRATTI & ASSET
        # ---------------------------------------
        print("\n📝 Creazione Contratti e Asset...")
        contracts = []
        for sponsor in sponsors:
            # 80% chance di avere un contratto
            if random.random() > 0.2:
                # Determina status
                status = random.choice(['attivo', 'attivo', 'attivo', 'scaduto', 'bozza'])
                start_date = get_random_date(start_days_ago=100, end_days_ahead=0)
                end_date = start_date + timedelta(days=365)
                
                contract_name = f"Partnership {YEAR}-{YEAR+1}"
                if random.random() > 0.7:
                    contract_name = f"Main Sponsorship {YEAR}"
                
                contract = HeadOfTerms(
                    club_id=sponsor.club_id,
                    sponsor_id=sponsor.id,
                    nome_contratto=contract_name,
                    compenso=random.choice([10000, 25000, 50000, 100000, 250000]),
                    data_inizio=start_date,
                    data_fine=end_date,
                    descrizione=f"Contratto di sponsorizzazione {status} con {sponsor.ragione_sociale}",
                    status=status
                )
                db.session.add(contract)
                db.session.flush() # Per avere ID
                contracts.append(contract)

                # Assets per contratto
                asset_types = ['LED', 'Maglia', 'Social', 'Hospitality', 'Sito Web']
                num_assets = random.randint(2, 5)
                for _ in range(num_assets):
                    atype = random.choice(asset_types)
                    asset = Asset(
                        head_of_terms_id=contract.id,
                        categoria=atype,
                        nome=f"{atype} - Pacchetto {random.choice(['Gold', 'Silver', 'Standard'])}",
                        quantita_totale=random.randint(1, 20),
                        quantita_utilizzata=random.randint(0, 5),
                        valore=contract.compenso / num_assets,
                        status='in_corso' if status == 'attivo' else 'da_consegnare'
                    )
                    db.session.add(asset)

                # Checklists
                check_tasks = ["Invio Logo Vettoriale", "Approvazione Bozza", "Pagamento Acconto", "Consegna Materiali"]
                for task_name in check_tasks:
                    checklist = Checklist(
                        head_of_terms_id=contract.id,
                        titolo=task_name,
                        assegnato_a=random.choice(['club', 'sponsor']),
                        completato=random.choice([True, False]) if status == 'attivo' else False,
                        creato_da='club',
                        priorita=random.choice(['alta', 'media', 'bassa'])
                    )
                    db.session.add(checklist)

        db.session.commit()
        print(f"✅ {len(contracts)} Contratti creati.")

        # ---------------------------------------
        # 5. PARTITE & ATTIVAZIONI (Solo Club Demo per dettaglio)
        # ---------------------------------------
        print("\n🏟️ Creazione Partite e Attivazioni (Club Demo)...")
        opponents = [c.nome for c in clubs if c.id != demo_club.id] + ["FC Rival", "AC Enemy"]
        
        matches = []
        # Genera calendario stagionale (da -2 mesi a +4 mesi)
        base_date = datetime.now() - timedelta(days=60)
        for i in range(20): # 20 partite
            match_date = base_date + timedelta(days=i*7) # Una a settimana
            opponent = opponents[i % len(opponents)]
            is_home = i % 2 == 0
            
            # Status
            status = 'programmata'
            result_home = None
            result_away = None
            
            if match_date < datetime.now():
                status = 'conclusa'
                result_home = random.randint(0, 4)
                result_away = random.randint(0, 4)
            
            match = Match(
                club_id=demo_club.id,
                data_ora=match_date,
                avversario=opponent,
                competizione="Serie B",
                luogo='casa' if is_home else 'trasferta',
                stadio="Stadio Demo" if is_home else f"Stadio {opponent}",
                status=status,
                risultato_casa=result_home,
                risultato_trasferta=result_away
            )
            db.session.add(match)
            db.session.flush()
            matches.append(match)

            # Attivazioni per partite in casa
            if is_home:
                active_contracts = [c for c in contracts if c.club_id == demo_club.id and c.status == 'attivo']
                if active_contracts:
                    # Crea 2-3 attivazioni per partita
                    for _ in range(random.randint(2, 4)):
                        contract = random.choice(active_contracts)
                        activation = Activation(
                            match_id=match.id,
                            contract_id=contract.id,
                            tipo=random.choice(['LED', 'Hospitality', 'Speaker', 'Stand']),
                            descrizione=f"Attivazione standard per {contract.nome_contratto}",
                            stato='eseguita' if status == 'conclusa' else 'pianificata',
                            eseguita=status == 'conclusa'
                        )
                        db.session.add(activation)

        db.session.commit()
        print(f"✅ {len(matches)} Partite create per Club Demo.")

        # ---------------------------------------
        # 6. EVENTI
        # ---------------------------------------
        print("\n📅 Creazione Eventi...")
        event_titles = ["Cena di Natale", "Presentazione Maglia", "Workshop B2B", "Meet & Greet Giocatori"]
        club_demo_sponsors = [s for s in sponsors if s.club_id == demo_club.id]
        
        for i in range(5):
            evt_date = get_random_date(-30, 60)
            evt = Event(
                club_id=demo_club.id,
                titolo=event_titles[i % len(event_titles)],
                tipo=random.choice(['brand_event', 'networking', 'presentazione_commerciale']),
                data_ora_inizio=evt_date,
                data_ora_fine=evt_date + timedelta(hours=3),
                luogo="Sede Club Demo",
                descrizione="Evento esclusivo per i partner.",
                creato_da_tipo='club',
                creato_da_id=demo_club.id,
                creato_da_nome=demo_club.nome,
                status='confermato' if evt_date > datetime.now() else 'concluso',
                visibile_a='tutti'
            )
            db.session.add(evt)
            db.session.flush()

            # Invitations
            if club_demo_sponsors:
                 for s in random.sample(club_demo_sponsors, min(5, len(club_demo_sponsors))):
                     inv = EventInvitation(event_id=evt.id, sponsor_id=s.id)
                     db.session.add(inv)

        db.session.commit()
        print("✅ Eventi creati.")

        # ---------------------------------------
        # 7. LEADS
        # ---------------------------------------
        print("\n🎯 Creazione Leads...")
        lead_sources = ['LinkedIn', 'Sito Web', 'Referral', 'Evento']
        statuses = ['nuovo', 'contattato', 'in_trattativa', 'vinto', 'perso']
        
        for i in range(NUM_LEADS_PER_CLUB):
            company_name = generate_company_name()
            lead = Lead(
                club_id=demo_club.id,
                ragione_sociale=company_name,
                settore_merceologico=random.choice(SECTORS),
                referente_nome=random.choice(FIRST_NAMES),
                referente_cognome=random.choice(LAST_NAMES),
                email=f"contact@{company_name.lower().replace(' ', '')}.com",
                status=random.choice(statuses),
                fonte=random.choice(lead_sources),
                probabilita_chiusura=random.randint(10, 90),
                valore_stimato=random.randint(5000, 50000)
            )
            db.session.add(lead)
        
        db.session.commit()
        print("✅ Leads creati.")

        # ---------------------------------------
        # 8. MARKETPLACE
        # ---------------------------------------
        print("\n🛒 Creazione Marketplace...")
        
        market_categories = ["sport", "digital", "eventi", "social", "csr", "esports"]
        market_types = ["main_sponsor", "technical_partner", "co_branding", "naming_rights", "official_supplier", "media_partner"]
        
        # Generiamo ~60 opportunità miste
        for i in range(60):
            is_club_creator = random.choice([True, False])
            
            if is_club_creator:
                creator_type = 'club'
                creator_id = random.choice(clubs).id
                title = f"Sponsorizzazione {random.choice(['Maglia', 'Stadio', 'SETTORE GIOVANILE', 'EVENTO', 'DIGITAL'])} - {random.randint(2024, 2025)}"
                desc = f"Il club cerca partner per {title.lower()}. Grande visibilità e opportunità di attivazione."
            else:
                creator_type = 'sponsor'
                creator_id = random.choice(sponsors).id
                title = f"Proposta Partnership {random.choice(['Tecnologica', 'Food & Beverage', 'Mobilità', 'Green'])}"
                desc = f"Azienda leader nel settore cerca club partner per progetto innovativo di {random.choice(['sostenibilità', 'fan engagement', 'digital transformation'])}."

            opp = MarketplaceOpportunity(
                creator_type=creator_type,
                creator_id=creator_id,
                titolo=title,
                descrizione=desc,
                tipo_opportunita=random.choice(market_types),
                categoria=random.choice(market_categories),
                budget_richiesto=random.choice([5000, 10000, 25000, 50000, 100000, 0]),
                stato='pubblicata', # Importante: pubblicata
                visibilita='pubblica', # Importante: visibile a tutti
                data_inizio=datetime.now(),
                data_fine=datetime.now() + timedelta(days=random.randint(30, 180))
            )
            db.session.add(opp)
            
            # Aggiungiamo qualche candidatura (Application) random
            if random.random() > 0.7:
                applicant_type = 'sponsor' if creator_type == 'club' else 'club'
                applicant_id = random.choice(sponsors).id if applicant_type == 'sponsor' else random.choice(clubs).id
                
                app = OpportunityApplication(
                    opportunity=opp,
                    applicant_type=applicant_type,
                    applicant_id=applicant_id,
                    messaggio_candidatura="Siamo molto interessati a questa opportunità.",
                    proposta_budget=opp.budget_richiesto,
                    stato='in_valutazione'
                )
                db.session.add(app)
        
        db.session.commit()
        print("✅ 60+ Opportunità Marketplace create (Visibili a tutta la community).")

        # ---------------------------------------
        # 9. RISORSE & PRESS FEED
        # ---------------------------------------
        print("\n📚 Creazione Risorse e Press...")
        # Categoria Risorse
        cat_marketing = ResourceCategory(nome="Marketing", slug="marketing", icona="📢")
        db.session.add(cat_marketing)
        db.session.flush()

        res = Resource(
            titolo="Guida alla Sponsorizzazione 2024",
            slug="guida-2024",
            descrizione="Tutto quello che devi sapere sulle sponsorizzazioni.",
            tipo_risorsa="guida",
            category_id=cat_marketing.id,
            file_tipo="pdf",
            visibilita="public",
            autore="Pitch Admin"
        )
        db.session.add(res)

        # Press Feed Post
        post = PressPublication(
            author_type='club',
            author_id=demo_club.id,
            author_name=demo_club.nome,
            tipo='comunicato',
            titolo="Inizia una nuova era per il Club Demo",
            testo="Siamo felici di annunciare l'inizio della nuova stagione con record di abbonamenti!",
            data_pubblicazione=datetime.now() - timedelta(hours=2),
            visibility='community'
        )
        db.session.add(post)
        
        db.session.commit()
        print("✅ Risorse e Press Feed creati.")

        print("\n" + "="*50)
        print("🚀 SEED COMPLETATO CON SUCCESSO! 🚀")
        print("="*50)
        print("Credenziali per accesso:")
        print("  🔹 Club Demo: club@demo.com / password")
        print("  🔹 Sponsor Demo: sponsor@demo.com / password")
        print("  🔹 Admin: admin / admin123")
        print("="*50)

if __name__ == '__main__':
    main()
