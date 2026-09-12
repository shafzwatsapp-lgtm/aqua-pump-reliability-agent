# AQUA / Pump Reliability Command

Interactive hackathon prototype for a water-utility centrifugal pump. All plant data, work orders and asset records are synthetic. The dashboard does not connect to or control plant equipment.

## Demonstration

1. Select a scenario: suction restriction, bearing deterioration, post-maintenance misalignment, healthy operation or sensor fault.
2. Explore process trends and the waveform/FFT laboratory. Open evidence cards to inspect provenance.
3. Ask the guided copilot why a condition is changing, what to inspect next, about FMEA, or about remaining life.
4. Add a reported inspection. A clear suction path reduces restriction support; loose sensor mounting gates mechanical diagnosis.
5. Review and approve an inspection task. Findings and approved AQUA tasks persist in D1, scoped to the signed-in user and scenario.
6. Reload and open Lifecycle to verify saved events. Export the current case as JSON.

## What is implemented

- Seeded synthetic hourly measurements and 2,048 Hz velocity waveforms.
- A radix-2 FFT with Hann window, RMS, crest factor, kurtosis, 2x peak and relative high-frequency energy.
- Deterministic, evidence-linked hypothesis ranking. Scenario labels choose the generator; no scenario label is sent to the language model.
- FMEA with explicitly illustrative S/O/D ratings and RPN. Ratings are not calibrated probabilities.
- Pressure-difference head and approximate wire-to-water efficiency. Remaining life is explicitly not modelled.
- Server-persisted inspection findings and approved demo tasks. Same-origin checks and server-side user identity protect writes.
- Responsive command-centre interface, keyboard-accessible primitive controls, evidence drawer, JSON export and WebMCP read/select tools.
- Optional OpenRouter-backed conversation grounded in the same computed evidence. Without a key, guided responses are explicitly labelled and support a bounded set of questions. They are not an LLM.

## Integration status

SCADA, Maximo and vibration adapters are synthetic. Ambiguous AI is **not connected**. No external work order, document or message is created. The current task destination is AQUA's own D1 case history.

To enable free-form AI, configure `OPENROUTER_API_KEY` as a server-side runtime secret. `OPENROUTER_MODEL` is optional; omission uses the account default. For local work use the ignored `.env` file; for hosting use Sites environment-variable management. Never put keys in browser code or source control. The configured provider receives the synthetic evidence and recent conversation; only send approved real data in a future integration.

The next Ambiguous integration should discover the live workspace MCP schemas at `https://app.ambiguous.ai/mcp`, use least-privilege task/document scopes, require an engineer-approved draft before creating a task and read back the returned task ID. Do not invent REST fields or claim success before read-back. Workspace access has not been configured in this version.

## Run locally

Node 22.13+ and npm. Install with `npm run install:ci`, then `npm run dev`. The development server uses port 5173. The Sites portable starter simulates sign-in only at loopback through `/signin-with-chatgpt?return_to=/`; hosted access uses platform authentication.

Generate migrations with `npm run db:generate` and build with `npm run build`. Apply each new local migration once:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_amazing_gideon.sql
```

On this Windows machine the Sites wrapper's npm.cmd invocation failed; invoking the official npm JavaScript entry point succeeded:

```powershell
node 'C:/Program Files/nodejs/node_modules/npm/bin/npm-cli.js' run build
```

## Verification

```sh
node --experimental-strip-types --test tests/pump.test.mjs
node node_modules/typescript/bin/tsc --noEmit
```

Tests verify frequency/amplitude recovery, expected scenario rankings, contradictory evidence, quality gating, agreement between historian and current waveform, physically bounded efficiency, and citation integrity. They demonstrate internal consistency, not diagnostic accuracy on field data. Browser checks cover guided chat, saved finding/reload, approval/reload, spectrum/waveform, FMEA, mobile/desktop and WebMCP valid/invalid input.

## Engineering limitations

The waveform is a simplified synthetic velocity signal, not a calibrated acquisition model. The model does not distinguish all hydraulic faults or perform bearing-envelope diagnostics. Bearing geometry, axial/phase evidence, OEM NPSHr and complete suction-system geometry are not available. NPSH margin, a confirmed root cause and remaining useful life must not be inferred. Head/efficiency assume equal pressure-tap elevations and negligible velocity-head difference. Free-text inspection notes are saved as context; only the explicit selected finding changes the rules. FMEA ratings require utility-specific engineering review.

References used to frame the workflow:
- [KSB: Cavitation](https://www.ksb.com/en-global/centrifugal-pump-lexicon/article/cavitation-1117364)
- [SKF: Enveloping FAQ](https://skftechnicalsupport.zendesk.com/hc/en-us/articles/360024289134-Frequently-Asked-Questions-About-Enveloping)
- [IBM Maximo: Failure analysis](https://www.ibm.com/docs/en/masv-and-l/maximo-manage/cd?topic=overview-failure-analysis)
- [OpenRouter API reference](https://openrouter.ai/docs/api_reference/overview)

This is a hackathon decision-support prototype; validation against independently labelled asset histories and engineering review are prerequisites for real maintenance decisions.
