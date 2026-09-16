#!/usr/bin/env node
/**
 * Daily MongoDB backup. Run from cron on the backend server.
 *
 * Writes one gzipped NDJSON file per run:
 *   line 1      {"meta": {database, createdAt, collections: [{name, count, indexes}]}}
 *   lines 2..n  {"c": "<collection>", "d": <document as canonical EJSON>}
 *
 * Canonical EJSON keeps ObjectId, Date, Decimal128 etc. exactly, so a restore
 * reproduces the original types rather than strings. Uses the mongodb driver
 * already installed for the backend, so the server needs no extra tooling.
 *
 * The dump contains password hashes and API secrets: the directory is 0700 and
 * every file 0600.
 *
 * Env:
 *   BACKUP_DIR         where dumps go             (default ~/backups/db)
 *   BACKUP_KEEP        how many dumps to retain   (default 14)
 *   BACKUP_MIN_FREE_MB refuse to run below this   (default 1024)
 *
 * Restore / verify with scripts/restore-db.mjs.
 */
import { createWriteStream, promises as fs } from 'node:fs';
import { createGzip } from 'node:zlib';
import { once } from 'node:events';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { EJSON } from 'bson';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '..', '.env'), quiet: true });

const BACKUP_DIR = process.env.BACKUP_DIR || join(homedir(), 'backups', 'db');
const KEEP = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const MIN_FREE_MB = Number(process.env.BACKUP_MIN_FREE_MB) || 1024;
const FILE_PREFIX = 'indiankart-db-';
const FILE_SUFFIX = '.ndjson.gz';
const LOCK = join(BACKUP_DIR, '.backup.lock');

const log = (message) => console.log(`[${new Date().toISOString()}] ${message}`);

const writeLine = async (stream, value) => {
    if (!stream.write(`${value}\n`)) await once(stream, 'drain');
};

const acquireLock = async () => {
    try {
        const handle = await fs.open(LOCK, 'wx');
        await handle.writeFile(String(process.pid));
        await handle.close();
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
        // A lock older than 6 hours is from a run that died; take it over.
        const { mtimeMs } = await fs.stat(LOCK);
        if (Date.now() - mtimeMs < 6 * 60 * 60 * 1000) {
            throw new Error(`another backup is running (lock ${LOCK})`);
        }
        log('removing stale lock from a run that did not finish');
        await fs.rm(LOCK, { force: true });
        return acquireLock();
    }
};

const prune = async () => {
    const dumps = (await fs.readdir(BACKUP_DIR))
        .filter((name) => name.startsWith(FILE_PREFIX) && name.endsWith(FILE_SUFFIX))
        .sort();
    const excess = dumps.slice(0, Math.max(0, dumps.length - KEEP));
    for (const name of excess) {
        await fs.rm(join(BACKUP_DIR, name), { force: true });
        log(`pruned ${name}`);
    }
    return dumps.length - excess.length;
};

const main = async () => {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set');

    await fs.mkdir(BACKUP_DIR, { recursive: true, mode: 0o700 });
    await fs.chmod(BACKUP_DIR, 0o700);

    const { bavail, bsize } = await fs.statfs(BACKUP_DIR);
    const freeMb = (bavail * bsize) / 1048576;
    if (freeMb < MIN_FREE_MB) {
        throw new Error(`only ${freeMb.toFixed(0)} MB free, need ${MIN_FREE_MB} MB - refusing to fill the disk`);
    }

    // Construct before locking: a malformed URI throws here, and must not leave
    // a lock behind that blocks the next six hours of runs.
    const client = new MongoClient(process.env.MONGO_URI);
    await acquireLock();
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const finalPath = join(BACKUP_DIR, `${FILE_PREFIX}${stamp}${FILE_SUFFIX}`);
    const partialPath = `${finalPath}.partial`;

    try {
        await client.connect();
        const db = client.db(process.env.MONGO_DB_NAME || undefined);

        const collections = (await db.listCollections({}, { nameOnly: false }).toArray())
            .filter((info) => info.type !== 'view' && !info.name.startsWith('system.'))
            .map((info) => info.name)
            .sort();

        const meta = { database: db.databaseName, createdAt: new Date().toISOString(), collections: [] };
        for (const name of collections) {
            meta.collections.push({
                name,
                count: await db.collection(name).countDocuments(),
                indexes: await db.collection(name).indexes(),
            });
        }

        const file = createWriteStream(partialPath, { mode: 0o600 });
        const gzip = createGzip({ level: 9 });
        gzip.pipe(file);
        await writeLine(gzip, JSON.stringify({ meta }));

        let written = 0;
        for (const name of collections) {
            let n = 0;
            for await (const doc of db.collection(name).find({})) {
                await writeLine(gzip, `{"c":${JSON.stringify(name)},"d":${EJSON.stringify(doc, { relaxed: false })}}`);
                n++;
            }
            const expected = meta.collections.find((c) => c.name === name).count;
            // Writes can land between the count and the scan; a small drift is
            // expected on a live store, a large one means the scan failed.
            if (Math.abs(n - expected) > Math.max(5, expected * 0.01)) {
                throw new Error(`${name}: counted ${expected} but dumped ${n}`);
            }
            written += n;
        }

        gzip.end();
        await once(file, 'close');
        await fs.rename(partialPath, finalPath);

        const { size } = await fs.stat(finalPath);
        log(`ok ${finalPath} - ${collections.length} collections, ${written} documents, ${(size / 1048576).toFixed(2)} MB`);
        log(`retaining ${await prune()} dump(s), ${freeMb.toFixed(0)} MB was free`);
    } catch (error) {
        await fs.rm(partialPath, { force: true });
        throw error;
    } finally {
        await client.close().catch(() => {});
        await fs.rm(LOCK, { force: true });
    }
};

main().catch((error) => {
    log(`FAILED: ${error.message}`);
    process.exit(1);
});
