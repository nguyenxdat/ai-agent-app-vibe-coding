/**
 * A2A Protocol Client Test (TypeScript/JavaScript)
 *
 * Tests the A2A endpoints from a TypeScript/JavaScript client.
 * Can be run with ts-node or compiled to JavaScript.
 *
 * Usage:
 *   npx ts-node test_a2a_client.ts
 *   npx ts-node test_a2a_client.ts --api-key YOUR_KEY
 */

interface AgentCard {
  id: string
  name: string
  description: string
  capabilities: string[]
  protocol_version: string
  metadata?: {
    endpoints?: Record<string, string>
    authentication?: {
      required: boolean
      methods: string[]
    }
    [key: string]: any
  }
}

interface MessageRequest {
  content: string
  format?: 'plain' | 'markdown' | 'code'
  session_id?: string
  context?: Record<string, any>
}

interface MessageResponse {
  message_id: string
  content: string
  format: string
  timestamp: string
  metadata?: {
    session_id?: string
    [key: string]: any
  }
}

class A2AClient {
  private baseUrl: string
  private apiKey?: string
  private sessionId?: string

  constructor(baseUrl: string = 'http://localhost:8000', apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    return headers
  }

  /**
   * Test T099: Get agent card
   */
  async getAgentCard(): Promise<AgentCard | null> {
    console.log('\n📋 Test 1: Getting Agent Card...')
    console.log(`   URL: ${this.baseUrl}/api/v1/a2a/agent-card`)

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/a2a/agent-card`)

      if (response.ok) {
        const agentCard: AgentCard = await response.json()
        console.log('   ✅ Success!')
        console.log(`   Agent ID: ${agentCard.id}`)
        console.log(`   Agent Name: ${agentCard.name}`)
        console.log(`   Capabilities: ${agentCard.capabilities.join(', ')}`)
        console.log(`   Protocol Version: ${agentCard.protocol_version}`)
        return agentCard
      } else {
        console.log(`   ❌ Failed: HTTP ${response.status}`)
        const text = await response.text()
        console.log(`   Response: ${text}`)
        return null
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * Test T100: Send message to agent
   */
  async sendMessage(content: string, format: 'plain' | 'markdown' | 'code' = 'plain'): Promise<MessageResponse | null> {
    console.log('\n💬 Test 2: Sending Message...')
    console.log(`   URL: ${this.baseUrl}/api/v1/a2a/message`)
    console.log(`   Content: "${content}"`)
    console.log(`   Format: ${format}`)

    try {
      const payload: MessageRequest = {
        content,
        format,
      }

      if (this.sessionId) {
        payload.session_id = this.sessionId
      }

      const response = await fetch(`${this.baseUrl}/api/v1/a2a/message`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const messageResponse: MessageResponse = await response.json()
        console.log('   ✅ Success!')
        console.log(`   Message ID: ${messageResponse.message_id}`)
        console.log(`   Response Format: ${messageResponse.format}`)
        console.log(`   Response Content:`)
        console.log(`   ${messageResponse.content.substring(0, 200)}...`)

        // Extract session_id
        if (messageResponse.metadata?.session_id) {
          this.sessionId = messageResponse.metadata.session_id
          console.log(`   Session ID: ${this.sessionId}`)
        }

        return messageResponse
      } else if (response.status === 401) {
        console.log('   ❌ Authentication Failed (401)')
        const json = await response.json()
        console.log(`   Response: ${JSON.stringify(json)}`)
        console.log('   💡 Hint: You may need to provide an API key')
        return null
      } else {
        console.log(`   ❌ Failed: HTTP ${response.status}`)
        const text = await response.text()
        console.log(`   Response: ${text}`)
        return null
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  /**
   * Test T101: Validate agent card format compliance
   */
  validateAgentCardCompliance(agentCard: AgentCard): boolean {
    console.log('\n🔍 Test 3: Validating Agent Card Compliance...')

    const requiredFields = ['id', 'name', 'description', 'capabilities', 'protocol_version']
    const missingFields = requiredFields.filter((field) => !(field in agentCard))

    if (missingFields.length > 0) {
      console.log(`   ❌ Missing required fields: ${missingFields.join(', ')}`)
      return false
    }

    // Check capabilities
    if (!Array.isArray(agentCard.capabilities)) {
      console.log("   ❌ 'capabilities' must be an array")
      return false
    }

    // Check metadata
    if (agentCard.metadata && !agentCard.metadata.endpoints) {
      console.log("   ⚠️  Warning: 'metadata.endpoints' not found")
    }

    console.log('   ✅ Agent card format is compliant!')
    return true
  }

  /**
   * Health check
   */
  async checkHealth(): Promise<boolean> {
    console.log('\n🏥 Health Check...')
    console.log(`   URL: ${this.baseUrl}/api/v1/a2a/health`)

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/a2a/health`)

      if (response.ok) {
        const health = await response.json()
        console.log('   ✅ Service is healthy')
        console.log(`   Status: ${health.status}`)
        console.log(`   Protocol: ${health.protocol}`)
        console.log(`   Version: ${health.version}`)
        console.log(`   Active Sessions: ${health.active_sessions}`)
        return true
      } else {
        console.log(`   ❌ Health check failed: HTTP ${response.status}`)
        return false
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }
}

async function runTests(baseUrl: string, apiKey?: string): Promise<boolean> {
  console.log('='.repeat(60))
  console.log('🚀 A2A Protocol Client Test Suite (TypeScript)')
  console.log('='.repeat(60))
  console.log(`Base URL: ${baseUrl}`)
  console.log(`Authentication: ${apiKey ? 'Enabled (API Key provided)' : 'Disabled'}`)
  console.log('='.repeat(60))

  const client = new A2AClient(baseUrl, apiKey)

  // Test 0: Health check
  if (!(await client.checkHealth())) {
    console.log('\n❌ Server is not available. Please start the server first.')
    console.log('   Run: cd backend && python -m src.server.app')
    return false
  }

  // Test 1: Get agent card
  const agentCard = await client.getAgentCard()
  if (!agentCard) {
    console.log('\n❌ Failed to get agent card')
    return false
  }

  // Test 3: Validate agent card
  if (!client.validateAgentCardCompliance(agentCard)) {
    return false
  }

  // Test 2: Send messages
  const testMessages: Array<[string, 'plain' | 'markdown' | 'code']> = [
    ['Hello! How are you?', 'plain'],
    ['What can you do?', 'plain'],
    ['Show me a code example', 'plain'],
  ]

  for (const [content, format] of testMessages) {
    const response = await client.sendMessage(content, format)
    if (!response) {
      console.log(`\n❌ Failed to send message: ${content}`)
      return false
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ All tests passed successfully!')
  console.log('='.repeat(60))
  console.log('\n📊 Summary:')
  console.log('   • Agent card retrieved and validated')
  console.log('   • Messages sent and received')
  console.log(`   • Session maintained: ${client['sessionId']}`)
  console.log('   • A2A protocol compliance verified')

  return true
}

// Main execution
async function main() {
  const args = process.argv.slice(2)
  const baseUrlIndex = args.indexOf('--base-url')
  const apiKeyIndex = args.indexOf('--api-key')

  const baseUrl = baseUrlIndex !== -1 && args[baseUrlIndex + 1] ? args[baseUrlIndex + 1] : 'http://localhost:8000'
  const apiKey = apiKeyIndex !== -1 && args[apiKeyIndex + 1] ? args[apiKeyIndex + 1] : undefined

  try {
    const success = await runTests(baseUrl, apiKey)
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.log(`\n\n❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

// Run if executed directly
if (require.main === module) {
  main()
}

export { A2AClient, AgentCard, MessageRequest, MessageResponse }
