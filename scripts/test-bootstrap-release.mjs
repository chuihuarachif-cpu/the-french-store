import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Compare the actual release identifiers. A cache guard must not require an
// August date forever or accept an unversioned/stale bootstrap after deployment.
const bootstrap=readFileSync('v2/bootstrap.js','utf8');
const index=readFileSync('v2/index.html','utf8');
const version=bootstrap.match(/const VERSION = 'r(\d+)-[^']+-(\d{8})'/);
assert.ok(version,'Bootstrap must declare its dated release');
const scripts=[...index.matchAll(/<script\b[^>]*src="\.\/bootstrap\.js\?v=([^"]+)"/g)];
assert.equal(scripts.length,1,'Exactly one versioned bootstrap is required');
assert.equal(scripts[0][1],`${version[2]}-r${version[1]}`,'HTML cache key must match the active bootstrap release');
console.log('Bootstrap release/cache key contract PASS');
