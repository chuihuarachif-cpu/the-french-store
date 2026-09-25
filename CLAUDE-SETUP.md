# Claude Code setup for French Store Lab

The repository is preconfigured for an efficient multi-model workflow:

- Sonnet + medium effort as the main Claude implementation lane
- Haiku for cheap exploration/documentation
- Opus only as a selective visual/architecture specialist
- persistent Auto Memory
- physical-realism, intro/motion and mobile-performance skills
- quick-reviewer and security-auditor subagents
- deterministic edit verification hooks (no model/token cost unless they report a failure)
- Playwright browser verification through project MCP
- Context7 current documentation through project MCP
- official OpenAI Codex plugin for independent reviews/rescue using local Codex authentication

## First local session

From the repository root on the `design-lab` branch:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-claude-code.ps1
```

Inside Claude Code:

```text
/reload-plugins
/codex:setup
/doctor
/memory
/context all
/agents
/plugin
/mcp
```

If Codex says authentication is missing:

```text
!codex login
```

Choose **Sign in with ChatGPT** to use the Codex allowance from the ChatGPT plan. Do not choose API-key authentication unless API billing is intentionally desired.

## Usage policy

Normal implementation:
`Haiku discovery -> Sonnet implementation -> browser/performance verification`.

Opus:
only difficult architecture/material/light/composition or after two serious visual attempts fail.

Codex:
independent second opinion, pre-merge review, adversarial review for important decisions, or rescue after Claude is genuinely stuck.

Do **not** enable the Codex automatic review gate by default. It can create Claude/Codex loops and drain both usage pools.

Useful Codex commands:

```text
/codex:review --background
/codex:adversarial-review --background <specific risk>
/codex:rescue --background <specific task>
/codex:status
/codex:result
/codex:transfer
```

## Phone workflow

For maximum capability use a local Claude Code session on the laptop.
Use `/remote-control` to continue/steer that same local session from your phone.
The laptop must remain on for a local session to keep running.
