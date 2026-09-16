#!/usr/bin/env node
/**
 * Refuses to build or start the dev server when vite.config.js has been
 * tampered with.
 *
 * Vite executes vite.config.js on every `vite build` and `vite dev`, and an
 * obfuscated payload has been appended to that file four times - twice by
 * force-pushing over commits that had already landed. Deleting it each time did
 * not stop the next build from executing it, on Vercel and on developer
 * machines, before anyone noticed.
 *
 * This runs as prebuild/predev, in a separate process that only READS the file,
 * so a tampered config fails the build before Vite ever evaluates it.
 *
 * Deliberately needs no git metadata and no dependencies: Vercel builds from a
 * shallow checkout, and anything that crashes there would block every deploy.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(process.argv[2] || resolve(here, '..', 'vite.config.js'));

// The legitimate config is ~240 bytes. Real edits (a proxy, an alias) stay far
// under this; every injected copy so far has been 5 KB to 35 KB.
const MAX_BYTES = 4 * 1024;

const CHECKS = [
    {
        id: 'offscreen-padding',
        test: (src) => /\S[ \t]{80,}\S/.test(src),
        why: 'code, then a long whitespace run, then more code - hides an appended payload off-screen',
    },
    {
        id: 'global-marker',
        test: (src) => /global(?:This)?\s*(?:\.\s*[imr]\b|\[\s*['"][imr]['"]\s*\])\s*=/.test(src),
        why: 'assigns to a single-letter global (global.i / global.r / global.m), the payload bootstrap',
    },
    {
        id: 'create-require',
        test: (src) => /\bcreateRequire\b/.test(src),
        why: 'createRequire in the Vite config - only needed to smuggle require() into an ES module',
    },
    {
        id: 'network-module',
        test: (src) => /['"](?:node:)?(?:https?|net|child_process|dgram)['"]/.test(src),
        why: 'the Vite config references a network or process module',
    },
];

let source;
try {
    source = readFileSync(target, 'utf8');
} catch (error) {
    console.error(`verify-build-config: cannot read ${target}: ${error.message}`);
    process.exit(1);
}

const problems = [];
const bytes = Buffer.byteLength(source, 'utf8');
if (bytes > MAX_BYTES) {
    problems.push({ id: 'too-large', why: `${bytes} bytes (limit ${MAX_BYTES}) - the real config is ~240 bytes` });
}
for (const check of CHECKS) {
    if (check.test(source)) problems.push(check);
}

if (problems.length === 0) {
    console.log('verify-build-config: vite.config.js ok');
    process.exit(0);
}

console.error('\nverify-build-config: REFUSING TO BUILD - vite.config.js looks tampered with\n');
for (const problem of problems) {
    console.error(`  [${problem.id}] ${problem.why}`);
}
console.error('\nDo not run vite against this file. Restore the clean config from git and');
console.error('treat the machine or credentials that pushed it as compromised.\n');
process.exit(1);
