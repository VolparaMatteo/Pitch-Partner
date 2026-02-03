from flask import Blueprint, request, jsonify
from app import db
from app.models import Club, ClubUser
import re

club_activation_bp = Blueprint('club_activation', __name__)


def validate_password_strength(password):
    """Valida la sicurezza della password"""
    errors = []

    if len(password) < 8:
        errors.append('La password deve essere di almeno 8 caratteri')

    if not re.search(r'[A-Z]', password):
        errors.append('La password deve contenere almeno una lettera maiuscola')

    if not re.search(r'[a-z]', password):
        errors.append('La password deve contenere almeno una lettera minuscola')

    if not re.search(r'\d', password):
        errors.append('La password deve contenere almeno un numero')

    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        errors.append('La password deve contenere almeno un carattere speciale (!@#$%^&*(),.?":{}|<>)')

    return errors


@club_activation_bp.route('/public/club/activate/<token>', methods=['GET'])
def verify_activation_token(token):
    """Verifica validità del token di attivazione e restituisce info club"""
    club = Club.query.filter_by(activation_token=token).first()

    if not club:
        return jsonify({'error': 'Token non valido'}), 404

    if not club.is_activation_token_valid():
        return jsonify({'error': 'Token scaduto'}), 400

    if club.is_activated:
        return jsonify({'error': 'Account già attivato'}), 400

    return jsonify({
        'valid': True,
        'club': {
            'nome': club.nome,
            'logo_url': club.logo_url,
            'email': club.email
        }
    }), 200


@club_activation_bp.route('/public/club/activate/<token>', methods=['POST'])
def activate_club(token):
    """Attiva l'account del club creando il primo utente amministratore"""
    club = Club.query.filter_by(activation_token=token).first()

    if not club:
        return jsonify({'error': 'Token non valido'}), 404

    if not club.is_activation_token_valid():
        return jsonify({'error': 'Token scaduto'}), 400

    if club.is_activated:
        return jsonify({'error': 'Account già attivato'}), 400

    data = request.get_json()

    # Dati utente
    email = data.get('email', '').strip()
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    nome = data.get('nome', '').strip()
    cognome = data.get('cognome', '').strip()
    avatar_url = data.get('avatar_url')

    # Validazione campi obbligatori
    if not email:
        return jsonify({'error': 'Email obbligatoria'}), 400

    if not nome:
        return jsonify({'error': 'Nome obbligatorio'}), 400

    if not cognome:
        return jsonify({'error': 'Cognome obbligatorio'}), 400

    # Validazione email format
    email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_regex, email):
        return jsonify({'error': 'Formato email non valido'}), 400

    # Validazione password
    if not password or not confirm_password:
        return jsonify({'error': 'Password e conferma password richieste'}), 400

    if password != confirm_password:
        return jsonify({'error': 'Le password non corrispondono'}), 400

    # Validazione sicurezza password
    password_errors = validate_password_strength(password)
    if password_errors:
        return jsonify({'error': password_errors[0], 'errors': password_errors}), 400

    # Crea utente amministratore
    user = ClubUser(
        club_id=club.id,
        email=email,
        nome=nome,
        cognome=cognome,
        avatar_url=avatar_url,
        ruolo='amministratore',
        is_active=True
    )
    user.set_password(password)

    # Attiva il club
    club.activate()

    db.session.add(user)
    db.session.commit()

    return jsonify({
        'message': 'Account attivato con successo',
        'club': {
            'id': club.id,
            'nome': club.nome,
            'email': club.email
        },
        'user': user.to_dict()
    }), 200
