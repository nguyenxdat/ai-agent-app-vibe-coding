"""
Middleware configuration cho FastAPI application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import os

def setup_middleware(app: FastAPI):
    """
    Setup tất cả middleware cho application
    """

    # CORS middleware
    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Trusted Host middleware (production security)
    if os.getenv("DEBUG", "true").lower() != "true":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=["*.example.com", "localhost"]
        )

    # Add custom middleware here
    # Example: Logging, Rate limiting, Authentication, etc.

    return app
