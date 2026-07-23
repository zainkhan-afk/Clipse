"""Drop every table and recreate them from the models. DESTRUCTIVE — wipes all data.

Run from inside backend/ (so `from api...` imports resolve):
    python scripts/reset_tables.py          # asks to confirm first
    python scripts/reset_tables.py --yes     # skip the confirmation
"""
import sys
from urllib.parse import urlsplit, urlunsplit

from api.core.database import Base, engine
from api.clipboard import models  # registers the tables on Base.metadata


def _safe_url() -> str:
    """DB URL with the password blanked out, for printing."""
    parts = urlsplit(str(engine.url))
    if parts.password:
        netloc = parts.netloc.replace(f":{parts.password}@", ":***@")
        parts = parts._replace(netloc=netloc)
    return urlunsplit(parts)


def main():
    skip_confirm = "--yes" in sys.argv or "-y" in sys.argv

    print(f"Target database: {_safe_url()}")
    if not skip_confirm:
        answer = input("This will DROP all tables and delete all data. Type 'yes' to continue: ")
        if answer.strip().lower() != "yes":
            print("Aborted.")
            return

    Base.metadata.drop_all(bind=engine)
    print("Dropped all tables.")

    Base.metadata.create_all(bind=engine)
    print("Recreated all tables.")


if __name__ == "__main__":
    main()
