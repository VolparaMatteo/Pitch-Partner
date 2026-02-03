
from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_collaborations_schema():
    with app.app_context():
        print("Updating opportunity_collaborations schema...")
        
        with db.engine.connect() as conn:
            # 1. Rename existing table
            print("Renaming existing table...")
            conn.execute(text("ALTER TABLE opportunity_collaborations RENAME TO opportunity_collaborations_old"))
            
            # 2. Create new table
            print("Creating new table...")
            conn.execute(text("""
                CREATE TABLE opportunity_collaborations (
                    id INTEGER PRIMARY KEY,
                    opportunity_id INTEGER NOT NULL,
                    sponsor_id INTEGER,
                    club_id INTEGER,
                    ruolo VARCHAR(100),
                    budget_confermato NUMERIC(10, 2),
                    asset_confermati JSON,
                    contratto_firmato BOOLEAN DEFAULT 0,
                    documento_contratto_url VARCHAR(500),
                    data_firma_contratto DATETIME,
                    stato VARCHAR(50) DEFAULT 'attiva',
                    data_inizio DATE,
                    data_fine DATE,
                    performance_metrics JSON,
                    created_at DATETIME,
                    updated_at DATETIME,
                    completata_at DATETIME,
                    FOREIGN KEY(opportunity_id) REFERENCES marketplace_opportunities(id),
                    FOREIGN KEY(sponsor_id) REFERENCES sponsors(id),
                    FOREIGN KEY(club_id) REFERENCES clubs(id)
                )
            """))
            
            # 3. Copy data
            print("Copying data...")
            conn.execute(text("""
                INSERT INTO opportunity_collaborations (
                    id, opportunity_id, sponsor_id, ruolo, budget_confermato, 
                    asset_confermati, contratto_firmato, documento_contratto_url, 
                    data_firma_contratto, stato, data_inizio, data_fine, 
                    performance_metrics, created_at, updated_at, completata_at
                )
                SELECT 
                    id, opportunity_id, sponsor_id, ruolo, budget_confermato, 
                    asset_confermati, contratto_firmato, documento_contratto_url, 
                    data_firma_contratto, stato, data_inizio, data_fine, 
                    performance_metrics, created_at, updated_at, completata_at
                FROM opportunity_collaborations_old
            """))
            
            # 4. Drop old table
            print("Dropping old table...")
            conn.execute(text("DROP TABLE opportunity_collaborations_old"))
            
            conn.commit()
            print("Schema update completed successfully.")

if __name__ == "__main__":
    update_collaborations_schema()
