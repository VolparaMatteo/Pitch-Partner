from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import (
    Event, EventParticipant, EventInvitation, EventRegistrationForm,
    Club, Sponsor, Notification, EventAssetActivation,
    AssetAllocation, InventoryAsset, HeadOfTerms
)
from datetime import datetime
import json

event_bp = Blueprint('event', __name__)


# CREATE - Crea nuovo evento
@event_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role not in ['club', 'sponsor']:
        return jsonify({'error': 'Solo club e sponsor possono creare eventi'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('titolo') or not data.get('data_ora_inizio'):
        return jsonify({'error': 'Titolo e data/ora inizio sono obbligatori'}), 400

    # Ottieni nome creatore
    if role == 'club':
        club = Club.query.get(user_id)
        creator_name = club.nome if club else 'Club'
        club_id = user_id
    else:  # sponsor
        sponsor = Sponsor.query.get(user_id)
        creator_name = sponsor.ragione_sociale if sponsor else 'Sponsor'
        club_id = sponsor.club_id if sponsor else None

    if not club_id:
        return jsonify({'error': 'Club ID non trovato'}), 400

    try:
        # Crea evento
        event = Event(
            club_id=club_id,
            sponsor_id=data.get('sponsor_id') if role == 'club' else user_id,
            contract_id=data.get('contract_id'),
            titolo=data['titolo'],
            tipo=data.get('tipo'),
            data_ora_inizio=datetime.fromisoformat(data['data_ora_inizio'].replace('Z', '+00:00')),
            data_ora_fine=datetime.fromisoformat(data['data_ora_fine'].replace('Z', '+00:00')) if data.get('data_ora_fine') else None,
            luogo=data.get('luogo'),
            indirizzo=data.get('indirizzo'),
            online=data.get('online', False),
            link_meeting=data.get('link_meeting'),
            descrizione=data.get('descrizione'),
            agenda=data.get('agenda'),
            visibile_a=data.get('visibile_a', 'tutti'),
            creato_da_tipo=role,
            creato_da_id=user_id,
            creato_da_nome=creator_name,
            status='programmato',
            richiede_iscrizione=data.get('richiede_iscrizione', False),
            max_iscrizioni=data.get('max_iscrizioni'),
            registration_form_schema=json.dumps(data['registration_form_schema']) if data.get('registration_form_schema') else None
        )

        db.session.add(event)
        db.session.flush()  # Per ottenere l'ID dell'evento

        # Crea inviti per sponsor selezionati
        if data.get('invited_sponsors') and isinstance(data['invited_sponsors'], list):
            for sponsor_id in data['invited_sponsors']:
                invitation = EventInvitation(
                    event_id=event.id,
                    sponsor_id=int(sponsor_id)
                )
                db.session.add(invitation)

                # Crea notifica per sponsor invitato
                notification = Notification(
                    user_type='sponsor',
                    user_id=int(sponsor_id),
                    tipo='invito_evento',
                    titolo=f'Invito evento: {event.titolo}',
                    messaggio=f'Sei stato invitato all\'evento "{event.titolo}" del {event.data_ora_inizio.strftime("%d/%m/%Y %H:%M")}',
                    link=f'/events/{event.id}'
                )
                db.session.add(notification)

        # Aggiungi partecipanti se specificati
        if data.get('partecipanti'):
            for p in data['partecipanti']:
                participant = EventParticipant(
                    event_id=event.id,
                    user_type=p.get('user_type'),
                    user_id=p.get('user_id'),
                    nome=p['nome'],
                    email=p['email'],
                    ruolo=p.get('ruolo', 'partecipante')
                )
                db.session.add(participant)

                # Crea notifica per partecipante
                if p.get('user_type') and p.get('user_id'):
                    notification = Notification(
                        user_type=p['user_type'],
                        user_id=p['user_id'],
                        tipo='nuovo_evento',
                        titolo=f'Invito a evento: {event.titolo}',
                        messaggio=f'Sei stato invitato all\'evento "{event.titolo}" del {event.data_ora_inizio.strftime("%d/%m/%Y %H:%M")}',
                        link=f'/events/{event.id}'
                    )
                    db.session.add(notification)

        db.session.commit()

        return jsonify({
            'message': 'Evento creato con successo',
            'event': {
                'id': event.id,
                'titolo': event.titolo,
                'tipo': event.tipo,
                'data_ora_inizio': event.data_ora_inizio.isoformat(),
                'status': event.status
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni tutti gli eventi
@event_bp.route('/events', methods=['GET'])
@jwt_required()
def get_events():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Filtri
    tipo = request.args.get('tipo')
    status = request.args.get('status')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    if role == 'club':
        query = Event.query.filter_by(club_id=user_id)
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404
        # Sponsor vede eventi del club o eventi in cui è partecipante
        query = Event.query.filter(
            (Event.club_id == sponsor.club_id) |
            (Event.sponsor_id == user_id)
        )
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Applica filtri
    if tipo:
        query = query.filter_by(tipo=tipo)
    if status:
        query = query.filter_by(status=status)
    if from_date:
        query = query.filter(Event.data_ora_inizio >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(Event.data_ora_inizio <= datetime.fromisoformat(to_date))

    events = query.order_by(Event.data_ora_inizio.asc()).all()

    events_data = []
    for event in events:
        # Conta partecipanti (vecchio sistema)
        participants_count = len(event.participants)
        confirmed_count = sum(1 for p in event.participants if p.confermato)

        # Conta iscrizioni (nuovo sistema con form)
        registrations_count = 0
        if event.richiede_iscrizione:
            registrations_count = EventRegistrationForm.query.filter_by(event_id=event.id).count()

        events_data.append({
            'id': event.id,
            'club_id': event.club_id,
            'sponsor_id': event.sponsor_id,
            'contract_id': event.contract_id,
            'titolo': event.titolo,
            'tipo': event.tipo,
            'data_ora_inizio': event.data_ora_inizio.isoformat(),
            'data_ora_fine': event.data_ora_fine.isoformat() if event.data_ora_fine else None,
            'luogo': event.luogo,
            'indirizzo': event.indirizzo,
            'online': event.online,
            'descrizione': event.descrizione,
            'creato_da_tipo': event.creato_da_tipo,
            'creato_da_nome': event.creato_da_nome,
            'status': event.status,
            'participants_count': participants_count,
            'confirmed_count': confirmed_count,
            'registrations_count': registrations_count,
            'created_at': event.created_at.isoformat()
        })

    return jsonify({'events': events_data}), 200


# READ - Ottieni singolo evento
@event_bp.route('/events/<int:event_id>', methods=['GET'])
@jwt_required()
def get_event(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Verifica accesso
    if role == 'club':
        if event.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        # Sponsor può vedere se è del suo club o se è partecipante
        is_participant = EventParticipant.query.filter_by(event_id=event_id, user_id=user_id, user_type='sponsor').first()
        if not sponsor or (sponsor.club_id != event.club_id and not is_participant):
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Partecipanti
    participants_data = []
    for p in event.participants:
        participants_data.append({
            'id': p.id,
            'user_type': p.user_type,
            'user_id': p.user_id,
            'nome': p.nome,
            'email': p.email,
            'ruolo': p.ruolo,
            'invitato': p.invitato,
            'confermato': p.confermato,
            'presente': p.presente,
            'note': p.note
        })

    # Registrazioni (per eventi con iscrizione)
    registrations_data = []
    sponsor_registration = None

    if event.richiede_iscrizione:
        registrations = EventRegistrationForm.query.filter_by(event_id=event_id).all()
        for reg in registrations:
            if reg.sponsor_id:
                # Iscrizione da sponsor loggato
                sponsor = Sponsor.query.get(reg.sponsor_id)
                sponsor_nome = sponsor.ragione_sociale if sponsor else 'Sponsor Eliminato'
            else:
                # Iscrizione pubblica (utente esterno)
                form_data_dict = json.loads(reg.form_data) if reg.form_data else {}
                # Prova a estrarre nome da campi comuni
                sponsor_nome = form_data_dict.get('Nome', form_data_dict.get('Nome completo', form_data_dict.get('Nome Referente', 'Utente Pubblico')))

            registrations_data.append({
                'id': reg.id,
                'sponsor_id': reg.sponsor_id,
                'sponsor_nome': sponsor_nome,
                'is_public': reg.sponsor_id is None,
                'form_data': reg.form_data,
                'status': reg.status,
                'confermato': reg.confermato,
                'presente': reg.presente,
                'registrato_il': reg.registrato_il.isoformat(),
                'confermato_il': reg.confermato_il.isoformat() if reg.confermato_il else None,
                'note_club': reg.note_club,
                'note_sponsor': reg.note_sponsor
            })

        # Se è sponsor, ottieni la sua registrazione
        if role == 'sponsor':
            sponsor_registration = EventRegistrationForm.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
            if sponsor_registration:
                sponsor_registration = {
                    'id': sponsor_registration.id,
                    'form_data': sponsor_registration.form_data,
                    'status': sponsor_registration.status,
                    'confermato': sponsor_registration.confermato,
                    'presente': sponsor_registration.presente,
                    'registrato_il': sponsor_registration.registrato_il.isoformat()
                }

    # Verifica se sponsor è invitato
    is_invited = False
    if role == 'sponsor':
        invitation = EventInvitation.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
        is_invited = invitation is not None

    return jsonify({
        'id': event.id,
        'club_id': event.club_id,
        'sponsor_id': event.sponsor_id,
        'contract_id': event.contract_id,
        'titolo': event.titolo,
        'tipo': event.tipo,
        'data_ora_inizio': event.data_ora_inizio.isoformat(),
        'data_ora_fine': event.data_ora_fine.isoformat() if event.data_ora_fine else None,
        'luogo': event.luogo,
        'indirizzo': event.indirizzo,
        'online': event.online,
        'link_meeting': event.link_meeting,
        'descrizione': event.descrizione,
        'agenda': event.agenda,
        'visibile_a': event.visibile_a,
        'creato_da_tipo': event.creato_da_tipo,
        'creato_da_id': event.creato_da_id,
        'creato_da_nome': event.creato_da_nome,
        'status': event.status,
        'richiede_iscrizione': event.richiede_iscrizione,
        'max_iscrizioni': event.max_iscrizioni,
        'registration_form_schema': event.registration_form_schema,
        'registrations': registrations_data,
        'registrations_count': len(registrations_data),
        'sponsor_registration': sponsor_registration,
        'is_invited': is_invited,
        'materiali_url': json.loads(event.materiali_url) if event.materiali_url else [],
        'foto_evento': json.loads(event.foto_evento) if event.foto_evento else [],
        'participants': participants_data,
        'created_at': event.created_at.isoformat()
    }), 200


# UPDATE - Aggiorna evento
@event_bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Verifica accesso - solo creatore può modificare
    if event.creato_da_tipo != role or event.creato_da_id != user_id:
        return jsonify({'error': 'Solo il creatore può modificare l\'evento'}), 403

    data = request.get_json()

    try:
        # Aggiorna campi
        if 'titolo' in data:
            event.titolo = data['titolo']
        if 'tipo' in data:
            event.tipo = data['tipo']
        if 'data_ora_inizio' in data:
            event.data_ora_inizio = datetime.fromisoformat(data['data_ora_inizio'].replace('Z', '+00:00'))
        if 'data_ora_fine' in data:
            event.data_ora_fine = datetime.fromisoformat(data['data_ora_fine'].replace('Z', '+00:00')) if data['data_ora_fine'] else None
        if 'luogo' in data:
            event.luogo = data['luogo']
        if 'indirizzo' in data:
            event.indirizzo = data['indirizzo']
        if 'online' in data:
            event.online = data['online']
        if 'link_meeting' in data:
            event.link_meeting = data['link_meeting']
        if 'descrizione' in data:
            event.descrizione = data['descrizione']
        if 'agenda' in data:
            event.agenda = data['agenda']
        if 'status' in data:
            event.status = data['status']
        if 'materiali_url' in data:
            event.materiali_url = json.dumps(data['materiali_url'])
        if 'foto_evento' in data:
            event.foto_evento = json.dumps(data['foto_evento'])

        event.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Evento aggiornato con successo',
            'event': {
                'id': event.id,
                'titolo': event.titolo,
                'status': event.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Elimina evento
@event_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Solo creatore può eliminare
    if event.creato_da_tipo != role or event.creato_da_id != user_id:
        return jsonify({'error': 'Solo il creatore può eliminare l\'evento'}), 403

    try:
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Evento eliminato con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Conferma partecipazione
@event_bp.route('/events/<int:event_id>/confirm', methods=['PUT'])
@jwt_required()
def confirm_participation(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Trova partecipante
    participant = EventParticipant.query.filter_by(
        event_id=event_id,
        user_type=role,
        user_id=user_id
    ).first()

    if not participant:
        return jsonify({'error': 'Non sei tra i partecipanti invitati'}), 404

    data = request.get_json()
    participant.confermato = data.get('confermato', True)

    try:
        db.session.commit()
        return jsonify({
            'message': 'Partecipazione confermata' if participant.confermato else 'Partecipazione declinata',
            'confermato': participant.confermato
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Segna presenza
@event_bp.route('/events/<int:event_id>/attendance', methods=['PUT'])
@jwt_required()
def mark_attendance(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può segnare presenze
    if role != 'club':
        return jsonify({'error': 'Solo il club può segnare le presenze'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    data = request.get_json()
    participant_id = data.get('participant_id')
    presente = data.get('presente', True)

    participant = EventParticipant.query.get(participant_id)
    if not participant or participant.event_id != event_id:
        return jsonify({'error': 'Partecipante non trovato'}), 404

    participant.presente = presente

    try:
        db.session.commit()
        return jsonify({
            'message': 'Presenza aggiornata con successo',
            'presente': participant.presente
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500



# ==================== ROUTE PUBBLICHE (SENZA AUTENTICAZIONE) ====================

# GET - Ottieni dettagli evento pubblico (per link pubblico iscrizione)
@event_bp.route('/events/<int:event_id>/public', methods=['GET'])
def get_event_public(event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Verifica che l'evento accetti iscrizioni
    if not event.richiede_iscrizione:
        return jsonify({'error': 'Questo evento non accetta iscrizioni pubbliche'}), 403

    # Conta iscrizioni attuali
    registrations_count = EventRegistrationForm.query.filter_by(event_id=event_id).count()

    return jsonify({
        'id': event.id,
        'titolo': event.titolo,
        'tipo': event.tipo,
        'data_ora_inizio': event.data_ora_inizio.isoformat(),
        'data_ora_fine': event.data_ora_fine.isoformat() if event.data_ora_fine else None,
        'luogo': event.luogo,
        'indirizzo': event.indirizzo,
        'online': event.online,
        'link_meeting': event.link_meeting,
        'descrizione': event.descrizione,
        'agenda': event.agenda,
        'richiede_iscrizione': event.richiede_iscrizione,
        'max_iscrizioni': event.max_iscrizioni,
        'registration_form_schema': event.registration_form_schema,
        'registrations_count': registrations_count
    }), 200


# POST - Iscrizione pubblica (senza autenticazione)
@event_bp.route('/events/<int:event_id>/public-register', methods=['POST'])
def public_register_to_event(event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    if not event.richiede_iscrizione:
        return jsonify({'error': 'Questo evento non accetta iscrizioni'}), 400

    # Verifica limite iscrizioni
    if event.max_iscrizioni:
        current_registrations = EventRegistrationForm.query.filter_by(event_id=event_id).count()
        if current_registrations >= event.max_iscrizioni:
            return jsonify({'error': 'Numero massimo di iscrizioni raggiunto'}), 400

    data = request.get_json()

    if not data.get('form_data'):
        return jsonify({'error': 'Dati form mancanti'}), 400

    try:
        # Crea registrazione pubblica (sponsor_id = None per utenti esterni)
        registration = EventRegistrationForm(
            event_id=event_id,
            sponsor_id=None,  # NULL per iscrizioni pubbliche
            form_data=json.dumps(data['form_data']),
            note_sponsor=data.get('note_sponsor'),
            status='registrato'
        )

        db.session.add(registration)

        # Crea notifica per club
        notification = Notification(
            user_type='club',
            user_id=event.club_id,
            tipo='nuova_iscrizione_evento',
            titolo=f'Nuova iscrizione pubblica: {event.titolo}',
            messaggio=f'Qualcuno si è iscritto all\'evento "{event.titolo}" tramite link pubblico',
            link=f'/events/{event.id}'
        )
        db.session.add(notification)

        db.session.commit()

        return jsonify({
            'message': 'Iscrizione completata con successo',
            'registration': {
                'id': registration.id,
                'event_id': event_id,
                'status': registration.status,
                'registrato_il': registration.registrato_il.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== NUOVE ROUTE PER ISCRIZIONI ====================

# CREATE - Sponsor si iscrive ad evento
@event_bp.route('/events/<int:event_id>/register', methods=['POST'])
@jwt_required()
def register_to_event(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'sponsor':
        return jsonify({'error': 'Solo gli sponsor possono iscriversi'}), 403

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    if not event.richiede_iscrizione:
        return jsonify({'error': 'Questo evento non richiede iscrizione'}), 400

    # Verifica se sponsor è invitato
    invitation = EventInvitation.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
    if not invitation:
        return jsonify({'error': 'Non sei invitato a questo evento'}), 403

    # Verifica se già iscritto
    existing_registration = EventRegistrationForm.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
    if existing_registration:
        return jsonify({'error': 'Sei già iscritto a questo evento'}), 400

    # Verifica limite iscrizioni
    if event.max_iscrizioni:
        current_registrations = EventRegistrationForm.query.filter_by(event_id=event_id).count()
        if current_registrations >= event.max_iscrizioni:
            return jsonify({'error': 'Numero massimo di iscrizioni raggiunto'}), 400

    data = request.get_json()

    if not data.get('form_data'):
        return jsonify({'error': 'Dati form mancanti'}), 400

    try:
        registration = EventRegistrationForm(
            event_id=event_id,
            sponsor_id=user_id,
            form_data=json.dumps(data['form_data']),
            note_sponsor=data.get('note_sponsor'),
            status='registrato'
        )

        db.session.add(registration)

        # Marca invito come visualizzato
        invitation.visualizzato = True
        invitation.visualizzato_il = datetime.utcnow()

        # Crea notifica per club
        notification = Notification(
            user_type='club',
            user_id=event.club_id,
            tipo='nuova_iscrizione_evento',
            titolo=f'Nuova iscrizione evento: {event.titolo}',
            messaggio=f'Uno sponsor si è iscritto all\'evento "{event.titolo}"',
            link=f'/events/{event.id}'
        )
        db.session.add(notification)

        db.session.commit()

        return jsonify({
            'message': 'Iscrizione completata con successo',
            'registration': {
                'id': registration.id,
                'event_id': event_id,
                'status': registration.status,
                'registrato_il': registration.registrato_il.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Aggiorna iscrizione sponsor
@event_bp.route('/events/<int:event_id>/registration', methods=['PUT'])
@jwt_required()
def update_registration(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'sponsor':
        return jsonify({'error': 'Solo gli sponsor possono modificare la propria iscrizione'}), 403

    registration = EventRegistrationForm.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
    if not registration:
        return jsonify({'error': 'Iscrizione non trovata'}), 404

    data = request.get_json()

    try:
        if 'form_data' in data:
            registration.form_data = json.dumps(data['form_data'])
        if 'note_sponsor' in data:
            registration.note_sponsor = data['note_sponsor']

        db.session.commit()

        return jsonify({
            'message': 'Iscrizione aggiornata con successo',
            'registration': {
                'id': registration.id,
                'form_data': json.loads(registration.form_data),
                'status': registration.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Cancella iscrizione
@event_bp.route('/events/<int:event_id>/registration', methods=['DELETE'])
@jwt_required()
def cancel_registration(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'sponsor':
        return jsonify({'error': 'Solo gli sponsor possono cancellare la propria iscrizione'}), 403

    registration = EventRegistrationForm.query.filter_by(event_id=event_id, sponsor_id=user_id).first()
    if not registration:
        return jsonify({'error': 'Iscrizione non trovata'}), 404

    try:
        registration.status = 'cancellato'
        registration.cancellato_il = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Iscrizione cancellata con successo'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Club conferma iscrizione sponsor
@event_bp.route('/events/<int:event_id>/registrations/<int:registration_id>/confirm', methods=['PUT'])
@jwt_required()
def confirm_registration(event_id, registration_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può confermare le iscrizioni'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    registration = EventRegistrationForm.query.get(registration_id)
    if not registration or registration.event_id != event_id:
        return jsonify({'error': 'Iscrizione non trovata'}), 404

    data = request.get_json()

    try:
        registration.confermato = data.get('confermato', True)
        if registration.confermato:
            registration.confermato_il = datetime.utcnow()
            registration.status = 'confermato'
        else:
            registration.status = 'registrato'

        if 'note_club' in data:
            registration.note_club = data['note_club']

        # Crea notifica per sponsor (solo se non è iscrizione pubblica)
        if registration.sponsor_id:
            notification = Notification(
                user_type='sponsor',
                user_id=registration.sponsor_id,
                tipo='conferma_iscrizione_evento',
                titolo=f'Iscrizione {"confermata" if registration.confermato else "in attesa"}: {event.titolo}',
                messaggio=f'La tua iscrizione all\'evento "{event.titolo}" è stata {"confermata" if registration.confermato else "messa in attesa"}',
                link=f'/events/{event.id}'
            )
            db.session.add(notification)

        db.session.commit()

        return jsonify({
            'message': 'Iscrizione aggiornata con successo',
            'registration': {
                'id': registration.id,
                'confermato': registration.confermato,
                'status': registration.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# UPDATE - Club segna presenza iscritto
@event_bp.route('/events/<int:event_id>/registrations/<int:registration_id>/attendance', methods=['PUT'])
@jwt_required()
def mark_registration_attendance(event_id, registration_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può segnare le presenze'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    registration = EventRegistrationForm.query.get(registration_id)
    if not registration or registration.event_id != event_id:
        return jsonify({'error': 'Iscrizione non trovata'}), 404

    data = request.get_json()

    try:
        registration.presente = data.get('presente', True)
        if registration.presente:
            registration.status = 'presente'
        db.session.commit()

        return jsonify({
            'message': 'Presenza aggiornata con successo',
            'registration': {
                'id': registration.id,
                'presente': registration.presente,
                'status': registration.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ==================== ROUTE ATTIVAZIONI ASSET PER EVENTI ====================

# CREATE - Crea attivazione asset per evento
@event_bp.route('/events/<int:event_id>/asset-activations', methods=['POST'])
@jwt_required()
def create_event_asset_activation(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può creare attivazioni asset'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    data = request.get_json()

    # Validazione
    if not data.get('contract_id'):
        return jsonify({'error': 'contract_id è obbligatorio'}), 400
    if not data.get('allocation_id') and not data.get('inventory_asset_id'):
        return jsonify({'error': 'allocation_id o inventory_asset_id è obbligatorio'}), 400

    # Verifica contratto
    contract = HeadOfTerms.query.get(data['contract_id'])
    if not contract or contract.club_id != user_id:
        return jsonify({'error': 'Contratto non trovato'}), 404

    # Ottieni info da allocazione se fornita
    allocation = None
    inventory_asset = None
    if data.get('allocation_id'):
        allocation = AssetAllocation.query.get(data['allocation_id'])
        if not allocation:
            return jsonify({'error': 'Allocazione non trovata'}), 404
        inventory_asset = allocation.inventory_asset
    elif data.get('inventory_asset_id'):
        inventory_asset = InventoryAsset.query.get(data['inventory_asset_id'])
        if not inventory_asset or inventory_asset.club_id != user_id:
            return jsonify({'error': 'Asset inventario non trovato'}), 404

    try:
        # Ottieni nome categoria dall'asset
        asset_category_name = None
        if inventory_asset and inventory_asset.category:
            asset_category_name = inventory_asset.category.nome
        elif inventory_asset:
            asset_category_name = inventory_asset.tipo

        activation = EventAssetActivation(
            event_id=event_id,
            contract_id=data['contract_id'],
            allocation_id=data.get('allocation_id'),
            inventory_asset_id=inventory_asset.id if inventory_asset else None,
            tipo=data.get('tipo', asset_category_name or 'Altro'),
            descrizione=data.get('descrizione'),
            quantita_utilizzata=data.get('quantita_utilizzata', 1),
            stato=data.get('stato', 'pianificata'),
            responsabile=data.get('responsabile')
        )

        db.session.add(activation)
        db.session.commit()

        return jsonify({
            'message': 'Attivazione asset creata con successo',
            'activation': {
                'id': activation.id,
                'event_id': activation.event_id,
                'contract_id': activation.contract_id,
                'allocation_id': activation.allocation_id,
                'inventory_asset_id': activation.inventory_asset_id,
                'inventory_asset': {
                    'id': inventory_asset.id,
                    'nome': inventory_asset.nome,
                    'categoria': inventory_asset.category.nome if inventory_asset.category else inventory_asset.tipo,
                    'immagine_url': inventory_asset.immagine_principale
                } if inventory_asset else None,
                'tipo': activation.tipo,
                'descrizione': activation.descrizione,
                'stato': activation.stato
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni attivazioni asset per evento
@event_bp.route('/events/<int:event_id>/asset-activations', methods=['GET'])
@jwt_required()
def get_event_asset_activations(event_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Evento non trovato'}), 404

    # Verifica accesso
    if role == 'club' and event.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        sponsor = Sponsor.query.get(user_id)
        if not sponsor or sponsor.club_id != event.club_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403

    activations = EventAssetActivation.query.filter_by(event_id=event_id).all()

    activations_data = []
    for act in activations:
        # Ottieni info inventario
        inventory_asset_data = None
        if act.inventory_asset:
            inventory_asset_data = {
                'id': act.inventory_asset.id,
                'nome': act.inventory_asset.nome,
                'categoria': act.inventory_asset.category.nome if act.inventory_asset.category else act.inventory_asset.tipo,
                'tipo': act.inventory_asset.tipo,
                'immagine_url': act.inventory_asset.immagine_principale,
                'quantita_totale': act.inventory_asset.quantita_totale
            }

        # Ottieni info contratto
        contract_data = None
        if act.contract:
            contract_data = {
                'id': act.contract.id,
                'titolo': act.contract.titolo,
                'sponsor_id': act.contract.sponsor_id,
                'sponsor_nome': act.contract.sponsor.ragione_sociale if act.contract.sponsor else None
            }

        activations_data.append({
            'id': act.id,
            'event_id': act.event_id,
            'contract_id': act.contract_id,
            'contract': contract_data,
            'allocation_id': act.allocation_id,
            'inventory_asset_id': act.inventory_asset_id,
            'inventory_asset': inventory_asset_data,
            'tipo': act.tipo,
            'descrizione': act.descrizione,
            'quantita_utilizzata': act.quantita_utilizzata,
            'stato': act.stato,
            'responsabile': act.responsabile,
            'eseguita': act.eseguita,
            'eseguita_da': act.eseguita_da,
            'eseguita_il': act.eseguita_il.isoformat() if act.eseguita_il else None,
            'note_esecuzione': act.note_esecuzione,
            'foto_attivazione': act.foto_attivazione,
            'created_at': act.created_at.isoformat()
        })

    return jsonify({'activations': activations_data}), 200


# UPDATE - Aggiorna attivazione asset
@event_bp.route('/events/<int:event_id>/asset-activations/<int:activation_id>', methods=['PUT'])
@jwt_required()
def update_event_asset_activation(event_id, activation_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può modificare attivazioni asset'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    activation = EventAssetActivation.query.get(activation_id)
    if not activation or activation.event_id != event_id:
        return jsonify({'error': 'Attivazione non trovata'}), 404

    data = request.get_json()

    try:
        if 'tipo' in data:
            activation.tipo = data['tipo']
        if 'descrizione' in data:
            activation.descrizione = data['descrizione']
        if 'quantita_utilizzata' in data:
            activation.quantita_utilizzata = data['quantita_utilizzata']
        if 'stato' in data:
            activation.stato = data['stato']
        if 'responsabile' in data:
            activation.responsabile = data['responsabile']
        if 'eseguita' in data:
            activation.eseguita = data['eseguita']
            if data['eseguita']:
                activation.eseguita_il = datetime.utcnow()
        if 'eseguita_da' in data:
            activation.eseguita_da = data['eseguita_da']
        if 'note_esecuzione' in data:
            activation.note_esecuzione = data['note_esecuzione']
        if 'foto_attivazione' in data:
            activation.foto_attivazione = data['foto_attivazione']

        activation.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Attivazione aggiornata con successo',
            'activation': {
                'id': activation.id,
                'stato': activation.stato,
                'eseguita': activation.eseguita
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Elimina attivazione asset
@event_bp.route('/events/<int:event_id>/asset-activations/<int:activation_id>', methods=['DELETE'])
@jwt_required()
def delete_event_asset_activation(event_id, activation_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può eliminare attivazioni asset'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    activation = EventAssetActivation.query.get(activation_id)
    if not activation or activation.event_id != event_id:
        return jsonify({'error': 'Attivazione non trovata'}), 404

    try:
        db.session.delete(activation)
        db.session.commit()
        return jsonify({'message': 'Attivazione eliminata con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# GET - Ottieni allocazioni disponibili per un evento
@event_bp.route('/events/<int:event_id>/available-allocations', methods=['GET'])
@jwt_required()
def get_available_allocations_for_event(event_id):
    """Restituisce le allocazioni inventario disponibili per un evento"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può vedere le allocazioni'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    # Filtri opzionali
    contract_id = request.args.get('contract_id', type=int)
    sponsor_id = request.args.get('sponsor_id', type=int)

    # Query allocazioni attive alla data evento
    query = AssetAllocation.query.join(InventoryAsset).filter(
        InventoryAsset.club_id == user_id,
        AssetAllocation.data_inizio <= event.data_ora_inizio,
        AssetAllocation.data_fine >= event.data_ora_inizio
    )

    if contract_id:
        query = query.filter(AssetAllocation.contract_id == contract_id)
    if sponsor_id:
        query = query.filter(AssetAllocation.sponsor_id == sponsor_id)

    allocations = query.all()

    # Ottieni attivazioni già esistenti per questo evento
    existing_activations = EventAssetActivation.query.filter_by(event_id=event_id).all()
    existing_allocation_ids = [act.allocation_id for act in existing_activations if act.allocation_id]

    allocations_data = []
    for alloc in allocations:
        # Ottieni info sponsor
        sponsor_nome = None
        if alloc.sponsor:
            sponsor_nome = alloc.sponsor.ragione_sociale

        # Ottieni info contratto
        contract_titolo = None
        if alloc.contract:
            contract_titolo = alloc.contract.titolo

        allocations_data.append({
            'id': alloc.id,
            'inventory_asset_id': alloc.asset_id,
            'inventory_asset': {
                'id': alloc.asset.id,
                'nome': alloc.asset.nome,
                'categoria': alloc.asset.category.nome if alloc.asset.category else alloc.asset.tipo,
                'tipo': alloc.asset.tipo,
                'immagine_url': alloc.asset.immagine_principale,
                'quantita_totale': alloc.asset.quantita_totale
            } if alloc.asset else None,
            'sponsor_id': alloc.sponsor_id,
            'sponsor_nome': sponsor_nome,
            'contract_id': alloc.contract_id,
            'contract_titolo': contract_titolo,
            'quantita_allocata': alloc.quantita,
            'data_inizio': alloc.data_inizio.isoformat(),
            'data_fine': alloc.data_fine.isoformat(),
            'already_activated': alloc.id in existing_allocation_ids
        })

    return jsonify({'allocations': allocations_data}), 200


# GET - Ottieni asset inventario per evento (tutti gli asset del club)
@event_bp.route('/events/<int:event_id>/available-assets', methods=['GET'])
@jwt_required()
def get_available_inventory_assets_for_event(event_id):
    """Restituisce gli asset inventario del club disponibili per un evento"""
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    if role != 'club':
        return jsonify({'error': 'Solo il club può vedere gli asset'}), 403

    event = Event.query.get(event_id)
    if not event or event.club_id != user_id:
        return jsonify({'error': 'Evento non trovato o accesso non autorizzato'}), 404

    assets = InventoryAsset.query.filter_by(club_id=user_id, attivo=True).all()

    assets_data = []
    for asset in assets:
        assets_data.append({
            'id': asset.id,
            'nome': asset.nome,
            'categoria': asset.category.nome if asset.category else asset.tipo,
            'tipo': asset.tipo,
            'immagine_url': asset.immagine_principale,
            'quantita_totale': asset.quantita_totale,
            'descrizione': asset.descrizione
        })

    return jsonify({'assets': assets_data}), 200
