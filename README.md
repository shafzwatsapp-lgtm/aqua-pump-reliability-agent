# AQUA · Pump Reliability Operations Desk

AQUA helps a water-utility engineer investigate a changing centrifugal pump and turn the next useful check into an approved, persistent inspection task.

Built by **SignalSprout** for AI Tinkerers' **Agents, Everywhere** hackathon.

[Open AQUA](https://aqua-pump-command-shafi.shafz.chatgpt.site/) · [Figma design](https://www.figma.com/design/mMb88S1Lu81xu80SW13P7O?node-id=2-180)

The hosted site is currently private. This repository includes the runnable prototype. All plant measurements, maintenance records and asset history are synthetic.

## Try the workflow

1. Read the front page, then open the P-101 operations desk at `/desk`.
2. Select suction restriction and inspect pressure, flow, vibration and maintenance evidence.
3. Ask: “Compare process, vibration and maintenance evidence. What is the leading hypothesis and next inspection? Propose it for review.”
4. Inspect the actual tool trace and click its evidence references.
5. Add “Suction path checked clear.” Restriction support changes from 80 to 45 and the next check changes.
6. Review an inspection. Cancel to leave the case unchanged, or approve to save it in AQUA.
7. Reload and open Maintenance history to read the persisted record. Export the case as JSON.

Five repeatable scenarios cover suction restriction, bearing deterioration, post-maintenance misalignment, healthy operation and sensor faults.

## What is implemented

- A Figma-designed operations desk with a functional pump drawing, clickable instruments, evidence dossier and responsive analysis views.
- Synthetic hourly process measurements and one-second velocity waveforms at 2,048 samples/second.
- Mean removal, Hann-window FFT, 1 Hz bins, RMS, crest factor, kurtosis, 2× running-speed amplitude and relative band energy.
- Explicit, deterministic hypothesis support and illustrative FMEA S/O/D ratings. The model does not calculate these scores.
- An OpenRouter model that selects evidence tools, consumes their results and returns cited explanations and inspection drafts.
- Structured findings that revise the analysis. Invalid or loose-mounted vibration channels withhold derived features.
- Engineer approval, evidence-revision checks, atomic rejection of stale approvals, idempotent saves and database read-back.
- Browser speech recognition for an editable transcript, optional read-aloud, and a keyboard input path.
- JSON export and optional WebMCP hooks for reading the current investigation and selecting a scenario.

## Agent architecture

The browser sends the selected synthetic scenario, structured finding, question and recent conversation to the server. The server computes the evidence; the model receives it through six allowlisted tools:

| Tool | Purpose |
|---|---|
| `read_process_trends` | Current/reference measurements, process trend, head and efficiency |
| `inspect_vibration` | Quality check and computed signal features; invalid features withheld |
| `read_maintenance` | Fictional maintenance history and the selected inspection finding |
| `rank_hypotheses` | Support, contradictory evidence and discriminating checks |
| `read_fmea` | Failure effects and illustrative risk-priority ratings |
| `propose_inspection` | Reviewable draft tied to the current evidence revision; cannot save or execute |

The loop allows at most five model rounds and ten tool calls. Unknown tools and invalid arguments are rejected. A proposal requires prior evidence-tool execution. Final answers require a returned evidence citation; IDs absent from the run are rejected. These checks validate references, not every natural-language conclusion.

Actual completed and rejected calls appear with the returned answer; the trace is not streamed. The UI distinguishes guided mode, a configured provider, and a successful live agent run.

**Durable state:** engineer findings and approved tasks, scoped to signed-in user and scenario. **Session state:** conversation history. Changing scenario or saving a finding clears the current conversation. Free-text notes are retained in the case record; only the selected structured finding drives the current analysis and maintenance-tool evidence.

## Run locally

Requires Node 22.13+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:5173/. The front page is at `/`; the operations desk is at `/desk`. Use the app's **Sign in to save** link for loopback-only simulated development sign-in. Production uses platform authentication.

For live reasoning, copy `.env.example` to ignored `.env` and set `OPENROUTER_API_KEY`. The default model is `google/gemini-3-flash-preview`; override with `OPENROUTER_MODEL`. Without a key, the app clearly labels deterministic guided replies.

Keep keys server-side. The model provider receives synthetic evidence and recent conversation. Never place credentials in source control or browser code.

Build and initialize a fresh local database:

```sh
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_amazing_gideon.sql
```

Apply the migration once, then restart the development server. The included `.openai/hosting.json` identifies this project's hosted instance. If creating your own hosted copy, register your own Sites project and replace that project ID; do not deploy to the original instance.

On this Windows environment, the npm wrapper needed the official npm entry point:
`node "C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run build`.

## Verification

```sh
node --experimental-strip-types tests/pump.test.mjs
node --experimental-strip-types tests/agent.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Thirteen automated checks cover FFT recovery, scenario rankings, contradictory findings, signal quality, waveform/historian consistency, bounded support and valid bracketed citations, real tool-result consumption, rejected calls, execution limits, proposal boundaries, mandatory evidence review, and bounded recovery from empty or truncated model replies.

For an optional live local integration run, start the server with your key, then run:
`node --experimental-strip-types scripts/verify-demo.mjs`.
This uses model credits and creates explicitly labelled synthetic verification records in the local demo account. It checks a live baseline investigation, a contrary finding, invalid sensor evidence, stale approval rejection, persistence and idempotent retry. Results are written to ignored `outputs/live-verification.json`.

Verified locally on September 12, 2026: all three live agent scenarios returned actual evidence-tool traces; a stale approval returned HTTP 409; an approved task was read back once after repeated submission. Browser sign-in, a six-tool investigation and saved-history retrieval were also observed. Earlier empty or invalid-citation replies exposed a recovery issue; bounded repair was added and subsequent live checks passed. Model availability and response quality can still vary. Production and browser voice recognition are not claimed as fully validated.

## Engineering limits

This is an investigation prototype, not a validated predictive-maintenance model. It does not establish a confirmed root cause, calculate NPSH margin, predict failure dates or remaining useful life, or identify race-specific bearing defects. Bearing geometry, phase/axial measurements and full suction-system geometry are unavailable. Head and efficiency assume equal pressure-tap elevations and negligible velocity-head difference. The synthetic waveform is not a calibrated acquisition model.

SCADA, Maximo and vibration data sources are simulated. **Hermes and Ambiguous AI are not connected.** AQUA has no equipment-control tools and issues no external maintenance work orders. Browser speech services may process audio online; voice is an optional input/output convenience.

Real deployment would require approved historian and maintenance adapters, timestamp/unit/asset reconciliation, engineering validation against labelled histories, and utility-specific acceptance criteria.

## Attribution and prior work

AQUA uses the existing Sites/Vinext starter, React, TypeScript, Cloudflare Workers/D1, Recharts, and reusable shadcn/Base UI/Radix components. Those are inherited infrastructure. OpenAI Codex assisted development. AQUA's pump generator, evidence rules, agent tools, investigation flow, operations interface and submission content are project-specific work.

IBM Plex Sans and Mono are bundled under the [SIL Open Font License 1.1](public/fonts/OFL.txt). Dependency licenses remain with their respective projects. The pump drawing was exported from the project's Figma design.
