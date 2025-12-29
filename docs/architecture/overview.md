# Tourandot Architecture Overview

## Vision

Centralized platform for travelers featuring AI-generated walking tours with synchronized group narration.

## Core MVP Features

1. **Tour Browsing** - List and view tour details
2. **Narration Config** - Adjust style (verbose/quick/balanced) before starting
3. **Party Mode** - Multiple people share synchronized audio narration
   - Host creates party, shares invite link
   - Everyone preloads tour content
   - Audio plays simultaneously when group reaches stops
   - Host can manually advance

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND API                              │
│                   Node.js + Fastify + WebSocket                  │
├─────────────────────────────────────────────────────────────────┤
│  REST Endpoints              │  WebSocket (per party)           │
│  ├─ GET  /tours              │  ├─ Location broadcast           │
│  ├─ GET  /tours/:id          │  ├─ Party state sync             │
│  ├─ POST /party              │  ├─ Play signals                 │
│  ├─ GET  /party/:code        │  └─ Host controls                │
│  ├─ POST /party/:code/join   │                                  │
│  └─ POST /party/:code/ready  │                                  │
├─────────────────────────────────────────────────────────────────┤
│  Future: Postgres + Redis    │  Future: S3/R2 for audio         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MOBILE APP                                  │
│                  React Native + Expo                             │
├─────────────────────────────────────────────────────────────────┤
│  Screens:                    │  Core:                           │
│  ├─ Tour List                │  ├─ expo-location (GPS)          │
│  ├─ Tour Detail + Config     │  ├─ expo-av (audio)              │
│  ├─ Party Lobby              │  ├─ react-native-maps            │
│  └─ Active Tour              │  └─ WebSocket client             │
└─────────────────────────────────────────────────────────────────┘
```

## Party Mode Flow

```
1. Host selects tour → configures narration style
2. Host creates party → gets shareable code/link
3. Friends join via link → land in lobby
4. Everyone preloads tour (audio, route, stops)
5. All mark "ready" → Host taps "Start Tour"
6. Tour active:
   ├─ GPS tracks all members
   ├─ Group arrives at stop → audio plays on all devices
   ├─ Host can tap "Next" to skip ahead
   └─ Repeat until tour complete
```

## Audio Sync Strategy

For instantaneous sync across devices:

1. **Preload phase**: All audio downloaded before tour starts
2. **Buffer phase**: When approaching stop, all clients buffer audio
3. **Ready signal**: Each client reports "buffered"
4. **Play trigger**: Server broadcasts "PLAY" when all ready
5. **Playback**: All devices start within <100ms of each other
