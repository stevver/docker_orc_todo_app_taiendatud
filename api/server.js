const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const redis = require('redis');

const app = express();
const PORT = 3000;
const CACHE_TTL = 60; // seconds

app.use(cors());
app.use(express.json());

console.log('Starting API server...');

// PostgreSQL connection
const pool = new Pool({
  host: 'database',
  port: 5432,
  database: 'tododb',
  user: 'todouser',
  password: 'mypassword',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('connect', () => console.log('Connected to PostgreSQL'));

// Redis connection
let redisClient;
(async () => {
  redisClient = redis.createClient({ socket: { host: 'redis', port: 6379 } });
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Connected to Redis'));
  await redisClient.connect();
})();

// Health
app.get('/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    const redisResult = await redisClient.ping();
    res.json({
      status: 'OK',
      database: 'connected',
      redis: redisResult === 'PONG' ? 'connected' : 'disconnected',
      timestamp: dbResult.rows[0].now
    });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({ status: 'ERROR', message: err.message });
  }
});

// GET all todos with cache
app.get('/api/todos', async (req, res) => {
  console.log('GET /api/todos');
  try {
    const cached = await redisClient.get('todos:all');
    if (cached) {
      console.log('Cache HIT');
      return res.json(JSON.parse(cached));
    }
    console.log('Cache MISS - fetching from DB');
    const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
    await redisClient.setEx('todos:all', CACHE_TTL, JSON.stringify(result.rows));
    console.log(`Found ${result.rows.length} todos`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET single
app.get('/api/todos/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM todos WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Todo not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create (invalidate)
app.post('/api/todos', async (req, res) => {
  const { title, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const r = await pool.query(
      'INSERT INTO todos (title, description) VALUES ($1, $2) RETURNING *',
      [title.trim(), description || null]
    );
    await redisClient.del('todos:all');
    console.log('Cache invalidated');
    res.status(201).json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update (invalidate)
app.put('/api/todos/:id', async (req, res) => {
  const { title, description, completed } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  try {
    const r = await pool.query(
      'UPDATE todos SET title=$1, description=$2, completed=$3 WHERE id=$4 RETURNING *',
      [title.trim(), description || null, !!completed, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Todo not found' });
    await redisClient.del('todos:all');
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (invalidate)
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM todos WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Todo not found' });
    await redisClient.del('todos:all');
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint not found' }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Todos:  http://localhost:${PORT}/api/todos`);
});
