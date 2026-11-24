"""
Azure SQL connection for the chat list (table ppm.genie_chats).

The connection uses a Microsoft Entra access token instead of a SQL username/password:
  - AZURE_CLIENT_ID + AZURE_CLIENT_SECRET + AZURE_TENANT_ID set -> that service principal logs in.
  - Otherwise DefaultAzureCredential: a managed identity in Azure, or `az login` on a laptop.

Settings (app/.env locally, App Service settings in Azure), read when first used:
  AZURE_SQL_SERVER    e.g. myserver.database.windows.net
  AZURE_SQL_DATABASE  database name
  ODBC_DRIVER         optional, default "ODBC Driver 18 for SQL Server"
"""
import logging
import os
import struct
import urllib.parse
from functools import lru_cache
from typing import Iterator

from azure.identity import ClientSecretCredential, DefaultAzureCredential
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

logger = logging.getLogger(__name__)

Base = declarative_base()

# pyodbc connection attribute that carries an Entra access token (SQL_COPT_SS_ACCESS_TOKEN).
_SQL_COPT_SS_ACCESS_TOKEN = 1256
_TOKEN_SCOPE = "https://database.windows.net/.default"
_TIMEOUT_SECONDS = 30


def validate_db_config() -> None:
    """Called at startup so a missing database setting fails fast with a clear message."""
    missing = [name for name in ("AZURE_SQL_SERVER", "AZURE_SQL_DATABASE") if not os.getenv(name, "").strip()]
    if missing:
        raise RuntimeError(f"Chat history database settings are missing: {', '.join(missing)}")


def _credential():
    tenant_id = os.getenv("AZURE_TENANT_ID", "").strip()
    client_id = os.getenv("AZURE_CLIENT_ID", "").strip()
    client_secret = os.getenv("AZURE_CLIENT_SECRET", "").strip()
    if tenant_id and client_id and client_secret:
        return ClientSecretCredential(tenant_id=tenant_id, client_id=client_id, client_secret=client_secret)
    return DefaultAzureCredential(exclude_interactive_browser_credential=True)


def _token_struct(credential) -> bytes:
    # The credential caches its token and renews it before expiry, so asking each time is cheap.
    token = credential.get_token(_TOKEN_SCOPE).token.encode("utf-16-le")
    return struct.pack(f"<I{len(token)}s", len(token), token)


@lru_cache(maxsize=1)
def get_engine() -> Engine:
    validate_db_config()
    driver = os.getenv("ODBC_DRIVER", "ODBC Driver 18 for SQL Server").strip()
    odbc_conn_str = (
        f"Driver={{{driver}}};"
        f"Server=tcp:{os.environ['AZURE_SQL_SERVER'].strip()},1433;"
        f"Database={os.environ['AZURE_SQL_DATABASE'].strip()};"
        "Encrypt=yes;TrustServerCertificate=no;"
        f"Connection Timeout={_TIMEOUT_SECONDS};"
    )
    engine = create_engine(
        "mssql+pyodbc:///?odbc_connect=" + urllib.parse.quote_plus(odbc_conn_str),
        pool_size=5,
        max_overflow=5,
        pool_pre_ping=True,
        pool_recycle=1800,
        connect_args={"timeout": _TIMEOUT_SECONDS},
    )
    credential = _credential()

    @event.listens_for(engine, "do_connect")
    def _inject_token(dialect, conn_rec, cargs, cparams):
        cparams["attrs_before"] = {_SQL_COPT_SS_ACCESS_TOKEN: _token_struct(credential)}

    return engine


@lru_cache(maxsize=1)
def _session_factory() -> sessionmaker:
    return sessionmaker(bind=get_engine(), autoflush=False, expire_on_commit=False)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one database session per request."""
    db = _session_factory()()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
