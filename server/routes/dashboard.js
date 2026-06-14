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

    const totalIngresos = Number((await db.query("SELECT COALESCE(SUM(precio_venta),0) as t FROM ventas")).rows[0].t);
    const totalGastos = Number((await db.query("SELECT COALESCE(SUM(importe),0) as t FROM gastos")).rows[0].t);

    const mesActual = (await db.query(`
      SELECT
        COALESCE((SELECT SUM(precio_venta) FROM ventas WHERE to_char(fecha_venta::date,'YYYY-MM') = to_char(now(),'YYYY-MM')), 0) AS ingresos,
        COALESCE((SELECT SUM(importe) FROM gastos WHERE to_char(fecha::date,'YYYY-MM') = to_char(now(),'YYYY-MM')), 0) AS gastos
    `)).rows[0];
    const ingresosMes = Number(mesActual.ingresos);
    const gastosMes = Number(mesActual.gastos);

    const gastosPorCategoria = (await db.query(`
      SELECT categoria, COALESCE(SUM(importe),0) as total
      FROM gastos GROUP BY categoria ORDER BY total DESC
    `)).rows.map(r => ({ categoria: r.categoria, total: Number(r.total) }));

    res.json({
      totalVehiculos, enStock, vendidos, totalInvertido, beneficioTotal, ultimasVentas, ventasPorMes,
      totalIngresos, totalGastos, ingresosMes, gastosMes, beneficioMes: ingresosMes - gastosMes,
      gastosPorCategoria,
    });
  } catch (err) { next(err); }
});

module.exports = router;
