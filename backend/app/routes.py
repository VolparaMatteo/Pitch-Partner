from flask import Blueprint, jsonify

main = Blueprint('main', __name__)

@main.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Pitch Partner API is running'})
