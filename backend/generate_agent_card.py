#!/usr/bin/env python3
"""
Generate agent_card.json file for A2A protocol discovery

This script generates a static agent card file that can be served
for A2A protocol agent discovery.
"""

import json
import os
import sys
from datetime import datetime

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from server.middleware.auth import is_auth_enabled


def generate_agent_card(
    agent_id: str = "ai-chat-agent-001",
    agent_name: str = "AI Chat Agent",
    base_url: str = "http://localhost:8000",
    output_file: str = "agent_card.json"
):
    """
    Generate agent card JSON file

    Args:
        agent_id: Unique agent identifier
        agent_name: Agent display name
        base_url: Base URL for the agent API
        output_file: Output file path
    """

    # Define agent capabilities
    capabilities = [
        "chat",  # Real-time chat communication
        "websocket",  # WebSocket support for streaming
        "markdown",  # Markdown message format
        "code",  # Code block format with syntax highlighting
        "session-management",  # Multi-session support
        "typing-indicator",  # Typing status broadcast
        "message-history",  # Persistent message history
    ]

    # Define metadata with endpoint information
    metadata = {
        "endpoints": {
            "agent_card": f"{base_url}/api/v1/a2a/agent-card",
            "message": f"{base_url}/api/v1/a2a/message",
            "websocket": f"{base_url.replace('http', 'ws')}/ws",
            "health": f"{base_url}/api/v1/health",
            "docs": f"{base_url}/api/docs",
        },
        "authentication": {
            "required": is_auth_enabled(),
            "methods": ["bearer"],
            "header": "Authorization: Bearer <api-key>",
        },
        "rate_limits": {
            "messages_per_minute": 60,
            "concurrent_sessions": 100,
        },
        "supported_formats": ["plain", "markdown", "code"],
        "streaming": True,
        "version": "1.0.0",
        "contact": {
            "documentation": f"{base_url}/api/docs",
            "repository": "https://github.com/your-org/ai-chat-app",
        },
    }

    # Create agent card
    agent_card = {
        "id": agent_id,
        "name": agent_name,
        "description": (
            "AI Chat Agent with A2A protocol support. "
            "Provides intelligent chat responses with support for rich message formats "
            "(markdown, code blocks) and real-time WebSocket communication."
        ),
        "capabilities": capabilities,
        "protocol_version": "1.0.0",
        "created_at": datetime.utcnow().isoformat(),
        "metadata": metadata,
    }

    # Write to file
    with open(output_file, 'w') as f:
        json.dump(agent_card, f, indent=2)

    print(f"✅ Agent card generated: {output_file}")
    print(f"   Agent ID: {agent_id}")
    print(f"   Base URL: {base_url}")
    print(f"   Authentication: {'Enabled' if is_auth_enabled() else 'Disabled'}")

    return agent_card


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate A2A agent card")
    parser.add_argument(
        "--agent-id",
        default="ai-chat-agent-001",
        help="Agent ID (default: ai-chat-agent-001)"
    )
    parser.add_argument(
        "--name",
        default="AI Chat Agent",
        help="Agent name (default: AI Chat Agent)"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--output",
        default="agent_card.json",
        help="Output file (default: agent_card.json)"
    )

    args = parser.parse_args()

    generate_agent_card(
        agent_id=args.agent_id,
        agent_name=args.name,
        base_url=args.base_url,
        output_file=args.output
    )
