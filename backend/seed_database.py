#!/usr/bin/env python3
"""
Script per popolare il database con dati di test realistici.
- 50 Club sportivi italiani
- 400 Sponsor (aziende italiane)
- 100 Opportunità nel Marketplace
"""

import random
from datetime import datetime, timedelta
from app import create_app, db
from app.models import Club, Sponsor, MarketplaceOpportunity

# ==================== DATI DI BASE ====================

SPORT_TIPOLOGIE = [
    'Calcio', 'Basket', 'Volley', 'Rugby', 'Tennis', 'Nuoto',
    'Atletica', 'Pallamano', 'Hockey', 'Ciclismo'
]

CATEGORIE_CAMPIONATO = {
    'Calcio': ['Serie A', 'Serie B', 'Serie C', 'Serie D', 'Eccellenza', 'Promozione'],
    'Basket': ['Serie A', 'Serie A2', 'Serie B', 'Serie C Gold', 'Serie C Silver'],
    'Volley': ['SuperLega', 'Serie A2', 'Serie A3', 'Serie B', 'Serie C'],
    'Rugby': ['Top10', 'Serie A', 'Serie B', 'Serie C'],
    'Tennis': ['Serie A1', 'Serie A2', 'Serie B', 'Serie C'],
    'Nuoto': ['Serie A1', 'Serie A2', 'Serie B'],
    'Atletica': ['Serie Oro', 'Serie Argento', 'Serie Bronzo'],
    'Pallamano': ['Serie A Gold', 'Serie A Silver', 'Serie B'],
    'Hockey': ['Serie A1', 'Serie A2', 'Serie B'],
    'Ciclismo': ['ProTeam', 'Continental', 'Club']
}

CITTA_ITALIANE = [
    ('Milano', 'MI', 'Lombardia', 45.4642, 9.1900),
    ('Roma', 'RM', 'Lazio', 41.9028, 12.4964),
    ('Napoli', 'NA', 'Campania', 40.8518, 14.2681),
    ('Torino', 'TO', 'Piemonte', 45.0703, 7.6869),
    ('Firenze', 'FI', 'Toscana', 43.7696, 11.2558),
    ('Bologna', 'BO', 'Emilia-Romagna', 44.4949, 11.3426),
    ('Genova', 'GE', 'Liguria', 44.4056, 8.9463),
    ('Venezia', 'VE', 'Veneto', 45.4408, 12.3155),
    ('Verona', 'VR', 'Veneto', 45.4384, 10.9916),
    ('Palermo', 'PA', 'Sicilia', 38.1157, 13.3615),
    ('Catania', 'CT', 'Sicilia', 37.5079, 15.0830),
    ('Bari', 'BA', 'Puglia', 41.1171, 16.8719),
    ('Padova', 'PD', 'Veneto', 45.4064, 11.8768),
    ('Trieste', 'TS', 'Friuli-Venezia Giulia', 45.6495, 13.7768),
    ('Brescia', 'BS', 'Lombardia', 45.5416, 10.2118),
    ('Parma', 'PR', 'Emilia-Romagna', 44.8015, 10.3279),
    ('Modena', 'MO', 'Emilia-Romagna', 44.6471, 10.9252),
    ('Reggio Emilia', 'RE', 'Emilia-Romagna', 44.6989, 10.6297),
    ('Perugia', 'PG', 'Umbria', 43.1107, 12.3908),
    ('Cagliari', 'CA', 'Sardegna', 39.2238, 9.1217),
    ('Livorno', 'LI', 'Toscana', 43.5485, 10.3106),
    ('Ravenna', 'RA', 'Emilia-Romagna', 44.4184, 12.2035),
    ('Ferrara', 'FE', 'Emilia-Romagna', 44.8381, 11.6198),
    ('Rimini', 'RN', 'Emilia-Romagna', 44.0678, 12.5695),
    ('Pescara', 'PE', 'Abruzzo', 42.4618, 14.2161),
    ('Ancona', 'AN', 'Marche', 43.6158, 13.5189),
    ('Salerno', 'SA', 'Campania', 40.6824, 14.7681),
    ('Taranto', 'TA', 'Puglia', 40.4644, 17.2470),
    ('Lecce', 'LE', 'Puglia', 40.3516, 18.1718),
    ('Bergamo', 'BG', 'Lombardia', 45.6983, 9.6773),
    ('Como', 'CO', 'Lombardia', 45.8081, 9.0852),
    ('Udine', 'UD', 'Friuli-Venezia Giulia', 46.0711, 13.2346),
    ('Trento', 'TN', 'Trentino-Alto Adige', 46.0748, 11.1217),
    ('Bolzano', 'BZ', 'Trentino-Alto Adige', 46.4983, 11.3548),
    ('Pisa', 'PI', 'Toscana', 43.7228, 10.4017),
    ('Siena', 'SI', 'Toscana', 43.3188, 11.3308),
    ('Arezzo', 'AR', 'Toscana', 43.4633, 11.8797),
    ('Vicenza', 'VI', 'Veneto', 45.5455, 11.5354),
    ('Treviso', 'TV', 'Veneto', 45.6669, 12.2430),
    ('Novara', 'NO', 'Piemonte', 45.4469, 8.6220),
    ('Alessandria', 'AL', 'Piemonte', 44.9125, 8.6153),
    ('La Spezia', 'SP', 'Liguria', 44.1025, 9.8240),
    ('Sassari', 'SS', 'Sardegna', 40.7259, 8.5556),
    ('Messina', 'ME', 'Sicilia', 38.1938, 15.5540),
    ('Foggia', 'FG', 'Puglia', 41.4621, 15.5444),
    ('Cosenza', 'CS', 'Calabria', 39.3088, 16.2501),
    ('Catanzaro', 'CZ', 'Calabria', 38.9098, 16.5877),
    ('Reggio Calabria', 'RC', 'Calabria', 38.1147, 15.6501),
    ('Latina', 'LT', 'Lazio', 41.4675, 12.9035),
    ('Monza', 'MB', 'Lombardia', 45.5845, 9.2744)
]

SETTORI_MERCEOLOGICI = [
    'Alimentare', 'Automotive', 'Bancario/Finanziario', 'Beverage',
    'Edilizia/Costruzioni', 'Elettronica', 'Energia', 'Farmaceutico',
    'Fashion/Abbigliamento', 'GDO/Retail', 'Immobiliare', 'Informatica/Tech',
    'Logistica/Trasporti', 'Manifatturiero', 'Media/Editoria', 'Ristorazione',
    'Servizi', 'Sport/Fitness', 'Telecomunicazioni', 'Turismo/Hospitality'
]

PREFISSI_AZIENDE = [
    'Gruppo', 'Società', '', '', '', 'Impresa', 'Industrie',
    'Tech', 'Digital', 'Smart', 'Eco', 'Green', 'Italian', 'Euro'
]

SUFFISSI_AZIENDE = [
    'Italia', 'Group', 'Solutions', 'Services', 'Systems',
    'Partners', 'Industries', 'Tech', 'Corp', 'Holding', ''
]

NOMI_BASE_AZIENDE = [
    'Rossi', 'Bianchi', 'Verdi', 'Neri', 'Conti', 'Romano', 'Gallo',
    'Costa', 'Fontana', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri',
    'Santoro', 'Marini', 'Greco', 'Bruno', 'Gatti', 'Leone', 'Serra',
    'Mancini', 'Ricci', 'Longo', 'Gentile', 'Martini', 'Vitale', 'Russo',
    'Alba', 'Aurora', 'Delta', 'Gamma', 'Omega', 'Prima', 'Zenith',
    'Nord', 'Sud', 'Est', 'Ovest', 'Centro', 'Meridian', 'Atlantic',
    'Global', 'Inter', 'Trans', 'Multi', 'Uni', 'Poly', 'Meta'
]

TIPI_OPPORTUNITA = [
    ('evento_speciale', 'Evento Speciale'),
    ('campagna_promozionale', 'Campagna Promozionale'),
    ('progetto_csr', 'Progetto CSR'),
    ('co_branding', 'Co-Branding'),
    ('attivazione_speciale', 'Attivazione Speciale')
]

ASSET_CATEGORIES = [
    'LED Bordocampo', 'Backdrop', 'Maglie Gara', 'Maglie Allenamento',
    'Social Media Post', 'Story Instagram', 'Video Content', 'Newsletter',
    'Biglietti VIP', 'Hospitality', 'Meet & Greet', 'Brand Activation',
    'Naming Rights', 'Sponsor di Maglia', 'Sponsor Tecnico'
]


# ==================== GENERATORI ====================

def genera_email_club(nome, index):
    """Genera email per club"""
    slug = nome.lower().replace(' ', '').replace("'", '')[:15]
    return f"{slug}{index}@club-email.it"


def genera_email_sponsor(ragione_sociale, index):
    """Genera email per sponsor"""
    slug = ragione_sociale.lower().replace(' ', '').replace('.', '')[:15]
    return f"info{index}@{slug}.it"


def genera_nome_azienda():
    """Genera nome azienda casuale"""
    prefisso = random.choice(PREFISSI_AZIENDE)
    nome = random.choice(NOMI_BASE_AZIENDE)
    suffisso = random.choice(SUFFISSI_AZIENDE)

    parts = [p for p in [prefisso, nome, suffisso] if p]
    return ' '.join(parts)


def genera_titolo_opportunita(tipo, sport, citta):
    """Genera titolo opportunità"""
    templates = {
        'evento_speciale': [
            f"Evento {sport} - {citta}",
            f"Torneo {sport} Città di {citta}",
            f"Gran Gala {sport} {citta}",
            f"Meeting {sport} Internazionale",
            f"Derby {citta} - Evento Esclusivo"
        ],
        'campagna_promozionale': [
            f"Campagna Social {sport} {citta}",
            f"Promozione Stagione {random.randint(2024, 2025)}",
            f"Lancio Nuova Stagione {sport}",
            f"Campagna Digital Marketing {citta}",
            f"Brand Awareness {sport}"
        ],
        'progetto_csr': [
            f"Sport per Tutti - {citta}",
            f"Progetto Sociale {sport}",
            f"Inclusione nello Sport",
            f"Scuola {sport} per Bambini",
            f"Sostenibilità e Sport"
        ],
        'co_branding': [
            f"Partnership Esclusiva {citta}",
            f"Co-Branding Premium {sport}",
            f"Collaborazione Strategica",
            f"Brand Partnership {citta}",
            f"Joint Venture {sport}"
        ],
        'attivazione_speciale': [
            f"Attivazione Matchday {citta}",
            f"Fan Experience {sport}",
            f"Hospitality Premium",
            f"VIP Experience {citta}",
            f"Behind the Scenes {sport}"
        ]
    }
    return random.choice(templates.get(tipo, [f"Opportunità {sport} {citta}"]))


def genera_descrizione_opportunita(tipo, sport, budget):
    """Genera descrizione opportunità"""
    intro = random.choice([
        f"Opportunità unica nel mondo del {sport.lower()} italiano.",
        f"Un'occasione imperdibile per associare il tuo brand al {sport.lower()}.",
        f"Visibilità garantita in uno dei settori sportivi più seguiti.",
        f"Partnership strategica nel {sport.lower()} professionistico.",
        f"Esperienza esclusiva nel mondo dello sport."
    ])

    corpo = random.choice([
        f"Offriamo visibilità sui nostri canali social (oltre 50.000 follower), presenza durante gli eventi e attivazioni dedicate.",
        f"Il pacchetto include esposizione LED, presenza sui materiali promozionali e accesso VIP agli eventi.",
        f"Garantiamo copertura mediatica, contenuti esclusivi e opportunità di networking con altri sponsor.",
        f"Possibilità di personalizzare il pacchetto in base alle esigenze del brand partner.",
        f"Pacchetto completo con asset digitali e fisici, supporto marketing dedicato."
    ])

    budget_info = f"Budget indicativo: €{budget:,.0f}" if budget else "Budget da definire insieme"

    return f"{intro}\n\n{corpo}\n\n{budget_info}"


def genera_asset_richiesti():
    """Genera lista asset richiesti"""
    num_assets = random.randint(2, 5)
    assets = []
    selected = random.sample(ASSET_CATEGORIES, num_assets)
    for cat in selected:
        assets.append({
            'categoria': cat,
            'descrizione': f"Richiesta {cat.lower()} per la stagione"
        })
    return assets


def genera_asset_forniti():
    """Genera lista asset forniti"""
    num_assets = random.randint(3, 6)
    assets = []
    selected = random.sample(ASSET_CATEGORIES, num_assets)
    for cat in selected:
        assets.append({
            'categoria': cat,
            'descrizione': f"Fornitura {cat.lower()} inclusa nel pacchetto"
        })
    return assets


# ==================== CREAZIONE DATI ====================

def crea_clubs(num_clubs=50):
    """Crea club sportivi"""
    print(f"\n📍 Creazione {num_clubs} Club...")
    clubs = []

    # Lista nomi club realistici
    prefissi_club = ['AC', 'AS', 'US', 'SS', 'FC', 'ASD', 'Polisportiva', 'GS', 'Virtus', 'Real']

    for i in range(num_clubs):
        citta, provincia, regione, lat, lng = random.choice(CITTA_ITALIANE)
        sport = random.choice(SPORT_TIPOLOGIE)

        # Nome club
        prefisso = random.choice(prefissi_club)
        nome = f"{prefisso} {citta} {sport}" if random.random() > 0.5 else f"{prefisso} {citta}"

        # Evita duplicati
        nome = f"{nome} {i+1}" if i > len(CITTA_ITALIANE) else nome

        # Categoria
        categorie = CATEGORIE_CAMPIONATO.get(sport, ['Serie A', 'Serie B'])

        club = Club(
            nome=nome,
            tipologia=sport,
            email=genera_email_club(nome, i),
            telefono=f"+39 0{random.randint(10,99)} {random.randint(1000000,9999999)}",
            indirizzo_sede_legale=f"Via dello Sport {random.randint(1,100)}, {citta} ({provincia})",
            indirizzo_sede_operativa=f"Centro Sportivo {citta}, {citta}",
            referente_nome=random.choice(['Marco', 'Luca', 'Giovanni', 'Paolo', 'Andrea', 'Matteo']),
            referente_cognome=random.choice(['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Conti']),
            referente_ruolo=random.choice(['Presidente', 'Direttore Generale', 'Responsabile Marketing']),
            numero_tesserati=random.randint(50, 500),
            categoria_campionato=random.choice(categorie),
            pubblico_medio=random.randint(500, 20000),
            account_attivo=True,
            nome_abbonamento='Premium',
            costo_abbonamento=99.0,
            tipologia_abbonamento='annuale',
            data_scadenza_licenza=datetime.utcnow() + timedelta(days=365)
        )
        club.set_password('password123')
        clubs.append(club)

    db.session.add_all(clubs)
    db.session.commit()
    print(f"   ✅ {len(clubs)} club creati")
    return clubs


def crea_sponsors(clubs, num_sponsors=400):
    """Crea sponsor (aziende)"""
    print(f"\n🏢 Creazione {num_sponsors} Sponsor...")
    sponsors = []

    # Pre-genera nomi aziende unici
    nomi_usati = set()

    for i in range(num_sponsors):
        # Genera nome unico
        nome = genera_nome_azienda()
        while nome in nomi_usati:
            nome = genera_nome_azienda()
        nomi_usati.add(nome)

        citta, provincia, regione, lat, lng = random.choice(CITTA_ITALIANE)
        settore = random.choice(SETTORI_MERCEOLOGICI)

        # Assegna a un club casuale (necessario per la FK)
        club = random.choice(clubs)

        sponsor = Sponsor(
            club_id=club.id,
            ragione_sociale=nome,
            partita_iva=f"{random.randint(10000000000, 99999999999)}",
            settore_merceologico=settore,
            email=genera_email_sponsor(nome, i),
            telefono=f"+39 0{random.randint(10,99)} {random.randint(1000000,9999999)}",
            indirizzo_sede=f"Via {random.choice(['Roma', 'Milano', 'Torino', 'Italia'])} {random.randint(1,200)}, {citta}",
            referente_nome=random.choice(['Marco', 'Luca', 'Giovanni', 'Paolo', 'Andrea', 'Maria', 'Laura', 'Giulia']),
            referente_cognome=random.choice(['Rossi', 'Bianchi', 'Verdi', 'Neri', 'Conti', 'Romano']),
            referente_ruolo=random.choice(['CEO', 'Marketing Manager', 'Brand Manager', 'Direttore Commerciale']),
            account_attivo=True
        )
        sponsor.set_password('password123')
        sponsors.append(sponsor)

    db.session.add_all(sponsors)
    db.session.commit()
    print(f"   ✅ {len(sponsors)} sponsor creati")
    return sponsors


def crea_opportunita(clubs, sponsors, num_opps=100):
    """Crea opportunità nel marketplace"""
    print(f"\n🎯 Creazione {num_opps} Opportunità Marketplace...")
    opportunities = []

    for i in range(num_opps):
        # 80% create da club, 20% da sponsor
        if random.random() < 0.8:
            club = random.choice(clubs)
            creator_type = 'club'
            creator_id = club.id
            sport = club.tipologia
        else:
            sponsor = random.choice(sponsors)
            creator_type = 'sponsor'
            creator_id = sponsor.id
            sport = random.choice(SPORT_TIPOLOGIE)

        citta, provincia, regione, lat, lng = random.choice(CITTA_ITALIANE)
        tipo_opp, _ = random.choice(TIPI_OPPORTUNITA)
        budget = random.choice([5000, 10000, 15000, 20000, 25000, 30000, 50000, 75000, 100000, None])

        # Date
        data_inizio = datetime.utcnow() + timedelta(days=random.randint(30, 180))
        data_fine = data_inizio + timedelta(days=random.randint(1, 90))
        deadline = datetime.utcnow() + timedelta(days=random.randint(7, 60))

        opp = MarketplaceOpportunity(
            creator_type=creator_type,
            creator_id=creator_id,
            titolo=genera_titolo_opportunita(tipo_opp, sport, citta),
            descrizione=genera_descrizione_opportunita(tipo_opp, sport, budget),
            tipo_opportunita=tipo_opp,
            categoria=random.choice(['sport', 'business', 'entertainment', 'digital', 'sociale']),
            budget_richiesto=budget,
            asset_richiesti=genera_asset_richiesti(),
            asset_forniti=genera_asset_forniti(),
            numero_sponsor_cercati=random.randint(1, 5),
            data_inizio=data_inizio.date(),
            data_fine=data_fine.date(),
            location=f"{citta}, {provincia}",
            location_city=citta,
            location_province=provincia,
            location_region=regione,
            location_country='Italia',
            location_lat=lat + random.uniform(-0.05, 0.05),  # Leggera variazione
            location_lng=lng + random.uniform(-0.05, 0.05),
            visibilita='pubblica',
            stato='pubblicata',
            deadline_candidature=deadline,
            views_count=random.randint(10, 500),
            applications_count=random.randint(0, 20),
            pubblicata_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
        )
        opportunities.append(opp)

    db.session.add_all(opportunities)
    db.session.commit()
    print(f"   ✅ {len(opportunities)} opportunità create")
    return opportunities


def main():
    """Funzione principale"""
    print("=" * 60)
    print("🚀 SEED DATABASE - Pitch Partner")
    print("=" * 60)

    app = create_app()
    with app.app_context():
        # Conferma eliminazione
        print("\n⚠️  ATTENZIONE: Questo script eliminerà TUTTI i dati esistenti!")
        print("   Verranno creati:")
        print("   - 50 Club")
        print("   - 400 Sponsor")
        print("   - 100 Opportunità Marketplace")

        # Elimina tabelle
        print("\n🗑️  Eliminazione dati esistenti...")
        db.drop_all()
        print("   ✅ Tabelle eliminate")

        # Ricrea tabelle
        print("\n📋 Ricreazione schema database...")
        db.create_all()
        print("   ✅ Schema creato")

        # Crea dati
        clubs = crea_clubs(50)
        sponsors = crea_sponsors(clubs, 400)
        opportunities = crea_opportunita(clubs, sponsors, 100)

        # Statistiche finali
        print("\n" + "=" * 60)
        print("📊 RIEPILOGO")
        print("=" * 60)
        print(f"   Club creati:         {Club.query.count()}")
        print(f"   Sponsor creati:      {Sponsor.query.count()}")
        print(f"   Opportunità create:  {MarketplaceOpportunity.query.count()}")

        # Credenziali di test
        primo_club = Club.query.first()
        primo_sponsor = Sponsor.query.first()

        print("\n" + "=" * 60)
        print("🔐 CREDENZIALI DI ACCESSO")
        print("=" * 60)
        print("\n📍 CLUB DI TEST:")
        print(f"   Nome:     {primo_club.nome}")
        print(f"   Email:    {primo_club.email}")
        print(f"   Password: password123")

        print("\n🏢 SPONSOR DI TEST:")
        print(f"   Nome:     {primo_sponsor.ragione_sociale}")
        print(f"   Email:    {primo_sponsor.email}")
        print(f"   Password: password123")

        print("\n" + "=" * 60)
        print("✅ DATABASE POPOLATO CON SUCCESSO!")
        print("=" * 60)


if __name__ == '__main__':
    main()
