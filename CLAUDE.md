# CLAUDE.md

Project scope and product decisions: see DESIGN.md. Domain vocabulary: GLOSSARY.md.

## Learning mode: human-reviewable work

The engineer reviews every line that lands in this repo. Work must be sized and paced for a human reviewer, not for an agent's context window. These rules override the default sizing in `to-spec`, `to-tickets` and `implement`.

### Spec sizing (`to-spec`)

- **One phase per spec.** A spec covers exactly one phase from the Phases section of DESIGN.md, never the whole v1. Name the phase in the spec's title.
- **Open stays open.** Decisions DESIGN.md marks as open or deferred stay out of the spec, unless the phase being specified is the one meant to settle them; then they are settled with the engineer before the spec is written.

### Ticket sizing (`to-tickets`, `to-spec`)

Each ticket (sub-issue) must satisfy all of these. If it doesn't, split it.

- **One behaviour.** It adds one thing the engineer can observe, described in one sentence with no "and".
- **One new concept at most.** One new library, pattern, layer or piece of infrastructure per ticket. Scaffolding (project setup, config, test harness) is its own ticket, with no feature logic.
- **Small diff.** It touches at most 5 files, tests included, and aims for under ~200 changed lines. Generated files and lockfiles don't count.
- **Verifiable by hand.** Each ticket has a "How to verify" section: a command, request or test the engineer runs, and the result they should see.
- **Expected footprint.** Each ticket names the areas or modules it will touch, so the reviewer knows where to look. This overrides `to-tickets`' "no file paths" rule; it's a guide, not a contract.

A vertical slice may be thin. A first slice can be "POST to the Worker returns 200 and stores one row", with validation, auth and queues each added as their own following tickets.

When proposing a breakdown, give for each ticket: title, behaviour, new concept, expected footprint and how to verify. Prefer too many tickets over too few.

### Implementation pacing (`implement`)

- **Work in steps.** Split the ticket into steps of one function, module or test each. Before writing code, list the steps and wait for approval.
- **Stop after each step.** Report:
  1. **What changed:** the files and the functions or sections, with clickable links.
  2. **What it does:** a plain explanation of the code, including any non-obvious decision.
  3. **How to see it:** the test, command or request that shows it working.
  
  Then wait for the engineer to say continue.
- **One commit per step**, with a message that describes that step only.
- **Answer questions before moving on.** If the engineer asks why or how, explain it before writing more code. Never batch unexplained changes.
- **If the ticket turns out bigger than the limits above, stop.** Propose splitting it instead of pushing through.
- **Readable over clever.** Prefer small named functions, explicit types and straightforward control flow. Avoid abstractions the current ticket doesn't need yet.

## Agent skills

### Issue tracker

GitHub Issues on ivanxpalacios/inbound-lead-qualification-workflow, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` plus `docs/adr/`. See `docs/agents/domain.md`.
