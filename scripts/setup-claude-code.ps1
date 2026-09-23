$ErrorActionPreference = "Continue"

Write-Host "Updating Claude Code..."
claude update

Write-Host "Adding Anthropic official marketplace..."
claude plugin marketplace add anthropics/claude-plugins-official

Write-Host "Installing efficient Claude plugins..."
claude plugin install frontend-design@claude-plugins-official
claude plugin install claude-md-management@claude-plugins-official
claude plugin install claude-code-setup@claude-plugins-official

Write-Host "Adding official OpenAI Codex plugin marketplace..."
claude plugin marketplace add openai/codex-plugin-cc
claude plugin install codex@openai-codex

Write-Host "Ensuring Codex CLI is installed..."
if (Get-Command npm -ErrorAction SilentlyContinue) {
  npm install -g @openai/codex@latest
} else {
  Write-Warning "npm was not found. Install/update Node.js, then install @openai/codex."
}

Write-Host ""
Write-Host "Project MCP servers (Playwright + Context7) are configured in .mcp.json."
Write-Host "The project also includes deterministic zero-model edit verification hooks."
Write-Host ""
Write-Host "Next inside Claude Code:"
Write-Host "  /reload-plugins"
Write-Host "  /codex:setup"
Write-Host ""
Write-Host "If Codex is not authenticated, run: !codex login"
Write-Host "Choose Sign in with ChatGPT if you want Codex usage billed against your ChatGPT plan rather than API usage."
Write-Host ""
Write-Host "Keep the Codex review gate disabled by default to conserve usage."
Write-Host "Then run /doctor, /memory, /context all, /agents, /plugin and /mcp."
