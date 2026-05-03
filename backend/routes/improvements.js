const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
const nodemailer = require('nodemailer');
const ics = require('ics');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads folder if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Configure Nodemailer transporter with Office 365
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // TLS requires secureConnection false and STARTTLS
  auth: {
    user: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
    pass: process.env.EMAIL_PASS || 'colba2024_'
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Helper to get Microsoft Graph Token
const getGraphToken = async () => {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;
  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) return null;

  try {
    const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('client_id', AZURE_CLIENT_ID);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('client_secret', AZURE_CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');

    const res = await axios.post(url, params);
    return res.data.access_token;
  } catch (err) {
    console.error('Error getting Graph token:', err.response?.data || err.message);
    return null;
  }
};

// Helper to create a REAL Teams/Outlook Event via Graph API
const createGraphEvent = async (title, emails, meetingDateStr) => {
  const token = await getGraphToken();
  if (!token) return null;

  const senderEmail = process.env.EMAIL_SENDER_ID || 'no_responder@grupocolba.com';
  const date = new Date(meetingDateStr);
  const endDate = new Date(date.getTime() + 60 * 60 * 1000); // 1 hour duration

  const event = {
    subject: title,
    body: {
      contentType: 'HTML',
      content: `Se ha generado un levantamiento de información para la mejora: <b>${title}</b>.`
    },
    start: {
      dateTime: date.toISOString(),
      timeZone: 'SA Pacific Standard Time'
    },
    end: {
      dateTime: endDate.toISOString(),
      timeZone: 'SA Pacific Standard Time'
    },
    location: {
      displayName: 'Microsoft Teams Meeting'
    },
    attendees: emails.map(email => ({
      emailAddress: { address: email },
      type: 'required'
    })),
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness'
  };

  try {
    // Create event in the calendar of the sender email
    const url = `https://graph.microsoft.com/v1.0/users/${senderEmail}/events`;
    const res = await axios.post(url, event, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    console.log(`[GRAPH API] Evento creado exitosamente: ${res.data.id}`);
    return res.data.onlineMeeting?.joinUrl || res.data.webLink;
  } catch (err) {
    console.error('Error creating Graph event:', err.response?.data || err.message);
    return null;
  }
};

// Mock function for creating a Teams Event (fallback)
const createTeamsEvent = (title, emails, meetingDate) => {
  const link = `https://teams.microsoft.com/l/meetup-join/mock-teams-link-${Date.now()}`;
  console.log(`[TEAMS API MOCK] Event created: "${title}" for ${meetingDate} with participants: ${emails.join(', ')}`);
  return link;
};

// Function to send Levantamiento Email with Calendar Invite
const sendLevantamientoEmail = async (improvementName, emails, meetingDateStr) => {
  try {
    // 1. Try to create a REAL Graph Event first
    let teamsLink = await createGraphEvent(`LEV. INFO: ${improvementName}`, emails, meetingDateStr);
    
    if (teamsLink) {
      console.log(`[EMAIL] Reutilizando enlace de Graph API para el correo.`);
    } else {
      // 2. Fallback to ICS if Graph API fails
      teamsLink = createTeamsEvent(`LEV. INFO: ${improvementName}`, emails, meetingDateStr);
    }

    const date = meetingDateStr ? new Date(meetingDateStr) : new Date();
    const start = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      date.getHours(),
      date.getMinutes()
    ];

    const { error, value } = ics.createEvent({
      uid: `colba-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@grupocolba.com`,
      start: start,
      duration: { hours: 1 },
      title: `LEV. INFO: ${improvementName}`,
      description: `Levantamiento de información para la mejora: ${improvementName}\n\nEnlace de Teams: ${teamsLink}`,
      location: 'Microsoft Teams Meeting',
      url: teamsLink,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      productId: 'ColbaConnect/Calendar',
      organizer: { name: 'ColbaConnect', email: process.env.EMAIL_USER || 'no_responder@grupocolba.com' },
      attendees: emails.map(email => ({ email, rsvp: true, role: 'REQ-PARTICIPANT', partstat: 'NEEDS-ACTION' }))
    });

    if (error) {
      console.error('Error creating ICS:', error);
    }

    const sender = process.env.EMAIL_USER || 'no_responder@grupocolba.com';
    await transporter.sendMail({
      from: `"ColbaConnect" <${sender}>`,
      to: emails.join(', '),
      subject: `INVITACION REUNION: ${improvementName}`,
      text: `Se le ha invitado al levantamiento de información para la mejora: ${improvementName}.\n\nFecha y Hora programada: ${date.toLocaleString('es-CO')}\n\nEnlace de Teams: ${teamsLink}`,
      icalEvent: {
        filename: 'invitacion.ics',
        method: 'REQUEST',
        content: value
      },
      alternatives: [{
        contentType: 'text/calendar; charset=UTF-8; method=REQUEST',
        content: value
      }]
    });
    console.log(`[EMAIL ENVIADO] Invitación de calendario enviada correctamente.`);
  } catch (err) {
    console.error('Error enviando correo de levantamiento:', err.message);
  }
};

// Function to send Socialization Email
const sendSocializationEmail = async (improvementName, tasks, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `SOCIALIZACION: ${improvementName}`,
      text: `La mejora "${improvementName}" fue cargada a productivo.\n\nTareas realizadas:\n${tasks.map(t => '- ' + t.description).join('\n')}`
    });
    console.log(`[EMAIL ENVIADO] Socialización desde no_responder`);
  } catch (err) {
    console.error('Error enviando correo de socialización:', err.message);
  }
};

// Function to send Cancellation Email
const sendCancellationEmail = async (improvementName, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `CANCELACION - LEV. INFO: ${improvementName}`,
      text: `Le informamos que la mejora "${improvementName}" ha sido cancelada/eliminada por su creador. El levantamiento de información queda suspendido.`
    });
    console.log(`[EMAIL ENVIADO] Cancelación desde no_responder`);
  } catch (err) {
    console.error('Error enviando correo de cancelación:', err.message);
  }
};

// Function to send Developer Assignment Email
const sendAsignacionDevEmail = async (improvementName, devName, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `ASIGNACION DE DESARROLLADOR: ${improvementName}`,
      text: `La iniciativa "${improvementName}" ha sido asignada al desarrollador: ${devName}.\n\nSe dará inicio a la definición de tareas técnicas.`
    });
    console.log(`[EMAIL ENVIADO] Asignación de Desarrollador`);
  } catch (err) {
    console.error('Error enviando correo de asignación:', err.message);
  }
};

// Function to send Developer Change Email
const sendCambioDevEmail = async (improvementName, oldDevName, newDevName, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `CAMBIO DE DESARROLLADOR: ${improvementName}`,
      text: `Se ha realizado un cambio de desarrollador para la iniciativa "${improvementName}".\n\nDesarrollador anterior: ${oldDevName}\nNuevo desarrollador asignado: ${newDevName}`
    });
    console.log(`[EMAIL ENVIADO] Cambio de Desarrollador`);
  } catch (err) {
    console.error('Error enviando correo de cambio:', err.message);
  }
};

// Function to send Tasks Assigned Email (for Approval)
const sendTareasAsignadasEmail = async (improvementName, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `PLAN DE TRABAJO LISTO: ${improvementName}`,
      text: `Se ha completado la definición de tareas para la iniciativa "${improvementName}".\n\nRECORDATORIO AL USUARIO CREADOR: Por favor, ingrese al portal para revisar y aprobar el plan de ejecución propuesto.`
    });
    console.log(`[EMAIL ENVIADO] Plan de Trabajo Listo`);
  } catch (err) {
    console.error('Error enviando correo de tareas asignadas:', err.message);
  }
};

// Function to send Approval Email
const sendAprobadoEmail = async (improvementName, description, tasks, emails) => {
  const taskList = tasks.map(t => `- ${t.description} (Del ${new Date(t.start_date).toLocaleString('es-CO')} al ${new Date(t.end_date).toLocaleString('es-CO')})`).join('\n');
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `INICIATIVA APROBADA: ${improvementName}`,
      text: `La iniciativa "${improvementName}" ha sido oficialmente aprobada.\n\n` +
            `DESCRIPCIÓN:\n${description}\n\n` +
            `PLAN DE EJECUCIÓN:\n${taskList}\n\n` +
            `El desarrollador asignado procederá ahora con el inicio de la fase de construcción técnica.`
    });
    console.log(`[EMAIL ENVIADO] Iniciativa Aprobada`);
  } catch (err) {
    console.error('Error enviando correo de aprobación:', err.message);
  }
};

// Function to send "In Development" email
const sendEnDesarrolloEmail = async (improvementName, emails) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || 'no_responder@grupocolba.com',
      to: emails.join(', '),
      subject: `INICIO DE DESARROLLO: ${improvementName}`,
      text: `Le informamos que se ha dado inicio formal al desarrollo técnico de la mejora: "${improvementName}".\n\nEl desarrollador asignado ya se encuentra trabajando en las tareas programadas.`
    });
    console.log(`[EMAIL ENVIADO] Inicio de Desarrollo`);
  } catch (err) {
    console.error('Error enviando correo de inicio de desarrollo:', err.message);
  }
};

// Get all improvements based on role
router.get('/', verifyToken, async (req, res) => {
  try {
    let query = '';
    let params = [];

    // Auditor, Desarrollador and Administrador see everything
    const canSeeAll = ['Auditor', 'Desarrollador', 'Administrador'].includes(req.user.role);

    if (canSeeAll) {
      query = `
        SELECT i.*, u.name as creator_name, d.name as developer_name,
               MIN(t.start_date) as start_date, MAX(t.end_date) as end_date,
               SUM(TIMESTAMPDIFF(HOUR, t.start_date, t.end_date)) as duration_hours,
               IFNULL(ROUND(COUNT(CASE WHEN t.status = 'Completada' THEN 1 END) * 100 / COUNT(t.id)), 0) as progress_percent
        FROM improvements i
        JOIN users u ON i.creator_id = u.id
        LEFT JOIN users d ON i.developer_id = d.id
        LEFT JOIN tasks t ON i.id = t.improvement_id
        GROUP BY i.id, u.name, d.name
        ORDER BY i.created_at DESC
      `;
    } else {
      // Regular 'Usuario' only sees their own
      query = `
        SELECT i.*, u.name as creator_name, d.name as developer_name,
               MIN(t.start_date) as start_date, MAX(t.end_date) as end_date,
               SUM(TIMESTAMPDIFF(HOUR, t.start_date, t.end_date)) as duration_hours,
               IFNULL(ROUND(COUNT(CASE WHEN t.status = 'Completada' THEN 1 END) * 100 / COUNT(t.id)), 0) as progress_percent
        FROM improvements i
        JOIN users u ON i.creator_id = u.id
        LEFT JOIN users d ON i.developer_id = d.id
        LEFT JOIN tasks t ON i.id = t.improvement_id
        WHERE i.creator_id = ? 
        GROUP BY i.id, u.name, d.name
        ORDER BY i.created_at DESC
      `;
      params = [req.user.id];
    }

    const [rows] = await db.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create improvement
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, emails, meetingDate } = req.body;
    const state = 'Solicitado';
    
    const [result] = await db.execute(
      'INSERT INTO improvements (title, description, state, creator_id, meeting_date) VALUES (?, ?, ?, ?, ?)',
      [title, description, state, req.user.id, meetingDate || null]
    );
    const improvementId = result.insertId;

    if (emails && emails.length > 0) {
      const [userRows] = await db.execute('SELECT email FROM users WHERE id = ?', [req.user.id]);
      const creatorEmail = userRows[0]?.email;

      if (creatorEmail && !emails.includes(creatorEmail)) {
        emails.push(creatorEmail);
      }
      
      for (const email of emails) {
        await db.execute(
          "INSERT INTO event_emails (improvement_id, event_type, email) VALUES (?, 'Levantamiento', ?)",
          [improvementId, email]
        );
      }
      
      const formattedDate = meetingDate ? new Date(meetingDate).toLocaleString('es-CO') : 'Por definir';
      await sendLevantamientoEmail(title, emails, meetingDate);
    }

    res.json({ id: improvementId, title, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single improvement
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT improvements.*, users.name as creator_name 
      FROM improvements 
      JOIN users ON improvements.creator_id = users.id 
      WHERE improvements.id = ?
    `, [req.params.id]);
    
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    
    const improvement = rows[0];

    // Check permissions for detailed view
    const canSeeAll = ['Auditor', 'Desarrollador', 'Administrador'].includes(req.user.role);
    if (!canSeeAll && improvement.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado. Solo puedes ver tus propias iniciativas.' });
    }

    const [tasks] = await db.execute('SELECT * FROM tasks WHERE improvement_id = ?', [req.params.id]);
    improvement.tasks = tasks;
    
    res.json(improvement);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add task to improvement
router.post('/:id/tasks', verifyToken, upload.array('attachments'), async (req, res) => {
  try {
    const { id: improvementId } = req.params;
    const { description, startDate, endDate } = req.body;

    // Date Validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      return res.status(400).json({ error: 'La fecha de fin debe ser posterior a la fecha de inicio.' });
    }

    const [impRows] = await db.execute('SELECT developer_id FROM improvements WHERE id = ?', [improvementId]);
    const improvement = impRows[0];
    
    if (improvement.developer_id !== req.user.id && req.user.role !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el desarrollador asignado puede agregar tareas.' });
    }

    // Overlap Validation - Check ALL initiatives of the same developer
    const [overlapRows] = await db.execute(
      `SELECT t.id FROM tasks t 
       JOIN improvements i ON t.improvement_id = i.id 
       WHERE i.developer_id = ? 
       AND ((t.start_date < ? AND t.end_date > ?) 
            OR (t.start_date < ? AND t.end_date > ?) 
            OR (t.start_date >= ? AND t.end_date <= ?))`,
      [improvement.developer_id, end, start, start, start, start, end]
    );

    if (overlapRows.length > 0) {
      return res.status(400).json({ error: 'El desarrollador ya tiene una tarea programada en este rango de fechas en otro proyecto.' });
    }

    const attachments = req.files.map(file => `/uploads/${file.filename}`);
    const attachmentsJson = JSON.stringify(attachments);

    const [result] = await db.execute(
      'INSERT INTO tasks (improvement_id, description, start_date, end_date, attachments) VALUES (?, ?, ?, ?, ?)',
      [improvementId, description, startDate || null, endDate || null, attachmentsJson]
    );
    res.json({ id: result.insertId, description, status: 'Pendiente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete task
router.delete('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.execute('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change state
router.put('/:id/state', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { state, emails } = req.body;

    const [impRows] = await db.execute('SELECT * FROM improvements WHERE id = ?', [id]);
    const improvement = impRows[0];

    if (!improvement) return res.status(404).json({ error: 'Mejora no encontrada' });

    if (state === 'Desarrollador Asignado' && req.user.role !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el administrador puede asignar un desarrollador' });
    }

    if (state === 'Tareas Asignadas' && improvement.developer_id !== req.user.id && req.user.role !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el desarrollador asignado puede finalizar esta fase' });
    }

    if (state === 'En Desarrollo' && improvement.developer_id !== req.user.id && req.user.role !== 'Administrador') {
      return res.status(403).json({ error: 'Solo el desarrollador asignado puede iniciar desarrollo' });
    }

    // Logic for Developer Assignment/Change
    if (state === 'Desarrollador Asignado') {
      const { developerId } = req.body;
      if (!developerId) return res.status(400).json({ error: 'Debes seleccionar un desarrollador' });
      
      const restrictedStates = ['En Desarrollo', 'Desarrollado', 'Socializado'];
      if (restrictedStates.includes(improvement.state)) {
        return res.status(403).json({ error: 'No se puede cambiar el desarrollador en este estado' });
      }

      // NEW RULE: Can't change developer if tasks already exist
      const [existingTasks] = await db.execute('SELECT id FROM tasks WHERE improvement_id = ?', [id]);
      if (existingTasks.length > 0) {
        return res.status(403).json({ error: 'No se puede cambiar el desarrollador porque ya existen tareas asignadas.' });
      }

      const isChange = improvement.developer_id !== null && improvement.developer_id != developerId;
      const oldDevId = improvement.developer_id;

      await db.execute(
        'UPDATE improvements SET state = ?, developer_id = ? WHERE id = ?',
        [state, developerId, id]
      );

      // Fetch all necessary info for emails
      const [creatorRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.creator_id]);
      const [newDevRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [developerId]);
      const [attendeeRows] = await db.execute("SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Levantamiento'", [id]);
      
      const emailSet = new Set();
      if (creatorRows[0]?.email) emailSet.add(creatorRows[0].email);
      if (newDevRows[0]?.email) emailSet.add(newDevRows[0].email);
      attendeeRows.forEach(r => emailSet.add(r.email));

      if (isChange) {
        const [oldDevRows] = await db.execute('SELECT name, email FROM users WHERE id = ?', [oldDevId]);
        if (oldDevRows[0]?.email) emailSet.add(oldDevRows[0].email);
        await sendCambioDevEmail(improvement.title, oldDevRows[0]?.name || 'N/A', newDevRows[0].name, Array.from(emailSet));
      } else {
        await sendAsignacionDevEmail(improvement.title, newDevRows[0].name, Array.from(emailSet));
      }

      return res.json({ message: 'Desarrollador procesado correctamente' });
    }
    if (state === 'Tareas Asignadas') {
      const [creatorRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.creator_id]);
      const [devRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.developer_id]);
      const [adminRows] = await db.execute("SELECT email FROM users WHERE role = 'Administrador'");
      const [attendeeRows] = await db.execute("SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Levantamiento'", [id]);

      const emailSet = new Set();
      if (creatorRows[0]?.email) emailSet.add(creatorRows[0].email);
      if (devRows[0]?.email) emailSet.add(devRows[0].email);
      adminRows.forEach(a => emailSet.add(a.email));
      attendeeRows.forEach(att => emailSet.add(att.email));

      await sendTareasAsignadasEmail(improvement.title, Array.from(emailSet));
    }
    
    if (state === 'Aprobado') {
      const [creatorRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.creator_id]);
      const [devRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.developer_id]);
      const [adminRows] = await db.execute("SELECT email FROM users WHERE role = 'Administrador'");
      const [attendeeRows] = await db.execute("SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Levantamiento'", [id]);
      const [tasks] = await db.execute('SELECT description, start_date, end_date FROM tasks WHERE improvement_id = ?', [id]);

      const emailSet = new Set();
      if (creatorRows[0]?.email) emailSet.add(creatorRows[0].email);
      if (devRows[0]?.email) emailSet.add(devRows[0].email);
      adminRows.forEach(a => emailSet.add(a.email));
      attendeeRows.forEach(att => emailSet.add(att.email));

      await sendAprobadoEmail(improvement.title, improvement.description, tasks, Array.from(emailSet));
    }

    if (state === 'En Desarrollo') {
      const [creatorRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.creator_id]);
      const [devRows] = await db.execute('SELECT email FROM users WHERE id = ?', [improvement.developer_id]);
      const [adminRows] = await db.execute("SELECT email FROM users WHERE role = 'Administrador'");
      const [attendeeRows] = await db.execute("SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Levantamiento'", [id]);

      const emailSet = new Set();
      if (creatorRows[0]?.email) emailSet.add(creatorRows[0].email);
      if (devRows[0]?.email) emailSet.add(devRows[0].email);
      adminRows.forEach(a => emailSet.add(a.email));
      attendeeRows.forEach(att => emailSet.add(att.email));

      await sendEnDesarrolloEmail(improvement.title, Array.from(emailSet));
    }
    if (state === 'Desarrollado') {
      const [tasks] = await db.execute('SELECT status FROM tasks WHERE improvement_id = ?', [id]);
      const allDone = tasks.length > 0 && tasks.every(t => t.status === 'Completada');
      if (!allDone) {
        return res.status(400).json({ error: 'No se puede entregar la mejora hasta que todas las tareas estén completadas al 100%.' });
      }
    }

    if (state === 'Desarrollado' && req.user.role !== 'Desarrollador') {
      return res.status(403).json({ error: 'Solo desarrolladores pueden terminar desarrollo' });
    }

    if (state === 'Socializado') {
      const [emailRows] = await db.execute(
        "SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Socializacion'",
        [id]
      );

      if (emailRows.length > 0) {
        const emailList = emailRows.map(r => r.email);
        const [tasks] = await db.execute("SELECT description FROM tasks WHERE improvement_id = ?", [id]);
        await sendSocializationEmail(improvement.title, tasks, emailList);
      }
    }

    await db.execute('UPDATE improvements SET state = ? WHERE id = ?', [state, id]);

    if (state === 'Desarrollado' && emails && emails.length > 0) {
      for (const email of emails) {
        await db.execute(
          "INSERT INTO event_emails (improvement_id, event_type, email) VALUES (?, 'Socializacion', ?)",
          [id, email]
        );
      }
      createTeamsEvent(`SOCIALIZACION: ${improvement.title}`, emails);
    }

    res.json({ message: 'Estado actualizado a ' + state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle task completion
router.put('/tasks/:taskId/toggle', verifyToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const [taskRows] = await db.execute('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (taskRows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada' });
    
    const task = taskRows[0];
    
    // Check improvement state
    const [impRows] = await db.execute('SELECT state FROM improvements WHERE id = ?', [task.improvement_id]);
    if (impRows[0].state !== 'En Desarrollo') {
      return res.status(400).json({ error: 'Solo se pueden marcar tareas cuando la mejora está "En Desarrollo"' });
    }

    const newStatus = task.status === 'Completada' ? 'Pendiente' : 'Completada';
    const completedAt = newStatus === 'Completada' ? new Date() : null;

    await db.execute(
      'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
      [newStatus, completedAt, taskId]
    );

    res.json({ message: 'Tarea actualizada', status: newStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete improvement
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if improvement exists and is Solicitado
    const [impRows] = await db.execute('SELECT * FROM improvements WHERE id = ?', [id]);
    const improvement = impRows[0];

    if (!improvement) return res.status(404).json({ error: 'Mejora no encontrada' });
    if (improvement.state !== 'Solicitado') {
      return res.status(400).json({ error: 'Solo se pueden eliminar mejoras en estado Solicitado' });
    }

    // Only creator or admin can delete
    if (improvement.creator_id !== req.user.id && req.user.role !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta mejora' });
    }

    // Get emails to send cancellation
    const [emailRows] = await db.execute("SELECT email FROM event_emails WHERE improvement_id = ? AND event_type = 'Levantamiento'", [id]);

    if (emailRows.length > 0) {
      const emailList = emailRows.map(r => r.email);
      await sendCancellationEmail(improvement.title, emailList);
    }

    // Delete from DB (tasks, event_emails, improvement)
    await db.execute('DELETE FROM tasks WHERE improvement_id = ?', [id]);
    await db.execute('DELETE FROM event_emails WHERE improvement_id = ?', [id]);
    await db.execute('DELETE FROM improvements WHERE id = ?', [id]);

    res.json({ message: 'Mejora eliminada correctamente y correo de cancelación enviado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
