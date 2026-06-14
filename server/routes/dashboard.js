const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/stats', async (req, res, next) => {
  try {
    const totalVehiculos = Number((await db.query('SELECT COUNT(*) as n FROM vehiculos')).rows[0].n);
    const enStock = Number((await db.query("SELECT COUNT(*) as n FROM vehiculos WHERE estado = 'en_stock'")).rows[0].n);
    const vendidos = Number((await db.query("SELECT COUNT(*) as n FROM vehiculos WHERE estado = 'vendido'")).rows[0].n);
    const totalInvertido = Number((await db.query("SELECT COALESCE(SUM(precio_compra),0) as t FROM vehiculos WHERE estado != 'vendido'")).rows[0].t);

    const beneficioTotal = Number((await db.query(`
      SELECT COALESCE(SUM(
        vt.precio_venta - v.precio_compra
        - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0)
        - COALESCE(vt.comision_agente, 0)
      ), 0) AS total
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
    `)).rows[0].total);

    const ultimasVentas = (await db.query(`
      SELECT vt.fecha_venta, v.marca || ' ' || v.modelo AS vehiculo, vt.precio_venta,
        vt.precio_venta - v.precio_compra - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) AS beneficio
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
      ORDER BY vt.fecha_venta DESC LIMIT 5
    `)).rows;

    const ventasPorMes = (await db.query(`
      SELECT to_char(fecha_venta::date, 'YYYY-MM') as mes, COUNT(*) as cantidad, SUM(precio_venta) as total
      FROM ventas GROUP BY mes ORDER BY mes DESC LIMIT 12
    `)).rows.map(r => ({ mes: r.mes, cantidad: Number(r.cantidad), total: Number(r.total) }));

    res.json({ totalVehiculos, enStock, vendidos, totalInvertido, beneficioTotal, ultimasVentas, ventasPorMes });
  } catch (err) { next(err); }
});

module.exports = router;
