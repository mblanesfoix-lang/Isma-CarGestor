const db = require('./db');
const buscarPrecios = require('./comparador');

module.exports = function registerIPC(ipcMain) {

  // ── COMPARADOR DE PRECIOS ──────────────────────────────────────────────────

  ipcMain.handle('comparador:buscar', (_, params) => buscarPrecios(params));


  // ── VEHICULOS ──────────────────────────────────────────────────────────────

  ipcMain.handle('vehiculos:list', () => {
    return db.prepare(`
      SELECT v.*,
        COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) AS total_gastos,
        (SELECT vt.precio_venta FROM ventas vt WHERE vt.vehiculo_id = v.id LIMIT 1) AS precio_venta
      FROM vehiculos v ORDER BY v.created_at DESC
    `).all();
  });

  ipcMain.handle('vehiculos:get', (_, id) => {
    const v = db.prepare('SELECT * FROM vehiculos WHERE id = ?').get(id);
    const gastos = db.prepare('SELECT * FROM gastos WHERE vehiculo_id = ? ORDER BY fecha DESC').all(id);
    const venta = db.prepare('SELECT * FROM ventas WHERE vehiculo_id = ? LIMIT 1').get(id);
    return { ...v, gastos, venta };
  });

  ipcMain.handle('vehiculos:create', (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO vehiculos (marca, modelo, anio, bastidor, matricula, color, kilometros, precio_compra, pais_origen, fecha_compra, estado, notas)
      VALUES (@marca, @modelo, @anio, @bastidor, @matricula, @color, @kilometros, @precio_compra, @pais_origen, @fecha_compra, @estado, @notas)
    `);
    const result = stmt.run(data);
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('vehiculos:update', (_, { id, ...data }) => {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE vehiculos SET ${fields} WHERE id = @id`).run({ ...data, id });
    return { ok: true };
  });

  ipcMain.handle('vehiculos:delete', (_, id) => {
    db.prepare('DELETE FROM vehiculos WHERE id = ?').run(id);
    return { ok: true };
  });

  // ── GASTOS ─────────────────────────────────────────────────────────────────

  ipcMain.handle('gastos:list', (_, vehiculoId) => {
    if (vehiculoId) {
      return db.prepare('SELECT * FROM gastos WHERE vehiculo_id = ? ORDER BY fecha DESC').all(vehiculoId);
    }
    return db.prepare(`
      SELECT g.*, v.marca || ' ' || v.modelo AS vehiculo_nombre
      FROM gastos g LEFT JOIN vehiculos v ON v.id = g.vehiculo_id
      ORDER BY g.fecha DESC
    `).all();
  });

  ipcMain.handle('gastos:create', (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO gastos (vehiculo_id, concepto, importe, fecha, categoria, pagado_por, notas)
      VALUES (@vehiculo_id, @concepto, @importe, @fecha, @categoria, @pagado_por, @notas)
    `);
    const result = stmt.run(data);
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('gastos:update', (_, { id, ...data }) => {
    const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE gastos SET ${fields} WHERE id = @id`).run({ ...data, id });
    return { ok: true };
  });

  ipcMain.handle('gastos:delete', (_, id) => {
    db.prepare('DELETE FROM gastos WHERE id = ?').run(id);
    return { ok: true };
  });

  // ── VENTAS ─────────────────────────────────────────────────────────────────

  ipcMain.handle('ventas:list', () => {
    return db.prepare(`
      SELECT vt.*, v.marca || ' ' || v.modelo AS vehiculo_nombre, v.matricula,
        vt.precio_venta - v.precio_compra - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) - COALESCE(vt.comision_agente, 0) AS beneficio
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
      ORDER BY vt.fecha_venta DESC
    `).all();
  });

  ipcMain.handle('ventas:create', (_, data) => {
    const tx = db.transaction((d) => {
      const stmt = db.prepare(`
        INSERT INTO ventas (vehiculo_id, cliente_nombre, cliente_telefono, precio_venta, fecha_venta, forma_pago, comision_agente, notas)
        VALUES (@vehiculo_id, @cliente_nombre, @cliente_telefono, @precio_venta, @fecha_venta, @forma_pago, @comision_agente, @notas)
      `);
      const result = stmt.run(d);
      db.prepare(`UPDATE vehiculos SET estado = 'vendido' WHERE id = ?`).run(d.vehiculo_id);
      return { id: result.lastInsertRowid };
    });
    return tx(data);
  });

  ipcMain.handle('ventas:delete', (_, id) => {
    const venta = db.prepare('SELECT vehiculo_id FROM ventas WHERE id = ?').get(id);
    if (venta) {
      db.prepare('DELETE FROM ventas WHERE id = ?').run(id);
      db.prepare(`UPDATE vehiculos SET estado = 'en_stock' WHERE id = ?`).run(venta.vehiculo_id);
    }
    return { ok: true };
  });

  // ── CAJA / FINANZAS ────────────────────────────────────────────────────────

  ipcMain.handle('caja:list', () => {
    return db.prepare(`
      SELECT m.*, v.marca || ' ' || v.modelo AS vehiculo_nombre
      FROM movimientos_caja m LEFT JOIN vehiculos v ON v.id = m.vehiculo_id
      ORDER BY m.fecha DESC
    `).all();
  });

  ipcMain.handle('caja:create', (_, data) => {
    const stmt = db.prepare(`
      INSERT INTO movimientos_caja (concepto, importe, tipo, fecha, vehiculo_id, notas)
      VALUES (@concepto, @importe, @tipo, @fecha, @vehiculo_id, @notas)
    `);
    const result = stmt.run(data);
    return { id: result.lastInsertRowid };
  });

  ipcMain.handle('caja:delete', (_, id) => {
    db.prepare('DELETE FROM movimientos_caja WHERE id = ?').run(id);
    return { ok: true };
  });

  ipcMain.handle('caja:resumen', () => {
    const movs = db.prepare('SELECT tipo, SUM(importe) as total FROM movimientos_caja GROUP BY tipo').all();
    const ventas = db.prepare('SELECT SUM(precio_venta) as total FROM ventas').get();
    const gastos = db.prepare('SELECT SUM(importe) as total FROM gastos').get();
    const gastosPorSocio = db.prepare('SELECT pagado_por, SUM(importe) as total FROM gastos GROUP BY pagado_por').all();

    const map = {};
    movs.forEach(m => map[m.tipo] = m.total || 0);

    return {
      total_ventas: ventas.total || 0,
      total_gastos: gastos.total || 0,
      ingresos: map['ingreso'] || 0,
      gastos_caja: map['gasto'] || 0,
      aportaciones: map['aportacion'] || 0,
      retiradas: map['retirada'] || 0,
      deuda_socio1: map['deuda_socio1'] || 0,
      deuda_socio2: map['deuda_socio2'] || 0,
      gastos_por_socio: gastosPorSocio
    };
  });

  // ── DASHBOARD ──────────────────────────────────────────────────────────────

  ipcMain.handle('dashboard:stats', () => {
    const totalVehiculos = db.prepare("SELECT COUNT(*) as n FROM vehiculos").get().n;
    const enStock = db.prepare("SELECT COUNT(*) as n FROM vehiculos WHERE estado = 'en_stock'").get().n;
    const vendidos = db.prepare("SELECT COUNT(*) as n FROM vehiculos WHERE estado = 'vendido'").get().n;
    const totalInvertido = db.prepare("SELECT COALESCE(SUM(precio_compra),0) as t FROM vehiculos WHERE estado != 'vendido'").get().t;

    const beneficioTotal = db.prepare(`
      SELECT COALESCE(SUM(
        vt.precio_venta - v.precio_compra
        - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0)
        - COALESCE(vt.comision_agente, 0)
      ), 0) AS total
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
    `).get().total;

    const ultimasVentas = db.prepare(`
      SELECT vt.fecha_venta, v.marca || ' ' || v.modelo AS vehiculo, vt.precio_venta,
        vt.precio_venta - v.precio_compra - COALESCE((SELECT SUM(g.importe) FROM gastos g WHERE g.vehiculo_id = v.id), 0) AS beneficio
      FROM ventas vt JOIN vehiculos v ON v.id = vt.vehiculo_id
      ORDER BY vt.fecha_venta DESC LIMIT 5
    `).all();

    const ventasPorMes = db.prepare(`
      SELECT strftime('%Y-%m', fecha_venta) as mes, COUNT(*) as cantidad, SUM(precio_venta) as total
      FROM ventas GROUP BY mes ORDER BY mes DESC LIMIT 12
    `).all();

    return { totalVehiculos, enStock, vendidos, totalInvertido, beneficioTotal, ultimasVentas, ventasPorMes };
  });

  // ── CONFIG ─────────────────────────────────────────────────────────────────

  ipcMain.handle('config:get', () => {
    const rows = db.prepare('SELECT * FROM config').all();
    const cfg = {};
    rows.forEach(r => cfg[r.clave] = r.valor);
    return cfg;
  });

  ipcMain.handle('config:set', (_, { clave, valor }) => {
    db.prepare('INSERT OR REPLACE INTO config VALUES (?, ?)').run(clave, valor);
    return { ok: true };
  });
};
