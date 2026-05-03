const db = require('./db.js');
require('dotenv').config();

async function repair() {
  await db.initDb();
  try {
    console.log('Repairing empty or inconsistent states...');
    // If has developer but state is empty or Solicitado, set to Desarrollador Asignado
    await db.query("UPDATE improvements SET state = 'Desarrollador Asignado' WHERE developer_id IS NOT NULL AND (state = '' OR state = 'Solicitado' OR state IS NULL)");
    // If no developer and state is empty, set to Solicitado
    await db.query("UPDATE improvements SET state = 'Solicitado' WHERE developer_id IS NULL AND (state = '' OR state IS NULL)");
    console.log('Repair complete');
    
    const [rows] = await db.query('SELECT id, state FROM improvements');
    console.log('Current states:', rows);
  } catch (err) {
    console.error('Repair failed:', err.message);
  }
  process.exit(0);
}

repair();
