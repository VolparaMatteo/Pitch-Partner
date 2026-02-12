"""merge heads

Revision ID: 8c375d636c8c
Revises: 6820fb88ea94, add_newsletter_tables
Create Date: 2026-02-12 13:20:13.568626

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8c375d636c8c'
down_revision = ('6820fb88ea94', 'add_newsletter_tables')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
