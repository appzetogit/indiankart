// pm2 process list for the backend. Two copies of the same app on different
// ports; nginx balances requests between them (see deploy/nginx/) and sends
// traffic to the other one while either is restarting, so deploys do not drop
// requests. Start/refresh with:  pm2 startOrReload ecosystem.config.cjs
//
// Only the first instance runs the payment reconciler. It is safe to run on
// both (each checkout is leased), but one is enough.
const common = {
    script: 'server.js',
    cwd: __dirname,
    exec_mode: 'fork',
    max_memory_restart: '1500M',
    // Matches the graceful shutdown in server.js: finish in-flight requests.
    kill_timeout: 15000,
    listen_timeout: 15000,
};

module.exports = {
    apps: [
        { ...common, name: 'backend', env: { PORT: 5000 } },
        { ...common, name: 'backend-2', env: { PORT: 5001, DISABLE_PAYMENT_RECONCILER: 'true' } },
    ],
};
