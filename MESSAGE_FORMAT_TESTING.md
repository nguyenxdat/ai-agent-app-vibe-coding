# Message Format Testing Guide

Test guide for Rich Message Formats (plain text, markdown, code blocks).

---

## Test Cases

### T112: Plain Text Rendering ✅

**Purpose**: Verify plain text messages display correctly

**Test Messages**:
```
1. "Hello, world!"
2. "This is a simple plain text message."
3. "Multi-line message\nwith line breaks\nshould work."
4. "Special characters: !@#$%^&*()_+-=[]{}|;:',.<>?/"
5. "Unicode: 你好 こんにちは 안녕하세요 🎉"
```

**Expected Result**:
- Text displays as-is
- Line breaks preserved
- Special characters render correctly
- Unicode characters display properly
- No formatting applied

**How to Test**:
1. Open chat interface
2. Send each test message
3. Verify rendering matches expectations
4. Check in both light and dark modes

---

### T113: Markdown Rendering ✅

**Purpose**: Verify markdown formatting works correctly

**Test Messages**:

#### Headers
```markdown
# Heading 1
## Heading 2
### Heading 3
```

#### Text Formatting
```markdown
**Bold text**
*Italic text*
***Bold and italic***
~~Strikethrough~~
`inline code`
```

#### Lists
```markdown
- Unordered item 1
- Unordered item 2
  - Nested item

1. Ordered item 1
2. Ordered item 2
   1. Nested ordered item
```

#### Links
```markdown
[OpenAI](https://openai.com)
[Local link](/settings)
```

#### Blockquotes
```markdown
> This is a blockquote
> It can span multiple lines
```

#### Tables
```markdown
| Feature | Status |
|---------|--------|
| Chat    | ✅     |
| A2A     | ✅     |
```

#### Horizontal Rules
```markdown
---
***
```

**Expected Result**:
- Headers render with appropriate sizes
- Bold/italic/strikethrough applied correctly
- Lists have proper bullets/numbers and indentation
- Links are clickable
- Blockquotes have distinctive styling
- Tables formatted properly
- Code inline has monospace font and background
- Horizontal rules display as dividers

**How to Test**:
1. Send each markdown example
2. Verify visual styling
3. Test link clicking
4. Check responsive layout
5. Verify in light and dark modes

---

### T114: Code Block Rendering with Syntax Highlighting ✅

**Purpose**: Verify code blocks with syntax highlighting

**Test Code Blocks**:

#### Python
````markdown
```python
def greet(name):
    """Greet a person by name."""
    return f"Hello, {name}!"

# Usage
message = greet("User")
print(message)
```
````

#### JavaScript/TypeScript
````markdown
```typescript
interface User {
  id: string
  name: string
  email: string
}

const greetUser = (user: User): string => {
  return `Hello, ${user.name}!`
}

// Usage
const user: User = { id: '1', name: 'Alice', email: 'alice@example.com' }
console.log(greetUser(user))
```
````

#### JSON
````markdown
```json
{
  "name": "AI Chat App",
  "version": "1.0.0",
  "features": ["chat", "a2a", "markdown"]
}
```
````

#### SQL
````markdown
```sql
SELECT users.name, COUNT(messages.id) as message_count
FROM users
LEFT JOIN messages ON users.id = messages.user_id
GROUP BY users.id
ORDER BY message_count DESC
LIMIT 10;
```
````

#### Bash/Shell
````markdown
```bash
#!/bin/bash
cd backend
source venv/bin/activate
python -m src.server.app
```
````

#### HTML/CSS
````markdown
```html
<div class="card">
  <h2>Title</h2>
  <p>Description</p>
</div>

<style>
.card {
  border: 1px solid #ccc;
  padding: 1rem;
  border-radius: 0.5rem;
}
</style>
```
````

**Expected Result**:
- Code blocks have distinct background
- Syntax highlighting applied (keywords, strings, comments colored)
- Line numbers visible (optional)
- Copy button appears on hover
- Proper monospace font
- Scrollable if content is long
- Language label displayed
- Code preserves indentation and spacing

**How to Test**:
1. Send each code block example
2. Verify syntax highlighting colors
3. Test copy button functionality
4. Check horizontal/vertical scrolling
5. Verify language detection
6. Test in light and dark modes
7. Check readability

---

## Component Testing

### ChatMessage Component

**File**: `web/src/components/chat/ChatMessage.tsx`

**Tests**:
- [ ] Renders plain text correctly
- [ ] Detects and renders markdown
- [ ] Handles code blocks properly
- [ ] Applies correct styling for user vs assistant
- [ ] Timestamps display correctly
- [ ] Avatar/icon renders

### MarkdownMessage Component

**File**: `web/src/components/chat/MarkdownMessage.tsx`

**Tests**:
- [ ] All markdown syntax renders
- [ ] Links are safe (external links open in new tab)
- [ ] Images render (if supported)
- [ ] Tables format correctly
- [ ] Nested markdown works

### CodeBlock Component

**File**: `web/src/components/chat/CodeBlock.tsx`

**Tests**:
- [ ] Syntax highlighting works for all languages
- [ ] Copy button copies correct content
- [ ] Copy button shows feedback
- [ ] Language label displays
- [ ] Long code scrolls properly
- [ ] Supports multiple themes (light/dark)

---

## Integration Testing

### End-to-End Format Test

**Scenario**: User sends message requesting code

```
User: "Show me a Python function to calculate fibonacci numbers"

Expected AI Response:
```python
def fibonacci(n):
    """
    Calculate the nth Fibonacci number.

    Args:
        n: The position in the Fibonacci sequence

    Returns:
        The Fibonacci number at position n
    """
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Example usage
print(fibonacci(10))  # Output: 55
```
```

**Verify**:
1. Request sent as plain text
2. Response detected as code format
3. Code block renders with syntax highlighting
4. Copy button works
5. Python syntax colored correctly

---

## Browser Compatibility

Test in each browser:

| Browser | Plain Text | Markdown | Code | Notes |
|---------|-----------|----------|------|-------|
| Chrome  | ✅ | ✅ | ✅ | Primary dev browser |
| Firefox | ⏳ | ⏳ | ⏳ | Test pending |
| Safari  | ⏳ | ⏳ | ⏳ | Test pending |
| Edge    | ⏳ | ⏳ | ⏳ | Test pending |

---

## Performance Testing

### Large Message Test

**Test**: Send message with 1000+ lines of code

**Expected**:
- Page remains responsive
- Scrolling is smooth
- Syntax highlighting doesn't freeze UI
- Copy button still works

### Multiple Code Blocks

**Test**: Send message with 10+ code blocks in different languages

**Expected**:
- All blocks render correctly
- No performance degradation
- Each has independent copy button
- Syntax highlighting accurate for each language

---

## Accessibility Testing

- [ ] Code blocks have proper ARIA labels
- [ ] Copy button keyboard accessible
- [ ] Screen reader announces code language
- [ ] Sufficient color contrast in syntax highlighting
- [ ] Focus indicators visible

---

## Known Issues

### Issue 1: [Example - remove after testing]
**Description**: Long inline code breaks layout on mobile
**Status**: ⏳ To Fix
**Workaround**: Use code blocks for long code

---

## Test Results

### Manual Testing

| Test Case | Status | Date | Tester | Notes |
|-----------|--------|------|--------|-------|
| T112: Plain Text | ✅ | 2025-11-07 | - | All formats render correctly |
| T113: Markdown | ✅ | 2025-11-07 | - | Headers, lists, links work |
| T114: Code Blocks | ✅ | 2025-11-07 | - | Python, JS, JSON tested |

### Browser Testing

| Browser | Version | Status | Date |
|---------|---------|--------|------|
| Chrome  | 120+    | ✅ | 2025-11-07 |
| Firefox | 120+    | ⏳ | - |
| Safari  | 17+     | ⏳ | - |
| Edge    | 120+    | ⏳ | - |

---

## Automated Tests (Future)

```typescript
describe('Message Formatting', () => {
  test('renders plain text', () => {
    // Test implementation
  })

  test('renders markdown headers', () => {
    // Test implementation
  })

  test('renders code blocks with syntax highlighting', () => {
    // Test implementation
  })

  test('copy button copies code', () => {
    // Test implementation
  })
})
```

---

## Sign-off

- [ ] All plain text tests pass
- [ ] All markdown tests pass
- [ ] All code block tests pass
- [ ] Cross-browser tested
- [ ] Accessibility verified
- [ ] Performance acceptable

**Approved by**: _______________
**Date**: _______________
