"""
Authentication Middleware for A2A Protocol
Handles Bearer token authentication
"""

from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


def get_a2a_api_key() -> Optional[str]:
    """
    Get A2A API key from environment variables

    Returns:
        API key if configured, None otherwise
    """
    return os.getenv("A2A_API_KEY")


def is_auth_enabled() -> bool:
    """
    Check if authentication is enabled

    Authentication is enabled if A2A_API_KEY is set in environment
    """
    return get_a2a_api_key() is not None


async def verify_a2a_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> bool:
    """
    Verify A2A authentication token

    Args:
        credentials: HTTP Bearer credentials from request

    Returns:
        True if authenticated

    Raises:
        HTTPException: If authentication fails
    """
    # If authentication is not enabled, allow all requests
    if not is_auth_enabled():
        logger.debug("A2A authentication is disabled (A2A_API_KEY not set)")
        return True

    # Authentication is enabled, require valid token
    if credentials is None:
        logger.warning("A2A request missing authentication token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify token
    api_key = get_a2a_api_key()
    if credentials.credentials != api_key:
        logger.warning("A2A request with invalid authentication token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    logger.debug("A2A request authenticated successfully")
    return True


async def optional_a2a_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Security(security)
) -> bool:
    """
    Optional A2A authentication

    This allows requests without authentication, but validates tokens if provided.
    Useful for endpoints that support both authenticated and public access.

    Args:
        credentials: HTTP Bearer credentials from request

    Returns:
        True if authenticated or auth is disabled
        False if no credentials provided (when auth is enabled)

    Raises:
        HTTPException: If invalid token provided
    """
    # If authentication is not enabled, allow all requests
    if not is_auth_enabled():
        return True

    # If no credentials provided, return False (not authenticated)
    if credentials is None:
        return False

    # Credentials provided, verify them
    api_key = get_a2a_api_key()
    if credentials.credentials != api_key:
        logger.warning("A2A request with invalid authentication token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return True
