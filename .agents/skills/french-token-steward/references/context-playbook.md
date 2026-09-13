# Context efficiency playbook

Read only for long/context-heavy work.

## Input-token reduction hierarchy

Highest leverage usually comes from preventing irrelevant text from entering context.

1. Avoid broad reads.
2. Avoid rereads.
3. Filter logs/data before reading.
4. Load only the skill/reference needed.
5. Store durable conclusions as compact pointers.
6. Keep user-facing output terse.

Output-only brevity helps, but long agentic coding runs often spend much more context on files/tool results than on the final prose.

## Repository exploration

Start with filenames/metadata/search. Search unique identifiers before generic terms. Read relevant ranges around matches. Follow only direct dependencies required to make the decision. Once canonical implementation/source of truth is found, stop exploring stale copies unless comparison/history is explicitly needed.

For code changes:
`locate -> inspect narrow context -> edit -> narrow test -> broader gate only if warranted`.

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

Skill descriptions should be specific enough for routing. Core SKILL.md should stay short. Heavy examples/checklists belong in `references/` and load only when needed. Multiple skills should be loaded only for truly mixed tasks.

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
