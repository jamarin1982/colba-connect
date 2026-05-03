const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'colba_connect'
    });
    
    console.log('Migrating database...');

    const [cols] = await connection.query("SHOW COLUMNS FROM improvements LIKE 'meeting_date'");
    if (cols.length === 0) {
      await connection.query('ALTER TABLE improvements ADD COLUMN meeting_date DATETIME;');
      console.log('Migration: Added meeting_date column to improvements.');
    }

    const [taskCols] = await connection.query("SHOW COLUMNS FROM tasks LIKE 'start_date'");
    if (taskCols.length === 0) {
      await connection.query('ALTER TABLE tasks ADD COLUMN start_date DATETIME, ADD COLUMN end_date DATETIME, ADD COLUMN attachments TEXT;');
      console.log('Migration: Added start_date, end_date and attachments to tasks.');
    }

    await connection.query("ALTER TABLE improvements MODIFY COLUMN state ENUM('Solicitado', 'Asignar Desarrollador', 'Tareas Asignadas', 'Aprobado', 'En Desarrollo', 'Desarrollado', 'Socializado') DEFAULT 'Solicitado';");
    console.log('Migration: Updated improvements.state enum.');

    await connection.end();
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

migrate();
