const db = require('./db.js');
require('dotenv').config();

async function migrate() {
  await db.initDb();
  try {
    console.log('Altering table...');
    await db.query("ALTER TABLE improvements MODIFY COLUMN state ENUM('Solicitado', 'Desarrollador Asignado', 'Tareas Asignadas', 'Aprobado', 'En Desarrollo', 'Desarrollado', 'Socializado') DEFAULT 'Solicitado'");
    console.log('Updating data...');
    await db.query("UPDATE improvements SET state = 'Desarrollador Asignado' WHERE state = 'Asignar Desarrollador'");
    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
  process.exit(0);
}

migrate();
