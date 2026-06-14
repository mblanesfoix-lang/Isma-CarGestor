require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const requireAuth = require('./auth');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/vehiculos', requireAuth, require('./routes/vehiculos'));
app.use('/api/gastos', requireAuth, require('./routes/gastos'));
app.use('/api/ventas', requireAuth, require('./routes/ventas'));
app.use('/api/movimientos-caja', requireAuth, require('./routes/caja'));
app.use('/api/dashboard', requireAuth, require('./routes/dashboard'));
app.use('/api/config', requireAuth, require('./routes/config'));
app.use('/api/comparador', requireAuth, require('./routes/comparador'));
app.use('/api/isma', requireAuth, require('./routes/isma'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[server] Escuchando en puerto ${PORT}`));
