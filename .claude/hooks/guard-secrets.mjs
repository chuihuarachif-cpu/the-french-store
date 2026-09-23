import fs from 'node:fs';
import path from 'node:path';

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const ti = input.tool_input || {};
const file = ti.file_path ? path.basename(ti.file_path) : '';
const text = [ti.content, ti.new_string, ...(Array.isArray(ti.edits) ? ti.edits.map(e => e.new_string) : [])]
  .filter(v => typeof v === 'string')
  .join('\n');

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason
    }
  }));
  process.exit(0);
}

if (/^\.env(?:\..+)?$/i.test(file) && !/\.example$/i.test(file) || /\.dev\.vars$|\.(?:pem|key)$|^credentials/i.test(file)) {
  decide('deny', `Blocked: ${file} holds secrets. Edit it manually outside Claude.`);
}

if (/service_role/i.test(text) || /eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{30,}\./.test(text) || /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/.test(text)) {
  decide('ask', 'Content mentions service_role or looks like a secret/token. Confirm it must not reach public frontend code.');
}
