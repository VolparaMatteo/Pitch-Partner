"""add project management models

Revision ID: f4d9b8c73f21
Revises: cec1ae63858b
Create Date: 2025-10-02 01:57:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'f4d9b8c73f21'
down_revision = '3eacc3c2268a'
branch_labels = None
depends_on = None


def upgrade():
    # Create projects table
    op.create_table('projects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('contract_id', sa.Integer(), nullable=False),
        sa.Column('club_id', sa.Integer(), nullable=False),
        sa.Column('sponsor_id', sa.Integer(), nullable=False),
        sa.Column('titolo', sa.String(length=255), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('stato', sa.Enum('pianificazione', 'in_corso', 'in_pausa', 'completato', 'archiviato', name='project_status'), nullable=True),
        sa.Column('data_inizio', sa.Date(), nullable=True),
        sa.Column('data_fine', sa.Date(), nullable=True),
        sa.Column('priorita', sa.Enum('bassa', 'media', 'alta', 'urgente', name='project_priority'), nullable=True),
        sa.Column('progresso_percentuale', sa.Integer(), nullable=True),
        sa.Column('budget_allocato', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('archived_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['contract_id'], ['contracts.id'], ),
        sa.ForeignKeyConstraint(['club_id'], ['clubs.id'], ),
        sa.ForeignKeyConstraint(['sponsor_id'], ['sponsors.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_club_id'), 'projects', ['club_id'], unique=False)
    op.create_index(op.f('ix_projects_sponsor_id'), 'projects', ['sponsor_id'], unique=False)
    op.create_index(op.f('ix_projects_stato'), 'projects', ['stato'], unique=False)

    # Create project_milestones table
    op.create_table('project_milestones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('titolo', sa.String(length=255), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('data_scadenza', sa.Date(), nullable=False),
        sa.Column('stato', sa.Enum('da_iniziare', 'in_corso', 'completato', 'in_ritardo', name='milestone_status'), nullable=True),
        sa.Column('completato_il', sa.DateTime(), nullable=True),
        sa.Column('ordine', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_milestones_project_id'), 'project_milestones', ['project_id'], unique=False)

    # Create project_tasks table
    op.create_table('project_tasks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('milestone_id', sa.Integer(), nullable=True),
        sa.Column('titolo', sa.String(length=255), nullable=False),
        sa.Column('descrizione', sa.Text(), nullable=True),
        sa.Column('assegnato_a_type', sa.Enum('club', 'sponsor', name='assignee_type'), nullable=True),
        sa.Column('assegnato_a_id', sa.Integer(), nullable=True),
        sa.Column('creato_da_type', sa.Enum('club', 'sponsor', 'admin', name='creator_type'), nullable=False),
        sa.Column('creato_da_id', sa.Integer(), nullable=False),
        sa.Column('priorita', sa.Enum('bassa', 'media', 'alta', 'urgente', name='task_priority'), nullable=True),
        sa.Column('stato', sa.Enum('da_fare', 'in_corso', 'in_revisione', 'completato', 'bloccato', name='task_status'), nullable=True),
        sa.Column('data_scadenza', sa.DateTime(), nullable=True),
        sa.Column('completato_il', sa.DateTime(), nullable=True),
        sa.Column('tempo_stimato', sa.Integer(), nullable=True),
        sa.Column('tags', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.ForeignKeyConstraint(['milestone_id'], ['project_milestones.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tasks_project_id'), 'project_tasks', ['project_id'], unique=False)
    op.create_index(op.f('ix_tasks_assignee'), 'project_tasks', ['assegnato_a_type', 'assegnato_a_id'], unique=False)
    op.create_index(op.f('ix_tasks_stato'), 'project_tasks', ['stato'], unique=False)

    # Create project_updates table
    op.create_table('project_updates',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('project_id', sa.Integer(), nullable=False),
        sa.Column('autore_type', sa.Enum('club', 'admin', name='author_type'), nullable=False),
        sa.Column('autore_id', sa.Integer(), nullable=False),
        sa.Column('titolo', sa.String(length=255), nullable=False),
        sa.Column('contenuto', sa.Text(), nullable=False),
        sa.Column('tipo_update', sa.Enum('news', 'milestone_completato', 'task_completato', 'cambio_stato', 'alert', 'documento', name='update_type'), nullable=True),
        sa.Column('allegati_urls', sa.Text(), nullable=True),
        sa.Column('visibilita', sa.Enum('sponsor_only', 'team_only', 'pubblico', name='update_visibility'), nullable=True),
        sa.Column('pin_in_alto', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_updates_project_id'), 'project_updates', ['project_id'], unique=False)

    # Create task_comments table
    op.create_table('task_comments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('autore_type', sa.Enum('club', 'sponsor', 'admin', name='comment_author_type'), nullable=False),
        sa.Column('autore_id', sa.Integer(), nullable=False),
        sa.Column('contenuto', sa.Text(), nullable=False),
        sa.Column('allegati_urls', sa.Text(), nullable=True),
        sa.Column('parent_comment_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['task_id'], ['project_tasks.id'], ),
        sa.ForeignKeyConstraint(['parent_comment_id'], ['task_comments.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_comments_task_id'), 'task_comments', ['task_id'], unique=False)

    # Alter existing notifications table (già esistente, aggiungo solo campi mancanti)
    # La tabella notifications esiste già con: user_type, user_id, tipo, titolo, messaggio, link, letta, letta_il, created_at
    # Aggiungo campi: oggetto_type, oggetto_id, priorita
    # Rinomino: user_type -> destinatario_type, user_id -> destinatario_id, link -> link_url

    with op.batch_alter_table('notifications') as batch_op:
        # Add new columns
        batch_op.add_column(sa.Column('oggetto_type', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('oggetto_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('priorita', sa.String(length=10), default='normale', nullable=True))

        # Rename columns (SQLite doesn't support RENAME COLUMN easily, skip for now)
        # Useremo i nomi esistenti: user_type, user_id, link invece di destinatario_type, destinatario_id, link_url


def downgrade():
    # Remove added columns from notifications
    with op.batch_alter_table('notifications') as batch_op:
        batch_op.drop_column('priorita')
        batch_op.drop_column('oggetto_id')
        batch_op.drop_column('oggetto_type')

    op.drop_index(op.f('ix_comments_task_id'), table_name='task_comments')
    op.drop_table('task_comments')

    op.drop_index(op.f('ix_updates_project_id'), table_name='project_updates')
    op.drop_table('project_updates')

    op.drop_index(op.f('ix_tasks_stato'), table_name='project_tasks')
    op.drop_index(op.f('ix_tasks_assignee'), table_name='project_tasks')
    op.drop_index(op.f('ix_tasks_project_id'), table_name='project_tasks')
    op.drop_table('project_tasks')

    op.drop_index(op.f('ix_milestones_project_id'), table_name='project_milestones')
    op.drop_table('project_milestones')

    op.drop_index(op.f('ix_projects_stato'), table_name='projects')
    op.drop_index(op.f('ix_projects_sponsor_id'), table_name='projects')
    op.drop_index(op.f('ix_projects_club_id'), table_name='projects')
    op.drop_table('projects')
