# Agentic Travel Decision Log

Date: 2026-07-31

## Goal

Build a public-facing travel planning demo outside MakeMyTrip that can later be pitched internally.

## Locked decisions

### Product shape

- Public demo, not an internal-only tool
- India and international support both
- Focus on new trip planning first
- Optimize for planning quality first, with conversion hooks built in
- Show a ranked shortlist of 3 options plus a CTA to fetch 3 more
- Default ranking mode: best value
- Use chips for quick choice and comparison
- Use mobile web first

### User journey

- Trip planning first
- Search first only when the user has provided trip-critical details
- Stop and ask before any search when critical details are missing
- Streaming should be on by default
- One conversation thread per trip
- If a similar trip chat already exists, recommend continuing it
- Logged-out users can see one conversation with a max of 3 user turns
- After that, hard stop with a login prompt

### Identity and memory

- Per-user account memory
- Gmail-only login
- Authentication handled by Clerk or a similar simple auth layer
- Compact state retained for 90 days
- Raw conversation retained for 30 days
- Stale trip chats auto-close after 14 days of inactivity
- No reminder before auto-close

### Home screen

- Home screen should support both India and international
- Use three equal buttons
- Buttons: Trip planning, Flights, Stays
- Trip planning should show example prompts
- Use 3 starter prompts
- Prompt examples should be easy to scan on mobile

### Routing and agent architecture

- First pass should be a travel intent classifier
- Classifier output should be JSON-schema validated
- Use strict enum-based schema fields
- `trip_planning` is an umbrella intent
- `trip_type` stays internal to the router
- `trip_type` values are controlled, versioned, and extensible
- Secondary intents are optional
- Cap secondary intents at 2 for v1
- Order secondary intents by user importance, with confidence as tie-breaker
- Use current message plus session history to infer ordering
- Use compact extracted state instead of full chat text for routing
- Build compact state with deterministic code after the LLM call
- Keep raw conversation text for replay and debugging
- Keep compact state as the runtime source of truth
- Use a small classifier LLM followed by a planner LLM
- Use 2 LLM calls for v1
- Keep the routing layer as a hard allowlist
- Use trip stage first, vertical second
- Use `pi-agent` as the main orchestrator with a thin router in front
- `pi-agent` may call tools only after the router filters the tool list

### Tooling and adapters

- Treat the system as retrieval-first
- Use near-real-time inventory and pricing
- Cache static content aggressively
- Expose tools by user task, with LoB-specific adapters underneath
- Use one canonical result schema internally
- Build page adapters for each MakeMyTrip vertical
- Use `cheerio` only when the page HTML already contains usable data
- Do not mirror raw page structure in the core schema

### Scope

- Support flights, hotels, homestays, holidays, rail, bus, cabs, activities, visa, cruise, forex, travel insurance, trip ideas, and how2go in the broader design
- Start with a high-quality trip-planning loop, then expand

## Still open

- Exact minimal router JSON schema
- Exact tool bundle mapping from intent and trip stage to exposed tools
- Canonical result schema for each adapter
- Final first-demo MVP slice
- Whether the home prompt should be a unified search box or quick actions plus starter prompts

## Recommended next step

Define the minimal router schema and the trip-planning adapter contract first, then wire the first public demo around those two boundaries.
