const db = require('../config/db');

const getAll = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM equipment ORDER BY name');
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const logUsage = async (req, res) => {
  const { equipment_id, project_id, operator_id, usage_date, hours_used, fuel_used, condition_notes } = req.body;
  try {
    const { rows } = await db.query(
      `INSERT INTO equipment_usage
         (equipment_id, project_id, operator_id, usage_date, hours_used, fuel_used, condition_notes, logged_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [equipment_id, project_id, operator_id, usage_date, hours_used, fuel_used, condition_notes, req.user.id]
    );
    await db.query(
      "UPDATE equipment SET status = 'in_use', updated_at = NOW() WHERE id = $1",
      [equipment_id]
    );
    res.status(201).json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const getUsage = async (req, res) => {
  const { from, to, project_id, site } = req.query;
  let query = `
    SELECT eu.*, eq.name as equipment_name, eq.category,
           p.name as project_name, p.site_location,
           e.name as operator_name
    FROM equipment_usage eu
    JOIN equipment eq ON eu.equipment_id = eq.id
    LEFT JOIN projects p ON eu.project_id = p.id
    LEFT JOIN employees e ON eu.operator_id = e.id
    WHERE 1=1
  `;
  const params = [];
  if (from) { params.push(from); query += ` AND eu.usage_date >= $${params.length}`; }
  if (to)   { params.push(to);   query += ` AND eu.usage_date <= $${params.length}`; }
  if (project_id) { params.push(project_id); query += ` AND eu.project_id = $${params.length}`; }
  if (site) { params.push(`%${site}%`); query += ` AND p.site_location ILIKE $${params.length}`; }
  query += ' ORDER BY eu.usage_date DESC LIMIT 500';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getAll, logUsage, getUsage };
