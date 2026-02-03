"""add social features to press (hashtags, mentions, visibility community)

Revision ID: social_features_002
Revises: social_press_001
Create Date: 2025-01-17 14:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'social_features_002'
down_revision = 'social_press_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add new social features columns to press_publications
    with op.batch_alter_table('press_publications', schema=None) as batch_op:
        # Hashtags
        batch_op.add_column(sa.Column('hashtags', sa.JSON(), nullable=True))

        # Mentions (array di oggetti con type, id, name)
        batch_op.add_column(sa.Column('mentioned_user_ids', sa.JSON(), nullable=True))

        # Visibility: interna (solo club+sponsor) o community (tutta la piattaforma)
        batch_op.add_column(sa.Column('visibility', sa.String(length=20), server_default='interna'))

    # Set default empty arrays for existing records
    op.execute("""
        UPDATE press_publications
        SET
            hashtags = '[]',
            mentioned_user_ids = '[]'
        WHERE hashtags IS NULL OR mentioned_user_ids IS NULL
    """)


def downgrade():
    # Remove social features columns
    with op.batch_alter_table('press_publications', schema=None) as batch_op:
        batch_op.drop_column('visibility')
        batch_op.drop_column('mentioned_user_ids')
        batch_op.drop_column('hashtags')
