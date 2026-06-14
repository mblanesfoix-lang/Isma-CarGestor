import React, { useEffect, useState } from 'react';
import { api, fmtEur, fmtDate, today } from '../utils';

const TIPOS = [
  { value: 'ingreso', label: 'Ingreso' },
  { value: 'gasto', label: 'Gasto' },
  { value: 'aportacion', label: 'Aportacion socio' },
  { value: 'retirada', label: 'Retirada socio' },
  { value: 'deuda_socio1', label: 'Deuda Socio 1' },
  { value: 'deuda_socio2', label: 'Deuda Socio 2' },
];

const EMPTY = { concepto: '', importe: 0, tipo: 'ingreso', fecha: today(), vehiculo_id: '', notas: '' };

export default function Finanzas() {
  const [movimientos, setMovimientos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [m, r, v] = await Promise.all([
      api('caja:list'),
      api('caja:resumen'),
      api('vehiculos:list')
    ]);
    setMovimientos(m || []);
    setResumen(r);
    setVehiculos(v || []);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    await api('caja:create', {
      ...form,
      importe: parseFloat(form.importe) || 0,
      vehiculo_id: form.vehiculo_id ? parseInt(form.vehiculo_id) : null
    });
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Eliminar movimiento?')) return;
    await api('caja:delete', id);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const saldoCaja = resumen
    ? (resumen.ingresos + resumen.aportaciones + resumen.total_ventas)
      - (resumen.gastos_caja + resumen.retiradas + resumen.total_gastos)
    : 0;

  const diferenciaEntresocios = resumen
    ? (resumen.deuda_socio1 || 0) - (resumen.deuda_socio2 || 0)
    : 0;

  return (
    <>
      <div className="page-header">
        <h2>Finanzas</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Movimiento</button>
      </div>

      {resumen && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="label">Saldo estimado</div>
              <div className={`value ${saldoCaja >= 0 ? 'green' : 'red'}`}>{fmtEur(saldoCaja)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total ventas cobradas</div>
              <div className="value accent">{fmtEur(resumen.total_ventas)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Total gastos pagados</div>
              <div className="value red">{fmtEur(resumen.total_gastos)}</div>
            </div>
            <div className="stat-card">
              <div className="label">Beneficio neto total</div>
              <div className={`value ${(resumen.total_ventas - resumen.total_gastos) >= 0 ? 'green' : 'red'}`}>
                {fmtEur(resumen.total_ventas - resumen.total_gastos)}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="detail-panel">
              <h3>Desglose socios</h3>
              {(resumen.gastos_por_socio || []).map(s => (
                <div className="detail-row" key={s.pagado_por}>
                  <span className="dk" style={{ textTransform: 'capitalize' }}>{s.pagado_por}</span>
                  <span className="dv" style={{ color: 'var(--red)' }}>{fmtEur(s.total)}</span>
                </div>
              ))}
              <div className="detail-row" style={{ marginTop: 8 }}>
                <span className="dk">Deuda registrada Socio 1</span>
                <span className="dv">{fmtEur(resumen.deuda_socio1)}</span>
              </div>
              <div className="detail-row">
                <span className="dk">Deuda registrada Socio 2</span>
                <span className="dv">{fmtEur(resumen.deuda_socio2)}</span>
              </div>
              <div className="detail-row" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
                <span className="dk">Balance entre socios</span>
                <span className="dv" style={{ color: diferenciaEntresocios === 0 ? 'var(--green)' : 'var(--yellow)' }}>
                  {diferenciaEntresocios === 0 ? 'Equilibrado' : (diferenciaEntresocios > 0 ? `S1 debe ${fmtEur(diferenciaEntresocios)}` : `S2 debe ${fmtEur(Math.abs(diferenciaEntresocios))}`)}
                </span>
              </div>
            </div>
            <div className="detail-panel">
              <h3>Caja</h3>
              <div className="detail-row"><span className="dk">Aportaciones socios</span><span className="dv">{fmtEur(resumen.aportaciones)}</span></div>
              <div className="detail-row"><span className="dk">Retiradas socios</span><span className="dv" style={{ color: 'var(--red)' }}>{fmtEur(resumen.retiradas)}</span></div>
              <div className="detail-row"><span className="dk">Ingresos manuales</span><span className="dv">{fmtEur(resumen.ingresos)}</span></div>
              <div className="detail-row"><span className="dk">Gastos manuales</span><span className="dv" style={{ color: 'var(--red)' }}>{fmtEur(resumen.gastos_caja)}</span></div>
            </div>
          </div>
        </>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Tipo</th>
              <th>Vehiculo</th>
              <th>Fecha</th>
              <th>Importe</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text2)' }}>Sin movimientos.</td></tr>
            ) : movimientos.map(m => {
              const esGasto = ['gasto', 'retirada'].includes(m.tipo);
              return (
                <tr key={m.id}>
                  <td>{m.concepto}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text2)', fontSize: 12 }}>
                    {TIPOS.find(t => t.value === m.tipo)?.label || m.tipo}
                  </td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{m.vehiculo_nombre || '-'}</td>
                  <td style={{ color: 'var(--text2)' }}>{fmtDate(m.fecha)}</td>
                  <td style={{ fontWeight: 700, color: esGasto ? 'var(--red)' : 'var(--green)' }}>
                    {esGasto ? '-' : '+'}{fmtEur(m.importe)}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => del(m.id)}>x</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nuevo movimiento de caja</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Concepto *</label>
                <input value={form.concepto} onChange={e => f('concepto', e.target.value)} placeholder="Descripcion" />
              </div>
              <div className="form-group">
                <label>Tipo *</label>
                <select value={form.tipo} onChange={e => f('tipo', e.target.value)}>
                  {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Importe (EUR) *</label>
                <input type="number" step="0.01" value={form.importe} onChange={e => f('importe', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fecha</label>
                <input type="date" value={form.fecha} onChange={e => f('fecha', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Vehiculo (opcional)</label>
                <select value={form.vehiculo_id} onChange={e => f('vehiculo_id', e.target.value)}>
                  <option value="">-- Ninguno --</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.marca} {v.modelo} {v.matricula ? `- ${v.matricula}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={form.notas} onChange={e => f('notas', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
