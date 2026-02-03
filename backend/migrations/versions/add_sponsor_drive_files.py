"""Add sponsor drive files table

Revision ID: add_sponsor_drive_files
Revises: add_lead_asset_interests
Create Date: 2024-01-31

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sponsor_drive_files'
down_revision = 'add_lead_asset_interests'
branch_labels = None
depends_on = None


def upgrade():
    # Create sponsor_drive_files table
    op.create_table('sponsor_drive_files',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('sponsor_id', sa.Integer(), nullable=False),
        sa.Column('nome', sa.String(300), nullable=False),
        sa.Column('file_url', sa.String(500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('file_type', sa.String(100), nullable=True),
        sa.Column('estensione', sa.String(20), nullable=True),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('categoria', sa.String(100), default='altro'),
        sa.Column('cartella', sa.String(500), default='/'),
        sa.Column('tags', sa.Text(), nullable=True),
        sa.Column('contract_id', sa.Integer(), nullable=True),
        sa.Column('activation_id', sa.Integer(), nullable=True),
        sa.Column('event_activation_id', sa.Integer(), nullable=True),
        sa.Column('inventory_asset_id', sa.Integer(), nullable=True),
        sa.Column('caricato_da', sa.String(50), nullable=False),
        sa.Column('caricato_da_nome', sa.String(200), nullable=True),
        sa.Column('visibile_sponsor', sa.Boolean(), default=True),
        sa.Column('visibile_club', sa.Boolean(), default=True),
        sa.Column('stato', sa.String(50), default='attivo'),
        sa.Column('thumbnail_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id']),
        sa.ForeignKeyConstraint(['sponsor_id'], ['sponsors.id']),
        sa.ForeignKeyConstraint(['contract_id'], ['head_of_terms.id']),
        sa.ForeignKeyConstraint(['activation_id'], ['activations.id']),
        sa.ForeignKeyConstraint(['event_activation_id'], ['event_asset_activations.id']),
        sa.ForeignKeyConstraint(['inventory_asset_id'], ['inventory_assets.id'])
    )

    # Create indexes for faster queries
    op.create_index('ix_sponsor_drive_files_club_sponsor', 'sponsor_drive_files', ['club_id', 'sponsor_id'])
    op.create_index('ix_sponsor_drive_files_contract', 'sponsor_drive_files', ['contract_id'])
    op.create_index('ix_sponsor_drive_files_categoria', 'sponsor_drive_files', ['categoria'])


def downgrade():
    op.drop_index('ix_sponsor_drive_files_categoria')
    op.drop_index('ix_sponsor_drive_files_contract')
    op.drop_index('ix_sponsor_drive_files_club_sponsor')
    op.drop_table('sponsor_drive_files')
