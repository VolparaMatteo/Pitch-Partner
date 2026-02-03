#!/usr/bin/env python3
"""
Script per popolare eventi demo per FC Stellamare
"""

from app import create_app, db
from app.models import Club, Sponsor, HeadOfTerms, Event, EventParticipant, EventInvitation
from datetime import datetime, timedelta
import random

def main():
    app = create_app()

    with app.app_context():
        print("=" * 60)
        print("📅 CREAZIONE EVENTI DEMO - FC STELLAMARE")
        print("=" * 60)

        # Trova il club FC Stellamare
        club = Club.query.filter_by(email='info@fcstellamare.it').first()
        if not club:
            print("❌ Club FC Stellamare non trovato!")
            print("   Esegui prima: python seed_demo_data.py")
            return
        print(f"✅ Club trovato: {club.nome} (ID: {club.id})")

        # Trova gli sponsor associati
        sponsors = Sponsor.query.filter_by(club_id=club.id).all()
        print(f"✅ Sponsor trovati: {len(sponsors)}")

        # Trova i contratti attivi
        contracts = HeadOfTerms.query.filter_by(club_id=club.id, status='attivo').all()
        print(f"✅ Contratti attivi: {len(contracts)}")

        # Elimina eventi esistenti del club per evitare duplicati
        existing_events = Event.query.filter_by(club_id=club.id).all()
        if existing_events:
            print(f"\n🗑️  Eliminazione {len(existing_events)} eventi esistenti...")
            for event in existing_events:
                db.session.delete(event)
            db.session.commit()

        print("\n📆 Creazione nuovi eventi...")

        events_data = [
            # Eventi passati (completati)
            {
                'titolo': 'Conferenza Stampa Inizio Stagione',
                'tipo': 'ufficio_stampa',
                'giorni_offset': -45,
                'durata_ore': 2,
                'ora_inizio': 11,
                'luogo': 'Sala Stampa Stadio Comunale Riviera',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Presentazione ufficiale della rosa e degli obiettivi stagionali. Intervento del Presidente, del Direttore Sportivo e del Mister.',
                'agenda': '11:00 - Accrediti stampa\n11:30 - Intervento Presidente\n12:00 - Presentazione staff tecnico\n12:30 - Domande e risposte\n13:00 - Photo opportunity',
                'status': 'completato',
                'sponsor_index': 0,
                'max_iscrizioni': 50,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Presentazione Partnership TechVision',
                'tipo': 'presentazione_commerciale',
                'giorni_offset': -30,
                'durata_ore': 3,
                'ora_inizio': 18,
                'luogo': 'Lounge VIP Stadio',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Evento esclusivo per la presentazione della partnership tecnologica con TechVision Solutions. Verranno svelate le innovazioni digitali per la prossima stagione.',
                'agenda': '18:00 - Welcome cocktail\n18:30 - Presentazione partnership\n19:00 - Demo tecnologie\n19:30 - Q&A\n20:00 - Networking dinner',
                'status': 'completato',
                'sponsor_index': 0,
                'max_iscrizioni': 30,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Workshop Social Media Marketing',
                'tipo': 'formazione',
                'giorni_offset': -20,
                'durata_ore': 4,
                'ora_inizio': 9,
                'luogo': 'Centro Sportivo Stellamare',
                'indirizzo': 'Via dello Sport 15, Milano',
                'online': False,
                'descrizione': 'Workshop pratico sulla gestione dei social media per club sportivi. Best practice e case study di successo.',
                'agenda': '09:00 - Introduzione\n09:30 - Strategia social per club sportivi\n10:30 - Coffee break\n10:45 - Case study FC Stellamare\n11:30 - Esercitazione pratica\n12:30 - Q&A e conclusioni',
                'status': 'completato',
                'max_iscrizioni': 25,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Cena di Gala Sponsor',
                'tipo': 'brand_event',
                'giorni_offset': -15,
                'durata_ore': 5,
                'ora_inizio': 20,
                'luogo': 'Grand Hotel Riviera',
                'indirizzo': 'Lungomare Europa 1, Milano',
                'descrizione': 'Serata di gala esclusiva per ringraziare tutti i partner e sponsor della stagione. Cena con intrattenimento e premiazioni.',
                'agenda': '20:00 - Aperitivo di benvenuto\n20:30 - Saluti istituzionali\n21:00 - Cena di gala\n22:30 - Premiazioni sponsor\n23:00 - Intrattenimento musicale',
                'status': 'completato',
                'max_iscrizioni': 100,
                'richiede_iscrizione': True
            },

            # Eventi in corso o prossimi
            {
                'titolo': 'Meeting Trimestrale Partner',
                'tipo': 'meeting',
                'giorni_offset': -2,
                'durata_ore': 2,
                'ora_inizio': 15,
                'luogo': 'Sala Conferenze Stadio',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Incontro periodico con tutti i partner per aggiornamenti su attivazioni, risultati e prossime iniziative.',
                'agenda': '15:00 - Accoglienza\n15:15 - Report attivazioni Q1\n15:45 - Risultati marketing\n16:15 - Prossimi eventi\n16:45 - Discussione aperta',
                'status': 'confermato',
                'max_iscrizioni': 20,
                'richiede_iscrizione': False
            },
            {
                'titolo': 'Webinar: ROI nelle Sponsorizzazioni',
                'tipo': 'formazione',
                'giorni_offset': 3,
                'durata_ore': 2,
                'ora_inizio': 14,
                'online': True,
                'link_meeting': 'https://zoom.us/j/123456789',
                'descrizione': 'Webinar online dedicato alla misurazione del ROI nelle sponsorizzazioni sportive. Partecipazione gratuita per tutti gli sponsor.',
                'agenda': '14:00 - Introduzione\n14:15 - KPI fondamentali\n14:45 - Strumenti di misurazione\n15:15 - Case study\n15:45 - Q&A',
                'status': 'confermato',
                'max_iscrizioni': 100,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Presentazione Nuovo Kit Gara',
                'tipo': 'ufficio_stampa',
                'giorni_offset': 7,
                'durata_ore': 2,
                'ora_inizio': 11,
                'luogo': 'Flagship Store SportMax',
                'indirizzo': 'Corso Italia 45, Milano',
                'descrizione': 'Evento stampa per la presentazione ufficiale delle nuove maglie da gioco realizzate in partnership con SportMax.',
                'agenda': '11:00 - Accrediti\n11:30 - Svelamento kit\n11:45 - Interviste\n12:00 - Photo shooting\n12:30 - Aperitivo stampa',
                'status': 'confermato',
                'sponsor_index': 2,
                'max_iscrizioni': 40,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Open Day Centro Sportivo',
                'tipo': 'brand_event',
                'giorni_offset': 10,
                'durata_ore': 6,
                'ora_inizio': 10,
                'luogo': 'Centro Sportivo Stellamare',
                'indirizzo': 'Via dello Sport 15, Milano',
                'descrizione': 'Giornata aperta al pubblico per visitare le strutture del club. Stand sponsor, attività per bambini e meet & greet con i giocatori.',
                'agenda': '10:00 - Apertura cancelli\n10:30 - Tour strutture\n11:00 - Attività bambini\n12:00 - Pausa pranzo (food truck sponsor)\n14:00 - Meet & greet giocatori\n15:00 - Mini torneo\n16:00 - Chiusura',
                'status': 'programmato',
                'max_iscrizioni': 500,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Networking Lunch Sponsor',
                'tipo': 'networking',
                'giorni_offset': 14,
                'durata_ore': 3,
                'ora_inizio': 12,
                'luogo': 'Ristorante La Terrazza',
                'indirizzo': 'Via del Porto 22, Milano',
                'descrizione': 'Pranzo informale per favorire il networking tra i vari sponsor del club. Occasione per creare sinergie commerciali.',
                'agenda': '12:00 - Aperitivo e networking\n12:30 - Pranzo\n14:00 - Speed networking\n14:45 - Conclusioni',
                'status': 'programmato',
                'max_iscrizioni': 30,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Conferenza Stampa Pre-Derby',
                'tipo': 'ufficio_stampa',
                'giorni_offset': 18,
                'durata_ore': 1,
                'ora_inizio': 14,
                'luogo': 'Sala Stampa Stadio Comunale Riviera',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Conferenza stampa del mister in vista del derby cittadino. Accesso riservato ai media accreditati.',
                'agenda': '14:00 - Ingresso stampa\n14:15 - Conferenza mister\n14:45 - Domande\n15:00 - Fine conferenza',
                'status': 'programmato',
                'max_iscrizioni': 30,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Workshop Brand Activation',
                'tipo': 'formazione',
                'giorni_offset': 21,
                'durata_ore': 4,
                'ora_inizio': 9,
                'online': True,
                'link_meeting': 'https://teams.microsoft.com/meet/abc123',
                'descrizione': 'Workshop online sulle migliori strategie di brand activation durante gli eventi sportivi. Focus su engagement e misurazione.',
                'agenda': '09:00 - Introduzione\n09:30 - Tipologie di activation\n10:30 - Break\n10:45 - Case study internazionali\n11:45 - Esercitazione\n12:30 - Conclusioni',
                'status': 'programmato',
                'max_iscrizioni': 50,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Evento Charity Match',
                'tipo': 'brand_event',
                'giorni_offset': 28,
                'durata_ore': 4,
                'ora_inizio': 18,
                'luogo': 'Stadio Comunale Riviera',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Partita benefica con vecchie glorie del club a favore della Fondazione Ospedale Pediatrico. Tutti gli sponsor sono invitati a partecipare con attivazioni dedicate.',
                'agenda': '18:00 - Apertura cancelli\n18:30 - Intrattenimento pre-partita\n19:00 - Calcio d\'inizio\n20:00 - Intervallo con asta benefica\n20:15 - Secondo tempo\n21:00 - Premiazioni e ringraziamenti',
                'status': 'programmato',
                'max_iscrizioni': 200,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Presentazione Report Semestrale',
                'tipo': 'presentazione_commerciale',
                'giorni_offset': 35,
                'durata_ore': 2,
                'ora_inizio': 16,
                'luogo': 'Sala Conferenze Banca Riviera',
                'indirizzo': 'Piazza Affari 10, Milano',
                'descrizione': 'Presentazione del report semestrale sulle performance delle sponsorizzazioni. Dati, analytics e previsioni per la seconda parte della stagione.',
                'agenda': '16:00 - Accoglienza\n16:15 - Presentazione dati\n16:45 - Analisi ROI per sponsor\n17:15 - Piani futuri\n17:45 - Q&A',
                'status': 'programmato',
                'sponsor_index': 1,
                'max_iscrizioni': 25,
                'richiede_iscrizione': True
            },
            {
                'titolo': 'Meeting Online Sponsor Internazionali',
                'tipo': 'meeting',
                'giorni_offset': 40,
                'durata_ore': 1,
                'ora_inizio': 17,
                'online': True,
                'link_meeting': 'https://zoom.us/j/987654321',
                'descrizione': 'Call con potenziali sponsor internazionali interessati a partnership con FC Stellamare per espansione brand all\'estero.',
                'agenda': '17:00 - Introduzione club\n17:15 - Opportunità sponsorship\n17:30 - Q&A\n17:50 - Next steps',
                'status': 'programmato',
                'max_iscrizioni': 10,
                'richiede_iscrizione': False
            },
            {
                'titolo': 'Press Tour Nuovo Settore Stadio',
                'tipo': 'ufficio_stampa',
                'giorni_offset': 45,
                'durata_ore': 3,
                'ora_inizio': 10,
                'luogo': 'Stadio Comunale Riviera - Settore Premium',
                'indirizzo': 'Via Marittima 88, Milano',
                'descrizione': 'Tour esclusivo per la stampa del nuovo settore premium dello stadio, realizzato grazie alla partnership con Banca Riviera.',
                'agenda': '10:00 - Ritrovo ingresso VIP\n10:15 - Tour settore premium\n10:45 - Visita sky box\n11:15 - Conferenza stampa\n11:45 - Brunch stampa\n12:30 - Photo opportunity',
                'status': 'programmato',
                'sponsor_index': 1,
                'max_iscrizioni': 35,
                'richiede_iscrizione': True
            }
        ]

        created_events = []

        for i, event_data in enumerate(events_data):
            # Calcola date
            data_inizio = datetime.now() + timedelta(days=event_data['giorni_offset'])
            data_inizio = data_inizio.replace(
                hour=event_data['ora_inizio'],
                minute=0,
                second=0,
                microsecond=0
            )
            data_fine = data_inizio + timedelta(hours=event_data['durata_ore'])

            # Sponsor associato (se specificato)
            sponsor_id = None
            contract_id = None
            if 'sponsor_index' in event_data and len(sponsors) > event_data['sponsor_index']:
                sponsor_id = sponsors[event_data['sponsor_index']].id
                # Trova contratto associato
                for c in contracts:
                    if c.sponsor_id == sponsor_id:
                        contract_id = c.id
                        break

            event = Event(
                club_id=club.id,
                sponsor_id=sponsor_id,
                contract_id=contract_id,
                titolo=event_data['titolo'],
                tipo=event_data['tipo'],
                data_ora_inizio=data_inizio,
                data_ora_fine=data_fine,
                luogo=event_data.get('luogo'),
                indirizzo=event_data.get('indirizzo'),
                online=event_data.get('online', False),
                link_meeting=event_data.get('link_meeting'),
                descrizione=event_data.get('descrizione'),
                agenda=event_data.get('agenda'),
                creato_da_tipo='club',
                creato_da_id=club.id,
                creato_da_nome=club.nome,
                status=event_data['status'],
                max_iscrizioni=event_data.get('max_iscrizioni'),
                richiede_iscrizione=event_data.get('richiede_iscrizione', False),
                visibile_a='tutti'
            )

            db.session.add(event)
            db.session.flush()

            # Aggiungi partecipanti per eventi completati o confermati
            if event_data['status'] in ['completato', 'confermato']:
                # Aggiungi alcuni partecipanti
                partecipanti = [
                    {'nome': 'Marco Benedetti', 'email': 'm.benedetti@fcstellamare.it', 'ruolo': 'organizzatore'},
                    {'nome': 'Laura Rossi', 'email': 'l.rossi@fcstellamare.it', 'ruolo': 'organizzatore'},
                ]

                # Aggiungi partecipanti sponsor casuali
                if sponsors and event_data['status'] == 'completato':
                    num_partecipanti = random.randint(3, 8)
                    for j in range(num_partecipanti):
                        sponsor = random.choice(sponsors)
                        partecipanti.append({
                            'nome': f'Referente {sponsor.ragione_sociale.split()[0]}',
                            'email': f'ref{j}@{sponsor.email.split("@")[1]}',
                            'ruolo': 'partecipante',
                            'user_type': 'sponsor',
                            'user_id': sponsor.id
                        })

                for p in partecipanti:
                    participant = EventParticipant(
                        event_id=event.id,
                        nome=p['nome'],
                        email=p['email'],
                        ruolo=p.get('ruolo', 'partecipante'),
                        user_type=p.get('user_type'),
                        user_id=p.get('user_id'),
                        invitato=True,
                        confermato=event_data['status'] == 'completato',
                        presente=event_data['status'] == 'completato'
                    )
                    db.session.add(participant)

            # Aggiungi inviti per sponsor per eventi futuri
            if event_data['status'] in ['programmato', 'confermato'] and sponsors:
                # Invita alcuni sponsor casuali
                sponsors_to_invite = random.sample(sponsors, min(len(sponsors), random.randint(2, 4)))
                for sponsor in sponsors_to_invite:
                    # Verifica che non esista già un invito
                    existing = EventInvitation.query.filter_by(
                        event_id=event.id,
                        sponsor_id=sponsor.id
                    ).first()
                    if not existing:
                        invitation = EventInvitation(
                            event_id=event.id,
                            sponsor_id=sponsor.id,
                            visualizzato=random.choice([True, False])
                        )
                        db.session.add(invitation)

            created_events.append(event)
            status_emoji = {
                'programmato': '📅',
                'confermato': '✅',
                'completato': '🏁',
                'in_corso': '▶️',
                'annullato': '❌'
            }
            print(f"  {status_emoji.get(event_data['status'], '📅')} {event.titolo}")

        db.session.commit()

        # Statistiche finali
        print("\n" + "=" * 60)
        print("✅ EVENTI CREATI CON SUCCESSO!")
        print("=" * 60)

        completati = len([e for e in created_events if e.status == 'completato'])
        confermati = len([e for e in created_events if e.status == 'confermato'])
        programmati = len([e for e in created_events if e.status == 'programmato'])

        print(f"""
📊 RIEPILOGO EVENTI:

Totale eventi:    {len(created_events)}
├── Completati:   {completati}
├── Confermati:   {confermati}
└── Programmati:  {programmati}

📋 TIPI DI EVENTI:
├── Ufficio Stampa:        {len([e for e in created_events if e.tipo == 'ufficio_stampa'])}
├── Presentazione:         {len([e for e in created_events if e.tipo == 'presentazione_commerciale'])}
├── Brand Event:           {len([e for e in created_events if e.tipo == 'brand_event'])}
├── Meeting:               {len([e for e in created_events if e.tipo == 'meeting'])}
├── Formazione:            {len([e for e in created_events if e.tipo == 'formazione'])}
└── Networking:            {len([e for e in created_events if e.tipo == 'networking'])}

🌐 MODALITÀ:
├── In presenza:  {len([e for e in created_events if not e.online])}
└── Online:       {len([e for e in created_events if e.online])}
""")
        print("=" * 60)


if __name__ == '__main__':
    main()
