# Roadmap

## Phase 1: Core Party Sync (Current)

**Goal:** Validate that synchronized audio playback across devices works reliably.

- [x] Monorepo setup
- [x] Basic API structure (tours, party CRUD)
- [x] Mobile app scaffolding (all screens)
- [ ] WebSocket broadcast implementation
- [ ] Audio preloading on mobile
- [ ] Synchronized playback trigger
- [ ] Test with 2-3 devices on same WiFi

**Success criteria:** 3 phones in a room can hear the same narration start within 1 second of each other.

---

## Phase 2: Real Tour Content

**Goal:** Create one complete tour with real data.

- [ ] Design tour data schema (stops, coordinates, content)
- [ ] Integrate Grok for content generation
- [ ] Choose and integrate TTS provider
- [ ] Generate audio for test tour
- [ ] Real GPS coordinates for a walkable route
- [ ] Test party mode on actual walking tour

---

## Phase 3: Polish & Deploy

**Goal:** Deployable MVP that friends can use.

- [ ] Postgres database (persist parties, tours)
- [ ] Basic auth (anonymous or simple login)
- [ ] Deep linking for party invites (tourandot://party/CODE)
- [ ] Deploy API (Railway/Fly.io)
- [ ] TestFlight build for iOS testing
- [ ] Error handling, offline resilience

---

## Phase 4: Public Beta

- [ ] Multiple tours
- [ ] User accounts
- [ ] Tour creation flow (for hosts)
- [ ] Payment integration (if monetizing tours)
- [ ] App Store submission

---

## Non-goals for MVP

- User-generated tours (Phase 4+)
- Monetization
- Social features
- Reviews/ratings
- Offline tours (nice to have, not critical)
