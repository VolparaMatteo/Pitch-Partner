"""
Seed script per popolare il marketplace con opportunità di test
Crea opportunità sia da Club che da Sponsor, con candidature incrociate
"""

from app import create_app, db
from app.models import Club, Sponsor, MarketplaceOpportunity, OpportunityApplication
from datetime import datetime, timedelta
import random

def seed_marketplace():
    app = create_app()
    with app.app_context():
        print("🌱 Seeding marketplace data...")
        
        # Get existing clubs and sponsors
        clubs = Club.query.all()
        sponsors = Sponsor.query.all()
        
        if not clubs or not sponsors:
            print("❌ Nessun club o sponsor trovato. Esegui prima create_demo_data.py")
            return
        
        print(f"✓ Trovati {len(clubs)} clubs e {len(sponsors)} sponsors")
        
        # Clear existing marketplace data
        print("🗑️  Rimuovo dati marketplace esistenti...")
        OpportunityApplication.query.delete()
        MarketplaceOpportunity.query.delete()
        db.session.commit()
        
        # Opportunità create da CLUB
        club_opportunities = [
            {
                'creator_type': 'club',
                'creator_id': clubs[0].id,
                'titolo': '⚽ Torneo Estivo Giovanile 2025',
                'descrizione': 'Cerchiamo sponsor per il nostro torneo estivo dedicato alle categorie giovanili. Evento con oltre 500 partecipanti e 2000 spettatori previsti. Ottima visibilità per brand sportivi e family-oriented.',
                'tipo_opportunita': 'evento_speciale',
                'categoria': 'sport',
                'location': 'Milano, Italia',
                'data_inizio': datetime.now() + timedelta(days=60),
                'data_fine': datetime.now() + timedelta(days=65),
                'budget_richiesto': 15000,
                'numero_sponsor_cercati': 3,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_richiesti': [{'categoria': 'LED', 'descrizione': 'LED a bordo campo'}, {'categoria': 'Hospitality', 'descrizione': 'Spazio hospitality'}, {'categoria': 'Digital', 'descrizione': 'Social media coverage'}],
                'target_audience': {'age_range': '18-45', 'interests': ['sport', 'famiglia'], 'description': 'Famiglie, giovani atleti, appassionati di calcio'}
            },
            {
                'creator_type': 'club',
                'creator_id': clubs[0].id,
                'titolo': '🎯 Campagna Social "Road to Victory"',
                'descrizione': 'Campagna social per la stagione 2024-2025. Contenuti esclusivi, interviste ai giocatori, behind the scenes. Pacchetto completo di visibilità digitale.',
                'tipo_opportunita': 'campagna_promozionale',
                'categoria': 'digital',
                'location': 'Online',
                'data_inizio': datetime.now() + timedelta(days=15),
                'data_fine': datetime.now() + timedelta(days=200),
                'budget_richiesto': 8000,
                'numero_sponsor_cercati': 2,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_richiesti': [{'categoria': 'Social', 'descrizione': 'Post sponsorizzati'}, {'categoria': 'Social', 'descrizione': 'Stories dedicate'}, {'categoria': 'Video', 'descrizione': 'Video content'}],
                'target_audience': {'age_range': '18-35', 'interests': ['sport', 'social media'], 'description': 'Giovani 18-35, appassionati di sport'}
            },
            {
                'creator_type': 'club',
                'creator_id': clubs[1].id if len(clubs) > 1 else clubs[0].id,
                'titolo': '🌟 Naming Rights Stadio - Stagione 2025',
                'descrizione': 'Opportunità esclusiva di naming rights per il nostro stadio. Visibilità garantita in tutte le partite casalinghe, eventi e comunicazioni ufficiali.',
                'tipo_opportunita': 'co_branding',
                'categoria': 'business',
                'location': 'Stellamare, Italia',
                'data_inizio': datetime.now() + timedelta(days=30),
                'data_fine': datetime.now() + timedelta(days=395),
                'budget_richiesto': 50000,
                'numero_sponsor_cercati': 1,
                'visibilita': 'privata',
                'stato': 'pubblicata',
                'asset_richiesti': [{'categoria': 'Naming', 'descrizione': 'Naming rights stadio'}, {'categoria': 'LED', 'descrizione': 'LED premium'}, {'categoria': 'Hospitality', 'descrizione': 'Hospitality VIP'}],
                'target_audience': {'age_range': '25-55', 'interests': ['business', 'premium'], 'description': 'Brand premium, aziende locali'}
            },
            {
                'creator_type': 'club',
                'creator_id': clubs[0].id,
                'titolo': '💚 Progetto CSR "Sport per Tutti"',
                'descrizione': 'Iniziativa sociale per portare lo sport nelle scuole e nelle comunità svantaggiate. Cerchiamo partner che condividano i nostri valori di inclusione e responsabilità sociale.',
                'tipo_opportunita': 'progetto_csr',
                'categoria': 'sociale',
                'location': 'Lombardia, Italia',
                'data_inizio': datetime.now() + timedelta(days=45),
                'data_fine': datetime.now() + timedelta(days=410),
                'budget_richiesto': 12000,
                'numero_sponsor_cercati': 4,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_richiesti': [{'categoria': 'Materiale', 'descrizione': 'Materiale sportivo'}, {'categoria': 'Logistica', 'descrizione': 'Supporto logistico'}, {'categoria': 'Branding', 'descrizione': 'Visibilità brand'}],
                'target_audience': {'age_range': '6-18', 'interests': ['sociale', 'educazione'], 'description': 'Scuole, famiglie, comunità locali'}
            }
        ]
        
        # Opportunità create da SPONSOR
        sponsor_opportunities = [
            {
                'creator_type': 'sponsor',
                'creator_id': sponsors[0].id,
                'titolo': '🏆 Ricerca Club per Partnership Annuale',
                'descrizione': 'Azienda leader nel settore tecnologico cerca club sportivo per partnership strategica. Offriamo budget competitivo e visibilità reciproca.',
                'tipo_opportunita': 'co_branding',
                'categoria': 'business',
                'location': 'Italia',
                'data_inizio': datetime.now() + timedelta(days=20),
                'data_fine': datetime.now() + timedelta(days=385),
                'budget_richiesto': 25000,
                'numero_sponsor_cercati': 2,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_forniti': [{'categoria': 'Budget', 'descrizione': 'Budget sponsorizzazione'}, {'categoria': 'Tech', 'descrizione': 'Tecnologia'}, {'categoria': 'Marketing', 'descrizione': 'Supporto marketing'}],
                'target_audience': {'age_range': '18-65', 'interests': ['sport', 'business'], 'description': 'Club sportivi, Serie C e superiori'}
            },
            {
                'creator_type': 'sponsor',
                'creator_id': sponsors[1].id if len(sponsors) > 1 else sponsors[0].id,
                'titolo': '📱 Campagna Digital per Club Emergenti',
                'descrizione': 'Web agency specializzata in sport marketing cerca club per campagne digital innovative. Offriamo servizi di content creation, social media management e web development.',
                'tipo_opportunita': 'campagna_promozionale',
                'categoria': 'digital',
                'location': 'Online',
                'data_inizio': datetime.now() + timedelta(days=10),
                'data_fine': datetime.now() + timedelta(days=190),
                'budget_richiesto': 5000,
                'numero_sponsor_cercati': 3,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_forniti': [{'categoria': 'Digital', 'descrizione': 'Servizi digital'}, {'categoria': 'Content', 'descrizione': 'Content creation'}, {'categoria': 'Social', 'descrizione': 'Social media management'}],
                'target_audience': {'age_range': '18-45', 'interests': ['digital', 'sport'], 'description': 'Club dilettantistici e semi-professionistici'}
            },
            {
                'creator_type': 'sponsor',
                'creator_id': sponsors[2].id if len(sponsors) > 2 else sponsors[0].id,
                'titolo': '🎪 Evento Speciale "Tech & Sport Day"',
                'descrizione': 'Organizziamo un evento che unisce tecnologia e sport. Cerchiamo club partner per demo, workshop e attività interattive. Grande visibilità mediatica garantita.',
                'tipo_opportunita': 'evento_speciale',
                'categoria': 'entertainment',
                'location': 'Roma, Italia',
                'data_inizio': datetime.now() + timedelta(days=90),
                'data_fine': datetime.now() + timedelta(days=92),
                'budget_richiesto': 10000,
                'numero_sponsor_cercati': 5,
                'visibilita': 'pubblica',
                'stato': 'pubblicata',
                'asset_forniti': [{'categoria': 'Spazio', 'descrizione': 'Spazio espositivo'}, {'categoria': 'Media', 'descrizione': 'Visibilità mediatica'}, {'categoria': 'Network', 'descrizione': 'Networking'}],
                'target_audience': {'age_range': '18-55', 'interests': ['tech', 'sport'], 'description': 'Appassionati tech e sport, famiglie'}
            }
        ]
        
        # Crea opportunità
        created_opportunities = []
        
        print("\n📝 Creazione opportunità da Club...")
        for opp_data in club_opportunities:
            opp = MarketplaceOpportunity(**opp_data)
            db.session.add(opp)
            created_opportunities.append(opp)
            print(f"  ✓ {opp_data['titolo']}")
        
        print("\n📝 Creazione opportunità da Sponsor...")
        for opp_data in sponsor_opportunities:
            opp = MarketplaceOpportunity(**opp_data)
            db.session.add(opp)
            created_opportunities.append(opp)
            print(f"  ✓ {opp_data['titolo']}")
        
        db.session.commit()
        print(f"\n✅ Create {len(created_opportunities)} opportunità")
        
        # Crea candidature incrociate
        print("\n📨 Creazione candidature di test...")
        
        applications_data = [
            # Sponsor applica a opportunità Club
            {
                'opportunity': created_opportunities[0],  # Torneo Estivo
                'applicant_type': 'sponsor',
                'applicant_id': sponsors[0].id,
                'messaggio': 'Siamo molto interessati a sponsorizzare il vostro torneo estivo. La nostra azienda ha una forte presenza nel settore sportivo e crediamo che questa partnership possa portare grande valore ad entrambe le parti.',
                'proposta_budget': 15000,
                'asset_offerti': ['LED premium a bordo campo', 'Hospitality VIP per 50 persone', 'Campagna social dedicata'],
                'stato': 'in_attesa'
            },
            {
                'opportunity': created_opportunities[1],  # Campagna Social
                'applicant_type': 'sponsor',
                'applicant_id': sponsors[1].id if len(sponsors) > 1 else sponsors[0].id,
                'messaggio': 'La nostra web agency è specializzata in content creation sportivo. Possiamo offrire servizi di produzione video, gestione social e analytics avanzati.',
                'proposta_budget': 6000,
                'asset_offerti': ['Video professionali', 'Gestione social media', 'Report analytics mensili'],
                'stato': 'in_attesa'
            },
            # Club applica a opportunità Sponsor
            {
                'opportunity': created_opportunities[4],  # Partnership Annuale Sponsor
                'applicant_type': 'club',
                'applicant_id': clubs[0].id,
                'messaggio': 'Il nostro club è interessato a sviluppare una partnership strategica. Abbiamo un seguito di oltre 10.000 tifosi e una forte presenza sui social media. Possiamo offrire eccellente visibilità del vostro brand.',
                'proposta_budget': 20000,
                'asset_offerti': ['LED a bordo campo per tutte le partite casalinghe', 'Logo su divise ufficiali', 'Presenza social costante'],
                'stato': 'in_attesa'
            },
            {
                'opportunity': created_opportunities[5],  # Campagna Digital Sponsor
                'applicant_type': 'club',
                'applicant_id': clubs[1].id if len(clubs) > 1 else clubs[0].id,
                'messaggio': 'Siamo un club in crescita con grande potenziale digital. Cerchiamo partner per sviluppare la nostra presenza online e raggiungere nuovi tifosi.',
                'proposta_budget': 4000,
                'asset_offerti': ['Accesso esclusivo a contenuti', 'Collaborazione su campagne', 'Cross-promotion'],
                'stato': 'in_attesa'
            },
            # Altre candidature con stati diversi
            {
                'opportunity': created_opportunities[0],  # Torneo Estivo
                'applicant_type': 'sponsor',
                'applicant_id': sponsors[2].id if len(sponsors) > 2 else sponsors[0].id,
                'messaggio': 'Proposta per sponsorizzazione silver del torneo con focus su hospitality.',
                'proposta_budget': 8000,
                'asset_offerti': ['Hospitality area', 'Branding secondario'],
                'stato': 'accettata'
            },
            {
                'opportunity': created_opportunities[6],  # Tech & Sport Day
                'applicant_type': 'club',
                'applicant_id': clubs[0].id,
                'messaggio': 'Interessati a partecipare con demo e workshop per i nostri giovani atleti.',
                'proposta_budget': 3000,
                'asset_offerti': ['Demo sportive', 'Presenza atleti', 'Workshop tecnici'],
                'stato': 'rifiutata'
            }
        ]
        
        for app_data in applications_data:
            app = OpportunityApplication(
                opportunity_id=app_data['opportunity'].id,
                applicant_type=app_data['applicant_type'],
                applicant_id=app_data['applicant_id'],
                messaggio_candidatura=app_data['messaggio'],
                proposta_budget=app_data['proposta_budget'],
                asset_offerti=app_data['asset_offerti'],
                stato=app_data['stato']
            )
            db.session.add(app)
            
            applicant_name = ""
            if app_data['applicant_type'] == 'sponsor':
                sponsor = Sponsor.query.get(app_data['applicant_id'])
                applicant_name = sponsor.ragione_sociale if sponsor else "Sponsor"
            else:
                club = Club.query.get(app_data['applicant_id'])
                applicant_name = club.nome if club else "Club"
            
            print(f"  ✓ {applicant_name} → {app_data['opportunity'].titolo} ({app_data['stato']})")
        
        db.session.commit()
        print(f"\n✅ Create {len(applications_data)} candidature")
        
        # Update views count per rendere più realistici i dati
        print("\n👁️  Aggiornamento visualizzazioni...")
        for opp in created_opportunities:
            opp.views_count = random.randint(15, 150)
        db.session.commit()
        
        print("\n" + "="*60)
        print("✅ SEED COMPLETATO CON SUCCESSO!")
        print("="*60)
        print(f"\n📊 Riepilogo:")
        print(f"  • Opportunità create da Club: {len(club_opportunities)}")
        print(f"  • Opportunità create da Sponsor: {len(sponsor_opportunities)}")
        print(f"  • Candidature totali: {len(applications_data)}")
        print(f"  • Candidature in attesa: {sum(1 for a in applications_data if a['stato'] == 'in_attesa')}")
        print(f"  • Candidature accettate: {sum(1 for a in applications_data if a['stato'] == 'accettata')}")
        print(f"  • Candidature rifiutate: {sum(1 for a in applications_data if a['stato'] == 'rifiutata')}")
        
        print("\n🔑 Credenziali di accesso:")
        print("\n  CLUB:")
        for club in clubs[:2]:
            print(f"    • Email: {club.email}")
            print(f"      Password: password123")
        
        print("\n  SPONSOR:")
        for sponsor in sponsors[:3]:
            print(f"    • Email: {sponsor.email}")
            print(f"      Password: password123")
        
        print("\n🚀 Puoi ora testare il marketplace su:")
        print("  • http://localhost:3000/club/marketplace (come Club)")
        print("  • http://localhost:3000/sponsor/marketplace (come Sponsor)")
        print("\n")

if __name__ == "__main__":
    seed_marketplace()
