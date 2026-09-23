# French Store — Claude Code

## Work mode
- Work first; explain briefly. Final replies should normally be 2–6 concise lines.
- Do not narrate routine tool calls or repeat diffs.
- Do not stop at planning when implementation and verification are possible.
- Make the smallest change that fully solves the task.
- Reuse existing components, utilities and dependencies before adding new ones.
- Work in Lab/design branches unless explicitly told to change production.

## Model routing
- Default implementation model: Sonnet, medium effort.
- Use Haiku subagents for file search, repository exploration, logs, docs lookup, and mechanical tasks.
- Use Sonnet for implementation, debugging, refactors, browser verification and performance work.
- Use Opus only for difficult architecture, high-impact visual direction, complex material/lighting decisions, or after two serious visual attempts still miss the target.
- Never use Opus for routine search, renames, formatting, simple bugs, or ordinary file edits.
- If the Advisor tool is available, prefer consulting the stronger advisor for one hard decision instead of moving the whole task to an expensive model.

## Token economy
- Search before reading many files.
- Read the smallest useful ranges.
- Do not reread unchanged files.
- Keep subagent prompts narrow and return summaries, not raw logs.
- Use existing project knowledge and Auto Memory instead of rediscovering facts.
- Prefer CLI/built-in tools when they solve the same task more cheaply than a large external-tool workflow.
- Avoid agent teams for ordinary frontend work.
- Use /clear between unrelated tasks and /compact during long related tasks.
- Keep this CLAUDE.md short; put specialized knowledge in skills.

## Visual direction
- Target physical realism, not generic AI UI.
- Prefer believable construction, glass, metal, plastic, wood, lighting, reflections, contact shadows, depth and restrained imperfections.
- Avoid generic purple/blue gradients, random neon borders, identical rounded cards, excessive glassmorphism, meaningless floating objects, particles without a cause and bloom everywhere.
- Use CSS/SVG first, Canvas for dense cheap particles, and Three.js/WebGL only when true 3D, PBR materials, reflection/refraction, perspective or spatial particles materially improve the result.
- For major realism work use the physical-realism-web skill.
- For intros/reveals use intro-motion-director.
- For heavy visual work use mobile-performance before considering the task complete.

## Performance
- Smooth low/mid-range Android performance is a release requirement.
- Never trade checkout, navigation, readability or input responsiveness for visual effects.
- Respect prefers-reduced-motion.
- Pause offscreen animation/render loops.
- Cap WebGL DPR, particles, shadow quality and postprocessing.
- Use HIGH / MEDIUM / LOW quality tiers for expensive effects.

## Verification
For meaningful frontend changes:
1. implement;
2. build/run;
3. inspect the real rendered page;
4. check desktop + mobile;
5. fix the largest visible mismatch first;
6. run performance review if effects/animation/WebGL changed;
7. only then report completion.

Compiling is not enough; verify the rendered result.

## Memory
- Keep Auto Memory enabled.
- Preserve durable visual decisions, repeated corrections, non-obvious architecture and proven performance fixes.
- Do not store trivial facts or duplicate obvious repository content.
- Before context compaction, preserve the active goal, acceptance criteria, files changed, visual/material decisions, unresolved bugs, tests already run and exact next action.
