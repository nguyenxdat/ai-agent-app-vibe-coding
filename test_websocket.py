#!/usr/bin/env python3
"""
Test WebSocket chat with Gemini agent
"""

import asyncio
import websockets
import json
from datetime import datetime

async def test_chat():
    session_id = "a3e24ba5-480a-4f63-b0dc-8699e1bb78a4"
    uri = f"ws://localhost:8000/api/v1/sessions/ws/{session_id}"

    print(f"🔌 Connecting to WebSocket: {uri}")

    async with websockets.connect(uri) as websocket:
        # Wait for connection confirmation
        response = await websocket.recv()
        print(f"✅ Connected: {response}")

        # Send a test message
        test_message = {
            "type": "message",
            "payload": {
                "content": "Hello! Can you tell me a short joke?"
            },
            "timestamp": datetime.utcnow().isoformat()
        }

        print(f"\n📤 Sending message: {test_message['payload']['content']}")
        await websocket.send(json.dumps(test_message))

        # Listen for responses
        print("\n👂 Listening for responses...\n")

        response_count = 0
        max_responses = 10  # Limit number of responses

        while response_count < max_responses:
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                data = json.loads(message)

                msg_type = data.get("type")
                payload = data.get("payload", {})

                if msg_type == "message":
                    role = payload.get("role", "unknown")
                    content = payload.get("content", "")

                    if role == "user":
                        print(f"✉️  User message confirmed: {content[:100]}...")
                    elif role == "agent":
                        print(f"🤖 Agent response: {content}")
                        # Exit after getting agent response
                        break

                elif msg_type == "typing":
                    is_typing = payload.get("is_typing", False)
                    if is_typing:
                        print("⌨️  Agent is typing...")
                    else:
                        print("⌨️  Agent stopped typing")

                elif msg_type == "error":
                    print(f"❌ Error: {payload}")
                    break

                else:
                    print(f"📨 {msg_type}: {payload}")

                response_count += 1

            except asyncio.TimeoutError:
                print("⏱️  Timeout waiting for response")
                break

        print("\n✅ Test complete!")

if __name__ == "__main__":
    asyncio.run(test_chat())
