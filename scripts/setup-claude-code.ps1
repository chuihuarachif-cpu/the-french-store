$ErrorActionPreference = "Continue"

Write-Host "Updating Claude Code..."
claude update

Write-Host "Adding Anthropic official marketplace..."
claude plugin marketplace add anthropics/claude-plugins-official

Write-Host "Installing recommended plugins..."
claude plugin install frontend-design@claude-plugins-official
claude plugin install claude-md-management@claude-plugins-official

Write-Host ""
Write-Host "Project MCP servers (Playwright + Context7) are already configured in .mcp.json."
Write-Host "Open Claude Code in this repository and approve the project MCP servers if prompted."
Write-Host "Then run /doctor, /memory, and /context all to verify the setup."
