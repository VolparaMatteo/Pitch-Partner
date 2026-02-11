"""add newsletter tables

Revision ID: add_newsletter_tables
Revises:
Create Date: 2026-02-11
"""
from alembic import op
import sqlalchemy as sa

revision = 'add_newsletter_tables'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('newsletter_groups',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('nome', sa.String(200), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('colore', sa.String(7), server_default='#6B7280'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table('newsletter_recipients',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('newsletter_groups.id'), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('nome', sa.String(200), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('group_id', 'email', name='uq_newsletter_recipient_group_email'),
    )

    op.create_table('newsletter_campaigns',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('titolo', sa.String(300), nullable=False),
        sa.Column('oggetto', sa.String(500), nullable=False),
        sa.Column('corpo_html', sa.Text(), nullable=False),
        sa.Column('account_key', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), server_default='bozza'),
        sa.Column('totale_destinatari', sa.Integer(), server_default='0'),
        sa.Column('inviati_ok', sa.Integer(), server_default='0'),
        sa.Column('inviati_errore', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
    )

    op.create_table('newsletter_campaign_groups',
        sa.Column('campaign_id', sa.Integer(), sa.ForeignKey('newsletter_campaigns.id'), primary_key=True),
        sa.Column('group_id', sa.Integer(), sa.ForeignKey('newsletter_groups.id'), primary_key=True),
    )


def downgrade():
    op.drop_table('newsletter_campaign_groups')
    op.drop_table('newsletter_campaigns')
    op.drop_table('newsletter_recipients')
    op.drop_table('newsletter_groups')
