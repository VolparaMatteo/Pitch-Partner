from flask import Blueprint, jsonify
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app.models import (
    Club, Sponsor, HeadOfTerms, Match, Event, Asset, Activation, Media, Checklist,
    Budget, Payment, Expense, Project, ProjectMilestone, ProjectTask,
    MarketplaceOpportunity, OpportunityApplication, PressPublication,
    BestPracticeEvent, EventInvitation
)
from datetime import datetime

pitchy_bp = Blueprint('pitchy', __name__)

@pitchy_bp.route('/context', methods=['GET', 'OPTIONS'])
@cross_origin()
@jwt_required()
def get_pitchy_context():
    current_user_id = get_jwt_identity()
    claims = get_jwt()
    role = claims.get('role')
    
    print(f"DEBUG: Pitchy Context Request - User ID: {current_user_id}, Role: {role}")

    club = None
    sponsor = None
    context_text = ""

    if role == 'club':
        club = Club.query.get(current_user_id)
        if club:
            print(f"DEBUG: Found Club: {club.nome}")
            # --- CORE CONTEXT ---
            active_contracts = HeadOfTerms.query.filter_by(club_id=club.id, status='attivo').all()
            next_matches = Match.query.filter_by(club_id=club.id).filter(Match.data_ora >= datetime.utcnow()).order_by(Match.data_ora).limit(3).all()
            
            context_text += f"Sei l'assistente del Club '{club.nome}'. "
            context_text += f"Il club milita nel campionato: {club.categoria_campionato}. "
            context_text += f"Attualmente ha {len(active_contracts)} contratti di sponsorizzazione attivi. "
            
            if next_matches:
                matches_str = ", ".join([f"{m.avversario} ({m.data_ora.strftime('%d/%m')})" for m in next_matches])
                context_text += f"Le prossime partite sono contro: {matches_str}. "
            
            if active_contracts:
                context_text += "Sponsor attivi: "
                for c in active_contracts:
                    sponsor_name = c.sponsor.ragione_sociale if c.sponsor else "Sconosciuto"
                    context_text += f"- {sponsor_name} (Valore: €{c.compenso}, Scadenza: {c.data_fine.strftime('%d/%m/%Y')}). "

            # --- 1. ASSETS & ACTIVATIONS ---
            active_contract_ids = [c.id for c in active_contracts]
            if active_contract_ids:
                assets = Asset.query.filter(Asset.head_of_terms_id.in_(active_contract_ids)).all()
                if assets:
                    context_text += "\n**ASSET:** "
                    asset_summary = {}
                    for a in assets:
                        if a.categoria not in asset_summary: asset_summary[a.categoria] = []
                        asset_summary[a.categoria].append(a.nome)
                    for cat, items in asset_summary.items():
                        context_text += f"{cat}: {', '.join(items[:3])}. "

            activations = Activation.query.join(Match).filter(Match.club_id == club.id).order_by(Match.data_ora.desc()).limit(5).all()
            if activations:
                context_text += "\n**ATTIVAZIONI RECENTI:** "
                for act in activations:
                    status = "Eseguita" if act.eseguita else "Pianificata"
                    context_text += f"- {act.tipo} vs {act.match.avversario} ({status}). "

            # --- 2. FINANCE (Budgets & Payments) ---
            # Budgets
            budgets = Budget.query.filter_by(owner_type='club', owner_id=club.id).all()
            if budgets:
                context_text += "\n**FINANZA:** "
                total_budget = sum(b.importo_totale for b in budgets)
                total_spent = sum(b.importo_speso for b in budgets)
                context_text += f"Budget Totale Gestito: €{total_budget:,.2f} (Speso: €{total_spent:,.2f}). "
            
            # Payments (In entrata dagli sponsor)
            incoming_payments = Payment.query.join(HeadOfTerms).filter(HeadOfTerms.club_id == club.id, Payment.stato == 'pianificato').order_by(Payment.data_prevista).limit(3).all()
            if incoming_payments:
                context_text += "Prossimi incassi previsti: "
                for p in incoming_payments:
                    context_text += f"€{p.importo} da {p.contract.sponsor.ragione_sociale} il {p.data_prevista.strftime('%d/%m')}. "

            # --- 3. PROJECTS ---
            projects = Project.query.filter_by(club_id=club.id, stato='in_corso').all()
            if projects:
                context_text += "\n**PROGETTI ATTIVI:** "
                for p in projects:
                    context_text += f"- {p.titolo} (Progresso: {p.progresso_percentuale}%). "
                    # Check late milestones
                    late_milestones = [m for m in p.milestones if m.is_late()]
                    if late_milestones:
                        context_text += f"⚠️ Milestone in ritardo: {', '.join([m.titolo for m in late_milestones])}. "

            # --- 4. MARKETPLACE ---
            opportunities = MarketplaceOpportunity.query.filter_by(creator_type='club', creator_id=club.id, stato='pubblicata').all()
            if opportunities:
                context_text += "\n**MARKETPLACE:** "
                context_text += f"Hai {len(opportunities)} opportunità pubblicate. "
                for opp in opportunities:
                    apps = OpportunityApplication.query.filter_by(opportunity_id=opp.id, stato='in_attesa').count()
                    if apps > 0:
                        context_text += f"L'opportunità '{opp.titolo}' ha {apps} candidature in attesa. "

            # --- 5. PRESS & EVENTS ---
            # Press
            recent_posts = PressPublication.query.filter_by(author_type='club', author_id=club.id).order_by(PressPublication.data_pubblicazione.desc()).limit(3).all()
            if recent_posts:
                context_text += "\n**PRESS:** Ultimi post: " + ", ".join([f"'{p.titolo}'" for p in recent_posts]) + ". "
            
            # Events
            upcoming_events = Event.query.filter_by(club_id=club.id).filter(Event.data_ora_inizio >= datetime.utcnow()).order_by(Event.data_ora_inizio).limit(3).all()
            if upcoming_events:
                context_text += "Prossimi eventi: " + ", ".join([f"{e.titolo} ({e.data_ora_inizio.strftime('%d/%m')})" for e in upcoming_events]) + ". "

    elif role == 'sponsor':
        sponsor = Sponsor.query.get(current_user_id)
        if sponsor:
            print(f"DEBUG: Found Sponsor: {sponsor.ragione_sociale}")
            # --- CORE CONTEXT ---
            active_contracts = HeadOfTerms.query.filter_by(sponsor_id=sponsor.id, status='attivo').all()
            
            context_text += f"Sei l'assistente per lo Sponsor '{sponsor.ragione_sociale}'. "
            context_text += f"Settore: {sponsor.settore_merceologico}. "
            
            if active_contracts:
                context_text += f"Hai {len(active_contracts)} contratti attivi. "
                for c in active_contracts:
                    club_name = c.club.nome if c.club else "Sconosciuto"
                    context_text += f"Sponsorizzi il club {club_name} (Investimento: €{c.compenso}). "
            else:
                context_text += "Al momento non hai contratti attivi. "

            # --- 1. ASSETS & ACTIVATIONS ---
            active_contract_ids = [c.id for c in active_contracts]
            if active_contract_ids:
                assets = Asset.query.filter(Asset.head_of_terms_id.in_(active_contract_ids)).all()
                if assets:
                    context_text += "\n**I TUOI ASSET:** "
                    delivered = len([a for a in assets if a.status == 'completato'])
                    context_text += f"Totale asset: {len(assets)} ({delivered} consegnati). "

                activations = Activation.query.filter(Activation.contract_id.in_(active_contract_ids)).order_by(Activation.id.desc()).limit(5).all()
                if activations:
                    context_text += "\n**ATTIVAZIONI:** "
                    for act in activations:
                        context_text += f"- {act.tipo} ({act.stato}). "

            # --- 2. FINANCE ---
            # Budgets
            budgets = Budget.query.filter_by(owner_type='sponsor', owner_id=sponsor.id).all()
            if budgets:
                context_text += "\n**FINANZA:** "
                total_budget = sum(b.importo_totale for b in budgets)
                remaining = sum(b.importo_rimanente for b in budgets) if budgets else 0
                context_text += f"Budget Totale: €{total_budget:,.2f} (Rimanente: €{remaining:,.2f}). "

            # Payments Due
            payments_due = Payment.query.join(HeadOfTerms).filter(HeadOfTerms.sponsor_id == sponsor.id, Payment.stato == 'pianificato').order_by(Payment.data_prevista).limit(3).all()
            if payments_due:
                context_text += "Prossimi pagamenti in scadenza: "
                for p in payments_due:
                    context_text += f"€{p.importo} a {p.contract.club.nome} il {p.data_prevista.strftime('%d/%m')}. "

            # --- 3. PROJECTS ---
            projects = Project.query.filter_by(sponsor_id=sponsor.id, stato='in_corso').all()
            if projects:
                context_text += "\n**PROGETTI:** "
                for p in projects:
                    context_text += f"- {p.titolo} con {p.club.nome} (Progresso: {p.progresso_percentuale}%). "

            # --- 4. MARKETPLACE ---
            # Opportunities applied to
            applications = OpportunityApplication.query.filter_by(applicant_id=sponsor.id).all()
            if applications:
                context_text += "\n**MARKETPLACE:** "
                pending = len([a for a in applications if a.stato == 'in_attesa'])
                accepted = len([a for a in applications if a.stato == 'accettata'])
                context_text += f"Hai inviato {len(applications)} candidature ({pending} in attesa, {accepted} accettate). "

            # --- 5. PRESS & EVENTS ---
            # Events invited to
            invitations = EventInvitation.query.filter_by(sponsor_id=sponsor.id, visualizzato=False).all()
            if invitations:
                context_text += f"\n**EVENTI:** Hai {len(invitations)} nuovi inviti a eventi. "
            
            # Best Practice Events
            bp_events = BestPracticeEvent.query.filter(BestPracticeEvent.data_evento >= datetime.utcnow()).order_by(BestPracticeEvent.data_evento).limit(2).all()
            if bp_events:
                context_text += "Prossimi webinar formativi: " + ", ".join([f"{e.titolo}" for e in bp_events]) + ". "

    else:
        print(f"DEBUG: Unknown role or user not found. Role: {role}")
        context_text = "L'utente è un visitatore o un amministratore."

    print(f"DEBUG: Generated Context: {context_text}")
    return jsonify({'context': context_text})
