
from app import create_app, db
from sqlalchemy import text

app = create_app()

def update_schema():
    with app.app_context():
        print("Updating database schema...")
        
        # Check if columns exist
        with db.engine.connect() as conn:
            # SQLite specific check
            result = conn.execute(text("PRAGMA table_info(messages)"))
            columns = [row[1] for row in result]
            
            if 'attachment_url' not in columns:
                print("Adding attachment_url column...")
                conn.execute(text("ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(500)"))
            
            if 'attachment_type' not in columns:
                print("Adding attachment_type column...")
                conn.execute(text("ALTER TABLE messages ADD COLUMN attachment_type VARCHAR(50)"))
                
            if 'attachment_name' not in columns:
                print("Adding attachment_name column...")
                conn.execute(text("ALTER TABLE messages ADD COLUMN attachment_name VARCHAR(200)"))
                
            conn.commit()
            conn.commit()

            # Check MarketplaceOpportunity columns
            result = conn.execute(text("PRAGMA table_info(marketplace_opportunities)"))
            opp_columns = [row[1] for row in result]

            if 'asset_forniti' not in opp_columns:
                print("Adding asset_forniti column...")
                conn.execute(text("ALTER TABLE marketplace_opportunities ADD COLUMN asset_forniti JSON"))

            # Check Message columns again for new fields
            result = conn.execute(text("PRAGMA table_info(messages)"))
            msg_columns = [row[1] for row in result]

            if 'context_type' not in msg_columns:
                print("Adding context_type column...")
                conn.execute(text("ALTER TABLE messages ADD COLUMN context_type VARCHAR(50)"))

            if 'context_id' not in msg_columns:
                print("Adding context_id column...")
                conn.execute(text("ALTER TABLE messages ADD COLUMN context_id INTEGER"))
                
            conn.commit()
            print("Schema update completed.")

if __name__ == '__main__':
    update_schema()
