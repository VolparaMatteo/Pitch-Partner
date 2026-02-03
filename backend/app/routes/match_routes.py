from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from app import db
from app.models import Match, Club, Activation, BoxInvite
from datetime import datetime

match_bp = Blueprint('match', __name__)


# CREATE - Crea nuova partita
@match_bp.route('/matches', methods=['POST'])
@jwt_required()
def create_match():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può creare partite
    if role != 'club':
        return jsonify({'error': 'Solo i club possono creare partite'}), 403

    data = request.get_json()

    # Validazione
    if not data.get('data_ora') or not data.get('avversario'):
        return jsonify({'error': 'Data/ora e avversario sono obbligatori'}), 400

    try:
        # Crea partita
        match = Match(
            club_id=user_id,
            data_ora=datetime.fromisoformat(data['data_ora'].replace('Z', '+00:00')),
            avversario=data['avversario'],
            competizione=data.get('competizione'),
            luogo=data.get('luogo', 'casa'),
            stadio=data.get('stadio'),
            note=data.get('note')
        )

        db.session.add(match)
        db.session.commit()

        return jsonify({
            'message': 'Partita creata con successo',
            'match': {
                'id': match.id,
                'club_id': match.club_id,
                'data_ora': match.data_ora.isoformat(),
                'avversario': match.avversario,
                'competizione': match.competizione,
                'luogo': match.luogo,
                'stadio': match.stadio,
                'status': match.status,
                'note': match.note,
                'created_at': match.created_at.isoformat()
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# READ - Ottieni tutte le partite
@match_bp.route('/matches', methods=['GET'])
@jwt_required()
def get_matches():
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Filtri
    status = request.args.get('status')
    from_date = request.args.get('from_date')
    to_date = request.args.get('to_date')

    if role == 'club':
        query = Match.query.filter_by(club_id=user_id)
    elif role == 'sponsor':
        # Sponsor vede partite dei club con cui ha contratti attivi
        from app.models import Sponsor
        sponsor = Sponsor.query.get(user_id)
        if not sponsor:
            return jsonify({'error': 'Sponsor non trovato'}), 404
        query = Match.query.filter_by(club_id=sponsor.club_id)
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Applica filtri
    if status:
        query = query.filter_by(status=status)
    if from_date:
        query = query.filter(Match.data_ora >= datetime.fromisoformat(from_date))
    if to_date:
        query = query.filter(Match.data_ora <= datetime.fromisoformat(to_date))

    matches = query.order_by(Match.data_ora.asc()).all()

    matches_data = []
    for match in matches:
        # Conta attivazioni
        attivazioni_count = len(match.activations)
        inviti_count = len(match.box_invites)

        matches_data.append({
            'id': match.id,
            'club_id': match.club_id,
            'data_ora': match.data_ora.isoformat(),
            'avversario': match.avversario,
            'competizione': match.competizione,
            'luogo': match.luogo,
            'stadio': match.stadio,
            'risultato_casa': match.risultato_casa,
            'risultato_trasferta': match.risultato_trasferta,
            'status': match.status,
            'note': match.note,
            'attivazioni_count': attivazioni_count,
            'inviti_count': inviti_count,
            'created_at': match.created_at.isoformat()
        })

    return jsonify({'matches': matches_data}), 200


# READ - Ottieni singola partita
@match_bp.route('/matches/<int:match_id>', methods=['GET'])
@jwt_required()
def get_match(match_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    # Verifica accesso
    if role == 'club':
        if match.club_id != user_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    elif role == 'sponsor':
        from app.models import Sponsor
        sponsor = Sponsor.query.get(user_id)
        if not sponsor or sponsor.club_id != match.club_id:
            return jsonify({'error': 'Accesso non autorizzato'}), 403
    else:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    # Attivazioni per questa partita
    activations_data = []
    for activation in match.activations:
        activations_data.append({
            'id': activation.id,
            'contract_id': activation.contract_id,
            'asset_id': activation.asset_id,
            'tipo': activation.tipo,
            'descrizione': activation.descrizione,
            'stato': activation.stato,
            'responsabile': activation.responsabile,
            'eseguita': activation.eseguita,
            'foto_attivazione': activation.foto_attivazione,
            'report_url': activation.report_url
        })

    # Inviti box per questa partita
    invites_data = []
    for invite in match.box_invites:
        invites_data.append({
            'id': invite.id,
            'business_box_id': invite.business_box_id,
            'sponsor_id': invite.sponsor_id,
            'nome': invite.nome,
            'cognome': invite.cognome,
            'status': invite.status,
            'check_in_il': invite.check_in_il.isoformat() if invite.check_in_il else None
        })

    return jsonify({
        'match': {
            'id': match.id,
            'club_id': match.club_id,
            'data_ora': match.data_ora.isoformat(),
            'avversario': match.avversario,
            'competizione': match.competizione,
            'luogo': match.luogo,
            'stadio': match.stadio,
            'risultato_casa': match.risultato_casa,
            'risultato_trasferta': match.risultato_trasferta,
            'status': match.status,
            'note': match.note,
            'activations': activations_data,
            'box_invites': invites_data,
            'created_at': match.created_at.isoformat()
        }
    }), 200


# UPDATE - Aggiorna partita
@match_bp.route('/matches/<int:match_id>', methods=['PUT'])
@jwt_required()
def update_match(match_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può aggiornare
    if role != 'club':
        return jsonify({'error': 'Solo i club possono aggiornare partite'}), 403

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    if match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    data = request.get_json()

    try:
        # Aggiorna campi
        if 'data_ora' in data:
            match.data_ora = datetime.fromisoformat(data['data_ora'].replace('Z', '+00:00'))
        if 'avversario' in data:
            match.avversario = data['avversario']
        if 'competizione' in data:
            match.competizione = data['competizione']
        if 'luogo' in data:
            match.luogo = data['luogo']
        if 'stadio' in data:
            match.stadio = data['stadio']
        if 'risultato_casa' in data:
            match.risultato_casa = data['risultato_casa']
        if 'risultato_trasferta' in data:
            match.risultato_trasferta = data['risultato_trasferta']
        if 'status' in data:
            match.status = data['status']
        if 'note' in data:
            match.note = data['note']

        match.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'message': 'Partita aggiornata con successo',
            'match': {
                'id': match.id,
                'data_ora': match.data_ora.isoformat(),
                'avversario': match.avversario,
                'status': match.status
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# DELETE - Elimina partita
@match_bp.route('/matches/<int:match_id>', methods=['DELETE'])
@jwt_required()
def delete_match(match_id):
    claims = get_jwt()
    role = claims.get('role')
    user_id = int(get_jwt_identity())

    # Solo club può eliminare
    if role != 'club':
        return jsonify({'error': 'Solo i club possono eliminare partite'}), 403

    match = Match.query.get(match_id)
    if not match:
        return jsonify({'error': 'Partita non trovata'}), 404

    if match.club_id != user_id:
        return jsonify({'error': 'Accesso non autorizzato'}), 403

    try:
        db.session.delete(match)
        db.session.commit()
        return jsonify({'message': 'Partita eliminata con successo'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
