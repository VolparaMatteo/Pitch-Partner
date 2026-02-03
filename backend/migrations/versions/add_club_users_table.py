"""Add ClubUser model for multi-user clubs

Revision ID: add_club_users
Revises: 3e14abfad6d5
Create Date: 2025-10-02 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_club_users'
down_revision = '3e14abfad6d5'
branch_labels = None
depends_on = None


def upgrade():
    # Create club_users table
    op.create_table('club_users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('nome', sa.String(length=100), nullable=False),
        sa.Column('cognome', sa.String(length=100), nullable=False),
        sa.Column('avatar_url', sa.String(length=500), nullable=True),
        sa.Column('ruolo', sa.String(length=50), nullable=True, default='amministratore'),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('last_login', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('club_id', 'email', name='uq_club_user_email')
    )


def downgrade():
    op.drop_table('club_users')
