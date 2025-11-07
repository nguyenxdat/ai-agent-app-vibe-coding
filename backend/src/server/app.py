"""
FastAPI Application - AI Chat A2A Server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import os
import logging
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s:     %(name)s - %(message)s'
)

# Create FastAPI app
app = FastAPI(
    title="AI Chat A2A Server",
    description="Backend server cho AI Chat Application với A2A protocol support",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Web app (Vite default)
        "http://localhost:5174",  # Desktop app (Electron)
        "http://localhost:3000",  # Alternative dev server
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from .routes import agents, sessions, a2a

# Register routes
app.include_router(agents.router)
app.include_router(sessions.router)
app.include_router(a2a.router)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "AI Chat A2A Server",
        "version": "1.0.0",
        "status": "running"
    }

# Health check endpoint
@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "ok",
        "version": "1.0.0"
    }

# Serve agent card file (if exists)
@app.get("/.well-known/agent-card.json")
async def serve_agent_card():
    """
    Serve static agent card file for A2A protocol discovery

    This follows the A2A convention of placing agent cards at:
    /.well-known/agent-card.json
    """
    agent_card_path = Path(__file__).parent.parent.parent / "agent_card.json"

    if agent_card_path.exists():
        return FileResponse(
            agent_card_path,
            media_type="application/json",
            headers={
                "Cache-Control": "public, max-age=3600",  # Cache for 1 hour
            }
        )
    else:
        return {
            "error": "Agent card not found",
            "message": "Run 'python generate_agent_card.py' to create agent_card.json"
        }

# Run server
if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"

    uvicorn.run(
        "src.server.app:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    )
