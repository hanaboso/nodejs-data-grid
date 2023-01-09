// --- COMMONS ---
process.env.APP_ENV = 'debug';

if (process.env.JEST_DOCKER) {
    // --- DOCKER ---
    process.env.MARIADB_DSN = 'mariadb://root:root@mariadb/test';
} else {
    // --- LOCALHOST ---
    process.env.MARIADB_DSN = 'mariadb://root:root@127.0.0.45/test';
}
