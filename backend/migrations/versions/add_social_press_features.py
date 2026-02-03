"""add social press features for club and sponsor posts

Revision ID: social_press_001
Revises:
Create Date: 2025-01-17 12:00:00

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'social_press_001'
down_revision = '0d65a1a018f3'  # Latest migration
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to press_publications table
    with op.batch_alter_table('press_publications', schema=None) as batch_op:
        # Add author fields (can be club or sponsor)
        batch_op.add_column(sa.Column('author_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('author_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('author_name', sa.String(length=200), nullable=True))

        # Add sponsor_id foreign key (nullable)
        batch_op.add_column(sa.Column('sponsor_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_press_pub_sponsor', 'sponsors', ['sponsor_id'], ['id'])

        # Make club_id nullable (for sponsor posts)
        batch_op.alter_column('club_id', existing_type=sa.Integer(), nullable=True)

        # Add likes_count cache
        batch_op.add_column(sa.Column('likes_count', sa.Integer(), server_default='0'))

    # Update existing records to populate new fields
    op.execute("""
        UPDATE press_publications
        SET
            author_type = 'club',
            author_id = club_id,
            author_name = creato_da_nome
        WHERE club_id IS NOT NULL
    """)

    # Make author fields non-nullable after populating
    with op.batch_alter_table('press_publications', schema=None) as batch_op:
        batch_op.alter_column('author_type', existing_type=sa.String(length=20), nullable=False)
        batch_op.alter_column('author_id', existing_type=sa.Integer(), nullable=False)
        batch_op.alter_column('author_name', existing_type=sa.String(length=200), nullable=False)

    # Add new columns to press_reactions table
    with op.batch_alter_table('press_reactions', schema=None) as batch_op:
        # Add user fields (can be club or sponsor)
        batch_op.add_column(sa.Column('user_type', sa.String(length=20), nullable=True))
        batch_op.add_column(sa.Column('user_id', sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column('user_name', sa.String(length=200), nullable=True))

        # Add club_id foreign key
        batch_op.add_column(sa.Column('club_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key('fk_press_reaction_club', 'clubs', ['club_id'], ['id'])

        # Make sponsor_id nullable
        batch_op.alter_column('sponsor_id', existing_type=sa.Integer(), nullable=True)

    # Update existing reactions
    op.execute("""
        UPDATE press_reactions
        SET
            user_type = 'sponsor',
            user_id = sponsor_id,
            tipo_reazione = 'like'
        WHERE sponsor_id IS NOT NULL
    """)

    # Make user fields non-nullable after populating
    with op.batch_alter_table('press_reactions', schema=None) as batch_op:
        batch_op.alter_column('user_type', existing_type=sa.String(length=20), nullable=False)
        batch_op.alter_column('user_id', existing_type=sa.Integer(), nullable=False)

        # Drop old unique constraint and create new one
        batch_op.drop_constraint('unique_reaction_per_sponsor', type_='unique')
        batch_op.create_unique_constraint('unique_reaction_per_user', ['publication_id', 'user_type', 'user_id'])


def downgrade():
    # Revert press_reactions changes
    with op.batch_alter_table('press_reactions', schema=None) as batch_op:
        batch_op.drop_constraint('unique_reaction_per_user', type_='unique')
        batch_op.create_unique_constraint('unique_reaction_per_sponsor', ['publication_id', 'sponsor_id'])

        batch_op.drop_constraint('fk_press_reaction_club', type_='foreignkey')
        batch_op.drop_column('club_id')
        batch_op.drop_column('user_name')
        batch_op.drop_column('user_id')
        batch_op.drop_column('user_type')

        batch_op.alter_column('sponsor_id', existing_type=sa.Integer(), nullable=False)

    # Revert press_publications changes
    with op.batch_alter_table('press_publications', schema=None) as batch_op:
        batch_op.drop_column('likes_count')
        batch_op.alter_column('club_id', existing_type=sa.Integer(), nullable=False)

        batch_op.drop_constraint('fk_press_pub_sponsor', type_='foreignkey')
        batch_op.drop_column('sponsor_id')
        batch_op.drop_column('author_name')
        batch_op.drop_column('author_id')
        batch_op.drop_column('author_type')
