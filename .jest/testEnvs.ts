// --- COMMONS ---
process.env.APP_ENV = 'debug'

if(process.env.JEST_DOCKER){
  // --- DOCKER ---
  process.env.MARIADB_HOST = 'mariadb'
} else {
  // --- LOCALHOST ---
  process.env.MARIADB_HOST = '127.0.0.45'
}
