import React, { useEffect, useState } from 'react';
import { api, fmtEur, fmt, fmtDate, CATEGORIAS_GASTO } from '../utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const catLabel = (value) => CATEGORIAS_GASTO.find(c => c.value === value)?.label || value;

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('dashboard:stats')
      .then(r => r && setStats(r))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div className="empty-state"><p>Error cargando dashboard: {error}</p></div>;
  if (!stats) return <div className="empty-state"><p>Cargando...</p></div>;

  const chartData = (stats.ventasPorMes || []).reverse().map(m => ({
    mes: m.mes,
    total: m.total,
    cantidad: m.cantidad
  }));

  return (
    <>
      <div className="page-header">
        <h2>Dashboard</h2>
        <span style={{ color: 'var(--text2)', fontSize: 12 }}>
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Vehiculos en stock</div>
          <div className="value accent">{fmt(stats.enStock)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total vendidos</div>
          <div className="value">{fmt(stats.vendidos)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Capital invertido (stock)</div>
          <div className="value yellow">{fmtEur(stats.totalInvertido)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Beneficio total neto</div>
          <div className={`value ${stats.beneficioTotal >= 0 ? 'green' : 'red'}`}>
            {fmtEur(stats.beneficioTotal)}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card green-card">
          <div className="label">Ingresos totales (ventas)</div>
          <div className="value green">{fmtEur(stats.totalIngresos)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Gastos totales</div>
          <div className="value red">{fmtEur(stats.totalGastos)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Ingresos este mes</div>
          <div className="value green">{fmtEur(stats.ingresosMes)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Gastos este mes</div>
          <div className="value red">{fmtEur(stats.gastosMes)}</div>
        </div>
        <div className="stat-card yellow-card">
          <div className="label">Beneficio este mes</div>
          <div className={`value ${stats.beneficioMes >= 0 ? 'green' : 'red'}`}>
            {fmtEur(stats.beneficioMes)}
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="detail-panel">
          <h3>Ventas por mes (EUR)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#555555', fontFamily: 'Barlow Condensed, Arial Narrow, Arial', letterSpacing: 1 }} />
              <YAxis tick={{ fontSize: 10, fill: '#555555', fontFamily: 'Barlow Condensed, Arial Narrow, Arial' }} tickFormatter={v => fmtEur(v)} />
              <Tooltip
                contentStyle={{ background: '#111111', border: '1px solid #333333', borderRadius: 0, fontFamily: 'Barlow, Arial' }}
                formatter={(v) => [fmtEur(v), 'Ventas']}
              />
              <Bar dataKey="total" fill="#d5001c" radius={[0, 0, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {(stats.gastosPorCategoria?.length > 0) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Categoria de gasto</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {stats.gastosPorCategoria.map((g, i) => (
                <tr key={i}>
                  <td style={{ textTransform: 'capitalize' }}>{catLabel(g.categoria)}</td>
                  <td style={{ color: 'var(--red)', fontWeight: 700 }}>{fmtEur(g.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(stats.ultimasVentas?.length > 0) && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehiculo</th>
                <th>Fecha</th>
                <th>Precio venta</th>
                <th>Beneficio</th>
              </tr>
            </thead>
            <tbody>
              {stats.ultimasVentas.map((v, i) => (
                <tr key={i}>
                  <td>{v.vehiculo}</td>
                  <td>{fmtDate(v.fecha_venta)}</td>
                  <td>{fmtEur(v.precio_venta)}</td>
                  <td style={{ color: v.beneficio >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                    {fmtEur(v.beneficio)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
