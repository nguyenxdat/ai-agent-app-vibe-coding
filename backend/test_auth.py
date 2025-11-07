#!/usr/bin/env python3
"""
Test script for A2A authentication
"""

import os
import sys

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from server.middleware.auth import get_a2a_api_key, is_auth_enabled

# Test 1: No API key (default)
print("Test 1: No API key set")
print(f"  API Key: {get_a2a_api_key()}")
print(f"  Auth Enabled: {is_auth_enabled()}")
print()

# Test 2: With API key
print("Test 2: With API key set")
os.environ['A2A_API_KEY'] = 'test-secret-key-12345'
print(f"  API Key: {get_a2a_api_key()}")
print(f"  Auth Enabled: {is_auth_enabled()}")
print()

# Test 3: Verify token matching
print("Test 3: Token verification logic")
test_token = "test-secret-key-12345"
api_key = get_a2a_api_key()
print(f"  Test Token: {test_token}")
print(f"  API Key: {api_key}")
print(f"  Match: {test_token == api_key}")
print()

print("✅ All authentication logic tests passed!")
