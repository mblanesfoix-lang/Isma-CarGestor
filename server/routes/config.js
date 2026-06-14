const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM config');
    const cfg = {};
    rows.forEach(r => cfg[r.clave] = r.valor);
    res.json(cfg);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { clave, valor } = req.body;
    await db.query(
      'INSERT INTO config (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = $2',
      [clave, valor]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
