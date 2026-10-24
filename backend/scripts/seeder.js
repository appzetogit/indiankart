// The old seeder wiped products, categories, home sections and every admin
// account, then created an admin with the password "123456". Run against the
// live database that is a full outage plus a known admin login, so it was
// removed. To set up a development database, copy a backup into a separate
// database instead (see scripts/backup-db.mjs and its restore script).
console.error('Seeding is disabled. Restore a backup into a separate development database instead.');
process.exit(1);
