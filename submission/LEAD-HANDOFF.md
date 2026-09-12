# AQUA — lead handoff

Team: SignalSprout. Submission remains on hold for Shafi's front-page and judging review. Only Ghenza can submit in the current portal.

- Public source: https://github.com/shafzwatsapp-lgtm/aqua-pump-reliability-agent
- Unlisted demo: https://youtu.be/5srqNqNeze4 — 110.02 seconds; YouTube displays 1:51. Uploaded and published Unlisted on Shafi's personal channel with approval.
- Owner-private site: https://aqua-pump-command-shafi.shafz.chatgpt.site
- Operations desk: `/desk`
- Portal: https://abu-dhabi.aitinkerers.org/hackathons/h_jFmTEqyJAZQ
- Handbook: https://abu-dhabi.aitinkerers.org/hackathons/h_jFmTEqyJAZQ/handbook
- Deadline shown by the event: September 12, 2026, 16:30 UAE time.

## Project description

AQUA helps a water-utility engineer turn a pump alarm into an evidence-based, reviewed next step.

Clues to a deteriorating centrifugal pump are scattered across SCADA trends, vibration data and maintenance history. AQUA brings them into an operations desk built around the selected asset: a functional pump drawing, source-linked observations, analysis views and an interactive investigation agent.

In the synthetic P-101 demonstration, suction pressure falls while vibration rises. The OpenRouter agent selects from six tools to inspect process trends, vibration quality, maintenance history, hypothesis rankings and FMEA, then prepares an inspection proposal when asked. Its actual tool executions are visible; evidence references open the underlying observation and its limitations.

The engineer can challenge the assessment. Selecting “Suction path checked clear” revises the structured evidence, reduces suction-restriction support from 80 to 45 and changes the next check. A missing vibration channel or reported loose sensor withholds derived features and prioritizes measurement validation.

The engineer reviews the proposed scope and explicitly approves it. AQUA saves and reads back an inspection task. Cancelling creates no task. Approval is tied to the evidence revision, and editing the scope clears approval.

The prototype combines five deterministic synthetic scenarios, generated velocity waveforms, a Hann-window FFT, engineering indicators, a bounded evidence-tool loop and a Figma-based interface using React, Vinext, Cloudflare Workers and D1. Optional browser voice input fills a transcript for review.

All measurements and maintenance records are synthetic. Support scores and FMEA ratings are illustrative. There are no plant controls or live SCADA/Maximo connectors. AQUA does not predict remaining life or claim a confirmed diagnosis. Hermes and Ambiguous are not connected.

## Verified demonstration

Thirteen automated checks pass. Live baseline, contradictory-finding and sensor-quality requests returned actual evidence-tool traces. A stale approval returned HTTP 409; repeating an identical approved task saved it only once. In the browser, cancellation left history unchanged, approval added a task, and the same task was present after reload. Voice compatibility and production model behavior are not fully validated.

## Tools and prior work

OpenAI Codex assisted development and verification. OpenRouter provides model access. Figma supplied the operations-desk design. Other infrastructure includes React, Vinext, TypeScript, Recharts, reusable UI components, Cloudflare Workers/D1 and Sites hosting.

Disclose the existing framework/UI/hosting starter. Do not claim every component was built from scratch. The team must confirm which original AQUA work was completed within the official event window.

## Contribution statements to complete

Shafi Abdulla: water-utility problem framing, pump/SCADA/vibration/maintenance requirements, synthetic-data direction and operations-desk design direction. Confirm any additional personal responsibilities.

Ghenza Samad: contribution statement still required from the team; do not invent one.

## Social copy for review

We built AQUA for #AgentsEverywhere: a pump reliability investigation agent for water-utility engineers. It connects synthetic process, vibration and maintenance evidence, revises its assessment when an engineer challenges it, and saves the next inspection only after approval.

Source: https://github.com/shafzwatsapp-lgtm/aqua-pump-reliability-agent

Demo: https://youtu.be/5srqNqNeze4

The Site remains private pending review.

@AITinkerers @OpenAI @CopilotKit @openrouter @exaailabs @auth0 @ambiguousio @triggerdotdev @mozillaAI @googlecloud #AgentsEverywhere

## Remaining submission items

Review the front page and provisional 16/20 assessment. Confirm both contributions and prior-work disclosure. Publish the reviewed social copy and add its public URL. The source and under-two-minute video links are ready. Ghenza then submits through the portal. No entry has been submitted by this workflow.
