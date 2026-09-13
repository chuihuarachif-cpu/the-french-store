# Bounded memory playbook

Read only when durable Codex/project memory needs creation, cleanup or repair.

## Purpose

Memory should eliminate rediscovery, not archive conversation.

Store only facts likely to save future searches:
- canonical source-of-truth location
- durable architecture decision
- integration boundary
- business/security invariant
- recurring failure with proven fix
- active deployment convention
- skill-routing convention
- non-obvious project constraint

## Format

Prefer one line:
`[topic] durable fact | source:path[,path] | verified:YYYY-MM-DD`

Use pointers rather than copies.

Good:
`[pricing] backend/Supabase authoritative; frontend never owns price rules | source:v2/ARCHITECTURE.md`

Bad:
three paragraphs explaining pricing architecture copied from the source document.

## Never store

- secrets, passwords, tokens, service-role values
- full conversations
- user chatter
- transient debugging attempts
- verbose rationale already documented elsewhere
- large code snippets
- generated output
- stale TODO history
- duplicate facts

## Maintenance

Before adding a fact:
1. Is it durable?
2. Will it materially avoid rediscovery?
3. Is it already obvious from a canonical config that Codex will open anyway?
4. Can it replace/update an existing line instead?

When memory approaches target size, delete superseded facts and merge duplicates before adding text.

Target <=1,000 words; hard ceiling 2,000.

## Retrieval

Do not automatically read memory for every task. Read it when:
- task spans multiple subsystems
- user refers to prior project decisions
- location/source of truth would otherwise need rediscovery
- recurring issue may already have a proven solution

Skip it for isolated obvious edits.

## Graph memory vs pointer memory

Graph systems such as Graphiti are useful when an agent must track many evolving entities/relationships across large heterogeneous datasets. They add infrastructure, indexing and retrieval complexity. For a single repository where canonical files already exist, a small pointer-memory file is usually cheaper and easier to audit.

Escalate to an external memory system only when the bounded file demonstrably stops scaling.
