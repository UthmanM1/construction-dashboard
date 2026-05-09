const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT p.*, u.name as created_by_name,
        COUNT(DISTINCT ea.id) as activity_count,
        COUNT(DISTINCT d.id) as document_count
      FROM projects p
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN employee_activity ea ON ea.project_id = p.id
      LEFT JOIN documents d ON d.project_id = p.id
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getOne = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Project not found' });
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const create = async (req, res) => {
  const { name, site_location, status, start_date, expected_end_date, budget, description } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO projects (name, site_location, status, start_date, expected_end_date, budget, description, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, site_location, status || 'planning', start_date, expected_end_date, budget, description, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  try {
    const existing = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Not found' });

    // Log changes to history
    for (const [key, value] of Object.entries(fields)) {
      if (existing.rows[0][key] !== value) {
        await db.query(
          `INSERT INTO project_history (project_id, changed_by, field_changed, old_value, new_value)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, req.user.id, key, String(existing.rows[0][key]), String(value)]
        );
      }
    }

    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await db.query(
      `UPDATE projects SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getHistory = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ph.*, u.name as changed_by_name FROM project_history ph
       LEFT JOIN users u ON ph.changed_by = u.id
       WHERE ph.project_id = $1 ORDER BY ph.changed_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, getOne, create, update, getHistory };
