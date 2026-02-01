# Social Screen Swap - Mobile App Design

## Design Philosophy

This app enables real-time screen sharing and swapping across social media platforms. The design follows **Apple Human Interface Guidelines** with a focus on **one-handed usage** in **portrait orientation (9:16)**. The interface prioritizes clarity, immediate feedback, and seamless social interaction.

## Color Palette

- **Primary**: `#FF6B6B` (Coral Red) - For active connections, swap actions, and primary CTAs
- **Secondary**: `#4ECDC4` (Turquoise) - For secondary actions and accents
- **Background**: `#FFFFFF` (Light) / `#151718` (Dark)
- **Surface**: `#F5F5F5` (Light) / `#1E2022` (Dark)
- **Success**: `#51CF66` - Connected status
- **Warning**: `#FFA94D` - Pending actions
- **Error**: `#FF6B6B` - Disconnected/error states

## Screen List

### 1. **Home Screen** (Main Entry)
- **Primary Content**: 
  - Large "Create Room" button (center)
  - "Join Room" button below
  - List of recent rooms (if any)
  - Active connection status indicator
- **Functionality**: 
  - Create new sharing room
  - Join existing room via code
  - Quick access to recent sessions

### 2. **Create Room Screen**
- **Primary Content**:
  - Room name input field
  - Privacy toggle (Public/Private)
  - Max participants selector (2-8 people)
  - Social media platform selector (multi-select chips)
  - Generated room code display (after creation)
- **Functionality**:
  - Generate unique room code
  - Configure room settings
  - Share room code via system share sheet

### 3. **Join Room Screen**
- **Primary Content**:
  - Room code input field (6-digit code)
  - Numeric keypad
  - "Join" button
- **Functionality**:
  - Enter room code
  - Validate and connect to room

### 4. **Room Lobby Screen**
- **Primary Content**:
  - Room name and code at top
  - Grid of participant avatars/names
  - "Ready" status indicators
  - "Start Session" button (host only)
  - "Leave Room" button
- **Functionality**:
  - See who's in the room
  - Wait for all participants to be ready
  - Host initiates the session

### 5. **Active Session Screen** (Main Feature)
- **Primary Content**:
  - Large screen preview area (takes 70% of screen)
  - Bottom control panel with:
    - Current viewer indicator ("You're viewing: @username")
    - Swap button (prominent, center)
    - Participant selector (horizontal scrollable list)
    - Settings/options menu
  - Floating social media app selector (overlay)
- **Functionality**:
  - Display current shared screen
  - Initiate manual swap
  - Select specific participant to swap with
  - Random swap option
  - Control whose screen to view

### 6. **Swap Control Panel** (Bottom Sheet)
- **Primary Content**:
  - "Swap with Random" button
  - "Choose Participant" option with list
  - "Request Swap" (if someone else is viewing your screen)
  - Swap history/timeline
- **Functionality**:
  - Manual participant selection
  - Randomized swap
  - Swap request system

### 7. **Social Media Selector Screen**
- **Primary Content**:
  - Grid of social media app icons:
    - TikTok
    - Douyin
    - RedNote (Xiaohongshu)
    - YouTube
    - Instagram
    - Pinterest
    - Twitter/X
    - Facebook
  - "Add Custom App" option
- **Functionality**:
  - Select which app to share
  - Deep link to social media apps
  - Custom app integration

### 8. **Settings Screen**
- **Primary Content**:
  - Account section (if using auth)
  - Notification preferences
  - Video quality settings
  - Privacy settings
  - About/Help section
- **Functionality**:
  - Configure app preferences
  - Manage account
  - Access help resources

## Key User Flows

### Flow 1: Create and Host a Session
1. User taps "Create Room" on Home screen
2. Create Room screen appears → User enters room name, selects platforms, sets max participants
3. Room code is generated → User shares code via system share sheet
4. Room Lobby screen shows → Wait for participants to join
5. When ready, host taps "Start Session"
6. Active Session screen loads → Screen sharing begins

### Flow 2: Join an Existing Session
1. User taps "Join Room" on Home screen
2. Join Room screen appears → User enters 6-digit code
3. Validation occurs → User enters Room Lobby
4. User marks as "Ready"
5. When host starts, Active Session screen loads

### Flow 3: Swap Screens During Session
1. User is viewing another participant's screen
2. User taps central "Swap" button
3. Bottom sheet appears with swap options
4. User chooses "Random Swap" OR selects specific participant
5. Screen transitions with animation to new participant's view
6. Control panel updates to show new viewer

### Flow 4: Control Social Media Selection
1. During active session, user taps floating social media icon
2. Social Media Selector appears as modal
3. User selects desired platform (e.g., TikTok)
4. App attempts to deep link to TikTok
5. User's screen now shows TikTok content
6. Other participants see this change in real-time

## Layout Specifications

### Active Session Screen Layout
```
┌─────────────────────────────┐
│   Room: Fun Times #AB12CD   │ ← Header (8% height)
├─────────────────────────────┤
│                             │
│                             │
│    [Screen Preview Area]    │ ← 70% height
│     (16:9 or 9:16 video)    │
│                             │
│                             │
├─────────────────────────────┤
│ Viewing: @alice             │ ← Status bar (5%)
├─────────────────────────────┤
│  [@alice] [@bob] [@charlie] │ ← Participant scroll (7%)
├─────────────────────────────┤
│        [SWAP BUTTON]        │ ← Primary action (10%)
└─────────────────────────────┘
```

## Interaction Patterns

### Swap Button Behavior
- **Default State**: Coral red circle with swap icon
- **Press**: Scale to 0.97 + medium haptic
- **Action**: Opens swap control bottom sheet
- **Long Press**: Triggers random swap immediately

### Participant Selection
- **Horizontal Scroll**: Smooth scroll through participant avatars
- **Tap Avatar**: Select participant to swap view
- **Active Indicator**: Highlighted border around current viewer

### Screen Transitions
- **Swap Animation**: Crossfade with 300ms duration
- **Loading State**: Shimmer effect during connection
- **Error State**: Red border flash + error haptic

## Technical Considerations

### Real-Time Communication
- Use WebRTC for peer-to-peer screen sharing
- Socket.io for signaling and room management
- Fallback to server relay if P2P fails

### Platform Integration
- Deep linking to social media apps
- Screen capture API (platform-specific)
- Permission handling for screen recording

### Performance
- Adaptive video quality based on network
- Efficient rendering with React Native Reanimated
- Minimize re-renders during active sessions

## Accessibility
- VoiceOver support for all interactive elements
- High contrast mode support
- Haptic feedback for all major actions
- Clear status announcements for screen changes
