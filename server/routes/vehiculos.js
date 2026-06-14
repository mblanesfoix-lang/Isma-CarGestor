const express = require('express');
const db = require('../db');

const router = express.Router();

const FIELDS = ['marca', 'modelo', 'anio', 'bastidor', 'matricula', 'color', 'kilometros', 'precio_compra', 'pais_origen', 'fecha_compra', 'estado', 'notas'];

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT v.*,
        COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) AS total_gastos,
        (SELECT vt.precio_venta FROM ventas vt WHERE vt.vehiculo_id = v.id LIMIT 1) AS precio_venta
      FROM vehiculos v ORDER BY v.created_at DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const v = (await db.query('SELECT * FROM vehiculos WHERE id = $1', [id])).rows[0];
    if (!v) return res.status(404).json({ error: 'No encontrado' });
    const gastos = (await db.query('SELECT * FROM gastos WHERE vehiculo_id = $1 ORDER BY fecha DESC', [id])).rows;
    const venta = (await db.query('SELECT * FROM ventas WHERE vehiculo_id = $1 LIMIT 1', [id])).rows[0] || null;
    res.json({ ...v, gastos, venta });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = req.body;
    const cols = FIELDS;
    const values = cols.map(c => data[c] ?? null);
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await db.query(
      `INSERT INTO vehiculos (${cols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
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
    await db.query(`UPDATE vehiculos SET ${setClause} WHERE id = $${cols.length + 1}`, values);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM vehiculos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
