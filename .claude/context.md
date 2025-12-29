# Claude Context

This file tracks notable decisions and context for future sessions. Update when something significant happens.

---

## Project: Tourandot

Walking tour platform with synchronized party audio.

## Current State (2024-12-29)

- **Phase:** Initial scaffolding complete
- **Next:** Implement WebSocket broadcast for party sync

## Key Decisions

1. **Monorepo** - Single repo at `tourandot/tourandot` (not separate api/app repos)
2. **Branch naming** - Uses `master` (not main)
3. **AI provider** - Grok for content generation
4. **TTS** - Not yet chosen

## Tech Stack

- API: Node.js + Fastify + TypeScript
- Mobile: Expo + React Native + expo-router
- Realtime: Native WebSocket (@fastify/websocket)
- Package manager: pnpm
- Build: Turborepo

## Notable Preferences (User)

- Prefers `master` over `main` for branch name
- Values fast iteration and low maintenance
- Knows Node.js somewhat

## File Locations

- Architecture docs: `docs/architecture/`
- API code: `apps/api/src/`
- Mobile code: `apps/mobile/app/`
- Shared types: `packages/shared/src/`

## Open Questions

- Which TTS provider to use?
- Hosting decision (Railway vs Fly.io vs other)
- Auth approach (anonymous? simple login?)

---

## Session Log

### 2024-12-29 - Initial Setup
- Created monorepo structure
- Set up API with Fastify + WebSocket routes
- Set up Expo mobile app with all screens scaffolded
- Created architecture documentation
- Renamed main → master
