const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/resumen', async (req, res, next) => {
  try {
    const movs = (await db.query('SELECT tipo, SUM(importe) as total FROM movimientos_caja GROUP BY tipo')).rows;
    const ventas = (await db.query('SELECT SUM(precio_venta) as total FROM ventas')).rows[0];
    const gastos = (await db.query('SELECT SUM(importe) as total FROM gastos')).rows[0];
    const gastosPorSocio = (await db.query('SELECT pagado_por, SUM(importe) as total FROM gastos GROUP BY pagado_por')).rows;

    const map = {};
    movs.forEach(m => map[m.tipo] = Number(m.total) || 0);

    res.json({
      total_ventas: Number(ventas.total) || 0,
      total_gastos: Number(gastos.total) || 0,
      ingresos: map['ingreso'] || 0,
      gastos_caja: map['gasto'] || 0,
      aportaciones: map['aportacion'] || 0,
      retiradas: map['retirada'] || 0,
      deuda_socio1: map['deuda_socio1'] || 0,
      deuda_socio2: map['deuda_socio2'] || 0,
      gastos_por_socio: gastosPorSocio.map(r => ({ pagado_por: r.pagado_por, total: Number(r.total) || 0 })),
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT m.*, v.marca || ' ' || v.modelo AS vehiculo_nombre
      FROM movimientos_caja m LEFT JOIN vehiculos v ON v.id = m.vehiculo_id
      ORDER BY m.fecha DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const d = req.body;
    const { rows } = await db.query(`
      INSERT INTO movimientos_caja (concepto, importe, tipo, fecha, vehiculo_id, notas)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [d.concepto, d.importe, d.tipo, d.fecha, d.vehiculo_id ?? null, d.notas ?? null]);
    res.json({ id: rows[0].id });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM movimientos_caja WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
