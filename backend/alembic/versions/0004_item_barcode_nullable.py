"""make item barcode nullable

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-24 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0004'
down_revision: Union[str, Sequence[str], None] = '0003'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Loose fruits & vegetables have no barcode
    op.alter_column('items', 'barcode', existing_type=sa.String(), nullable=True)


def downgrade() -> None:
    """Downgrade schema."""
    # Rows without a barcode would violate NOT NULL; give them an empty string first
    op.execute("UPDATE items SET barcode = '' WHERE barcode IS NULL")
    op.alter_column('items', 'barcode', existing_type=sa.String(), nullable=False)
