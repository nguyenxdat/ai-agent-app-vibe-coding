"""
FastAPI Application - AI Chat A2A Server
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes
from .routes import agents, sessions

# Register routes
app.include_router(agents.router)
app.include_router(sessions.router)

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
