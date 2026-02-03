from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Lead, LeadActivity, Sponsor, ContactPerson, Tag, lead_tags, LeadStageHistory, LeadScoreConfig, InventoryAsset, lead_asset_interests
from app.services.lead_scoring import calculate_lead_score
from datetime import datetime


def verify_club():
    """Helper function to verify club role and return club_id"""
    claims = get_jwt()
    if claims.get('role') != 'club':
        return None
    return int(get_jwt_identity())


def _record_stage_change(lead, from_status, to_status):
    """Record a stage transition in lead_stage_history"""
    if from_status == to_status:
        return
    entry = LeadStageHistory(
        lead_id=lead.id,
        club_id=lead.club_id,
        from_status=from_status,
        to_status=to_status,
        valore_al_momento=lead.valore_stimato or 0,
        probabilita_al_momento=lead.probabilita_chiusura or 0,
        changed_at=datetime.utcnow()
    )
    db.session.add(entry)


def _get_lead_score_config(club_id):
    """Get lead score config for club, or None for defaults"""
    return LeadScoreConfig.query.filter_by(club_id=club_id).first()


lead_bp = Blueprint('lead', __name__)


# ==================== LEAD CRUD ====================

# GET - Lista tutti i lead del club
@lead_bp.route('/club/leads', methods=['GET'])
@jwt_required()
def get_leads():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Filtri opzionali
    status = request.args.get('status')
    fonte = request.args.get('fonte')
    priorita = request.args.get('priorita', type=int)
    include_converted = request.args.get('include_converted', 'false').lower() == 'true'
    tag_ids = request.args.get('tags')  # comma-separated tag ids

    query = Lead.query.filter_by(club_id=club_id)

    # Di default non mostrare i lead convertiti
    if not include_converted:
        query = query.filter_by(convertito=False)

    if status:
        query = query.filter_by(status=status)
    if fonte:
        query = query.filter_by(fonte=fonte)
    if priorita:
        query = query.filter_by(priorita=priorita)
    if tag_ids:
        tag_id_list = [int(t) for t in tag_ids.split(',') if t.strip().isdigit()]
        if tag_id_list:
            query = query.filter(Lead.tags.any(Tag.id.in_(tag_id_list)))

    # Ordina per priorità (alta prima) e poi per data creazione
    leads = query.order_by(Lead.priorita.desc(), Lead.created_at.desc()).all()

    # Get lead score config for this club
    score_config = _get_lead_score_config(club_id)

    leads_data = []
    for lead in leads:
        # Fetch activities for count, recency, and scoring
        lead_activities = LeadActivity.query.filter_by(lead_id=lead.id)\
            .order_by(LeadActivity.data_attivita.desc()).all()

        activities_count = len(lead_activities)
        last_activity = lead_activities[0] if lead_activities else None

        # Calculate lead score
        contacts_count = ContactPerson.query.filter_by(lead_id=lead.id).count()
        score_data = calculate_lead_score(lead, lead_activities, contacts_count=contacts_count, config=score_config)

        leads_data.append({
            'id': lead.id,
            'ragione_sociale': lead.ragione_sociale,
            'settore_merceologico': lead.settore_merceologico,
            'email': lead.email,
            'telefono': lead.telefono,
            'logo_url': lead.logo_url,
            'status': lead.status,
            'valore_stimato': lead.valore_stimato,
            'probabilita_chiusura': lead.probabilita_chiusura,
            'fonte': lead.fonte,
            'priorita': lead.priorita,
            'data_prossimo_contatto': lead.data_prossimo_contatto.isoformat() if lead.data_prossimo_contatto else None,
            'referente_nome': lead.referente_nome,
            'referente_cognome': lead.referente_cognome,
            'convertito': lead.convertito,
            'sponsor_id': lead.sponsor_id,
            'activities_count': activities_count,
            'last_activity_date': last_activity.data_attivita.isoformat() if last_activity else None,
            'created_at': lead.created_at.isoformat() if lead.created_at else None,
            'lead_score': score_data['score'],
            'score_label': score_data['label'],
            'score_breakdown': score_data['breakdown'],
            'tags': [{'id': t.id, 'nome': t.nome, 'colore': t.colore} for t in lead.tags]
        })

    return jsonify(leads_data), 200


# GET - Statistiche pipeline lead (IMPORTANTE: deve essere prima delle route con parametri!)
@lead_bp.route('/club/leads/stats', methods=['GET'])
@jwt_required()
def get_lead_stats():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Conteggio per status
    statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']
    pipeline = {}
    for status in statuses:
        count = Lead.query.filter_by(club_id=club_id, status=status, convertito=False).count()
        value = db.session.query(db.func.sum(Lead.valore_stimato))\
            .filter_by(club_id=club_id, status=status, convertito=False).scalar() or 0
        pipeline[status] = {
            'count': count,
            'value': float(value)
        }

    # Totali (solo lead attivi in pipeline, esclusi vinto/perso)
    active_statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione']
    total_leads = Lead.query.filter(
        Lead.club_id == club_id,
        Lead.convertito == False,
        Lead.status.in_(active_statuses)
    ).count()
    total_value = db.session.query(db.func.sum(Lead.valore_stimato)).filter(
        Lead.club_id == club_id,
        Lead.convertito == False,
        Lead.status.in_(active_statuses)
    ).scalar() or 0

    # Lead convertiti (storico)
    converted_count = Lead.query.filter_by(club_id=club_id, convertito=True).count()
    converted_value = db.session.query(db.func.sum(Lead.valore_stimato))\
        .filter_by(club_id=club_id, convertito=True).scalar() or 0

    # Lead persi
    lost_count = Lead.query.filter_by(club_id=club_id, status='perso', convertito=False).count()

    # Tasso di conversione
    total_closed = converted_count + lost_count
    conversion_rate = (converted_count / total_closed * 100) if total_closed > 0 else 0

    # Lead con follow-up scaduti
    today = datetime.utcnow()
    overdue_followups = Lead.query.filter(
        Lead.club_id == club_id,
        Lead.convertito == False,
        Lead.data_prossimo_contatto != None,
        Lead.data_prossimo_contatto < today
    ).count()

    # Score distribution across active leads (solo pipeline attiva)
    active_leads = Lead.query.filter(
        Lead.club_id == club_id,
        Lead.convertito == False,
        Lead.status.in_(active_statuses)
    ).all()

    # Get lead score config for this club
    score_config = _get_lead_score_config(club_id)
    threshold_cold = score_config.threshold_cold if score_config else 33
    threshold_warm = score_config.threshold_warm if score_config else 66

    scores = []
    score_distribution = {'cold': 0, 'warm': 0, 'hot': 0}
    for al in active_leads:
        al_activities = LeadActivity.query.filter_by(lead_id=al.id).all()
        al_contacts_count = ContactPerson.query.filter_by(lead_id=al.id).count()
        sd = calculate_lead_score(al, al_activities, contacts_count=al_contacts_count, config=score_config)
        scores.append(sd['score'])
        if sd['score'] <= threshold_cold:
            score_distribution['cold'] += 1
        elif sd['score'] <= threshold_warm:
            score_distribution['warm'] += 1
        else:
            score_distribution['hot'] += 1

    average_score = round(sum(scores) / len(scores), 1) if scores else 0

    return jsonify({
        'pipeline': pipeline,
        'totals': {
            'total_leads': total_leads,
            'total_value': float(total_value),
            'converted_count': converted_count,
            'converted_value': float(converted_value),
            'lost_count': lost_count,
            'conversion_rate': round(conversion_rate, 1),
            'overdue_followups': overdue_followups,
            'average_score': average_score,
            'score_distribution': score_distribution
        }
    }), 200


# GET - Singolo lead
@lead_bp.route('/club/leads/<int:lead_id>', methods=['GET'])
@jwt_required()
def get_lead(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Calculate lead score
    lead_activities = LeadActivity.query.filter_by(lead_id=lead.id).all()
    lead_contacts_count = ContactPerson.query.filter_by(lead_id=lead.id).count()
    score_config = _get_lead_score_config(club_id)
    score_data = calculate_lead_score(lead, lead_activities, contacts_count=lead_contacts_count, config=score_config)

    return jsonify({
        'id': lead.id,
        'ragione_sociale': lead.ragione_sociale,
        'partita_iva': lead.partita_iva,
        'codice_fiscale': lead.codice_fiscale,
        'settore_merceologico': lead.settore_merceologico,
        'logo_url': lead.logo_url,
        'indirizzo_sede': lead.indirizzo_sede,
        'email': lead.email,
        'telefono': lead.telefono,
        'sito_web': lead.sito_web,
        'facebook': lead.facebook,
        'instagram': lead.instagram,
        'tiktok': lead.tiktok,
        'linkedin': lead.linkedin,
        'twitter': lead.twitter,
        'referente_nome': lead.referente_nome,
        'referente_cognome': lead.referente_cognome,
        'referente_ruolo': lead.referente_ruolo,
        'referente_contatto': lead.referente_contatto,
        'status': lead.status,
        'valore_stimato': lead.valore_stimato,
        'probabilita_chiusura': lead.probabilita_chiusura,
        'fonte': lead.fonte,
        'note': lead.note,
        'motivo_perdita': lead.motivo_perdita,
        'data_prossimo_contatto': lead.data_prossimo_contatto.isoformat() if lead.data_prossimo_contatto else None,
        'priorita': lead.priorita,
        'convertito': lead.convertito,
        'sponsor_id': lead.sponsor_id,
        'data_conversione': lead.data_conversione.isoformat() if lead.data_conversione else None,
        'created_at': lead.created_at.isoformat() if lead.created_at else None,
        'updated_at': lead.updated_at.isoformat() if lead.updated_at else None,
        'lead_score': score_data['score'],
        'score_label': score_data['label'],
        'score_breakdown': score_data['breakdown'],
        'score_thresholds': score_data['thresholds'],
        'score_config_custom': score_config is not None,
        'tags': [{'id': t.id, 'nome': t.nome, 'colore': t.colore} for t in lead.tags],
        'asset_interests': [{
            'id': a.id,
            'nome': a.nome,
            'categoria': a.category.nome if a.category else a.tipo,
            'tipo': a.tipo,
            'immagine_url': a.immagine_principale,
            'prezzo_listino': a.prezzo_listino
        } for a in lead.asset_interests]
    }), 200


# GET - Storico passaggi di fase
@lead_bp.route('/club/leads/<int:lead_id>/stage-history', methods=['GET'])
@jwt_required()
def get_lead_stage_history(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    entries = LeadStageHistory.query.filter_by(lead_id=lead_id)\
        .order_by(LeadStageHistory.changed_at.asc()).all()

    history = []
    for i, entry in enumerate(entries):
        # Calculate duration in this stage (until next entry or now)
        if i + 1 < len(entries):
            next_change = entries[i + 1].changed_at
        else:
            next_change = datetime.utcnow()

        duration_seconds = (next_change - entry.changed_at).total_seconds()
        duration_hours = duration_seconds / 3600
        duration_days = duration_seconds / 86400

        history.append({
            'id': entry.id,
            'from_status': entry.from_status,
            'to_status': entry.to_status,
            'valore_al_momento': entry.valore_al_momento,
            'probabilita_al_momento': entry.probabilita_al_momento,
            'changed_at': entry.changed_at.isoformat(),
            'duration_hours': round(duration_hours, 1),
            'duration_days': round(duration_days, 1),
            'is_current': i == len(entries) - 1
        })

    return jsonify(history), 200


# POST - Crea nuovo lead
@lead_bp.route('/club/leads', methods=['POST'])
@jwt_required()
def create_lead():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi richiesti
    if not data.get('ragione_sociale'):
        return jsonify({'error': 'Ragione sociale è obbligatoria'}), 400

    # Duplicate check (skip if force=true)
    if not data.get('force'):
        duplicates = []
        ragione = data['ragione_sociale'].strip()

        # Check ragione_sociale (case-insensitive)
        by_name = Lead.query.filter(
            Lead.club_id == club_id,
            db.func.lower(Lead.ragione_sociale) == ragione.lower()
        ).all()
        for d in by_name:
            duplicates.append({
                'id': d.id, 'ragione_sociale': d.ragione_sociale,
                'email': d.email, 'status': d.status,
                'match_field': 'ragione_sociale'
            })

        # Check email (if provided)
        email = (data.get('email') or '').strip()
        if email:
            by_email = Lead.query.filter(
                Lead.club_id == club_id,
                db.func.lower(Lead.email) == email.lower(),
                Lead.id.notin_([d['id'] for d in duplicates])
            ).all()
            for d in by_email:
                duplicates.append({
                    'id': d.id, 'ragione_sociale': d.ragione_sociale,
                    'email': d.email, 'status': d.status,
                    'match_field': 'email'
                })

        # Check partita_iva (if provided)
        piva = (data.get('partita_iva') or '').strip()
        if piva:
            by_piva = Lead.query.filter(
                Lead.club_id == club_id,
                Lead.partita_iva == piva,
                Lead.id.notin_([d['id'] for d in duplicates])
            ).all()
            for d in by_piva:
                duplicates.append({
                    'id': d.id, 'ragione_sociale': d.ragione_sociale,
                    'email': d.email, 'status': d.status,
                    'match_field': 'partita_iva'
                })

        if duplicates:
            return jsonify({
                'warning': 'duplicate',
                'message': 'Possibili duplicati trovati',
                'duplicates': duplicates
            }), 409

    # Validazione status
    valid_statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']
    status = data.get('status', 'nuovo')
    if status not in valid_statuses:
        return jsonify({'error': f'Status non valido. Valori accettati: {", ".join(valid_statuses)}'}), 400

    # Parsing data prossimo contatto
    data_prossimo_contatto = None
    if data.get('data_prossimo_contatto'):
        try:
            data_prossimo_contatto = datetime.fromisoformat(data['data_prossimo_contatto'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'Formato data_prossimo_contatto non valido'}), 400

    lead = Lead(
        club_id=club_id,
        ragione_sociale=data['ragione_sociale'],
        partita_iva=data.get('partita_iva'),
        codice_fiscale=data.get('codice_fiscale'),
        settore_merceologico=data.get('settore_merceologico'),
        logo_url=data.get('logo_url'),
        indirizzo_sede=data.get('indirizzo_sede'),
        email=data.get('email'),
        telefono=data.get('telefono'),
        sito_web=data.get('sito_web'),
        facebook=data.get('facebook'),
        instagram=data.get('instagram'),
        tiktok=data.get('tiktok'),
        linkedin=data.get('linkedin'),
        twitter=data.get('twitter'),
        referente_nome=data.get('referente_nome'),
        referente_cognome=data.get('referente_cognome'),
        referente_ruolo=data.get('referente_ruolo'),
        referente_contatto=data.get('referente_contatto'),
        status=status,
        valore_stimato=data.get('valore_stimato', 0),
        probabilita_chiusura=data.get('probabilita_chiusura', 0),
        fonte=data.get('fonte'),
        note=data.get('note'),
        data_prossimo_contatto=data_prossimo_contatto,
        priorita=data.get('priorita', 2)
    )

    db.session.add(lead)
    db.session.flush()  # get lead.id before committing

    # Record initial stage
    _record_stage_change(lead, None, lead.status)
    db.session.commit()

    return jsonify({
        'message': 'Lead creato con successo',
        'lead': {
            'id': lead.id,
            'ragione_sociale': lead.ragione_sociale,
            'status': lead.status
        }
    }), 201


# PUT - Aggiorna lead
@lead_bp.route('/club/leads/<int:lead_id>', methods=['PUT'])
@jwt_required()
def update_lead(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Non permettere modifiche ai lead convertiti (eccetto note)
    if lead.convertito:
        return jsonify({'error': 'Non puoi modificare un lead già convertito'}), 400

    data = request.get_json()

    # Validazione status
    old_status_for_history = lead.status
    if 'status' in data:
        valid_statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']
        if data['status'] not in valid_statuses:
            return jsonify({'error': f'Status non valido. Valori accettati: {", ".join(valid_statuses)}'}), 400
        lead.status = data['status']

    # Aggiorna altri campi
    updatable_fields = [
        'ragione_sociale', 'partita_iva', 'codice_fiscale', 'settore_merceologico',
        'logo_url', 'indirizzo_sede', 'email', 'telefono', 'sito_web',
        'facebook', 'instagram', 'tiktok', 'linkedin', 'twitter',
        'referente_nome', 'referente_cognome', 'referente_ruolo', 'referente_contatto',
        'valore_stimato', 'probabilita_chiusura', 'fonte', 'note', 'motivo_perdita', 'priorita'
    ]

    for field in updatable_fields:
        if field in data:
            setattr(lead, field, data[field])

    # Parsing data prossimo contatto
    if 'data_prossimo_contatto' in data:
        if data['data_prossimo_contatto']:
            try:
                lead.data_prossimo_contatto = datetime.fromisoformat(data['data_prossimo_contatto'].replace('Z', '+00:00'))
            except (ValueError, AttributeError):
                return jsonify({'error': 'Formato data_prossimo_contatto non valido'}), 400
        else:
            lead.data_prossimo_contatto = None

    # Record stage change if status was modified
    if 'status' in data:
        _record_stage_change(lead, old_status_for_history, lead.status)

    db.session.commit()

    return jsonify({
        'message': 'Lead aggiornato con successo',
        'lead': {
            'id': lead.id,
            'ragione_sociale': lead.ragione_sociale,
            'status': lead.status
        }
    }), 200


# DELETE - Elimina lead
@lead_bp.route('/club/leads/<int:lead_id>', methods=['DELETE'])
@jwt_required()
def delete_lead(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Non permettere eliminazione di lead convertiti
    if lead.convertito:
        return jsonify({'error': 'Non puoi eliminare un lead già convertito. Lo storico deve essere preservato.'}), 400

    db.session.delete(lead)
    db.session.commit()

    return jsonify({'message': 'Lead eliminato con successo'}), 200


# ==================== CAMBIO STATUS ====================

# PATCH - Cambia status del lead (per drag & drop Kanban)
@lead_bp.route('/club/leads/<int:lead_id>/status', methods=['PATCH'])
@jwt_required()
def change_lead_status(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if lead.convertito:
        return jsonify({'error': 'Non puoi modificare lo status di un lead già convertito'}), 400

    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']
    if new_status not in valid_statuses:
        return jsonify({'error': f'Status non valido. Valori accettati: {", ".join(valid_statuses)}'}), 400

    old_status = lead.status
    lead.status = new_status

    # Se perso, salva motivo
    if new_status == 'perso' and data.get('motivo_perdita'):
        lead.motivo_perdita = data['motivo_perdita']

    _record_stage_change(lead, old_status, new_status)
    db.session.commit()

    # Crea attività automatica per il cambio status
    activity = LeadActivity(
        lead_id=lead_id,
        club_id=club_id,
        tipo='nota',
        titolo=f'Status cambiato: {old_status} → {new_status}',
        descrizione=data.get('motivo_perdita') if new_status == 'perso' else None,
        data_attivita=datetime.utcnow(),
        nuovo_status=new_status,
        creato_da='Sistema'
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Status aggiornato con successo',
        'lead': {
            'id': lead.id,
            'old_status': old_status,
            'new_status': new_status
        }
    }), 200


# ==================== CONVERSIONE A SPONSOR ====================

# POST - Converti lead a sponsor
@lead_bp.route('/club/leads/<int:lead_id>/convert', methods=['POST'])
@jwt_required()
def convert_lead_to_sponsor(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    if lead.convertito:
        return jsonify({'error': 'Questo lead è già stato convertito'}), 400

    data = request.get_json()

    # Password obbligatoria per creare l'account sponsor
    if not data.get('password'):
        return jsonify({'error': 'Password obbligatoria per creare l\'account sponsor'}), 400

    # Email obbligatoria
    email = data.get('email') or lead.email
    if not email:
        return jsonify({'error': 'Email obbligatoria per creare l\'account sponsor'}), 400

    # Verifica che l'email non sia già usata da un altro sponsor
    existing_sponsor = Sponsor.query.filter_by(email=email, club_id=club_id).first()
    if existing_sponsor:
        return jsonify({'error': 'Esiste già uno sponsor con questa email'}), 400

    # Crea il nuovo sponsor con i dati del lead
    sponsor = Sponsor(
        club_id=club_id,
        ragione_sociale=lead.ragione_sociale,
        partita_iva=lead.partita_iva,
        codice_fiscale=lead.codice_fiscale,
        settore_merceologico=lead.settore_merceologico,
        logo_url=lead.logo_url,
        indirizzo_sede=lead.indirizzo_sede,
        email=email,
        telefono=lead.telefono,
        sito_web=lead.sito_web,
        facebook=lead.facebook,
        instagram=lead.instagram,
        tiktok=lead.tiktok,
        linkedin=lead.linkedin,
        twitter=lead.twitter,
        referente_nome=lead.referente_nome,
        referente_cognome=lead.referente_cognome,
        referente_ruolo=lead.referente_ruolo,
        referente_contatto=lead.referente_contatto,
        # Link alla lead di origine
        from_lead_id=lead.id,
        data_conversione_lead=datetime.utcnow()
    )
    sponsor.set_password(data['password'])

    db.session.add(sponsor)
    db.session.flush()  # Per ottenere l'ID dello sponsor

    # Trasferisci contatti dal lead allo sponsor
    lead_contacts = ContactPerson.query.filter_by(lead_id=lead_id, club_id=club_id).all()
    for lc in lead_contacts:
        new_contact = ContactPerson(
            club_id=club_id,
            sponsor_id=sponsor.id,
            lead_id=None,
            nome=lc.nome,
            cognome=lc.cognome,
            ruolo=lc.ruolo,
            email=lc.email,
            telefono=lc.telefono,
            ruolo_decisionale=lc.ruolo_decisionale,
            linkedin=lc.linkedin,
            note=lc.note,
            is_referente_principale=lc.is_referente_principale,
        )
        db.session.add(new_contact)

    # Aggiorna il lead come convertito
    old_status_before_conversion = lead.status
    lead.convertito = True
    lead.sponsor_id = sponsor.id
    lead.data_conversione = datetime.utcnow()
    lead.status = 'vinto'

    _record_stage_change(lead, old_status_before_conversion, 'vinto')

    # Crea attività di conversione
    activity = LeadActivity(
        lead_id=lead_id,
        club_id=club_id,
        tipo='nota',
        titolo='Lead convertito in Sponsor',
        descrizione=f'Il lead è stato convertito in sponsor con ID #{sponsor.id}',
        data_attivita=datetime.utcnow(),
        nuovo_status='vinto',
        creato_da='Sistema'
    )
    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Lead convertito in sponsor con successo!',
        'sponsor': {
            'id': sponsor.id,
            'ragione_sociale': sponsor.ragione_sociale,
            'email': sponsor.email
        },
        'lead': {
            'id': lead.id,
            'convertito': True,
            'data_conversione': lead.data_conversione.isoformat()
        }
    }), 201


# ==================== LEAD PROPOSALS ====================

# GET - Lista proposte per un lead
@lead_bp.route('/club/leads/<int:lead_id>/proposals', methods=['GET'])
@jwt_required()
def get_lead_proposals(lead_id):
    """Lista proposte associate a un lead"""
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    from app.models import Proposal

    proposals = Proposal.query.filter_by(
        club_id=club_id,
        lead_id=lead_id
    ).order_by(Proposal.created_at.desc()).all()

    proposals_data = []
    for p in proposals:
        proposals_data.append({
            'id': p.id,
            'codice': p.codice,
            'titolo': p.titolo,
            'stato': p.stato,
            'valore_totale': p.valore_totale,
            'valore_finale': p.valore_finale,
            'sconto_percentuale': p.sconto_percentuale,
            'data_scadenza': p.data_scadenza.isoformat() if p.data_scadenza else None,
            'data_invio': p.data_invio.isoformat() if p.data_invio else None,
            'data_accettazione': p.data_accettazione.isoformat() if p.data_accettazione else None,
            'created_at': p.created_at.isoformat() if p.created_at else None,
            'link_condivisione': p.link_condivisione,
            'link_attivo': p.link_attivo,
            'visualizzazioni': p.visualizzazioni,
            'convertita_in_contratto': p.convertita_in_contratto,
            'contratto_id': p.contratto_id
        })

    # Statistiche
    totale = len(proposals)
    inviate = len([p for p in proposals if p.stato == 'inviata'])
    accettate = len([p for p in proposals if p.stato == 'accettata'])
    rifiutate = len([p for p in proposals if p.stato == 'rifiutata'])
    in_trattativa = len([p for p in proposals if p.stato == 'in_trattativa'])
    valore_totale = sum(p.valore_finale or p.valore_totale or 0 for p in proposals)

    return jsonify({
        'proposals': proposals_data,
        'stats': {
            'totale': totale,
            'bozze': len([p for p in proposals if p.stato == 'bozza']),
            'inviate': inviate,
            'accettate': accettate,
            'rifiutate': rifiutate,
            'in_trattativa': in_trattativa,
            'valore_totale': valore_totale
        }
    }), 200


# ==================== LEAD ACTIVITIES ====================

# GET - Lista attività di un lead
@lead_bp.route('/club/leads/<int:lead_id>/activities', methods=['GET'])
@jwt_required()
def get_lead_activities(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activities = LeadActivity.query.filter_by(lead_id=lead_id)\
        .order_by(LeadActivity.data_attivita.desc()).all()

    activities_data = []
    for activity in activities:
        activities_data.append({
            'id': activity.id,
            'tipo': activity.tipo,
            'titolo': activity.titolo,
            'descrizione': activity.descrizione,
            'data_attivita': activity.data_attivita.isoformat() if activity.data_attivita else None,
            'contatto_nome': activity.contatto_nome,
            'esito': activity.esito,
            'nuovo_status': activity.nuovo_status,
            'data_followup': activity.data_followup.isoformat() if activity.data_followup else None,
            'followup_completato': activity.followup_completato,
            'creato_da': activity.creato_da,
            'created_at': activity.created_at.isoformat() if activity.created_at else None
        })

    return jsonify(activities_data), 200


# POST - Crea nuova attività per lead
@lead_bp.route('/club/leads/<int:lead_id>/activities', methods=['POST'])
@jwt_required()
def create_lead_activity(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione campi richiesti
    required_fields = ['tipo', 'titolo', 'data_attivita']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f'Campo {field} richiesto'}), 400

    # Validazione tipo
    valid_types = ['chiamata', 'meeting', 'email', 'nota', 'proposta', 'altro']
    if data['tipo'] not in valid_types:
        return jsonify({'error': f'Tipo non valido. Valori accettati: {", ".join(valid_types)}'}), 400

    # Parsing date
    try:
        data_attivita = datetime.fromisoformat(data['data_attivita'].replace('Z', '+00:00'))
    except (ValueError, AttributeError):
        return jsonify({'error': 'Formato data_attivita non valido'}), 400

    data_followup = None
    if data.get('data_followup'):
        try:
            data_followup = datetime.fromisoformat(data['data_followup'].replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            return jsonify({'error': 'Formato data_followup non valido'}), 400

    activity = LeadActivity(
        lead_id=lead_id,
        club_id=club_id,
        tipo=data['tipo'],
        titolo=data['titolo'],
        descrizione=data.get('descrizione'),
        data_attivita=data_attivita,
        contatto_nome=data.get('contatto_nome'),
        esito=data.get('esito'),
        nuovo_status=data.get('nuovo_status'),
        data_followup=data_followup,
        followup_completato=False,
        creato_da=data.get('creato_da', 'Club')
    )

    # Se c'è un nuovo status, aggiorna anche il lead
    if data.get('nuovo_status') and not lead.convertito:
        valid_statuses = ['nuovo', 'contattato', 'in_trattativa', 'proposta_inviata', 'negoziazione', 'vinto', 'perso']
        if data['nuovo_status'] in valid_statuses:
            old_activity_status = lead.status
            lead.status = data['nuovo_status']
            _record_stage_change(lead, old_activity_status, data['nuovo_status'])

    db.session.add(activity)
    db.session.commit()

    return jsonify({
        'message': 'Attività creata con successo',
        'activity': {
            'id': activity.id,
            'tipo': activity.tipo,
            'titolo': activity.titolo
        }
    }), 201


# DELETE - Elimina attività
@lead_bp.route('/club/leads/<int:lead_id>/activities/<int:activity_id>', methods=['DELETE'])
@jwt_required()
def delete_lead_activity(lead_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = LeadActivity.query.get_or_404(activity_id)
    if activity.club_id != club_id or activity.lead_id != lead_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    db.session.delete(activity)
    db.session.commit()

    return jsonify({'message': 'Attività eliminata con successo'}), 200


# PATCH - Completa follow-up
@lead_bp.route('/club/leads/<int:lead_id>/activities/<int:activity_id>/complete-followup', methods=['PATCH'])
@jwt_required()
def complete_lead_followup(lead_id, activity_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity = LeadActivity.query.get_or_404(activity_id)
    if activity.club_id != club_id or activity.lead_id != lead_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    activity.followup_completato = True
    db.session.commit()

    return jsonify({
        'message': 'Follow-up completato',
        'activity_id': activity.id
    }), 200


# ==================== LEAD SCORE CONFIG ====================

# GET - Recupera configurazione lead score (o default)
@lead_bp.route('/club/lead-score-config', methods=['GET'])
@jwt_required()
def get_lead_score_config():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    config = LeadScoreConfig.query.filter_by(club_id=club_id).first()

    # Default values if no config exists
    if not config:
        return jsonify({
            'weight_profile': 15,
            'weight_deal': 25,
            'weight_engagement': 25,
            'weight_pipeline': 25,
            'weight_contacts': 10,
            'threshold_cold': 33,
            'threshold_warm': 66,
            'is_default': True
        }), 200

    return jsonify({
        'id': config.id,
        'weight_profile': config.weight_profile,
        'weight_deal': config.weight_deal,
        'weight_engagement': config.weight_engagement,
        'weight_pipeline': config.weight_pipeline,
        'weight_contacts': config.weight_contacts,
        'threshold_cold': config.threshold_cold,
        'threshold_warm': config.threshold_warm,
        'is_default': False,
        'created_at': config.created_at.isoformat() if config.created_at else None,
        'updated_at': config.updated_at.isoformat() if config.updated_at else None
    }), 200


# PUT - Salva configurazione lead score
@lead_bp.route('/club/lead-score-config', methods=['PUT'])
@jwt_required()
def update_lead_score_config():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    # Validazione pesi (devono sommare a 100)
    weights = [
        data.get('weight_profile', 15),
        data.get('weight_deal', 25),
        data.get('weight_engagement', 25),
        data.get('weight_pipeline', 25),
        data.get('weight_contacts', 10)
    ]

    if sum(weights) != 100:
        return jsonify({'error': 'I pesi delle categorie devono sommare a 100'}), 400

    # Validazione soglie
    threshold_cold = data.get('threshold_cold', 33)
    threshold_warm = data.get('threshold_warm', 66)

    if not (0 < threshold_cold < threshold_warm < 100):
        return jsonify({'error': 'Le soglie devono essere: 0 < freddo < tiepido < 100'}), 400

    # Cerca config esistente o crea nuova
    config = LeadScoreConfig.query.filter_by(club_id=club_id).first()

    if not config:
        config = LeadScoreConfig(club_id=club_id)
        db.session.add(config)

    # Aggiorna valori
    config.weight_profile = weights[0]
    config.weight_deal = weights[1]
    config.weight_engagement = weights[2]
    config.weight_pipeline = weights[3]
    config.weight_contacts = weights[4]
    config.threshold_cold = threshold_cold
    config.threshold_warm = threshold_warm

    db.session.commit()

    return jsonify({
        'message': 'Configurazione salvata con successo',
        'config': {
            'id': config.id,
            'weight_profile': config.weight_profile,
            'weight_deal': config.weight_deal,
            'weight_engagement': config.weight_engagement,
            'weight_pipeline': config.weight_pipeline,
            'weight_contacts': config.weight_contacts,
            'threshold_cold': config.threshold_cold,
            'threshold_warm': config.threshold_warm
        }
    }), 200


# POST - Reset configurazione a valori default
@lead_bp.route('/club/lead-score-config/reset', methods=['POST'])
@jwt_required()
def reset_lead_score_config():
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    config = LeadScoreConfig.query.filter_by(club_id=club_id).first()

    if config:
        db.session.delete(config)
        db.session.commit()

    return jsonify({
        'message': 'Configurazione resettata ai valori default',
        'config': {
            'weight_profile': 15,
            'weight_deal': 25,
            'weight_engagement': 25,
            'weight_pipeline': 25,
            'weight_contacts': 10,
            'threshold_cold': 33,
            'threshold_warm': 66
        }
    }), 200


# ==================== ASSET INTERESTS (Interessi Asset Lead) ====================

# GET - Ottieni asset interests di un lead
@lead_bp.route('/club/leads/<int:lead_id>/asset-interests', methods=['GET'])
@jwt_required()
def get_lead_asset_interests(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    interests = []
    for asset in lead.asset_interests:
        interests.append({
            'id': asset.id,
            'nome': asset.nome,
            'categoria': asset.category.nome if asset.category else asset.tipo,
            'tipo': asset.tipo,
            'immagine_url': asset.immagine_principale,
            'descrizione': asset.descrizione,
            'prezzo_listino': asset.prezzo_listino,
            'quantita_totale': asset.quantita_totale
        })

    return jsonify({'asset_interests': interests}), 200


# POST - Aggiungi asset interest
@lead_bp.route('/club/leads/<int:lead_id>/asset-interests', methods=['POST'])
@jwt_required()
def add_lead_asset_interest(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    asset_id = data.get('asset_id')

    if not asset_id:
        return jsonify({'error': 'asset_id è obbligatorio'}), 400

    asset = InventoryAsset.query.get(asset_id)
    if not asset or asset.club_id != club_id:
        return jsonify({'error': 'Asset non trovato'}), 404

    # Check if already interested
    if asset in lead.asset_interests:
        return jsonify({'error': 'Asset già presente negli interessi'}), 400

    lead.asset_interests.append(asset)
    db.session.commit()

    return jsonify({
        'message': 'Asset aggiunto agli interessi',
        'asset': {
            'id': asset.id,
            'nome': asset.nome,
            'categoria': asset.category.nome if asset.category else asset.tipo,
            'immagine_url': asset.immagine_principale
        }
    }), 201


# POST - Aggiungi multipli asset interests
@lead_bp.route('/club/leads/<int:lead_id>/asset-interests/bulk', methods=['POST'])
@jwt_required()
def add_lead_asset_interests_bulk(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    asset_ids = data.get('asset_ids', [])

    if not asset_ids:
        return jsonify({'error': 'asset_ids è obbligatorio'}), 400

    added = []
    for asset_id in asset_ids:
        asset = InventoryAsset.query.get(asset_id)
        if asset and asset.club_id == club_id and asset not in lead.asset_interests:
            lead.asset_interests.append(asset)
            added.append({
                'id': asset.id,
                'nome': asset.nome,
                'categoria': asset.category.nome if asset.category else asset.tipo
            })

    db.session.commit()

    return jsonify({
        'message': f'{len(added)} asset aggiunti agli interessi',
        'added_assets': added
    }), 201


# DELETE - Rimuovi asset interest
@lead_bp.route('/club/leads/<int:lead_id>/asset-interests/<int:asset_id>', methods=['DELETE'])
@jwt_required()
def remove_lead_asset_interest(lead_id, asset_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    asset = InventoryAsset.query.get(asset_id)
    if not asset:
        return jsonify({'error': 'Asset non trovato'}), 404

    if asset not in lead.asset_interests:
        return jsonify({'error': 'Asset non presente negli interessi'}), 404

    lead.asset_interests.remove(asset)
    db.session.commit()

    return jsonify({'message': 'Asset rimosso dagli interessi'}), 200


# PUT - Sostituisci tutti gli asset interests
@lead_bp.route('/club/leads/<int:lead_id>/asset-interests', methods=['PUT'])
@jwt_required()
def set_lead_asset_interests(lead_id):
    club_id = verify_club()
    if not club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    lead = Lead.query.get_or_404(lead_id)
    if lead.club_id != club_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()
    asset_ids = data.get('asset_ids', [])

    # Clear existing interests
    lead.asset_interests.clear()

    # Add new interests
    for asset_id in asset_ids:
        asset = InventoryAsset.query.get(asset_id)
        if asset and asset.club_id == club_id:
            lead.asset_interests.append(asset)

    db.session.commit()

    interests = [{
        'id': a.id,
        'nome': a.nome,
        'categoria': a.category.nome if a.category else a.tipo,
        'immagine_url': a.immagine_principale
    } for a in lead.asset_interests]

    return jsonify({
        'message': 'Interessi asset aggiornati',
        'asset_interests': interests
    }), 200
