# Browser Testing Checklist

Test checklist cho AI Chat App trên các web browsers khác nhau.

## Test Environment Setup

```bash
# Start backend
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python -m src.server.app

# Start web app (in another terminal)
cd web
npm run dev
```

Access: http://localhost:5173

---

## Browsers to Test

- [x] **Chrome/Chromium** (v120+)
- [ ] **Firefox** (v120+)
- [ ] **Safari** (v17+)
- [ ] **Edge** (v120+)

---

## Test Cases

### 1. Basic Functionality

#### 1.1 Page Load
- [ ] App loads without errors
- [ ] No console errors on initial load
- [ ] Tailwind CSS styles applied correctly
- [ ] Dark/Light theme toggle works
- [ ] Fonts and icons render correctly

#### 1.2 Navigation
- [ ] Left navigation menu visible
- [ ] Can switch between Chat and Settings
- [ ] Navigation icons render correctly
- [ ] Active page highlighted

### 2. Chat Functionality

#### 2.1 WebSocket Connection
- [ ] WebSocket connects successfully
- [ ] Connection status indicator works
- [ ] Reconnection works after disconnect
- [ ] No memory leaks on reconnect

#### 2.2 Messaging
- [ ] Can send text messages
- [ ] Messages appear in chat history
- [ ] Markdown rendering works
- [ ] Code blocks with syntax highlighting
- [ ] Copy button on code blocks works
- [ ] Typing indicator appears
- [ ] Timestamps display correctly

#### 2.3 Session Management
- [ ] Can create new chat session
- [ ] Can switch between sessions
- [ ] Session list updates correctly
- [ ] Messages persist in localStorage

### 3. Settings/Agent Configuration

#### 3.1 Agent Management
- [ ] Can view agent list
- [ ] Can add new agent
- [ ] Can edit agent configuration
- [ ] Can delete agent
- [ ] Validation errors display correctly
- [ ] Success/error notifications work

#### 3.2 Form Handling
- [ ] All input fields work
- [ ] Dropdowns work correctly
- [ ] Toggle switches work
- [ ] Form validation works
- [ ] Can save changes

### 4. Responsive Design

- [ ] Desktop (1920x1080) - layout correct
- [ ] Laptop (1366x768) - layout correct
- [ ] Tablet (768x1024) - layout adapts
- [ ] Mobile (375x667) - mobile-friendly

### 5. Performance

- [ ] Initial page load < 3s
- [ ] Messages render smoothly (100+ messages)
- [ ] No UI freezing during typing
- [ ] Smooth scrolling in chat
- [ ] Memory usage stable (< 100MB after 30min)

### 6. Browser-Specific Features

#### Chrome/Chromium
- [ ] Service Worker support (if implemented)
- [ ] Web Notifications work
- [ ] localStorage quota sufficient
- [ ] IndexedDB support (future)

#### Firefox
- [ ] CSS Grid layout correct
- [ ] Flexbox rendering correct
- [ ] Web Notifications work
- [ ] localStorage works

#### Safari
- [ ] Webkit-specific CSS works
- [ ] Web Notifications permission flow
- [ ] localStorage works
- [ ] No CORS issues

#### Edge
- [ ] Chromium-based features work
- [ ] Web Notifications work
- [ ] All APIs supported

---

## Known Issues

### Safari-Specific
- [ ] Check if `flex-gap` is supported (Safari < 14.1)
- [ ] WebSocket connection may need special handling
- [ ] Web Notifications require user gesture

### Firefox-Specific
- [ ] Check CSS custom properties support
- [ ] Verify scroll behavior

---

## Testing Results

### Chrome v120+ ✅
- **Date**: 2025-11-07
- **Status**: All tests passed
- **Notes**: Development browser, fully tested

### Firefox v120+
- **Date**: _Not tested yet_
- **Status**: ⏳ Pending
- **Notes**:

### Safari v17+
- **Date**: _Not tested yet_
- **Status**: ⏳ Pending
- **Notes**:

### Edge v120+
- **Date**: _Not tested yet_
- **Status**: ⏳ Pending
- **Notes**:

---

## Automated Testing (Future)

```bash
# Run Playwright tests across browsers
npm run test:browsers

# Run specific browser
npm run test:chrome
npm run test:firefox
npm run test:safari
```

---

## Reporting Issues

When reporting browser-specific issues:

1. Browser name and version
2. Operating system
3. Steps to reproduce
4. Screenshots/console errors
5. Network tab (if API/WebSocket related)

**Example:**
```
Browser: Firefox 120.0
OS: macOS 14.1
Issue: WebSocket connection fails with CORS error
Console Error: [paste error here]
```
