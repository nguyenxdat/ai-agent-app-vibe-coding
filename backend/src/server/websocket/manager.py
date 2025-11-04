"""
WebSocket Connection Manager
Manages WebSocket connections and message routing
"""

from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
import json
import logging
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections
    Handles connection lifecycle, message routing, and broadcasting
    """

    def __init__(self):
        """Initialize connection manager"""
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

        # Session to connections mapping: {session_id: Set[connection_id]}
        self.session_connections: Dict[str, Set[str]] = {}

        # Connection metadata: {connection_id: Dict[str, Any]}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(
        self,
        websocket: WebSocket,
        connection_id: str,
        session_id: Optional[str] = None,
    ) -> None:
        """
        Accept and register new WebSocket connection

        Args:
            websocket: WebSocket connection
            connection_id: Unique connection identifier
            session_id: Optional session identifier
        """
        await websocket.accept()

        self.active_connections[connection_id] = websocket
        self.connection_metadata[connection_id] = {
            "session_id": session_id,
            "connected_at": datetime.utcnow().isoformat(),
            "last_activity": datetime.utcnow().isoformat(),
        }

        # Associate connection with session
        if session_id:
            if session_id not in self.session_connections:
                self.session_connections[session_id] = set()
            self.session_connections[session_id].add(connection_id)

        logger.info(
            f"Connection {connection_id} established "
            f"(session: {session_id}, total: {len(self.active_connections)})"
        )

        # Send connection acknowledgment
        await self.send_personal_message(
            connection_id,
            {
                "type": "connection_ack",
                "data": {
                    "connection_id": connection_id,
                    "session_id": session_id,
                },
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    def disconnect(self, connection_id: str) -> None:
        """
        Remove connection

        Args:
            connection_id: Connection identifier to remove
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Attempt to disconnect unknown connection: {connection_id}")
            return

        # Remove from session connections
        metadata = self.connection_metadata.get(connection_id, {})
        session_id = metadata.get("session_id")

        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(connection_id)

            # Clean up empty session
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]

        # Remove connection
        del self.active_connections[connection_id]
        del self.connection_metadata[connection_id]

        logger.info(
            f"Connection {connection_id} disconnected "
            f"(remaining: {len(self.active_connections)})"
        )

    async def send_personal_message(
        self,
        connection_id: str,
        message: Dict[str, Any],
    ) -> bool:
        """
        Send message to specific connection

        Args:
            connection_id: Target connection ID
            message: Message to send

        Returns:
            True if sent successfully, False otherwise
        """
        if connection_id not in self.active_connections:
            logger.warning(f"Cannot send to unknown connection: {connection_id}")
            return False

        try:
            websocket = self.active_connections[connection_id]
            await websocket.send_json(message)

            # Update last activity
            if connection_id in self.connection_metadata:
                self.connection_metadata[connection_id]["last_activity"] = (
                    datetime.utcnow().isoformat()
                )

            return True
        except Exception as e:
            logger.error(f"Error sending to {connection_id}: {e}")
            self.disconnect(connection_id)
            return False

    async def send_to_session(
        self,
        session_id: str,
        message: Dict[str, Any],
    ) -> int:
        """
        Send message to all connections in a session

        Args:
            session_id: Target session ID
            message: Message to send

        Returns:
            Number of connections that received the message
        """
        if session_id not in self.session_connections:
            logger.warning(f"No connections for session: {session_id}")
            return 0

        connection_ids = list(self.session_connections[session_id])
        success_count = 0

        for connection_id in connection_ids:
            if await self.send_personal_message(connection_id, message):
                success_count += 1

        return success_count

    async def broadcast(self, message: Dict[str, Any]) -> int:
        """
        Broadcast message to all connections

        Args:
            message: Message to broadcast

        Returns:
            Number of connections that received the message
        """
        connection_ids = list(self.active_connections.keys())
        success_count = 0

        for connection_id in connection_ids:
            if await self.send_personal_message(connection_id, message):
                success_count += 1

        return success_count

    async def send_typing_indicator(
        self,
        connection_id: str,
        is_typing: bool = True,
    ) -> bool:
        """
        Send typing indicator

        Args:
            connection_id: Target connection ID
            is_typing: Typing status

        Returns:
            True if sent successfully
        """
        return await self.send_personal_message(
            connection_id,
            {
                "type": "typing",
                "data": {"is_typing": is_typing},
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def send_error(
        self,
        connection_id: str,
        error_code: str,
        error_message: str,
    ) -> bool:
        """
        Send error message

        Args:
            connection_id: Target connection ID
            error_code: Error code
            error_message: Error message

        Returns:
            True if sent successfully
        """
        return await self.send_personal_message(
            connection_id,
            {
                "type": "error",
                "data": {
                    "error_code": error_code,
                    "message": error_message,
                },
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)

    def get_session_connection_count(self, session_id: str) -> int:
        """Get number of connections for a session"""
        return len(self.session_connections.get(session_id, set()))

    def is_connection_active(self, connection_id: str) -> bool:
        """Check if connection is active"""
        return connection_id in self.active_connections

    async def ping_connection(self, connection_id: str) -> bool:
        """
        Send ping to connection

        Args:
            connection_id: Target connection ID

        Returns:
            True if ping sent successfully
        """
        return await self.send_personal_message(
            connection_id,
            {
                "type": "ping",
                "data": {},
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def cleanup_inactive_connections(self, timeout_seconds: int = 300) -> int:
        """
        Clean up connections that haven't been active

        Args:
            timeout_seconds: Inactivity timeout in seconds

        Returns:
            Number of connections cleaned up
        """
        now = datetime.utcnow()
        cleanup_count = 0

        for connection_id, metadata in list(self.connection_metadata.items()):
            last_activity = datetime.fromisoformat(metadata["last_activity"])
            inactive_seconds = (now - last_activity).total_seconds()

            if inactive_seconds > timeout_seconds:
                logger.info(
                    f"Cleaning up inactive connection {connection_id} "
                    f"(inactive for {inactive_seconds}s)"
                )
                self.disconnect(connection_id)
                cleanup_count += 1

        return cleanup_count

    def __repr__(self) -> str:
        return (
            f"<ConnectionManager("
            f"connections={len(self.active_connections)}, "
            f"sessions={len(self.session_connections)}"
            f")>"
        )


# Global connection manager instance
connection_manager = ConnectionManager()
