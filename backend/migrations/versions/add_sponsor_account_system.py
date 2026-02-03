"""Add sponsor account system - multi-club support

Revision ID: add_sponsor_account_system
Revises: add_sponsor_drive_files
Create Date: 2024-02-01

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_sponsor_account_system'
down_revision = 'add_sponsor_drive_files'
branch_labels = None
depends_on = None


def upgrade():
    # 1. Create sponsor_accounts table (global sponsor accounts)
    op.create_table('sponsor_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(120), nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('email_verificata', sa.Boolean(), default=False),
        sa.Column('ragione_sociale', sa.String(200), nullable=False),
        sa.Column('partita_iva', sa.String(50), nullable=True),
        sa.Column('codice_fiscale', sa.String(50), nullable=True),
        sa.Column('settore_merceologico', sa.String(200), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('indirizzo_sede', sa.String(300), nullable=True),
        sa.Column('telefono', sa.String(20), nullable=True),
        sa.Column('sito_web', sa.String(200), nullable=True),
        sa.Column('facebook', sa.String(255), nullable=True),
        sa.Column('instagram', sa.String(255), nullable=True),
        sa.Column('tiktok', sa.String(255), nullable=True),
        sa.Column('linkedin', sa.String(255), nullable=True),
        sa.Column('twitter', sa.String(255), nullable=True),
        sa.Column('account_attivo', sa.Boolean(), default=True),
        sa.Column('ultimo_accesso', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email')
    )

    # 2. Create sponsor_invitations table
    op.create_table('sponsor_invitations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('token', sa.String(100), nullable=False),
        sa.Column('email_suggerita', sa.String(120), nullable=True),
        sa.Column('ragione_sociale_suggerita', sa.String(200), nullable=True),
        sa.Column('settore_suggerito', sa.String(200), nullable=True),
        sa.Column('note_club', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), default='pending'),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('accepted_at', sa.DateTime(), nullable=True),
        sa.Column('accepted_by_account_id', sa.Integer(), nullable=True),
        sa.Column('sponsor_membership_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token'),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id']),
        sa.ForeignKeyConstraint(['accepted_by_account_id'], ['sponsor_accounts.id'])
    )

    # 3. Add new columns to sponsors table
    # sponsor_account_id - link to global account
    op.add_column('sponsors', sa.Column('sponsor_account_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_sponsors_sponsor_account', 'sponsors', 'sponsor_accounts', ['sponsor_account_id'], ['id'])

    # membership_status
    op.add_column('sponsors', sa.Column('membership_status', sa.String(50), server_default='active'))

    # data_adesione
    op.add_column('sponsors', sa.Column('data_adesione', sa.DateTime(), nullable=True))

    # ruolo_sponsorship
    op.add_column('sponsors', sa.Column('ruolo_sponsorship', sa.String(100), nullable=True))

    # note_interne_club
    op.add_column('sponsors', sa.Column('note_interne_club', sa.Text(), nullable=True))

    # from_invitation_id
    op.add_column('sponsors', sa.Column('from_invitation_id', sa.Integer(), nullable=True))

    # 4. Make password_hash nullable in sponsors (new sponsors use SponsorAccount)
    # SQLite doesn't support ALTER COLUMN, so we skip this for SQLite
    # For other databases: op.alter_column('sponsors', 'password_hash', nullable=True)

    # 5. Add foreign key for sponsor_membership_id in invitations (after sponsors columns exist)
    # This is added later because of circular dependency

    # 6. Create indexes
    op.create_index('ix_sponsor_accounts_email', 'sponsor_accounts', ['email'])
    op.create_index('ix_sponsor_invitations_token', 'sponsor_invitations', ['token'])
    op.create_index('ix_sponsor_invitations_club', 'sponsor_invitations', ['club_id'])
    op.create_index('ix_sponsors_account', 'sponsors', ['sponsor_account_id'])


def downgrade():
    # Drop indexes
    op.drop_index('ix_sponsors_account')
    op.drop_index('ix_sponsor_invitations_club')
    op.drop_index('ix_sponsor_invitations_token')
    op.drop_index('ix_sponsor_accounts_email')

    # Drop foreign key and columns from sponsors
    op.drop_constraint('fk_sponsors_sponsor_account', 'sponsors', type_='foreignkey')
    op.drop_column('sponsors', 'from_invitation_id')
    op.drop_column('sponsors', 'note_interne_club')
    op.drop_column('sponsors', 'ruolo_sponsorship')
    op.drop_column('sponsors', 'data_adesione')
    op.drop_column('sponsors', 'membership_status')
    op.drop_column('sponsors', 'sponsor_account_id')

    # Drop tables
    op.drop_table('sponsor_invitations')
    op.drop_table('sponsor_accounts')
