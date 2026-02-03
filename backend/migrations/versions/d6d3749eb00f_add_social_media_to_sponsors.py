"""add_social_media_to_sponsors

Revision ID: d6d3749eb00f
Revises: 0ccebed62631
Create Date: 2025-10-16 16:38:56.963923

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd6d3749eb00f'
down_revision = '0ccebed62631'
branch_labels = None
depends_on = None


def upgrade():
    # Aggiungi colonne social media alla tabella sponsors
    op.add_column('sponsors', sa.Column('facebook', sa.String(255), nullable=True))
    op.add_column('sponsors', sa.Column('instagram', sa.String(255), nullable=True))
    op.add_column('sponsors', sa.Column('tiktok', sa.String(255), nullable=True))
    op.add_column('sponsors', sa.Column('linkedin', sa.String(255), nullable=True))
    op.add_column('sponsors', sa.Column('twitter', sa.String(255), nullable=True))


def downgrade():
    # Rimuovi colonne social media dalla tabella sponsors
    op.drop_column('sponsors', 'twitter')
    op.drop_column('sponsors', 'linkedin')
    op.drop_column('sponsors', 'tiktok')
    op.drop_column('sponsors', 'instagram')
    op.drop_column('sponsors', 'facebook')
