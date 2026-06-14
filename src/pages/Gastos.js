import React, { useEffect, useState } from 'react';
import { api, fmtEur, fmtDate, today, CATEGORIAS_GASTO } from '../utils';

const EMPTY = {
  vehiculo_id: '', concepto: '', importe: 0, fecha: today(),
  categoria: 'otro', pagado_por: 'socio1', notas: ''
};

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [filtroCat, setFiltroCat] = useState('');
  const [filtroSocio, setFiltroSocio] = useState('');

  const load = async () => {
    const [g, v] = await Promise.all([api('gastos:list', null), api('vehiculos:list')]);
    setGastos(g || []);
    setVehiculos(v || []);
  };

  useEffect(() => { load(); }, []);

  const filtered = gastos.filter(g => {
    const cat = !filtroCat || g.categoria === filtroCat;
    const socio = !filtroSocio || g.pagado_por === filtroSocio;
    return cat && socio;
  });

  const save = async () => {
    await api('gastos:create', {
      ...form,
      vehiculo_id: form.vehiculo_id ? parseInt(form.vehiculo_id) : null,
      importe: parseFloat(form.importe) || 0
    });
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Eliminar gasto?')) return;
    await api('gastos:delete', id);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const totalS1 = filtered.filter(g => g.pagado_por === 'socio1').reduce((s, g) => s + g.importe, 0);
  const totalS2 = filtered.filter(g => g.pagado_por === 'socio2').reduce((s, g) => s + g.importe, 0);
  const totalEmp = filtered.filter(g => g.pagado_por === 'empresa').reduce((s, g) => s + g.importe, 0);

  return (
    <>
      <div className="page-header">
        <h2>Gastos</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Nuevo gasto</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total gastos</div>
          <div className="value red">{fmtEur(filtered.reduce((s, g) => s + g.importe, 0))}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pagado por Socio 1</div>
          <div className="value yellow">{fmtEur(totalS1)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pagado por Socio 2</div>
          <div className="value yellow">{fmtEur(totalS2)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Pagado por empresa</div>
          <div className="value accent">{fmtEur(totalEmp)}</div>
        </div>
      </div>

      <div className="filters">
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 11px', fontSize: 13 }}>
          <option value="">Todas las categorias</option>
          {CATEGORIAS_GASTO.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={filtroSocio} onChange={e => setFiltroSocio(e.target.value)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 11px', fontSize: 13 }}>
          <option value="">Todos los pagadores</option>
          <option value="socio1">Socio 1</option>
          <option value="socio2">Socio 2</option>
          <option value="empresa">Empresa</option>
        </select>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state"><p>Sin gastos registrados.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Vehiculo</th>
                <th>Categoria</th>
                <th>Pagado por</th>
                <th>Fecha</th>
                <th>Importe</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td>{g.concepto}</td>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{g.vehiculo_nombre || 'General'}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text2)' }}>{g.categoria}</td>
                  <td style={{ textTransform: 'capitalize' }}>{g.pagado_por}</td>
                  <td style={{ color: 'var(--text2)' }}>{fmtDate(g.fecha)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--red)' }}>{fmtEur(g.importe)}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => del(g.id)}>x</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Nuevo gasto</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Vehiculo (opcional)</label>
                <select value={form.vehiculo_id} onChange={e => f('vehiculo_id', e.target.value)}>
                  <option value="">-- Gasto general --</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ''} {v.matricula ? `- ${v.matricula}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group full">
                <label>Concepto *</label>
                <input value={form.concepto} onChange={e => f('concepto', e.target.value)} placeholder="Descripcion del gasto" />
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
    </>
  );
}
