# Context efficiency playbook

Read only for long/context-heavy work.

## Input-token reduction hierarchy

Highest leverage usually comes from preventing irrelevant text from entering context.

1. Define `done` before exploration so work has a stopping condition.
2. Avoid broad reads.
3. Avoid rereads.
4. Filter logs/data before reading.
5. Load only the skill/reference needed.
6. Store durable conclusions as compact pointers.
7. Keep user-facing output terse.

Output-only brevity helps, but long agentic coding runs often spend much more context on files/tool results than on final prose.

## Max-capability / minimum-context protocol

Strong reasoning benefits from high-signal context, not maximum context volume.

- Keep the user's strongest chosen model; optimize context around it instead of silently downgrading intelligence.
- Default to one owning specialist. Sequential review is cheaper and clearer than loading a committee simultaneously.
- Between specialists pass a compact capsule: `goal | decision | evidence | affected surface | invariants | unresolved risk | next test`.
- Do not pass prior prose/reasoning when the capsule plus source pointers is sufficient.
- Separate discovery, decision and implementation on long tasks; after a phase is settled, retain conclusions/pointers rather than raw exploration.
- When switching to an unrelated problem, do not drag old task details into working context; rely on bounded project memory for durable state.
- If the active environment provides context compaction or caching, use them conservatively after coherent milestones; preserve exact constraints, IDs, failures and pending tests.

## Repository exploration

Start with filenames/metadata/search. Search unique identifiers before generic terms. Read relevant ranges around matches. Follow only direct dependencies required to make the decision. Once canonical implementation/source of truth is found, stop exploring stale copies unless comparison/history is explicitly needed.

For code changes:
`locate -> inspect narrow context -> edit -> narrow test -> broader gate only if warranted`

## Logs

Do not ingest whole logs by default.

Filter in this order:
- failure/error/exception keywords
- exact error code/message
- recent tail around failure
- one preceding setup block if causality unclear

Retain exact failing text and discard repetitive successes from working context.

## JSON / API / tool output

Prefer metadata and selected fields. Avoid full serialized objects when only IDs/statuses/paths matter. If a tool response is huge, extract a compact working representation before continuing.

## Diffs

Inspect changed filenames + relevant hunks first. Open full file only when surrounding invariants matter. Do not reread untouched files after a local edit unless the change can affect them indirectly.

## Web research

Search only when freshness/external verification matters. Use focused queries. Keep `fact | date | source | implication`; do not carry article prose forward. Do not research stable repository facts already known.

## Skill economy

Skill descriptions should be specific enough for routing. Core `SKILL.md` should stay short. Heavy examples/checklists belong in `references/` and load only when needed. Multiple skills should be loaded only for truly mixed tasks.

For multi-specialist work, use staged escalation:
`architect only if design is non-obvious -> owner -> critic only if consequential -> security only if relevant -> QA after mutation`.

## Test economy

Do not confuse fewer tokens with fewer safeguards.

Typical order:
1. syntax/static check
2. feature-specific regression
3. cross-cutting smoke/integration only if risk/policy requires

Security/payment/auth/data migrations keep their mandatory gates.

## Communication economy

Prefer:
`Done. <result>. Verified: <test>. Risk/blocker: <only if material>.`

Avoid progress narration unless work is long enough that user needs orientation. No repeated recap of tool calls.

## When to compact

If the environment supports explicit context compaction, compact after a coherent milestone when earlier verbose details are no longer needed. Preserve exact constraints, identifiers, pending failures and next test. Never compact away unresolved risk.

## External inspiration

Caveman/Cavemem's useful principle is separation: compress speech, compress persistent memory, retrieve progressively. Do not copy a large always-loaded prompt merely to enforce brevity; prompt overhead can exceed savings on small turns.
