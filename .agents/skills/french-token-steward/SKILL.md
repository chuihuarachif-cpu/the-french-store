---
name: french-token-steward
description: Token/context efficiency mode for The French Store. Use for long tasks, large files/repos/logs, repeated debugging, extended sessions, memory/context management, or when the user asks to save tokens/credits, be brief, avoid rereading, compress context, or make Codex usage last longer. Keep strongest reasoning and full verification while minimizing controllable input/output/context waste.
---

# French Token Steward

Goal: **brain big; context small; mouth small.** Spend the fewest controllable tokens that still finish the task correctly. Never save tokens by weakening reasoning, skipping required work/tests, hiding important risk, or silently changing model.

## Default operating rules

- Answer with result first. No filler, request restatement, ceremonial intro, or duplicated recap.
- Routine finals: ~20–120 words when sufficient. Expand only when decision/risk requires it or user asks.
- Search before reading. Prefer exact symbol/path/error/selector/RPC names.
- Read smallest useful range/file/hunk. Expand only when evidence is insufficient.
- Do not reread unchanged verified content in same task unless state may have changed.
- Prefer diffs over full files; filtered errors/tails over full logs; selected keys over full JSON.
- Batch independent reads/searches when supported. Never batch sequential writes to same path.
- Every tool call must discover, verify, modify, test, or compare. Otherwise skip it.
- Load only skills required by current intent. Never bulk-load reference folders.
- Run narrowest meaningful test first; broaden only for risk/repository gates.
- Ask only when missing information materially changes implementation and cannot be inferred safely.
- Preserve exact code, commands, identifiers, failures, security warnings, money/auth/permission/data-integrity facts.

## Progressive context

Use a widening funnel:

`search/index -> targeted range -> related caller/import -> full file -> broader subsystem`

Stop widening as soon as evidence is enough.

For large tasks keep a compact working ledger internally: `goal | verified facts | touched files | unresolved | next test`. Do not narrate it.

## Durable memory

`.agents/memory/FRENCH_STORE_STATE.md` is bounded hot memory, not a diary.

Read it only when prior project state would avoid rediscovery. Update only durable facts/decisions/pointers. One fact per line when possible. Replace stale facts instead of appending history. Prefer source pointers over copied content. No secrets, transcripts, transient debugging, or long explanations. Target <=1,000 words; hard ceiling 2,000.

## Modes

**ECO**: always-on baseline from root `AGENTS.md`; concise output + targeted reads.

**LEAN**: default when this full skill activates. Minimal narration, strict targeted reads, compact final, normal/full technical verification.

**ULTRA**: only if user explicitly requests maximum token saving. User-facing status extremely compressed; implementation/reasoning/testing quality unchanged.

## References: lazy only

Do **not** read these by default.

- `references/context-playbook.md`: only when task/session is context-heavy or user asks for aggressive optimization.
- `references/memory-playbook.md`: only when creating/compacting/repairing durable Codex memory.

## Important limitation

This skill can reduce controllable input/context/output and redundant tool usage. It cannot control hidden reasoning tokens, subscription quotas, model pricing, or guarantee a fixed month of usage. Do not downgrade the user's selected strong model automatically.

Before final: remove anything user does not need; keep anything that changes correctness, risk, verification, or next action.