"""add_club_invoice_and_activity

Revision ID: 778595cec055
Revises: add_sponsor_account_system
Create Date: 2026-02-02 23:34:48.503873

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '778595cec055'
down_revision = 'add_sponsor_account_system'
branch_labels = None
depends_on = None


def upgrade():
    # Create club_invoices table
    op.create_table('club_invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('subscription_id', sa.Integer(), nullable=True),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('issue_date', sa.DateTime(), nullable=False),
        sa.Column('due_date', sa.DateTime(), nullable=True),
        sa.Column('subtotal', sa.Float(), nullable=False),
        sa.Column('tax_rate', sa.Float(), nullable=True, default=22.0),
        sa.Column('tax_amount', sa.Float(), nullable=True),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('status', sa.String(20), nullable=True, default='draft'),
        sa.Column('paid_at', sa.DateTime(), nullable=True),
        sa.Column('payment_method', sa.String(50), nullable=True),
        sa.Column('payment_reference', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('period_start', sa.DateTime(), nullable=True),
        sa.Column('period_end', sa.DateTime(), nullable=True),
        sa.Column('pdf_url', sa.String(500), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], name='fk_club_invoices_club_id'),
        sa.ForeignKeyConstraint(['subscription_id'], ['subscriptions.id'], name='fk_club_invoices_subscription_id'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create club_activities table
    op.create_table('club_activities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('tipo', sa.String(50), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('esito', sa.String(50), nullable=True),
        sa.Column('data_schedulata', sa.DateTime(), nullable=True),
        sa.Column('created_by', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], name='fk_club_activities_club_id'),
        sa.ForeignKeyConstraint(['created_by'], ['admins.id'], name='fk_club_activities_created_by'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('club_activities')
    op.drop_table('club_invoices')
