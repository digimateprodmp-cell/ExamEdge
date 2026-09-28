const mysql = require('mysql2/promise');
const fs = require('fs');

const TAGS_SQL = 'C:/Users/rahul/AppData/Local/Temp/legacy-import/questiontags.sql';
const QUESTIONS_SQL = 'C:/Users/rahul/AppData/Local/Temp/legacy-import/questions.sql';

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: 'root',
    database: 'test_mela',
    multipleStatements: true,
    maxAllowedPacket: 536870912,
  });
  await conn.query('DROP TABLE IF EXISTS legacy_questions_staging');

  console.log('questiontags already staged, skipping.');

  console.log('importing questions (large, may take a bit)...');
  const qSql = fs.readFileSync(QUESTIONS_SQL, 'utf8');
  await conn.query(qSql);
  const [qCount] = await conn.query('SELECT COUNT(*) c FROM legacy_questions_staging');
  console.log('questions staged:', qCount[0].c);

  await conn.end();
})().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});
