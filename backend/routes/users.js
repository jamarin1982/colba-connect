const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

const verifyToken = require('../middleware/auth');

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'Administrador') {
    return res.status(403).json({ error: 'No autorizado' });
  }
  next();
};

// Get all users
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, name, email, role, active FROM users');
    // Transform tinyint(1) active to boolean if needed, though 1/0 works fine for frontend
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create user
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hash = bcrypt.hashSync(password, 10);
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, active) VALUES (?, ?, ?, ?, 1)',
      [name, email, hash, role]
    );
    res.json({ id: result.insertId, name, email, role, active: 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user (deactivate or change role)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role, active } = req.body;
    const { id } = req.params;
    await db.execute(
      'UPDATE users SET role = ?, active = ? WHERE id = ?',
      [role, active ? 1 : 0, id]
    );
    res.json({ message: 'Usuario actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tasks for a specific developer
router.get('/:id/tasks', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role !== 'Administrador' && req.user.id != id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    const [rows] = await db.execute(`
      SELECT t.*, i.title as improvement_title, i.state as improvement_state
      FROM tasks t
      JOIN improvements i ON t.improvement_id = i.id
      WHERE i.developer_id = ?
      ORDER BY t.start_date ASC
    `, [id]);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
