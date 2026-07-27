"""One-off backfill: add the `slug` column to an existing `clipboards` table and give
every row a unique opaque slug. Idempotent — safe to run repeatedly.

Needed because there are no migrations wired up: `create_tables.py` only creates missing
tables, it won't add the new column to a table that already exists. Fresh databases get
the column (and its UNIQUE index) straight from the model, so this is only for databases
created before the slug was introduced.

Run from the backend/ directory:

    python scripts/add_slugs.py
"""
import os
import sys

# Make `api...` importable regardless of how this script is invoked.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect, text

from api.core.database import engine
from api.clipboard.service import new_slug


def main():
    columns = [c["name"] for c in inspect(engine).get_columns("clipboards")]

    with engine.begin() as conn:
        if "slug" not in columns:
            print("Adding slug column…")
            conn.execute(text("ALTER TABLE clipboards ADD COLUMN slug VARCHAR"))
        else:
            print("slug column already exists.")

        # Slugs already assigned, so backfilled ones don't clash with them.
        used = {
            row[0]
            for row in conn.execute(
                text("SELECT slug FROM clipboards WHERE slug IS NOT NULL AND slug <> ''")
            )
        }

        rows = conn.execute(
            text("SELECT id FROM clipboards WHERE slug IS NULL OR slug = ''")
        ).fetchall()
        print(f"Backfilling {len(rows)} clipboard(s)…")
        for (clipboard_id,) in rows:
            slug = new_slug()
            while slug in used:
                slug = new_slug()
            conn.execute(
                text("UPDATE clipboards SET slug = :slug WHERE id = :id"),
                {"slug": slug, "id": clipboard_id},
            )
            used.add(slug)

        # Enforce uniqueness going forward (create_all won't add this to an existing table).
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_clipboards_slug ON clipboards (slug)")
        )

    print("Done.")


if __name__ == "__main__":
    main()
