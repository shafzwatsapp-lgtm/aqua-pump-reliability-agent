# AQUA — Operations Desk redesign brief

Status: design specification prepared, 12 September 2026. Figma connector returned UNAUTHORIZED / reauthentication required before file creation. No Figma file has been created and the published app has not been redesigned in this turn.

## Product direction

An engineering operations desk for a water-utility reliability engineer. Anchor the interface to a pump train and a chronological investigation. Avoid a wall of repeated rounded metric cards, decorative glow, sparkles, and a permanently dominant chatbot rail.

## Visual system

- Drawing surface: cool light grey #EEF1F2, white #FFFFFF evidence sheets.
- Structural ink: graphite #17252C; secondary annotations #526570.
- Navigation and engineering console: charcoal #142129.
- Selection/action: engineering blue #175DAB.
- Review warning: amber #9B5700 on #FFF2D9. Reserve red for a defined critical or invalid state.
- Typeface direction: IBM Plex Sans for interface and IBM Plex Mono for tags and measured values, subject to Figma font availability and proper loading. Existing app uses Arial; this redesign intentionally changes the typography.
- Square-edged instruments, 2–4 px corner treatment, 1 px ruled dividers, numbered annotations, readable units, no decorative gradients.
- Main text 16 px; routine labels 14 px; secondary provenance 12 px.

## Desktop composition — 1440 × 1000

1. Narrow dark header: AQUA / WATER OPERATIONS, station, asset selector, source mode. Source mode always says Synthetic demonstration until actual connectors exist.
2. Asset masthead: P-101 and current investigation status. One compact horizontal strip for current duty, rpm and reference window.
3. Main drawing field (about 860 px): functional suction → strainer → pump → motor → discharge diagram. Place measured values and evidence buttons near their physical measurement locations. The schematic is a navigation and explanation surface, not decorative machinery artwork. Unknown measurements stay unknown.
4. Adjacent investigation dossier (about 360 px): current question, timestamped observations, supporting and conflicting evidence, next discriminating check. Separate reported observation, working hypothesis and confirmed finding.
5. Lower analysis tray: process trends / spectrum / waveform / FMEA / history. Selecting an instrument opens the corresponding signal and provenance. Comparable operating windows are visible.
6. Bottom command bar: text input and push-to-talk button; visible Listening / Transcribing / Investigating / Responding / Awaiting approval states. Show transcript correction, stop and mute. No microphone recording without deliberate activation.
7. Task approval drawer: exact task scope, asset, evidence snapshot and destination. A success state must show the actual returned saved record identifier. Changing scope invalidates previous approval.

## Required interactions

- Selecting a scenario changes all relevant measurements and clears incompatible transient conversation state.
- Clicking a measurement highlights the matching location, trace and evidence record.
- A new inspection updates both the ranking and the explanation of what changed.
- A rejected or unavailable measurement produces an evidence-gap state rather than a forced diagnosis.
- Keyboard and text paths remain complete when voice is unavailable.
- Mobile 390 px: drawing scrolls inside its own labelled viewport, dossier follows, command bar remains accessible. The whole page must not overflow horizontally.

## Figma work once reconnected

Create a draft Design file. Resolve the user's plan via whoami; ask if multiple plans exist. There are no Code Connect mapping files in this checkout. Inspect target file/library components, variables and styles before writing; create the wrapper first, then sections. Deliver desktop operations desk, inspection-evidence drawer, approval state and mobile composition. Validate rendered output before implementing the selected Figma design in the existing app. No request to publish the site publicly is implied.

## Agent architecture recommendation

Jarvis means the requested voice experience, not an additional framework. Hermes Agent by Nous Research is a candidate investigation runtime. Use one orchestrator with narrowly defined engineering tools; multiple branded agents do not provide value by themselves.

Proposed flow:
voice/text + selected asset + time window → authenticated application service → Hermes run → numerical analysis / maintenance retrieval / evidence retrieval → cited result and view updates → engineer approval → Ambiguous task creation → read-back of saved task.

Hermes should run as a separate Python service with its own persistent runtime. Keep the current web app as the interface and authenticated gateway. Do not attempt to put the full Hermes process into the current Cloudflare Worker. Determine the exact API-server capability flags and authentication contract of a pinned version before writing the adapter.

Candidate tools (our proposed contracts, not existing Hermes or Ambiguous tool names): read_asset_context, read_process_window, compute_vibration_features, retrieve_maintenance_evidence, record_reported_finding, propose_inspection. Approved external execution belongs behind the application's authorization boundary. Agent memory may retain case context and engineer-accepted lessons; it must not silently rewrite engineering limits or turn a previous hypothesis into a confirmed fact.

Voice first release: push-to-talk, editable transcript, short spoken response, linked visual evidence, interrupt/stop, text fallback. Validate asset identifiers and units before saving records. Voice providers and latency must be tested before claiming a real-time conversation.

## Current judging assessment (estimate, not panel verdict)

Based on the published starter-kit rubric (1–5 each), subject to Abu Dhabi organizer updates:

| Criterion | Current estimate | Evidence / gap |
|---|---:|---|
| Core Requirements & Functionality | 3/5 | Working synthetic analysis and persisted inspection flow; guided replies rather than a live agent |
| Innovation & Theme Alignment | 3/5 | Concrete water-utility context; contextual interaction still needs to stand out in the demonstration |
| Technical Execution & Integration | 2/5 | Tested FFT and deterministic rules; OpenRouter and Ambiguous are not connected; no field-data evaluation |
| Usefulness & Agentic Experience | 3/5 | Clear engineering task and approval; no voice or genuine adaptive tool-selection loop yet |
| Total | 11/20 | Assessment of the shipped version, not the idea's potential |

The most valuable improvement is a genuine end-to-end agentic investigation with a verified external outcome. Design and voice improve comprehension and interaction, but adding frameworks alone does not establish functionality or integration.

## Two-minute demonstration target

0:00–0:20 — Engineer asks by voice why P-101 vibration changed. Asset and time window come from the open desk.
0:20–0:50 — Agent retrieves matched operating data and waveform features; highlights evidence and identifies missing information.
0:50–1:15 — Engineer reports a contradictory inspection; agent revises the hypothesis and next check visibly.
1:15–1:40 — Agent proposes a specific inspection task. Engineer reviews and approves.
1:40–2:00 — Read back the actual Ambiguous record; reopen case history. Explain synthetic data and remaining uncertainty.

## Sources

- Official starter-kit rubric: https://github.com/CopilotKit/agents-everywhere-starter-kit/blob/main/hackathon-overview.md#judging-criteria
- Build eligibility and deliverables: https://github.com/CopilotKit/agents-everywhere-starter-kit/blob/main/hackathon-rules.md
- Hermes programmatic integration: https://hermes-agent.nousresearch.com/docs/developer-guide/programmatic-integration
- Hermes MCP integration: https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- Hermes repository: https://github.com/NousResearch/hermes-agent

Abu Dhabi participant portal could not be checked through public web retrieval (403); local organizer updates remain unverified.
