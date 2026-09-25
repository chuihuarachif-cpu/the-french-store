import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const project = path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
const lab = path.resolve(project, 'design-lab');
const changed = input?.tool_input?.file_path ? path.resolve(input.tool_input.file_path) : '';

if (!changed || (changed !== lab && !changed.startsWith(lab + path.sep))) {
  process.exit(0);
}

const errors = [];

function checkJs(file) {
  if (!fs.existsSync(file)) return;
  const result = spawnSync(process.execPath, ['--check', file], {
    cwd: project,
    encoding: 'utf8',
    windowsHide: true
  });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'syntax check failed').trim();
    errors.push(`${path.relative(project, file)}: ${detail}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

for (const file of walk(lab)) {
  if (/\.(?:js|mjs|cjs)$/i.test(file)) checkJs(file);
}

const indexFile = path.join(lab, 'index.html');
if (fs.existsSync(indexFile)) {
  const html = fs.readFileSync(indexFile, 'utf8');
  const refs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)].map(m => m[1]);

  for (const ref of refs) {
    if (!ref.startsWith('./')) continue;
    const clean = ref.split(/[?#]/, 1)[0];
    const local = path.resolve(lab, clean);
    if (!fs.existsSync(local)) {
      errors.push(`design-lab/index.html references missing local file: ${ref}`);
    }
  }
}

if (errors.length) {
  const limited = errors.slice(0, 12);
  const suffix = errors.length > limited.length ? `\n...and ${errors.length - limited.length} more` : '';
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PostToolUse',
      additionalContext:
        'Automatic zero-model Lab verification found problems. Fix these before finishing:\n' +
        limited.join('\n') + suffix
    }
  }));
}
