# Research notes — token efficiency and memory

## Caveman

JuliusBrussee/caveman demonstrates a useful principle: reduce output prose while preserving code, commands and errors. Its public documentation reports large prose-output savings and smaller end-to-end savings on agentic coding runs. The transferable principle is **do not shrink reasoning quality; shrink narration**.

For The French Store we use a professional terse style rather than intentionally broken grammar, because maintainability and clarity matter.

## Token-efficient workflow skills

Public Codex skills such as `token-efficiency` and `token-efficient-workflow` emphasize:
- narrow evidence first
- avoid repeated context
- concise final answers
- do not reduce correctness or completion

These principles are incorporated directly.

## Graphiti / graph memory

Graphiti-style temporal knowledge graphs can provide persistent cross-session memory and compressed retrieval, but they add infrastructure, ingestion and retrieval overhead. They are useful when many projects/agents need long-term semantic memory, but are excessive for this repository's immediate quota-saving goal.

For this project we use a smaller pattern:
- bounded hot-memory file
- pointer-based facts
- no raw conversation storage
- overwrite superseded facts
- retrieve only when relevant

If the project later grows into multiple autonomous agents or many repositories, Graphiti/Zep or another external memory layer can be reconsidered.

## Codex progressive disclosure

Codex skills are designed so the initial context contains compact skill metadata and the full `SKILL.md` is loaded only when selected. Therefore an always-loaded giant optimization skill would be self-defeating. Root `AGENTS.md` contains only the cheapest always-on rules; the full Token Steward is selected for long/large/token-sensitive work.

## Economics

As of September 2026, Codex credit usage for most Plus/Pro users is token-based: input, cached input and output are charged at different rates, and model/context/reasoning/tool use affects consumption. Reducing output helps, but context size and repeated reads also matter.

The skill cannot guarantee a full month of usage. It targets controllable waste rather than hidden reasoning or account-specific quota.
