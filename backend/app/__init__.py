from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os
import json

load_dotenv()

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///pitch_partner.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # JWT error handlers
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'error': 'Token non valido', 'message': str(error)}), 422

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'error': 'Token mancante', 'message': str(error)}), 401

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'error': 'Token scaduto'}), 401

    # Enable CORS for all routes with full configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3001", "http://localhost:3000", "http://localhost:3003"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "max_age": 3600
        }
    })

    # Register blueprints
    from app.routes.admin_routes import admin_bp
    from app.routes.club_routes import club_bp
    from app.routes.sponsor_routes import sponsor_bp
    from app.routes.upload_routes import upload_bp
    from app.routes.contract_routes import contract_bp
    from app.routes.asset_routes import asset_bp
    from app.routes.checklist_routes import checklist_bp
    from app.routes.repository_routes import repository_bp
    from app.routes.notification_routes import notification_bp
    from app.routes.message_routes import message_bp
    from app.routes.match_routes import match_bp
    from app.routes.activation_routes import activation_bp
    from app.routes.event_routes import event_bp
    from app.routes.box_routes import box_bp
    from app.routes.sponsor_network_routes import sponsor_network_bp
    from app.routes.sponsor_message_routes import sponsor_message_bp
    from app.routes.partnership_routes import partnership_bp
    from app.routes.press_routes import press_bp
    from app.routes.admin_best_practice_routes import admin_best_practice_bp
    from app.routes.best_practice_routes import best_practice_bp
    from app.routes.admin_resource_routes import bp as admin_resource_bp
    from app.routes.resource_routes import bp as resource_bp
    # Project Management Routes
    from app.routes.club_project_routes import club_project_bp
    from app.routes.sponsor_project_routes import sponsor_project_bp
    from app.routes.admin_project_routes import admin_project_bp
    # Budget & Financial Management Routes
    from app.routes.club_budget_routes import club_budget_bp
    from app.routes.sponsor_budget_routes import sponsor_budget_bp
    from app.routes.admin_budget_routes import admin_budget_bp
    # Marketplace Opportunità Routes
    from app.routes.sponsor_marketplace_routes import sponsor_marketplace_bp
    from app.routes.club_marketplace_routes import club_marketplace_bp
    from app.routes.admin_marketplace_routes import admin_marketplace_bp
    from app.routes.pitchy_routes import pitchy_bp
    from app.routes.sponsor_activity_routes import sponsor_activity_bp
    # Lead Management Routes
    from app.routes.lead_routes import lead_bp
    # Automation Routes
    from app.routes.automation_routes import automation_bp
    # Inventory Management Routes
    from app.routes.inventory_routes import inventory_bp
    # Rights Management Routes
    from app.routes.rights_routes import rights_bp
    # Proposal Builder Routes
    from app.routes.proposal_routes import proposal_bp
    # Calendar CRM Routes
    from app.routes.calendar_routes import calendar_bp
    # Contact Person Routes
    from app.routes.contact_routes import contact_bp
    # Note Timeline Routes
    from app.routes.note_routes import note_bp
    # Tag Routes
    from app.routes.tag_routes import tag_bp
    # Lead Product Blueprint
    from app.routes.lead_product_routes import lead_product_bp
    # Lead Document Blueprint
    from app.routes.lead_document_routes import lead_document_bp
    # Catalog Routes
    from app.routes.catalog_routes import catalog_bp

    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(club_bp, url_prefix='/api/club')
    app.register_blueprint(sponsor_bp, url_prefix='/api')
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(contract_bp, url_prefix='/api')
    app.register_blueprint(asset_bp, url_prefix='/api')
    app.register_blueprint(checklist_bp, url_prefix='/api')
    app.register_blueprint(repository_bp, url_prefix='/api')
    app.register_blueprint(notification_bp, url_prefix='/api')
    app.register_blueprint(message_bp, url_prefix='/api')
    app.register_blueprint(match_bp, url_prefix='/api')
    app.register_blueprint(activation_bp, url_prefix='/api')
    app.register_blueprint(event_bp, url_prefix='/api')
    app.register_blueprint(box_bp, url_prefix='/api')
    app.register_blueprint(sponsor_network_bp, url_prefix='/api/sponsor-network')
    app.register_blueprint(sponsor_message_bp, url_prefix='/api/sponsor-messages')
    app.register_blueprint(partnership_bp, url_prefix='/api/partnerships')
    app.register_blueprint(press_bp, url_prefix='/api')
    app.register_blueprint(admin_best_practice_bp, url_prefix='/api/admin')
    app.register_blueprint(best_practice_bp, url_prefix='/api')
    app.register_blueprint(admin_resource_bp)
    app.register_blueprint(resource_bp)
    # Project Management Blueprints
    app.register_blueprint(club_project_bp, url_prefix='/api/club')
    app.register_blueprint(sponsor_project_bp, url_prefix='/api/sponsor')
    app.register_blueprint(admin_project_bp, url_prefix='/api')
    # Budget & Financial Management Blueprints
    app.register_blueprint(club_budget_bp, url_prefix='/api/club')
    app.register_blueprint(sponsor_budget_bp, url_prefix='/api/sponsor')
    app.register_blueprint(admin_budget_bp, url_prefix='/api')
    # Marketplace Opportunità Blueprints
    app.register_blueprint(sponsor_marketplace_bp, url_prefix='/api/sponsor')
    app.register_blueprint(club_marketplace_bp, url_prefix='/api/club')
    app.register_blueprint(admin_marketplace_bp, url_prefix='/api')
    app.register_blueprint(pitchy_bp, url_prefix='/api/pitchy')
    # Sponsor Activity Blueprint
    app.register_blueprint(sponsor_activity_bp, url_prefix='/api')
    # Lead Management Blueprint
    app.register_blueprint(lead_bp, url_prefix='/api')
    # Automation Blueprint
    app.register_blueprint(automation_bp, url_prefix='/api')
    # Inventory Management Blueprint
    app.register_blueprint(inventory_bp, url_prefix='/api/club/inventory')
    # Rights Management Blueprint
    app.register_blueprint(rights_bp, url_prefix='/api/club/rights')
    # Proposal Builder Blueprint
    app.register_blueprint(proposal_bp, url_prefix='/api/club/proposals')
    # Calendar CRM Blueprint
    app.register_blueprint(calendar_bp, url_prefix='/api')
    # Contact Person Blueprint
    app.register_blueprint(contact_bp, url_prefix='/api')
    # Note Timeline Blueprint
    app.register_blueprint(note_bp, url_prefix='/api')
    # Tag Blueprint
    app.register_blueprint(tag_bp, url_prefix='/api')
    # Lead Product Blueprint
    app.register_blueprint(lead_product_bp, url_prefix='/api')
    # Lead Document Blueprint
    app.register_blueprint(lead_document_bp, url_prefix='/api')
    # Catalog Blueprint
    app.register_blueprint(catalog_bp, url_prefix='/api/club')

    # Start Automation Scheduler (in development mode)
    if os.getenv('FLASK_ENV') != 'production' or os.getenv('START_SCHEDULER', 'false').lower() == 'true':
        from app.services.automation_scheduler import scheduler
        scheduler.init_app(app)
        # Lo scheduler verrà avviato manualmente o dal run.py

    # Test endpoint
    @app.route('/api/test')
    def test():
        return {'message': 'CORS working!'}

    return app
