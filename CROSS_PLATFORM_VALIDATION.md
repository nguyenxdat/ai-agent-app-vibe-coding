# Cross-Platform Validation Checklist

Đảm bảo AI Chat App có trải nghiệm nhất quán trên Web và Desktop (Electron).

---

## Platforms

- **Web**: Chrome, Firefox, Safari, Edge
- **Desktop**: Electron app (macOS, Windows, Linux)

---

## UI/UX Consistency Checks

### 1. Visual Consistency

#### Layout
- [ ] Same 3-column layout (Navigation | Sidebar | Main)
- [ ] Same component spacing and padding
- [ ] Same font sizes and weights
- [ ] Same color scheme (light/dark mode)
- [ ] Same button styles and sizes
- [ ] Same form input styles

#### Typography
- [ ] Same font family across platforms
- [ ] Same heading hierarchy
- [ ] Same text colors and contrast
- [ ] Same line heights

#### Icons & Images
- [ ] All icons render identically
- [ ] Icon sizes consistent
- [ ] SVG rendering correct on all platforms

### 2. Functional Consistency

#### Navigation
- [ ] Same navigation menu items
- [ ] Same keyboard shortcuts (if any)
- [ ] Same active state indicators
- [ ] Same hover effects

#### Chat Features
- [ ] Same message rendering (markdown, code)
- [ ] Same typing indicator
- [ ] Same timestamp format
- [ ] Same message actions (copy, delete, etc.)
- [ ] Same scrolling behavior
- [ ] Same session management

#### Settings
- [ ] Same agent configuration form
- [ ] Same validation rules
- [ ] Same error messages
- [ ] Same success notifications

### 3. Theme System

#### Light Mode
- [ ] Web: Same background colors
- [ ] Desktop: Same background colors
- [ ] Web: Same text colors
- [ ] Desktop: Same text colors
- [ ] Web: Same border colors
- [ ] Desktop: Same border colors

#### Dark Mode
- [ ] Web: Dark theme applies correctly
- [ ] Desktop: Dark theme applies correctly
- [ ] Same contrast ratios
- [ ] Same accent colors

#### Theme Toggle
- [ ] Web: Toggle works smoothly
- [ ] Desktop: Toggle works smoothly
- [ ] Preference persists on reload
- [ ] System theme detection works

---

## Platform-Specific Features

### Web-Only Features
- [ ] Browser notifications (Web Notifications API)
- [ ] PWA install prompt (if implemented)
- [ ] Browser back/forward navigation

### Desktop-Only Features
- [ ] **macOS**: Traffic lights (red/yellow/green)
- [ ] **macOS**: Native title bar drag
- [ ] **Windows/Linux**: Custom window controls
- [ ] **Windows/Linux**: Minimize/Maximize/Close buttons
- [ ] Native notifications (Electron)
- [ ] File system access (if needed)
- [ ] System tray icon (if implemented)

---

## Data Consistency

### Storage
- [ ] Web: localStorage works
- [ ] Desktop: electron-store works
- [ ] Same data structure in both
- [ ] Settings sync (if implemented)

### Sessions
- [ ] Web: Can create/manage sessions
- [ ] Desktop: Can create/manage sessions
- [ ] Session data format identical

### Agents
- [ ] Web: Can configure agents
- [ ] Desktop: Can configure agents
- [ ] Agent configs compatible

---

## Performance Comparison

### Startup Time
- [ ] Web: < 3s first load
- [ ] Desktop: < 5s app launch
- [ ] Desktop: < 2s subsequent launches

### Runtime Performance
- [ ] Web: Smooth scrolling (60fps)
- [ ] Desktop: Smooth scrolling (60fps)
- [ ] Web: Low memory usage
- [ ] Desktop: Low memory usage

### Network
- [ ] Web: WebSocket stable
- [ ] Desktop: WebSocket stable
- [ ] Both handle reconnection

---

## User Experience Validation

### Task 1: Start New Chat
**Web:**
1. [ ] Open app in browser
2. [ ] Select agent from sidebar
3. [ ] Click "New Chat"
4. [ ] Type message and send
5. [ ] Receive response

**Desktop:**
1. [ ] Launch desktop app
2. [ ] Select agent from sidebar
3. [ ] Click "New Chat"
4. [ ] Type message and send
5. [ ] Receive response

**Validation:**
- [ ] Same number of clicks
- [ ] Same visual feedback
- [ ] Same response time

### Task 2: Configure Agent
**Web:**
1. [ ] Navigate to Settings
2. [ ] Click "Add Agent"
3. [ ] Fill form
4. [ ] Save agent
5. [ ] Verify in agent list

**Desktop:**
1. [ ] Navigate to Settings
2. [ ] Click "Add Agent"
3. [ ] Fill form
4. [ ] Save agent
5. [ ] Verify in agent list

**Validation:**
- [ ] Same form fields
- [ ] Same validation
- [ ] Same success feedback

### Task 3: Switch Themes
**Web:**
1. [ ] Click theme toggle
2. [ ] Verify dark mode applied
3. [ ] Reload page
4. [ ] Verify preference persisted

**Desktop:**
1. [ ] Click theme toggle
2. [ ] Verify dark mode applied
3. [ ] Restart app
4. [ ] Verify preference persisted

**Validation:**
- [ ] Same toggle location
- [ ] Same transition effect
- [ ] Same dark mode colors

---

## Keyboard Shortcuts (Future)

| Action | Web | Desktop | Consistent? |
|--------|-----|---------|-------------|
| New Chat | Cmd/Ctrl+N | Cmd/Ctrl+N | [ ] |
| Settings | Cmd/Ctrl+, | Cmd/Ctrl+, | [ ] |
| Toggle Theme | Cmd/Ctrl+D | Cmd/Ctrl+D | [ ] |
| Send Message | Enter | Enter | [ ] |
| New Line | Shift+Enter | Shift+Enter | [ ] |

---

## Accessibility

### Web
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] ARIA labels present
- [ ] Focus indicators visible

### Desktop
- [ ] Keyboard navigation works
- [ ] Screen reader compatible (macOS VoiceOver, Windows Narrator)
- [ ] ARIA labels present
- [ ] Focus indicators visible

### Consistency
- [ ] Same tab order
- [ ] Same keyboard shortcuts
- [ ] Same focus management

---

## Edge Cases

### Network Issues
- [ ] Web: Handles offline gracefully
- [ ] Desktop: Handles offline gracefully
- [ ] Both show same error messages

### Large Data
- [ ] Web: 1000+ messages load OK
- [ ] Desktop: 1000+ messages load OK
- [ ] Both maintain performance

### Concurrent Sessions
- [ ] Web: Multiple tabs work
- [ ] Desktop: Multiple windows work (if allowed)

---

## Testing Results

### Web Platform
- **Browser**: Chrome 120+
- **Date**: 2025-11-07
- **Status**: ✅ Fully functional
- **Notes**: Primary development platform

### Desktop Platform
- **OS**: macOS 14.x
- **Date**: 2025-11-07
- **Status**: ✅ Fully functional
- **Notes**: Custom title bar, Tailwind CSS, ThemeProvider integrated

### Windows Desktop
- **OS**: Windows 10/11
- **Date**: _Not tested yet_
- **Status**: ⏳ Pending
- **Notes**: Custom window controls need validation

### Linux Desktop
- **OS**: Ubuntu 22.04+
- **Date**: _Not tested yet_
- **Status**: ⏳ Pending
- **Notes**: Window controls need validation

---

## Discrepancies Found

### Issue 1: [Example - Delete after testing]
- **Platform**: Desktop macOS
- **Issue**: Title bar height different from web header
- **Expected**: Same height (48px)
- **Actual**: Desktop has 48px on macOS, 32px on Windows
- **Resolution**: This is intentional for platform-native feel
- **Status**: ✅ Accepted

---

## Sign-off

| Platform | Tester | Date | Status |
|----------|--------|------|--------|
| Web (Chrome) | - | 2025-11-07 | ✅ Passed |
| Web (Firefox) | - | - | ⏳ Pending |
| Web (Safari) | - | - | ⏳ Pending |
| Desktop (macOS) | - | 2025-11-07 | ✅ Passed |
| Desktop (Windows) | - | - | ⏳ Pending |
| Desktop (Linux) | - | - | ⏳ Pending |

---

## Recommendations

1. **Automated Visual Regression Testing**: Use tools like Percy or Chromatic
2. **E2E Testing**: Playwright for web, Spectron for Electron
3. **Performance Monitoring**: Track metrics across platforms
4. **User Feedback**: Collect platform-specific feedback
