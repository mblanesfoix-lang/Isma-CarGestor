import React, { useEffect, useState } from 'react';
import { api, fmtEur, fmtDate, badgeClass, estadoLabel, today, ESTADOS_VEHICULO } from '../utils';
import GastosList from '../components/GastosList';

const EMPTY = {
  marca: '', modelo: '', anio: new Date().getFullYear(), bastidor: '', matricula: '',
  color: '', kilometros: 0, precio_compra: 0, pais_origen: '', fecha_compra: today(),
  estado: 'en_stock', notas: ''
};

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | 'edit' | 'detail'
  const [form, setForm] = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = () => api('vehiculos:list').then(r => setVehiculos(r ?? []));
  useEffect(() => { load(); }, []);

  const filtered = vehiculos.filter(v => {
    const q = search.toLowerCase();
    const match = !q || `${v.marca} ${v.modelo} ${v.matricula} ${v.bastidor}`.toLowerCase().includes(q);
    const est = !filtroEstado || v.estado === filtroEstado;
    return match && est;
  });

  const openNew = () => { setForm(EMPTY); setModal('new'); };

  const openEdit = (v) => {
    setForm({ ...v });
    setSelected(v.id);
    setModal('edit');
  };

  const openDetail = async (v) => {
    const d = await api('vehiculos:get', v.id);
    setDetail(d);
    setModal('detail');
  };

  const save = async () => {
    const data = {
      ...form,
      anio: parseInt(form.anio) || null,
      kilometros: parseInt(form.kilometros) || 0,
      precio_compra: parseFloat(form.precio_compra) || 0,
    };
    if (modal === 'new') {
      await api('vehiculos:create', data);
    } else {
      await api('vehiculos:update', { ...data, id: selected });
    }
    setModal(null);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Eliminar vehiculo y todos sus gastos?')) return;
    await api('vehiculos:delete', id);
    setModal(null);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const costeTotal = (v) => (v.precio_compra || 0) + (v.total_gastos || 0);
  const margen = (v) => v.precio_venta ? v.precio_venta - costeTotal(v) : null;

  return (
    <>
      <div className="page-header">
        <h2>Vehiculos</h2>
        <button className="btn btn-primary" onClick={openNew}>+ Nuevo vehiculo</button>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Buscar marca, modelo, matricula..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', padding: '7px 11px', fontSize: 13 }}>
          <option value="">Todos los estados</option>
          {ESTADOS_VEHICULO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        {filtered.length === 0 ? (
          <div className="empty-state"><p>Sin vehiculos. Agrega el primero.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vehiculo</th>
                <th>Matricula</th>
                <th>Ano</th>
                <th>Estado</th>
                <th>Coste total</th>
                <th>Precio venta</th>
                <th>Margen</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => {
                const ct = costeTotal(v);
                const mg = margen(v);
                return (
                  <tr key={v.id} onClick={() => openDetail(v)}>
                    <td><strong>{v.marca} {v.modelo}</strong></td>
                    <td>{v.matricula || '-'}</td>
                    <td>{v.anio || '-'}</td>
                    <td><span className={badgeClass(v.estado)}>{estadoLabel(v.estado)}</span></td>
                    <td>{fmtEur(ct)}</td>
                    <td>{v.precio_venta ? fmtEur(v.precio_venta) : '-'}</td>
                    <td style={{ color: mg == null ? 'var(--text2)' : mg >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 700 }}>
                      {mg != null ? fmtEur(mg) : '-'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}>Editar</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {(modal === 'new' || modal === 'edit') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{modal === 'new' ? 'Nuevo vehiculo' : 'Editar vehiculo'}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Marca *</label>
                <input value={form.marca} onChange={e => f('marca', e.target.value)} placeholder="BMW, Toyota..." />
              </div>
              <div className="form-group">
                <label>Modelo *</label>
                <input value={form.modelo} onChange={e => f('modelo', e.target.value)} placeholder="Serie 3, Corolla..." />
              </div>
              <div className="form-group">
                <label>Ano</label>
                <input type="number" value={form.anio} onChange={e => f('anio', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Kilometros</label>
                <input type="number" value={form.kilometros} onChange={e => f('kilometros', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Bastidor (VIN)</label>
                <input value={form.bastidor} onChange={e => f('bastidor', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Matricula</label>
                <input value={form.matricula} onChange={e => f('matricula', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input value={form.color} onChange={e => f('color', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Precio compra (EUR) *</label>
                <input type="number" step="0.01" value={form.precio_compra} onChange={e => f('precio_compra', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Pais origen</label>
                <input value={form.pais_origen} onChange={e => f('pais_origen', e.target.value)} placeholder="Alemania, Francia..." />
              </div>
              <div className="form-group">
                <label>Fecha compra</label>
                <input type="date" value={form.fecha_compra} onChange={e => f('fecha_compra', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={form.estado} onChange={e => f('estado', e.target.value)}>
                  {ESTADOS_VEHICULO.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={form.notas} onChange={e => f('notas', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              {modal === 'edit' && (
                <button className="btn btn-danger" onClick={() => del(selected)}>Eliminar</button>
              )}
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>
                {modal === 'new' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'detail' && detail && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" style={{ width: 700 }} onClick={e => e.stopPropagation()}>
            <h3>{detail.marca} {detail.modelo} {detail.anio ? `(${detail.anio})` : ''}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              <div className="detail-panel">
                <h3>Datos del vehiculo</h3>
                {[
                  ['Matricula', detail.matricula],
                  ['Bastidor', detail.bastidor],
                  ['Color', detail.color],
                  ['Kilometros', detail.kilometros ? `${detail.kilometros.toLocaleString()} km` : null],
                  ['Pais origen', detail.pais_origen],
                  ['Fecha compra', fmtDate(detail.fecha_compra)],
                  ['Estado', estadoLabel(detail.estado)],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div className="detail-row" key={k}><span className="dk">{k}</span><span className="dv">{v}</span></div>
                ))}
              </div>
              <div className="detail-panel">
                <h3>Finanzas</h3>
                {[
                  ['Precio compra', fmtEur(detail.precio_compra)],
                  ['Total gastos', fmtEur(detail.gastos?.reduce((s, g) => s + g.importe, 0) || 0)],
                  ['Coste total', fmtEur((detail.precio_compra || 0) + (detail.gastos?.reduce((s, g) => s + g.importe, 0) || 0))],
                  detail.venta ? ['Precio venta', fmtEur(detail.venta.precio_venta)] : null,
                  detail.venta ? ['Beneficio neto', fmtEur(detail.venta.precio_venta - detail.precio_compra - (detail.gastos?.reduce((s, g) => s + g.importe, 0) || 0) - (detail.venta.comision_agente || 0))] : null,
                ].filter(Boolean).map(([k, v]) => (
                  <div className="detail-row" key={k}><span className="dk">{k}</span><span className="dv">{v}</span></div>
                ))}
                {detail.venta && (
                  <div className="detail-row">
                    <span className="dk">Cliente</span>
                    <span className="dv">{detail.venta.cliente_nombre}</span>
                  </div>
                )}
              </div>
            </div>
            <GastosList vehiculoId={detail.id} gastos={detail.gastos || []} onRefresh={async () => {
              const d = await api('vehiculos:get', detail.id);
              setDetail(d);
              load();
            }} />
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setModal(null); openEdit(detail); }}>Editar vehiculo</button>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
