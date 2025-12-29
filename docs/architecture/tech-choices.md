# Technology Choices

## Rationale: Fast iteration, low maintenance

This is an MVP. Every choice optimizes for:
1. Speed of development
2. Minimal ops burden
3. Ability to pivot quickly

---

## Backend: Node.js + TypeScript + Fastify

**Why Node.js?**
- Same ecosystem as React Native (shared mental model, shared types)
- Excellent WebSocket support via Socket.io / ws
- Team familiarity

**Why Fastify?**
- Fastest Node.js framework
- Great TypeScript support
- Plugin architecture (clean separation)
- Built-in WebSocket support via @fastify/websocket

**Why not Python/FastAPI?**
- Would work fine, but adds context switching between JS frontend and Python backend
- Node WebSocket ecosystem is more mature

---

## Mobile: React Native + Expo (Managed)

**Why React Native?**
- Single codebase for iOS + Android
- Large ecosystem, proven at scale

**Why Expo Managed?**
- No native tooling setup (Xcode, Android Studio)
- OTA updates (push fixes without app store)
- expo-location, expo-av work out of the box
- EAS Build for production builds

**Key packages:**
- `expo-router` - File-based routing (like Next.js)
- `expo-location` - GPS with background support
- `expo-av` - Audio playback
- `react-native-maps` - Map display

---

## Real-time: WebSocket (native)

**Why WebSocket over alternatives?**
- Lower latency than polling
- Simpler than SSE for bidirectional
- No third-party service (Pusher, Ably) = no extra cost

**Implementation:**
- `@fastify/websocket` on server
- Native WebSocket API on client
- Each party gets its own connection namespace

---

## AI: Grok (xAI)

**For content generation:**
- Tour narratives
- Stop descriptions
- Adaptable to narration style preferences

---

## TTS: TBD

Options under consideration:
- ElevenLabs (highest quality, expensive)
- OpenAI TTS (good quality, reasonable cost)
- Google Cloud TTS (cheap, decent quality)
- Edge TTS (free, lower quality)

Decision deferred until we validate the core party sync experience.

---

## Database: Postgres (future)

Currently using in-memory storage for speed of iteration.

Will migrate to Postgres when:
- Need persistence across server restarts
- Need to store user accounts
- Need to store tour content

Likely hosting: Supabase or Railway Postgres

---

## File Storage: S3/R2 (future)

For audio files:
- Cloudflare R2 (S3-compatible, no egress fees)
- Or Supabase Storage

---

## Monorepo: pnpm + Turborepo

**Why monorepo?**
- Shared types between API and mobile
- Coordinated deployments
- Single place to understand the whole system

**Why pnpm?**
- Fastest package manager
- Strict dependency resolution
- Excellent workspace support

**Why Turborepo?**
- Build caching
- Parallel task execution
- Minimal config
