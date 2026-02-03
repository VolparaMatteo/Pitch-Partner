"""Add event asset activations table

Revision ID: add_event_asset_activations
Revises: add_inventory_activation
Create Date: 2024-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_event_asset_activations'
down_revision = 'add_inventory_activation'
branch_labels = None
depends_on = None


def upgrade():
    # Create event_asset_activations table
    op.create_table('event_asset_activations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('allocation_id', sa.Integer(), nullable=True),
        sa.Column('inventory_asset_id', sa.Integer(), nullable=True),
        sa.Column('tipo', sa.String(100), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('quantita_utilizzata', sa.Integer(), nullable=True),
        sa.Column('stato', sa.String(50), default='pianificata'),
        sa.Column('responsabile', sa.String(200), nullable=True),
        sa.Column('eseguita', sa.Boolean(), default=False),
        sa.Column('eseguita_da', sa.String(100), nullable=True),
        sa.Column('eseguita_il', sa.DateTime(), nullable=True),
        sa.Column('note_esecuzione', sa.Text(), nullable=True),
        sa.Column('foto_attivazione', sa.String(500), nullable=True),
        sa.Column('report_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['event_id'], ['events.id'], name='fk_event_activation_event'),
        sa.ForeignKeyConstraint(['contract_id'], ['head_of_terms.id'], name='fk_event_activation_contract'),
        sa.ForeignKeyConstraint(['allocation_id'], ['asset_allocations.id'], name='fk_event_activation_allocation'),
        sa.ForeignKeyConstraint(['inventory_asset_id'], ['inventory_assets.id'], name='fk_event_activation_inventory_asset'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('event_id', 'allocation_id', name='unique_event_allocation')
    )


def downgrade():
    op.drop_table('event_asset_activations')
