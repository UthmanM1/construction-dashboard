const db = require('../config/db');

const getSummary = async (req, res) => {
  try {
    const [projects, employees, equipment, alerts] = await Promise.all([
      db.query(`
        SELECT status, COUNT(*) as count FROM projects GROUP BY status
      `),
      db.query(`
        SELECT COUNT(*) as total FROM employees WHERE is_active = true
      `),
      db.query(`
        SELECT status, COUNT(*) as count FROM equipment GROUP BY status
      `),
      db.query(`
        SELECT COUNT(*) as count FROM alerts WHERE is_resolved = false
      `),
    ]);

    const todayActivity = await db.query(`
      SELECT COUNT(*) as count FROM employee_activity
      WHERE activity_date = CURRENT_DATE
    `);

    res.json({
      projects: projects.rows,
      totalActiveEmployees: parseInt(employees.rows[0].total),
      equipment: equipment.rows,
      unresolvedAlerts: parseInt(alerts.rows[0].count),
      todayActivityLogs: parseInt(todayActivity.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAlerts = async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT a.*, u.name as resolved_by_name
      FROM alerts a
      LEFT JOIN users u ON a.resolved_by = u.id
      WHERE a.is_resolved = false
      ORDER BY
        CASE a.severity WHEN 'critical' THEN 1 WHEN 'warning' THEN 2 ELSE 3 END,
        a.created_at DESC
      LIMIT 20
    `);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const resolveAlert = async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `UPDATE alerts SET is_resolved = true, resolved_by = $1, resolved_at = NOW()
       WHERE id = $2 RETURNING *`,
      [req.user.id, id]
    );
    res.json(rows[0]);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getSummary, getAlerts, resolveAlert };
