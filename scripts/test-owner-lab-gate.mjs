import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

// Owner-only lab gate: it must mount the lab only for the Supabase-verified owner
// session and fall back to the classic storefront in every other case.
const source = readFileSync('v2/owner-lab-gate.js', 'utf8');
const bootstrap = readFileSync('v2/bootstrap.js', 'utf8');
assert.match(bootstrap, /loadScript\('\.\/owner-lab-gate\.js'[^;]*\)\.catch\(\(\) => \{\}\);/, 'Gate load must never block or fail the bootstrap');
assert.doesNotMatch(source, /location\.(search|hash)|searchParams|localStorage/, 'URL parameters and localStorage must not influence the gate');

const OWNER = 'chuihuarachif@gmail.com';
const ownerUser = {id: 'owner-id', email: OWNER, email_confirmed_at: '2026-01-01T00:00:00Z'};
const session = (user, token = 'token-1') => ({access_token: token, user});

function harness({getUser, mount, classic = false, getSession = null, preloaded = true} = {}) {
  const timers = [];
  const calls = {getUser: 0, mount: 0, unmount: 0};
  let authListener = null;
  let currentSession = null;
  const elements = [];
  const appended = [];
  const root = {dataset: {}};
  const storage = new Map(classic ? [['fs_owner_lab_classic', '1']] : []);
  const element = () => {
    const el = {style: {}, listeners: {}, remove() { el.removed = true; }, setAttribute() {}, addEventListener(type, fn) { el.listeners[type] = fn; }};
    elements.push(el);
    return el;
  };
  const context = {
    console: {error() {}},
    URL,
    Promise,
    setTimeout: (fn, ms = 0) => { timers.push({fn, ms}); return timers.length; },
    clearTimeout: () => {},
    sessionStorage: {getItem: (k) => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: (k) => storage.delete(k)},
    document: {documentElement: root, baseURI: 'https://frenchstorebo.com/v2/', body: {appendChild() {}}, head: {appendChild: (el) => appended.push(el)}, createElement: element},
    sb: {auth: {
      getSession: () => (getSession ? getSession(currentSession) : Promise.resolve({data: {session: currentSession}})),
      getUser: (token) => { calls.getUser++; return getUser ? getUser(token, currentSession) : Promise.resolve({data: {user: ownerUser}, error: null}); },
      onAuthStateChange: (fn) => { authListener = fn; return {data: {subscription: {unsubscribe() {}}}}; }
    }}
  };
  context.window = context;
  const lab = {
    mount: (options) => { calls.mount++; calls.options = options; return mount ? mount() : Promise.resolve(); },
    unmount: () => { calls.unmount++; }
  };
  if (preloaded) context.FSOwnerLab = lab;
  vm.createContext(context);
  const settle = async (includeTimeouts = false) => {
    for (let round = 0; round < 20; round++) {
      await new Promise((resolve) => setImmediate(resolve));
      const due = timers.splice(0).filter((t) => {
        if (includeTimeouts || t.ms < 1000) return true;
        timers.push(t);
        return false;
      });
      due.forEach((t) => t.fn());
    }
  };
  return {
    context, calls, root, elements, appended, lab, storage, settle,
    start(initial) { currentSession = initial; vm.runInContext(source, context); },
    emit(event, next) { currentSession = next; authListener?.(event, next); }
  };
}

// 1. Nobody signed in: no verification request, nothing mounted.
{
  const h = harness();
  h.start(null);
  await h.settle();
  assert.equal(h.calls.getUser, 0);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 2. Another account: never verified, never mounted.
{
  const h = harness();
  h.start(session({id: 'u2', email: 'cliente@example.com', email_confirmed_at: 'x'}));
  h.emit('INITIAL_SESSION', session({id: 'u2', email: 'cliente@example.com', email_confirmed_at: 'x'}));
  await h.settle();
  assert.equal(h.calls.getUser, 0);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 3. Owner email in the (browser-editable) session but Supabase Auth rejects the token.
for (const [label, getUser] of [
  ['auth error', () => Promise.resolve({data: {user: null}, error: {message: 'invalid JWT'}})],
  ['verified email differs', () => Promise.resolve({data: {user: {...ownerUser, email: 'someone@example.com'}}, error: null})],
  ['verified id differs', () => Promise.resolve({data: {user: {...ownerUser, id: 'other'}}, error: null})],
  ['email not confirmed', () => Promise.resolve({data: {user: {...ownerUser, email_confirmed_at: null}}, error: null})],
  ['error with a user payload', () => Promise.resolve({data: {user: ownerUser}, error: {message: 'session expired'}})],
  ['request throws', () => Promise.reject(new Error('network'))]
]) {
  const h = harness({getUser});
  h.start(session(ownerUser));
  await h.settle();
  assert.equal(h.calls.mount, 0, `${label}: must not mount`);
  assert.equal(h.root.dataset.fsLab, undefined, `${label}: classic storefront stays`);
}

// 4. Verification that never answers times out closed.
{
  const h = harness({getUser: () => new Promise(() => {})});
  h.start(session(ownerUser));
  await h.settle(true);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 5. Verified owner: one verification for the shared initial token, one mount.
{
  const h = harness();
  h.start(session(ownerUser));
  h.emit('INITIAL_SESSION', session(ownerUser));
  await h.settle();
  assert.equal(h.calls.getUser, 1, 'getSession and INITIAL_SESSION share one verification');
  assert.equal(h.calls.mount, 1);
  assert.equal(h.root.dataset.fsLab, 'on');
  assert.equal(h.calls.options.base, 'https://frenchstorebo.com/v2/lab/');
  // A refreshed token is verified again while the lab stays mounted.
  h.emit('TOKEN_REFRESHED', session(ownerUser, 'token-2'));
  await h.settle();
  assert.equal(h.calls.mount, 1);
  assert.equal(h.calls.getUser, 2);
  assert.equal(h.root.dataset.fsLab, 'on');
  // The same token again needs no request.
  h.emit('SIGNED_IN', session(ownerUser, 'token-2'));
  await h.settle();
  assert.equal(h.calls.getUser, 2);
  // Sign-out removes it immediately.
  h.emit('SIGNED_OUT', null);
  await h.settle();
  assert.equal(h.root.dataset.fsLab, undefined);
  assert.ok(h.calls.unmount >= 1);
  // Switching to another account keeps it off.
  h.emit('SIGNED_IN', session({id: 'u3', email: 'otro@example.com', email_confirmed_at: 'x'}, 'token-3'));
  await h.settle();
  assert.equal(h.calls.mount, 1);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 6. Sign-out while the verification is still pending: the late answer is ignored.
{
  let resolveUser;
  const h = harness({getUser: () => new Promise((resolve) => { resolveUser = resolve; })});
  h.start(session(ownerUser));
  await h.settle();
  h.emit('SIGNED_OUT', null);
  await h.settle();
  resolveUser({data: {user: ownerUser}, error: null});
  await h.settle();
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 6b. A stale, slower verification that fails must not unmount a newer verified lab.
{
  const pending = [];
  const h = harness({getUser: (token) => new Promise((resolve) => pending.push({token, resolve}))});
  h.start(session(ownerUser, 'token-old'));
  await h.settle();
  h.emit('TOKEN_REFRESHED', session(ownerUser, 'token-new'));
  await h.settle();
  pending.find((p) => p.token === 'token-new').resolve({data: {user: ownerUser}, error: null});
  await h.settle();
  assert.equal(h.root.dataset.fsLab, 'on');
  pending.find((p) => p.token === 'token-old').resolve({data: {user: null}, error: {message: 'expired'}});
  await h.settle();
  assert.equal(h.root.dataset.fsLab, 'on', 'An outdated answer cannot change the current state');
  assert.equal(h.calls.unmount, 0);
}

// 6c. A refreshed token that Supabase Auth rejects removes a mounted lab; so does a missing token.
for (const next of [session(ownerUser, 'token-bad'), session(ownerUser, '')]) {
  const h = harness({getUser: (token) => Promise.resolve(token === 'token-1' ? {data: {user: ownerUser}, error: null} : {data: {user: null}, error: {message: 'invalid JWT'}})});
  h.start(session(ownerUser));
  await h.settle();
  assert.equal(h.root.dataset.fsLab, 'on');
  h.emit('TOKEN_REFRESHED', next);
  await h.settle();
  assert.equal(h.root.dataset.fsLab, undefined);
  assert.ok(h.calls.unmount >= 1);
}

// 6d. A late initial getSession() answer (arriving after SIGNED_OUT) is ignored.
{
  let resolveSession;
  const h = harness({getSession: () => new Promise((resolve) => { resolveSession = resolve; })});
  h.start(session(ownerUser));
  h.emit('SIGNED_OUT', null);
  await h.settle();
  resolveSession({data: {session: session(ownerUser)}});
  await h.settle();
  assert.equal(h.calls.getUser, 0);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
}

// 6e. A second verification while lab.js is still downloading reuses that download.
{
  const pending = [];
  const h = harness({preloaded: false, getUser: (token) => new Promise((resolve) => pending.push({token, resolve}))});
  h.start(session(ownerUser, 'token-1'));
  await h.settle();
  pending.shift().resolve({data: {user: ownerUser}, error: null});
  await h.settle();
  h.emit('TOKEN_REFRESHED', session(ownerUser, 'token-2'));
  await h.settle();
  pending.shift().resolve({data: {user: ownerUser}, error: null});
  await h.settle();
  const scripts = h.appended.filter((el) => el.id === 'fs-owner-lab-js');
  assert.equal(scripts.length, 1, 'One lab.js request');
  h.context.FSOwnerLab = h.lab;
  scripts[0].listeners.load();
  await h.settle();
  assert.equal(h.calls.mount, 1);
  assert.equal(h.root.dataset.fsLab, 'on');
}

// 7. Lab failing to load leaves the classic storefront.
{
  const h = harness({mount: () => Promise.reject(new Error('OWNER_LAB_STYLE_FAILED'))});
  h.start(session(ownerUser));
  await h.settle();
  assert.equal(h.calls.mount, 1);
  assert.equal(h.root.dataset.fsLab, undefined);
  assert.ok(h.calls.unmount >= 1);
}

// 8. The per-tab "classic" choice can only switch the lab off.
{
  const h = harness({classic: true});
  h.start(session(ownerUser));
  await h.settle();
  assert.equal(h.calls.mount, 0);
  assert.equal(h.root.dataset.fsLab, undefined);
  const button = h.elements.find((el) => el.id === 'fsOwnerLabReturn');
  assert.ok(button, 'Verified owner gets a way back to the lab');
  button.listeners.click();
  await h.settle();
  assert.equal(h.calls.mount, 1);
  assert.equal(h.root.dataset.fsLab, 'on');
  // Choosing classic from inside the lab unmounts it for this tab.
  h.calls.options.onClassic();
  assert.equal(h.root.dataset.fsLab, undefined);
  assert.equal(h.storage.get('fs_owner_lab_classic'), '1');
}

// 9. A classic flag for a non-owner session enables nothing.
{
  const h = harness({classic: true});
  h.start(session({id: 'u4', email: 'cliente@example.com', email_confirmed_at: 'x'}));
  await h.settle();
  assert.equal(h.calls.getUser, 0);
  assert.equal(h.calls.mount, 0);
  assert.equal(h.elements.filter((el) => el.id === 'fsOwnerLabReturn').length, 0);
}

console.log('Owner lab gate contract PASS');
