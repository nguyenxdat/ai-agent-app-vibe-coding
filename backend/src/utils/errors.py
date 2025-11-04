"""
Error Handling Utilities
Custom exceptions and error handlers for the application
"""

from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)


# Custom Exceptions

class AppException(Exception):
    """Base application exception"""

    def __init__(
        self,
        message: str,
        error_code: str = "APP_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AgentNotFoundException(AppException):
    """Agent not found exception"""

    def __init__(self, agent_id: str):
        super().__init__(
            message=f"Agent with ID '{agent_id}' not found",
            error_code="AGENT_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"agent_id": agent_id},
        )


class SessionNotFoundException(AppException):
    """Session not found exception"""

    def __init__(self, session_id: str):
        super().__init__(
            message=f"Session with ID '{session_id}' not found",
            error_code="SESSION_NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"session_id": session_id},
        )


class InvalidMessageFormatException(AppException):
    """Invalid message format exception"""

    def __init__(self, format: str):
        super().__init__(
            message=f"Invalid message format: '{format}'",
            error_code="INVALID_MESSAGE_FORMAT",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"format": format},
        )


class AgentProcessingException(AppException):
    """Agent processing error exception"""

    def __init__(self, message: str, agent_id: Optional[str] = None):
        super().__init__(
            message=f"Agent processing error: {message}",
            error_code="AGENT_PROCESSING_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"agent_id": agent_id} if agent_id else {},
        )


class WebSocketConnectionException(AppException):
    """WebSocket connection error exception"""

    def __init__(self, message: str):
        super().__init__(
            message=f"WebSocket connection error: {message}",
            error_code="WEBSOCKET_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


class RateLimitException(AppException):
    """Rate limit exceeded exception"""

    def __init__(self, limit: int, window: str):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {window}",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"limit": limit, "window": window},
        )


class AuthenticationException(AppException):
    """Authentication error exception"""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class AuthorizationException(AppException):
    """Authorization error exception"""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            status_code=status.HTTP_403_FORBIDDEN,
        )


# Error Handlers

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handle custom application exceptions

    Args:
        request: FastAPI request
        exc: Application exception

    Returns:
        JSON error response
    """
    logger.error(
        f"Application error: {exc.error_code} - {exc.message}",
        extra={"details": exc.details},
    )

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error_code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Handle request validation errors

    Args:
        request: FastAPI request
        exc: Validation exception

    Returns:
        JSON error response
    """
    errors = exc.errors()

    logger.warning(
        f"Validation error on {request.url.path}",
        extra={"errors": errors},
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error_code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": {"errors": errors},
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions

    Args:
        request: FastAPI request
        exc: Generic exception

    Returns:
        JSON error response
    """
    logger.exception(
        f"Unexpected error on {request.url.path}: {str(exc)}",
        exc_info=exc,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred",
            "details": {},
        },
    )


# Error Response Helpers

def create_error_response(
    error_code: str,
    message: str,
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    details: Optional[Dict[str, Any]] = None,
) -> JSONResponse:
    """
    Create error response

    Args:
        error_code: Error code
        message: Error message
        status_code: HTTP status code
        details: Optional error details

    Returns:
        JSON error response
    """
    return JSONResponse(
        status_code=status_code,
        content={
            "error_code": error_code,
            "message": message,
            "details": details or {},
        },
    )


def log_error(
    error_code: str,
    message: str,
    exc: Optional[Exception] = None,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Log error with consistent format

    Args:
        error_code: Error code
        message: Error message
        exc: Optional exception
        details: Optional error details
    """
    if exc:
        logger.exception(
            f"[{error_code}] {message}",
            exc_info=exc,
            extra={"details": details or {}},
        )
    else:
        logger.error(
            f"[{error_code}] {message}",
            extra={"details": details or {}},
        )
