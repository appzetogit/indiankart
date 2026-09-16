#!/usr/bin/env node
/**
 * Verify or restore a dump written by scripts/backup-db.mjs.
 *
 *   node scripts/restore-db.mjs <dump> --verify
 *       Reads and decodes every document and checks the per-collection counts
 *       against the dump's own metadata. Touches no database.
 *
 *   node scripts/restore-db.mjs <dump> --into <database> [--collections a,b] [--drop]
 *       Loads the dump into <database> and recreates its indexes.
 *       --drop clears each restored collection first; without it, a collection
 *       that already has documents is refused rather than merged.
 *
 * Restoring into the live database requires --overwrite-live-database as well,
 * so a mistyped name cannot replace production. Restore into a separate
 * database first, check it, then move what you need.
 */
import { createReadStream } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '..', '.env'), quiet: true });

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const dumpPath = args.find((a) => !a.startsWith('--') && a !== option('--into') && a !== option('--collections'));

const fail = (message) => { console.error(`restore-db: ${message}`); process.exit(1); };
if (!dumpPath) fail('usage: restore-db.mjs <dump> --verify | --into <database> [--collections a,b] [--drop]');

const lines = () => createInterface({ input: createReadStream(dumpPath).pipe(createGunzip()), crlfDelay: Infinity });

const readMeta = async () => {
    for await (const line of lines()) {
        const parsed = JSON.parse(line);
        if (!parsed.meta) fail('first line is not dump metadata - not a backup-db.mjs file?');
        return parsed.meta;
    }
    return fail('dump is empty');
};

const verify = async () => {
    const meta = await readMeta();
    const counts = new Map();
    let decoded = 0;
    let first = true;
    for await (const line of lines()) {
        if (first) { first = false; continue; }
        const { c, d } = JSON.parse(line);
        EJSON.deserialize(d, { relaxed: false });   // throws on anything undecodable
        counts.set(c, (counts.get(c) || 0) + 1);
        decoded++;
    }
    let mismatches = 0;
    for (const { name, count } of meta.collections) {
        const got = counts.get(name) || 0;
        if (Math.abs(got - count) > Math.max(5, count * 0.01)) {
            console.log(`  MISMATCH ${name}: metadata ${count}, dump ${got}`);
            mismatches++;
        }
    }
    console.log(`database ${meta.database}, dumped ${meta.createdAt}`);
    console.log(`${meta.collections.length} collections, ${decoded} documents decoded, ${mismatches} count mismatch(es)`);
    if (mismatches) process.exit(1);
    console.log('verify: OK');
};

const restore = async () => {
    const target = option('--into');
    if (!target) fail('--into <database> is required');
    if (!process.env.MONGO_URI) fail('MONGO_URI is not set');

    const meta = await readMeta();
    const only = option('--collections') ? new Set(option('--collections').split(',').map((s) => s.trim())) : null;
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    try {
        const liveName = client.db(process.env.MONGO_DB_NAME || undefined).databaseName;
        if (target === liveName && !flag('--overwrite-live-database')) {
            fail(`"${target}" is the live database. Restore somewhere else first, or pass --overwrite-live-database.`);
        }
        const db = client.db(target);
        const selected = meta.collections.filter((c) => !only || only.has(c.name));

        for (const { name } of selected) {
            const existing = await db.collection(name).estimatedDocumentCount();
            if (existing > 0 && !flag('--drop')) fail(`${target}.${name} already has ${existing} documents; pass --drop to replace it`);
            if (flag('--drop')) await db.collection(name).deleteMany({});
        }

        const wanted = new Set(selected.map((c) => c.name));
        const batches = new Map();
        const flush = async (name) => {
            const docs = batches.get(name);
            if (docs?.length) await db.collection(name).insertMany(docs, { ordered: false });
            batches.set(name, []);
        };

        let first = true;
        for await (const line of lines()) {
            if (first) { first = false; continue; }
            const { c, d } = JSON.parse(line);
            if (!wanted.has(c)) continue;
            if (!batches.has(c)) batches.set(c, []);
            batches.get(c).push(EJSON.deserialize(d, { relaxed: false }));
            if (batches.get(c).length >= 1000) await flush(c);
        }
        for (const name of batches.keys()) await flush(name);

        for (const { name, indexes } of selected) {
            for (const { key, name: indexName, v, ns, ...options } of indexes || []) {
                if (indexName === '_id_') continue;
                await db.collection(name).createIndex(key, { name: indexName, ...options });
            }
            console.log(`  restored ${name}: ${await db.collection(name).countDocuments()} documents`);
        }
        console.log(`restore into ${target}: OK`);
    } finally {
        await client.close();
    }
};

(flag('--verify') ? verify() : restore()).catch((error) => fail(error.message));
