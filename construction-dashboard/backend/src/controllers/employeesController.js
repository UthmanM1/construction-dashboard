const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM employees WHERE is_active = true ORDER BY name'
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const logActivity = async (req, res) => {
  const { employee_id, project_id, activity_date, activity_type, hours_worked, notes } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO employee_activity
         (employee_id, project_id, activity_date, activity_type, hours_worked, notes, logged_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [employee_id, project_id, activity_date, activity_type, hours_worked, notes, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getActivity = async (req, res) => {
  const { date, site, crew, project_id, from, to } = req.query;
  let query = `
    SELECT ea.*, e.name as employee_name, e.crew, e.trade,
           p.name as project_name, p.site_location,
           u.name as logged_by_name
    FROM employee_activity ea
    JOIN employees e ON ea.employee_id = e.id
    LEFT JOIN projects p ON ea.project_id = p.id
    LEFT JOIN users u ON ea.logged_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (date) { params.push(date); query += ` AND ea.activity_date = $${params.length}`; }
  if (from) { params.push(from); query += ` AND ea.activity_date >= $${params.length}`; }
  if (to)   { params.push(to);   query += ` AND ea.activity_date <= $${params.length}`; }
  if (crew) { params.push(crew); query += ` AND e.crew = $${params.length}`; }
  if (project_id) { params.push(project_id); query += ` AND ea.project_id = $${params.length}`; }
  if (site) { params.push(`%${site}%`); query += ` AND p.site_location ILIKE $${params.length}`; }

  query += ' ORDER BY ea.activity_date DESC, e.name LIMIT 500';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const approveActivity = async (req, res) => {
  try {
    const { rows } = await db.query(
      `UPDATE employee_activity SET approved_by = $1, approved_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, req.params.id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, logActivity, getActivity, approveActivity };
