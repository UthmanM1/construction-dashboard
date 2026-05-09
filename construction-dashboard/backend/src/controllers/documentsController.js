const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 52428800 },
}).single('file');

const uploadDocument = (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { project_id, category, description, tags } = req.body;
    try {
      const { rows } = await db.query(
        `INSERT INTO documents
           (project_id, file_name, original_name, file_path, file_size, mime_type, category, description, tags, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [
          project_id,
          req.file.filename,
          req.file.originalname,
          req.file.path,
          req.file.size,
          req.file.mimetype,
          category,
          description,
          tags ? tags.split(',').map(t => t.trim()) : [],
          req.user.id,
        ]
      );
      res.status(201).json(rows[0]);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });
};

const search = async (req, res) => {
  const { project_id, q, category } = req.query;
  let query = `
    SELECT d.*, p.name as project_name, u.name as uploaded_by_name
    FROM documents d
    LEFT JOIN projects p ON d.project_id = p.id
    LEFT JOIN users u ON d.uploaded_by = u.id
    WHERE d.is_archived = false
  `;
  const params = [];
  if (project_id) { params.push(project_id); query += ` AND d.project_id = $${params.length}`; }
  if (category)   { params.push(category);   query += ` AND d.category = $${params.length}`; }
  if (q) {
    params.push(`%${q}%`);
    query += ` AND (d.original_name ILIKE $${params.length} OR d.description ILIKE $${params.length} OR $${params.length} = ANY(d.tags::text[]))`;
  }
  query += ' ORDER BY d.created_at DESC LIMIT 100';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

const download = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.download(rows[0].file_path, rows[0].original_name);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { uploadDocument, search, download };
