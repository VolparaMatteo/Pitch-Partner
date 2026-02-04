"""merge heads

Revision ID: 6820fb88ea94
Revises: add_club_users, remove_codice_asset
Create Date: 2026-02-04 18:14:29.414292

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '6820fb88ea94'
down_revision = ('add_club_users', 'remove_codice_asset')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
