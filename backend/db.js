const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

let pool;

async function initDb() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS colba_connect');
    await connection.end();

    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: 'colba_connect',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Connected to MySQL database colba_connect.');

    // Create tables
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('Usuario', 'Desarrollador', 'Auditor', 'Administrador') NOT NULL,
      active BOOLEAN DEFAULT 1
    )`);

    const [rows] = await pool.query("SELECT * FROM users WHERE role = 'Administrador'");
    if (rows.length === 0) {
      const hash = bcrypt.hashSync('admin', 10);
      await pool.query(`INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@empresa.com', ?, 'Administrador')`, [hash]);
      console.log('Admin user created');
    }

    await pool.query(`CREATE TABLE IF NOT EXISTS improvements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      state ENUM('Solicitado', 'Desarrollador Asignado', 'Tareas Asignadas', 'Aprobado', 'En Desarrollo', 'Desarrollado', 'Socializado') DEFAULT 'Solicitado',
      creator_id INT,
      developer_id INT,
      meeting_date DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id),
      FOREIGN KEY (developer_id) REFERENCES users(id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      improvement_id INT,
      description TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'Pendiente',
      completed_at DATETIME,
      start_date DATETIME,
      end_date DATETIME,
      attachments TEXT,
      FOREIGN KEY (improvement_id) REFERENCES improvements(id)
    )`);

    await pool.query(`CREATE TABLE IF NOT EXISTS event_emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      improvement_id INT,
      event_type ENUM('Levantamiento', 'Socializacion'),
      email VARCHAR(255) NOT NULL,
      FOREIGN KEY (improvement_id) REFERENCES improvements(id)
    )`);

  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
}

module.exports = {
  initDb,
  query: async (...args) => {
    return pool.query(...args);
  },
  execute: async (...args) => {
    return pool.execute(...args);
  }
};
