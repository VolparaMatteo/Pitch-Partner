"""Add lead asset interests table

Revision ID: add_lead_asset_interests
Revises: add_event_asset_activations
Create Date: 2024-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_lead_asset_interests'
down_revision = 'add_event_asset_activations'
branch_labels = None
depends_on = None


def upgrade():
    # Create lead_asset_interests association table
    op.create_table('lead_asset_interests',
        sa.Column('lead_id', sa.Integer(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], name='fk_lead_asset_interest_lead'),
        sa.ForeignKeyConstraint(['asset_id'], ['inventory_assets.id'], name='fk_lead_asset_interest_asset'),
        sa.PrimaryKeyConstraint('lead_id', 'asset_id')
    )


def downgrade():
    op.drop_table('lead_asset_interests')
