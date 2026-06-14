import React, { useState } from 'react';
import { api, fmtEur, fmtDate, today, CATEGORIAS_GASTO } from '../utils';

const EMPTY = {
  concepto: '', importe: 0, fecha: today(), categoria: 'otro',
  pagado_por: 'socio1', notas: ''
};

export default function GastosList({ vehiculoId, gastos, onRefresh }) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const save = async () => {
    await api('gastos:create', {
      ...form,
      vehiculo_id: vehiculoId,
      importe: parseFloat(form.importe) || 0
    });
    setModal(false);
    setForm(EMPTY);
    onRefresh();
  };

  const del = async (id) => {
    if (!window.confirm('Eliminar gasto?')) return;
    await api('gastos:delete', id);
    onRefresh();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Gastos ({gastos.length})
        </span>
        <button className="btn btn-ghost btn-sm" onClick={() => setModal(true)}>+ Gasto</button>
      </div>

      {gastos.length === 0 ? (
        <div style={{ color: 'var(--text2)', fontSize: 13, padding: '12px 0' }}>Sin gastos registrados.</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Concepto', 'Categoria', 'Pagado por', 'Fecha', 'Importe', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: 'var(--text2)', borderBottom: '1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gastos.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '7px 10px', fontSize: 13 }}>{g.concepto}</td>
                <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--text2)' }}>{g.categoria}</td>
                <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--text2)' }}>{g.pagado_por}</td>
                <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--text2)' }}>{fmtDate(g.fecha)}</td>
                <td style={{ padding: '7px 10px', fontWeight: 700, color: 'var(--red)' }}>{fmtEur(g.importe)}</td>
                <td style={{ padding: '7px 10px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => del(g.id)} style={{ color: 'var(--red)' }}>x</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <h3>Nuevo gasto</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Concepto *</label>
                <input value={form.concepto} onChange={e => f('concepto', e.target.value)} placeholder="Transporte desde Alemania..." />
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
                <label>Categoria</label>
                <select value={form.categoria} onChange={e => f('categoria', e.target.value)}>
                  {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Pagado por</label>
                <select value={form.pagado_por} onChange={e => f('pagado_por', e.target.value)}>
                  <option value="socio1">Socio 1</option>
                  <option value="socio2">Socio 2</option>
                  <option value="empresa">Empresa</option>
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
    </div>
  );
}
