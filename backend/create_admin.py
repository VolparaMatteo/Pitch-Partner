from app import create_app, db
from app.models import Admin

app = create_app()

with app.app_context():
    # Crea tabelle
    db.create_all()

    # Verifica se admin esiste già
    if not Admin.query.filter_by(username='admin').first():
        admin = Admin(
            username='admin',
            email='admin@pitchpartner.com'
        )
        admin.set_password('admin123')  # Password di default - CAMBIARE IN PRODUZIONE!

        db.session.add(admin)
        db.session.commit()

        print("✓ Admin creato con successo!")
        print("Username: admin")
        print("Password: admin123")
        print("\n⚠️  IMPORTANTE: Cambiare la password in produzione!")
    else:
        print("✓ Admin già esistente")

    print("\n✓ Database inizializzato correttamente")
