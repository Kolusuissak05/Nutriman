const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;
const DB_FILE = path.join(__dirname, '..', 'db.json');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Serve React frontend (from ../frontend/dist) ──────────────────────────────
const DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  console.log('Serving frontend from:', DIST);
} else {
  console.log('No frontend/dist found – run: cd frontend && npm run build');
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_FILE)) return { users: {}, logs: {}, orders: {} };
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch(e) { return { users: {}, logs: {}, orders: {} }; }
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
function today() { return new Date().toISOString().split('T')[0]; }

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  const db = readDB();
  if (db.users[email])
    return res.status(409).json({ error: 'An account with this email already exists' });
  db.users[email] = {
    name, email, password,
    onboarded: false,
    createdAt: new Date().toISOString()
  };
  writeDB(db);
  const { password: _, ...user } = db.users[email];
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password are required' });
  const db = readDB();
  const user = db.users[email];
  if (!user)
    return res.status(404).json({ error: 'No account found with this email' });
  if (user.password !== password)
    return res.status(401).json({ error: 'Incorrect password' });
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// ── USER PROFILE ──────────────────────────────────────────────────────────────
app.get('/api/user/:email', (req, res) => {
  const db = readDB();
  const user = db.users[req.params.email];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

app.put('/api/user/:email', (req, res) => {
  const db = readDB();
  if (!db.users[req.params.email])
    return res.status(404).json({ error: 'User not found' });
  // Never overwrite password via this route
  const { password, ...updates } = req.body;
  db.users[req.params.email] = { ...db.users[req.params.email], ...updates };
  writeDB(db);
  const { password: _, ...safeUser } = db.users[req.params.email];
  res.json(safeUser);
});

// ── FOOD LOGS ─────────────────────────────────────────────────────────────────
app.get('/api/logs/:email', (req, res) => {
  const db = readDB();
  const date = req.query.date || today();
  const key = `${req.params.email}_${date}`;
  res.json(db.logs[key] || []);
});

app.post('/api/logs/:email', (req, res) => {
  const db = readDB();
  const key = `${req.params.email}_${today()}`;
  if (!db.logs[key]) db.logs[key] = [];
  const entry = { id: Date.now(), ...req.body, loggedAt: new Date().toISOString() };
  db.logs[key].push(entry);
  writeDB(db);
  res.json(entry);
});

app.delete('/api/logs/:email/:id', (req, res) => {
  const db = readDB();
  const key = `${req.params.email}_${today()}`;
  if (db.logs[key]) {
    db.logs[key] = db.logs[key].filter(l => String(l.id) !== String(req.params.id));
    writeDB(db);
  }
  res.json({ ok: true });
});

// Get last 7 days of logs for weekly chart
app.get('/api/logs/:email/week/summary', (req, res) => {
  const db = readDB();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    const key = `${req.params.email}_${date}`;
    const logs = db.logs[key] || [];
    const total = logs.reduce((s, l) => {
      const calPer = l.food ? (l.food.cal / l.food.minGrams) * l.grams : (l.cal || 0);
      return s + Math.round(calPer);
    }, 0);
    result.push({ date, total });
  }
  res.json(result);
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.get('/api/orders/:email', (req, res) => {
  const db = readDB();
  res.json((db.orders[req.params.email] || []).slice(0, 50));
});

app.post('/api/orders/:email', (req, res) => {
  const db = readDB();
  if (!db.orders[req.params.email]) db.orders[req.params.email] = [];
  const order = {
    id: 'ORD' + Date.now(),
    ...req.body,
    status: 'confirmed',
    placedAt: new Date().toISOString(),
  };
  db.orders[req.params.email].unshift(order);
  writeDB(db);

  // Simulate delivery status progression
  const transitions = [
    { status: 'preparing',        delay: 8000  },
    { status: 'out_for_delivery', delay: 20000 },
    { status: 'delivered',        delay: 40000 },
  ];
  transitions.forEach(({ status, delay }) => {
    setTimeout(() => {
      try {
        const d = readDB();
        const list = d.orders[req.params.email] || [];
        const o = list.find(x => x.id === order.id);
        if (o) { o.status = status; writeDB(d); }
      } catch(e) {}
    }, delay);
  });

  res.json(order);
});

app.get('/api/orders/:email/:orderId', (req, res) => {
  const db = readDB();
  const list = db.orders[req.params.email] || [];
  const order = list.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// ── Catch-all: serve React app for any non-API route ─────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(DIST, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({
      error: 'Frontend not built yet.',
      fix: 'Run: cd frontend && npm run build'
    });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🥗 NutriFlow is running!');
  console.log(`  Open: http://localhost:${PORT}`);
  console.log('');
});
