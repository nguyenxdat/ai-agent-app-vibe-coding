"""
Chat Sessions API Routes
Manages chat sessions and WebSocket connections
"""

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import json
import asyncio

router = APIRouter(prefix="/api/v1/sessions", tags=["sessions"])

# In-memory storage (replace with database in production)
sessions_db: Dict[str, Dict[str, Any]] = {}
messages_db: Dict[str, List[Dict[str, Any]]] = {}  # sessionId -> messages
active_connections: Dict[str, WebSocket] = {}  # sessionId -> websocket


# Pydantic models
class CreateSessionRequest(BaseModel):
    agent_id: str = Field(..., description="Agent ID for this session")
    user_id: str = Field(..., description="User ID creating the session")
    title: Optional[str] = Field(None, max_length=200)


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None


class SessionResponse(BaseModel):
    id: str
    user_id: str
    agent_id: str
    title: Optional[str]
    created_at: str
    updated_at: str
    last_message_at: Optional[str]
    is_active: bool


class MessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=10000)
    role: str = Field("user", pattern="^(user|agent|system)$")


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    agent_id: Optional[str]
    timestamp: str
    status: str


# REST Endpoints
@router.post("", response_model=SessionResponse)
async def create_session(request: CreateSessionRequest):
    """Create a new chat session"""
    session_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    session = {
        "id": session_id,
        "user_id": request.user_id,
        "agent_id": request.agent_id,
        "title": request.title,
        "created_at": now,
        "updated_at": now,
        "last_message_at": None,
        "is_active": True,
    }

    sessions_db[session_id] = session
    messages_db[session_id] = []

    return SessionResponse(**session)


@router.get("", response_model=List[SessionResponse])
async def get_sessions(user_id: Optional[str] = None, agent_id: Optional[str] = None):
    """Get all sessions, optionally filtered by user_id or agent_id"""
    sessions = list(sessions_db.values())

    if user_id:
        sessions = [s for s in sessions if s["user_id"] == user_id]

    if agent_id:
        sessions = [s for s in sessions if s["agent_id"] == agent_id]

    # Sort by updated_at descending
    sessions.sort(key=lambda s: s["updated_at"], reverse=True)

    return [SessionResponse(**s) for s in sessions]


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str):
    """Get a specific session"""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionResponse(**session)


@router.put("/{session_id}", response_model=SessionResponse)
async def update_session(session_id: str, request: UpdateSessionRequest):
    """Update session details"""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if request.title is not None:
        session["title"] = request.title

    if request.is_active is not None:
        session["is_active"] = request.is_active

    session["updated_at"] = datetime.utcnow().isoformat()
    sessions_db[session_id] = session

    return SessionResponse(**session)


@router.delete("/{session_id}", status_code=204)
async def delete_session(session_id: str):
    """Delete a session"""
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    # Close WebSocket connection if active
    if session_id in active_connections:
        try:
            await active_connections[session_id].close()
        except Exception:
            pass
        del active_connections[session_id]

    # Delete session and messages
    del sessions_db[session_id]
    if session_id in messages_db:
        del messages_db[session_id]


@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(session_id: str, limit: int = 100, offset: int = 0):
    """Get messages for a session"""
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    messages = messages_db.get(session_id, [])

    # Apply pagination
    paginated = messages[offset : offset + limit]

    return [MessageResponse(**m) for m in paginated]


@router.post("/{session_id}/messages", response_model=MessageResponse)
async def send_message(session_id: str, request: MessageRequest):
    """Send a message in a session (REST fallback)"""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    message_id = str(uuid.uuid4())
    now = datetime.utcnow().isoformat()

    message = {
        "id": message_id,
        "session_id": session_id,
        "role": request.role,
        "content": request.content,
        "agent_id": session["agent_id"] if request.role == "agent" else None,
        "timestamp": now,
        "status": "sent",
    }

    # Store message
    if session_id not in messages_db:
        messages_db[session_id] = []
    messages_db[session_id].append(message)

    # Update session
    session["last_message_at"] = now
    session["updated_at"] = now
    sessions_db[session_id] = session

    # Broadcast to WebSocket if connected
    if session_id in active_connections:
        try:
            ws_message = {
                "type": "message",
                "payload": message,
                "timestamp": now,
            }
            await active_connections[session_id].send_json(ws_message)
        except Exception:
            pass

    return MessageResponse(**message)


# WebSocket endpoint
@router.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time chat

    Message format:
    {
        "type": "message" | "typing" | "ping",
        "payload": {...},
        "timestamp": "ISO 8601"
    }
    """
    # Verify session exists
    if session_id not in sessions_db:
        await websocket.close(code=4004, reason="Session not found")
        return

    # Accept connection
    await websocket.accept()
    active_connections[session_id] = websocket

    try:
        # Send connection confirmation
        await websocket.send_json(
            {
                "type": "connection",
                "payload": {"status": "connected", "session_id": session_id},
                "timestamp": datetime.utcnow().isoformat(),
            }
        )

        # Keep connection alive and handle messages
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "message":
                    # Handle incoming message
                    payload = message.get("payload", {})
                    content = payload.get("content", "")

                    if content:
                        # Store user message
                        message_id = str(uuid.uuid4())
                        now = datetime.utcnow().isoformat()

                        user_message = {
                            "id": message_id,
                            "session_id": session_id,
                            "role": "user",
                            "content": content,
                            "agent_id": None,
                            "timestamp": now,
                            "status": "sent",
                        }

                        if session_id not in messages_db:
                            messages_db[session_id] = []
                        messages_db[session_id].append(user_message)

                        # Update session
                        sessions_db[session_id]["last_message_at"] = now
                        sessions_db[session_id]["updated_at"] = now

                        # Echo back confirmation
                        await websocket.send_json(
                            {
                                "type": "message",
                                "payload": user_message,
                                "timestamp": now,
                            }
                        )

                        # Here you would typically:
                        # 1. Get the agent from sessions_db[session_id]['agent_id']
                        # 2. Call agent.process_message()
                        # 3. Send agent response back through WebSocket
                        # For now, we just acknowledge the message

                elif msg_type == "typing":
                    # Broadcast typing indicator
                    payload = message.get("payload", {})
                    await websocket.send_json(
                        {
                            "type": "typing",
                            "payload": {
                                "session_id": session_id,
                                "is_typing": payload.get("is_typing", False),
                            },
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )

                elif msg_type == "ping":
                    # Respond to ping
                    await websocket.send_json(
                        {
                            "type": "pong",
                            "payload": {},
                            "timestamp": datetime.utcnow().isoformat(),
                        }
                    )

            except json.JSONDecodeError:
                await websocket.send_json(
                    {
                        "type": "error",
                        "payload": {
                            "code": "invalid_json",
                            "message": "Invalid JSON format",
                        },
                        "timestamp": datetime.utcnow().isoformat(),
                    }
                )

    except WebSocketDisconnect:
        # Client disconnected
        if session_id in active_connections:
            del active_connections[session_id]

    except Exception as e:
        # Unexpected error
        try:
            await websocket.send_json(
                {
                    "type": "error",
                    "payload": {"code": "server_error", "message": str(e)},
                    "timestamp": datetime.utcnow().isoformat(),
                }
            )
        except Exception:
            pass

        if session_id in active_connections:
            del active_connections[session_id]
