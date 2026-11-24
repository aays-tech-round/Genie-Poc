"""
Validates the Microsoft Entra ID access token the frontend sends as
`Authorization: Bearer <token>`, and exposes the signed-in user to the routes.

Settings (app/.env):
  ENTRA_TENANT_ID       Directory (tenant) ID that issues the tokens.
  ENTRA_API_AUDIENCE    This API's Application ID URI (api://<client-id>) or client ID.
  ENTRA_REQUIRED_SCOPE  Delegated scope the token must carry. Default: access_as_user.
  ENTRA_ALLOWED_ROLE    Optional app role (e.g. Genie.User). Empty = any user in the tenant.
  AUTH_ENABLED          Default true. "false" is only honoured when APP_ENV=local.
  APP_ENV               Set to "local" on a developer machine. Anything else is treated as deployed.
"""
import logging
import os
import uuid
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    oid: str
    name: Optional[str] = None
    email: Optional[str] = None
    roles: tuple = field(default_factory=tuple)


@dataclass(frozen=True)
class AuthSettings:
    enabled: bool
    tenant_id: str
    audiences: tuple
    issuers: tuple
    required_scope: Optional[str]
    allowed_role: Optional[str]


def _is_guid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def _audiences_for(audience: str) -> tuple:
    # v1 tokens carry the Application ID URI (api://<client-id>) in `aud`,
    # v2 tokens carry the bare client ID, so accept both forms of the same app.
    audiences = {audience}
    if audience.startswith("api://") and _is_guid(audience[len("api://"):]):
        audiences.add(audience[len("api://"):])
    elif _is_guid(audience):
        audiences.add(f"api://{audience}")
    return tuple(sorted(audiences))


@lru_cache(maxsize=1)
def get_auth_settings() -> AuthSettings:
    enabled = os.getenv("AUTH_ENABLED", "true").strip().lower() not in ("false", "0", "no", "off")
    tenant_id = os.getenv("ENTRA_TENANT_ID", "").strip()
    audience = os.getenv("ENTRA_API_AUDIENCE", "").strip()
    return AuthSettings(
        enabled=enabled,
        tenant_id=tenant_id,
        audiences=_audiences_for(audience) if audience else (),
        issuers=(
            f"https://login.microsoftonline.com/{tenant_id}/v2.0",
            f"https://sts.windows.net/{tenant_id}/",
        ),
        required_scope=os.getenv("ENTRA_REQUIRED_SCOPE", "access_as_user").strip() or None,
        allowed_role=os.getenv("ENTRA_ALLOWED_ROLE", "").strip() or None,
    )


def validate_auth_config() -> None:
    """Called at startup so a misconfigured server fails fast instead of serving unprotected."""
    settings = get_auth_settings()
    if not settings.enabled:
        if os.getenv("APP_ENV", "").strip().lower() != "local":
            raise RuntimeError("AUTH_ENABLED=false is only allowed when APP_ENV=local.")
        logger.warning("AUTH IS DISABLED (APP_ENV=local). Every request runs as a fake local user.")
        return
    missing = [name for name, value in (
        ("ENTRA_TENANT_ID", settings.tenant_id),
        ("ENTRA_API_AUDIENCE", settings.audiences),
    ) if not value]
    if missing:
        raise RuntimeError(f"Authentication is enabled but these settings are missing: {', '.join(missing)}")


@lru_cache(maxsize=1)
def _jwks_clients() -> tuple:
    tenant_id = get_auth_settings().tenant_id
    base = f"https://login.microsoftonline.com/{tenant_id}/discovery"
    # Keys are cached in memory; PyJWKClient refetches when it sees an unknown key ID.
    return (
        jwt.PyJWKClient(f"{base}/v2.0/keys", cache_keys=True, lifespan=3600),
        jwt.PyJWKClient(f"{base}/keys", cache_keys=True, lifespan=3600),
    )


def _signing_key(token: str):
    last_error = None
    for client in _jwks_clients():
        try:
            return client.get_signing_key_from_jwt(token).key
        except jwt.PyJWKClientError as e:
            last_error = e
    raise last_error


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_token(token: str) -> dict:
    settings = get_auth_settings()
    try:
        claims = jwt.decode(
            token,
            _signing_key(token),
            algorithms=["RS256"],
            audience=list(settings.audiences),
            issuer=list(settings.issuers),
            leeway=60,
            options={"require": ["exp", "iat", "aud", "iss"]},
        )
    except jwt.ExpiredSignatureError:
        raise _unauthorized("Your session has expired. Please sign in again.")
    except jwt.PyJWKClientConnectionError as e:
        logger.error(f"Could not fetch Entra signing keys: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Sign-in service is unavailable. Please try again.",
        )
    except (jwt.InvalidTokenError, jwt.PyJWKClientError) as e:
        logger.warning(f"Rejected access token: {e}")
        raise _unauthorized("Invalid access token.")

    if claims.get("tid") != settings.tenant_id:
        raise _unauthorized("Invalid access token.")
    # App-only (client credentials) tokens have no `scp`; only signed-in users are allowed.
    if settings.required_scope and settings.required_scope not in (claims.get("scp") or "").split():
        raise _unauthorized("Access token is missing the required scope.")
    return claims


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> CurrentUser:
    settings = get_auth_settings()
    if not settings.enabled:
        return CurrentUser(oid="local-dev", name="Local Developer")

    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise _unauthorized("Sign in required.")

    claims = decode_token(credentials.credentials)
    oid = claims.get("oid")
    if not oid:
        raise _unauthorized("Invalid access token.")

    roles = tuple(claims.get("roles") or ())
    if settings.allowed_role and settings.allowed_role not in roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to Genie. Contact your administrator.",
        )

    return CurrentUser(
        oid=oid,
        name=claims.get("name"),
        email=claims.get("preferred_username") or claims.get("upn") or claims.get("unique_name"),
        roles=roles,
    )
