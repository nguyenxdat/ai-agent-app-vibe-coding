#!/usr/bin/env python3
"""
A2A Protocol Client Test Script

Tests the A2A endpoints from an external client perspective.
This simulates how another application would interact with our A2A agent.

Usage:
    python test_a2a_client.py                    # Test without authentication
    python test_a2a_client.py --api-key YOUR_KEY # Test with authentication
"""

import argparse
import requests
import json
from typing import Optional
import sys


class A2AClient:
    """
    Simple A2A protocol client for testing
    """

    def __init__(self, base_url: str = "http://localhost:8000", api_key: Optional[str] = None):
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.session_id: Optional[str] = None

    def _get_headers(self) -> dict:
        """Get request headers with optional authentication"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def get_agent_card(self) -> dict:
        """
        Test T099: Get agent card

        GET /api/v1/a2a/agent-card
        """
        print("\n📋 Test 1: Getting Agent Card...")
        print(f"   URL: {self.base_url}/api/v1/a2a/agent-card")

        try:
            response = requests.get(
                f"{self.base_url}/api/v1/a2a/agent-card",
                timeout=10
            )

            if response.status_code == 200:
                agent_card = response.json()
                print("   ✅ Success!")
                print(f"   Agent ID: {agent_card.get('id')}")
                print(f"   Agent Name: {agent_card.get('name')}")
                print(f"   Capabilities: {', '.join(agent_card.get('capabilities', []))}")
                print(f"   Protocol Version: {agent_card.get('protocol_version')}")
                return agent_card
            else:
                print(f"   ❌ Failed: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                return {}

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return {}

    def send_message(self, content: str, message_format: str = "plain") -> Optional[dict]:
        """
        Test T100: Send message to agent

        POST /api/v1/a2a/message
        """
        print(f"\n💬 Test 2: Sending Message...")
        print(f"   URL: {self.base_url}/api/v1/a2a/message")
        print(f"   Content: \"{content}\"")
        print(f"   Format: {message_format}")

        try:
            payload = {
                "content": content,
                "format": message_format,
            }

            # Include session_id if we have one
            if self.session_id:
                payload["session_id"] = self.session_id

            response = requests.post(
                f"{self.base_url}/api/v1/a2a/message",
                headers=self._get_headers(),
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                message_response = response.json()
                print("   ✅ Success!")
                print(f"   Message ID: {message_response.get('message_id')}")
                print(f"   Response Format: {message_response.get('format')}")
                print(f"   Response Content:")
                print(f"   {message_response.get('content')[:200]}...")

                # Extract session_id for future messages
                if 'metadata' in message_response and 'session_id' in message_response['metadata']:
                    self.session_id = message_response['metadata']['session_id']
                    print(f"   Session ID: {self.session_id}")

                return message_response

            elif response.status_code == 401:
                print(f"   ❌ Authentication Failed (401)")
                print(f"   Response: {response.json()}")
                print(f"   💡 Hint: You may need to provide an API key with --api-key")
                return None

            else:
                print(f"   ❌ Failed: HTTP {response.status_code}")
                print(f"   Response: {response.text}")
                return None

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return None

    def validate_agent_card_compliance(self, agent_card: dict) -> bool:
        """
        Test T101: Validate agent card format compliance
        """
        print("\n🔍 Test 3: Validating Agent Card Compliance...")

        required_fields = ["id", "name", "description", "capabilities", "protocol_version"]
        missing_fields = []

        for field in required_fields:
            if field not in agent_card:
                missing_fields.append(field)

        if missing_fields:
            print(f"   ❌ Missing required fields: {', '.join(missing_fields)}")
            return False

        # Check capabilities
        if not isinstance(agent_card.get("capabilities"), list):
            print("   ❌ 'capabilities' must be a list")
            return False

        # Check metadata
        if "metadata" in agent_card:
            metadata = agent_card["metadata"]
            if "endpoints" not in metadata:
                print("   ⚠️  Warning: 'metadata.endpoints' not found")

        print("   ✅ Agent card format is compliant!")
        return True

    def check_health(self) -> bool:
        """
        Check A2A service health
        """
        print("\n🏥 Health Check...")
        print(f"   URL: {self.base_url}/api/v1/a2a/health")

        try:
            response = requests.get(
                f"{self.base_url}/api/v1/a2a/health",
                timeout=10
            )

            if response.status_code == 200:
                health = response.json()
                print("   ✅ Service is healthy")
                print(f"   Status: {health.get('status')}")
                print(f"   Protocol: {health.get('protocol')}")
                print(f"   Version: {health.get('version')}")
                print(f"   Active Sessions: {health.get('active_sessions')}")
                return True
            else:
                print(f"   ❌ Health check failed: HTTP {response.status_code}")
                return False

        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            return False


def run_tests(base_url: str, api_key: Optional[str] = None):
    """
    Run all A2A protocol tests
    """
    print("=" * 60)
    print("🚀 A2A Protocol Client Test Suite")
    print("=" * 60)
    print(f"Base URL: {base_url}")
    print(f"Authentication: {'Enabled (API Key provided)' if api_key else 'Disabled'}")
    print("=" * 60)

    client = A2AClient(base_url, api_key)

    # Test 0: Health check
    if not client.check_health():
        print("\n❌ Server is not available. Please start the server first.")
        print("   Run: cd backend && python -m src.server.app")
        return False

    # Test 1: Get agent card (T099)
    agent_card = client.get_agent_card()
    if not agent_card:
        print("\n❌ Failed to get agent card")
        return False

    # Test 3: Validate agent card (T101)
    if not client.validate_agent_card_compliance(agent_card):
        return False

    # Test 2: Send messages (T100)
    test_messages = [
        ("Hello! How are you?", "plain"),
        ("What can you do?", "plain"),
        ("Show me a code example", "plain"),
    ]

    for content, fmt in test_messages:
        response = client.send_message(content, fmt)
        if not response:
            print(f"\n❌ Failed to send message: {content}")
            return False

    print("\n" + "=" * 60)
    print("✅ All tests passed successfully!")
    print("=" * 60)
    print("\n📊 Summary:")
    print("   • Agent card retrieved and validated")
    print("   • Messages sent and received")
    print(f"   • Session maintained: {client.session_id}")
    print("   • A2A protocol compliance verified")

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Test A2A protocol endpoints"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the A2A server (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--api-key",
        help="API key for authentication (optional)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose output"
    )

    args = parser.parse_args()

    try:
        success = run_tests(args.base_url, args.api_key)
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        if args.verbose:
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
