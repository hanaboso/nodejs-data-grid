import { readFileSync } from "fs";

export const devIp = readFileSync( __dirname + '/../.env')?.toString()?.match("(DEV_IP=)(.*)")?.[2] ?? '';

// --- COMMONS ---
process.env.APP_ENV = 'debug';

if (process.env.JEST_DOCKER) {
    // --- DOCKER ---
    process.env.MARIADB_DSN = 'mariadb://root:root@mariadb/test';
} else {
    // --- LOCALHOST ---
    process.env.MARIADB_DSN = `mariadb://root:root@${devIp}/test`;
}
