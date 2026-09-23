# Claude Code setup for French Store Lab

The project is preconfigured for:
- Sonnet as the default implementation model
- Haiku for cheap exploration/documentation subagents
- Opus only as a selective visual director
- persistent Auto Memory
- physical-realism, intro/motion and mobile-performance skills
- Playwright browser verification through project MCP
- Context7 documentation lookup through project MCP

## First local session

From the repository root on the `design-lab` branch:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-claude-code.ps1
```

Then open Claude Code and run:

```text
/doctor
/memory
/context all
```

Approve the project MCP servers if Claude Code asks you to trust `.mcp.json`.

## Normal use

Keep the main session on Sonnet + medium effort. The project instructions tell Claude to delegate cheap work to Haiku and reserve Opus for difficult visual decisions.

For a realism task, ask normally, for example:

```text
Rediseña este banner con realismo físico. Usa cristal, aluminio negro,
iluminación coherente y profundidad real. Trabaja hasta verificarlo en
desktop y móvil. Mantén buen rendimiento.
```

Claude can automatically load the relevant skills/subagents from this repository.

## Phone workflow

For maximum capability use a local Claude Code session on the laptop.
Use `/remote-control` to continue/steer that same local session from your phone.
The laptop must remain on for a local session to keep running.
