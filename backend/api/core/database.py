from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# SQLite (for simplicity). For PostgreSQL:
# DATABASE_URL = "postgresql://user:password@localhost/dbname"
DATABASE_URL = "sqlite:///./clipboard.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}  # only for SQLite
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
