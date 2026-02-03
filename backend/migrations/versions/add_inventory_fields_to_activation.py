"""Add inventory fields to activation

Revision ID: add_inventory_activation
Revises:
Create Date: 2024-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_inventory_activation'
down_revision = 'c9bf35930b6f'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to activations table for inventory integration
    with op.batch_alter_table('activations', schema=None) as batch_op:
        batch_op.add_column(sa.Column('allocation_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('inventory_asset_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_activation_allocation',
            'asset_allocations',
            ['allocation_id'],
            ['id']
        )
        batch_op.create_foreign_key(
            'fk_activation_inventory_asset',
            'inventory_assets',
            ['inventory_asset_id'],
            ['id']
        )


def downgrade():
    with op.batch_alter_table('activations', schema=None) as batch_op:
        batch_op.drop_constraint('fk_activation_allocation', type_='foreignkey')
        batch_op.drop_constraint('fk_activation_inventory_asset', type_='foreignkey')
        batch_op.drop_column('inventory_asset_id')
        batch_op.drop_column('allocation_id')
