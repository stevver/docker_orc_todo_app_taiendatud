const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Compose teenuse nimi: 'database'
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'tododb',
  user: 'todouser',
  password: 'mypassword',
});

app.get('/health', async (_, res) => {
  try {
    const r = await pool.query('SELECT NOW()');
    res.json({ status: 'OK', database: 'connected', timestamp: r.rows[0].now });
  } catch (e) {
    res.status(503).json({ status: 'ERROR', message: e.message });
  }
});

app.get('/api/todos', async (_, res) => {
  try {
    const r = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/todos', async (req, res) => {
  const { title, description } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *',
      [title.trim(), description || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, completed } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'Title required' });
  try {
    const r = await pool.query(
      'UPDATE todos SET title=$1, description=$2, completed=$3 WHERE id=$4 RETURNING *',
      [title.trim(), description || null, !!completed, id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM todos WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, '0.0.0.0', () => console.log(`API on :${PORT}`));
