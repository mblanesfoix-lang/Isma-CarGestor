const express = require('express');
const db = require('../db');

const router = express.Router();

const FIELDS = ['vehiculo_id', 'concepto', 'importe', 'fecha', 'categoria', 'pagado_por', 'notas'];

router.get('/', async (req, res, next) => {
  try {
    const { vehiculo_id } = req.query;
    if (vehiculo_id) {
      const { rows } = await db.query('SELECT * FROM gastos WHERE vehiculo_id = $1 ORDER BY fecha DESC', [vehiculo_id]);
      return res.json(rows);
    }
    const { rows } = await db.query(`
      SELECT g.*, v.marca || ' ' || v.modelo AS vehiculo_nombre
      FROM gastos g LEFT JOIN vehiculos v ON v.id = g.vehiculo_id
      ORDER BY g.fecha DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const cols = FIELDS;
    const values = cols.map(c => data[c] ?? null);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await db.query(
      `INSERT INTO gastos (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      values
    );
    res.json({ id: rows[0].id });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const cols = Object.keys(data).filter(k => FIELDS.includes(k));
    if (cols.length === 0) return res.json({ ok: true });
    const setClause = cols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const values = cols.map(c => data[c]);
    values.push(id);
    await db.query(`UPDATE gastos SET ${setClause} WHERE id = $${cols.length + 1}`, values);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM gastos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
