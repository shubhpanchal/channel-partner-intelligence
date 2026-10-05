"""Database engine, session management, event hooks, and base metadata."""

from typing import Generator

from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings

# Configure SQLite or other connection
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    future=True,
)


# SQLite Foreign Key Enforcer
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints for SQLite connections."""
    try:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
    except Exception:
        pass


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """Dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_health() -> bool:
    """Verify database connection health by executing a simple scalar query."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def init_db(target_engine: Engine = engine) -> None:
    """Create all tables in the database if they do not exist."""
    # Ensure all models are registered with Base.metadata
    import app.models  # noqa: F401

    Base.metadata.create_all(bind=target_engine)


def reset_db(target_engine: Engine = engine) -> None:
    """Drop and recreate all tables in the database (development/test use)."""
    import app.models  # noqa: F401

    Base.metadata.drop_all(bind=target_engine)
    Base.metadata.create_all(bind=target_engine)
