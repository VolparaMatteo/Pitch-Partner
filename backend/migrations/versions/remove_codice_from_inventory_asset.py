"""Remove codice column from inventory_assets table

Revision ID: remove_codice_asset
Revises:
Create Date: 2026-02-03

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_codice_asset'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Remove codice column from inventory_assets table
    with op.batch_alter_table('inventory_assets', schema=None) as batch_op:
        batch_op.drop_column('codice')


def downgrade():
    # Re-add codice column if needed
    with op.batch_alter_table('inventory_assets', schema=None) as batch_op:
        batch_op.add_column(sa.Column('codice', sa.String(length=50), nullable=True))
