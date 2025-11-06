#!/usr/bin/env python3
"""
Test conversation context with multiple messages
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_conversation():
    # First, create agent and session via API
    import httpx

    async with httpx.AsyncClient() as client:
        # Create agent with unique name
        import time
        agent_name = f"Context Test {int(time.time())}"

        agent_response = await client.post(
            "http://localhost:8000/api/v1/agents",
            json={
                "name": agent_name,
                "endpointUrl": "https://llm.nal.vn",
                "authToken": "sk-rT5f8txOihUg-k4fKVVgOQ",
                "capabilities": ["chat"],
                "isActive": True,
                "selectedModel": "nal/gemini"
            }
        )
        agent_data = agent_response.json()

        if "id" not in agent_data:
            print(f"❌ Failed to create agent: {agent_data}")
            return

        agent_id = agent_data["id"]
        print(f"✅ Created agent: {agent_id}")

        # Create session
        session_response = await client.post(
            "http://localhost:8000/api/v1/sessions",
            json={
                "agent_id": agent_id,
                "user_id": "test-user",
                "title": "Context Test"
            }
        )
        session_data = session_response.json()
        session_id = session_data["id"]
        print(f"✅ Created session: {session_id}")

    uri = f"ws://localhost:8000/api/v1/sessions/ws/{session_id}"
    print(f"\n🔌 Connecting to WebSocket: {uri}\n")

    async with websockets.connect(uri) as websocket:
        # Wait for connection confirmation
        response = await websocket.recv()
        print(f"✅ Connected: {json.loads(response)['type']}\n")

        # Test 1: Ask about a topic
        print("=" * 60)
        print("TEST 1: Setting context - Ask about a color")
        print("=" * 60)

        message1 = {
            "type": "message",
            "payload": {"content": "My favorite color is blue"},
            "timestamp": datetime.utcnow().isoformat()
        }

        await websocket.send(json.dumps(message1))
        print(f"📤 Sent: {message1['payload']['content']}")

        # Collect responses for message 1
        for _ in range(5):
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(msg)
                if data["type"] == "message" and data["payload"].get("role") == "agent":
                    print(f"🤖 Response: {data['payload']['content']}\n")
                    break
            except asyncio.TimeoutError:
                break

        # Test 2: Ask a follow-up question that requires context
        print("=" * 60)
        print("TEST 2: Testing context - Ask follow-up about previous topic")
        print("=" * 60)

        message2 = {
            "type": "message",
            "payload": {"content": "What color did I just say I like?"},
            "timestamp": datetime.utcnow().isoformat()
        }

        await websocket.send(json.dumps(message2))
        print(f"📤 Sent: {message2['payload']['content']}")

        # Collect responses for message 2
        for _ in range(5):
            try:
                msg = await asyncio.wait_for(websocket.recv(), timeout=10.0)
                data = json.loads(msg)
                if data["type"] == "message" and data["payload"].get("role") == "agent":
                    response_content = data['payload']['content']
                    print(f"🤖 Response: {response_content}\n")

                    # Check if response contains "blue"
                    if "blue" in response_content.lower():
                        print("✅ SUCCESS! Agent remembered the context!")
                    else:
                        print("❌ FAILED! Agent did not remember the color.")
                    break
            except asyncio.TimeoutError:
                print("⏱️  Timeout")
                break

        print("\n" + "=" * 60)
        print("✅ Conversation test complete!")
        print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_conversation())
