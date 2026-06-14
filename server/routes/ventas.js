const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT vt.*, v.marca || ' ' || v.modelo AS vehiculo_nombre, v.matricula,
        vt.precio_venta - v.precio_compra - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) - COALESCE(vt.comision_agente, 0) AS beneficio
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
      ORDER BY vt.fecha_venta DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  const client = await db.connect();
  try {
    const d = req.body;
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO ventas (vehiculo_id, cliente_nombre, cliente_telefono, precio_venta, fecha_venta, forma_pago, comision_agente, notas)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [d.vehiculo_id, d.cliente_nombre, d.cliente_telefono ?? null, d.precio_venta, d.fecha_venta, d.forma_pago ?? 'transferencia', d.comision_agente ?? 0, d.notas ?? null]);
    await client.query(`UPDATE vehiculos SET estado = 'vendido' WHERE id = $1`, [d.vehiculo_id]);
    await client.query('COMMIT');
    res.json({ id: rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res, next) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const venta = (await client.query('SELECT vehiculo_id FROM ventas WHERE id = $1', [req.params.id])).rows[0];
    if (venta) {
      await client.query('DELETE FROM ventas WHERE id = $1', [req.params.id]);
      await client.query(`UPDATE vehiculos SET estado = 'en_stock' WHERE id = $1`, [venta.vehiculo_id]);
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
