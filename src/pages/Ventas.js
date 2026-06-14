import React, { useEffect, useState } from 'react';
import { api, fmtEur, fmtDate, today } from '../utils';

const EMPTY = {
  vehiculo_id: '', cliente_nombre: '', cliente_telefono: '',
  precio_venta: 0, fecha_venta: today(), forma_pago: 'transferencia',
  comision_agente: 0, notas: ''
};

export default function Ventas() {
  const [ventas, setVentas] = useState([]);
  const [vehiculosStock, setVehiculosStock] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async () => {
    const [v, veh] = await Promise.all([
      api('ventas:list'),
      api('vehiculos:list')
    ]);
    setVentas(v || []);
    setVehiculosStock((veh || []).filter(v => v.estado !== 'vendido'));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.vehiculo_id || !form.cliente_nombre || !form.precio_venta) return;
    await api('ventas:create', {
      ...form,
      vehiculo_id: parseInt(form.vehiculo_id),
      precio_venta: parseFloat(form.precio_venta) || 0,
      comision_agente: parseFloat(form.comision_agente) || 0
    });
    setModal(false);
    setForm(EMPTY);
    load();
  };

  const del = async (id) => {
    if (!window.confirm('Eliminar venta? El vehiculo volvera a stock.')) return;
    await api('ventas:delete', id);
    load();
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const totalBeneficio = ventas.reduce((s, v) => s + (v.beneficio || 0), 0);
  const totalVentas = ventas.reduce((s, v) => s + (v.precio_venta || 0), 0);

  return (
    <>
      <div className="page-header">
        <h2>Ventas</h2>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Registrar venta</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="label">Total ventas</div>
          <div className="value accent">{ventas.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">Facturacion total</div>
          <div className="value">{fmtEur(totalVentas)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Beneficio total neto</div>
          <div className={`value ${totalBeneficio >= 0 ? 'green' : 'red'}`}>{fmtEur(totalBeneficio)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Margen medio</div>
          <div className="value yellow">
            {ventas.length > 0 ? fmtEur(totalBeneficio / ventas.length) : '-'}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        {ventas.length === 0 ? (
          <div className="empty-state"><p>Sin ventas registradas.</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vehiculo</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Forma pago</th>
                <th>Precio venta</th>
                <th>Comision</th>
                <th>Beneficio neto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map(v => (
                <tr key={v.id}>
                  <td><strong>{v.vehiculo_nombre}</strong><br /><span style={{ color: 'var(--text2)', fontSize: 11 }}>{v.matricula}</span></td>
                  <td>{v.cliente_nombre}<br /><span style={{ color: 'var(--text2)', fontSize: 11 }}>{v.cliente_telefono}</span></td>
                  <td>{fmtDate(v.fecha_venta)}</td>
                  <td style={{ textTransform: 'capitalize' }}>{v.forma_pago}</td>
                  <td style={{ fontWeight: 700 }}>{fmtEur(v.precio_venta)}</td>
                  <td style={{ color: 'var(--text2)' }}>{v.comision_agente > 0 ? fmtEur(v.comision_agente) : '-'}</td>
                  <td style={{ fontWeight: 700, color: v.beneficio >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {fmtEur(v.beneficio)}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => del(v.id)}>Eliminar</button>
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
            <h3>Registrar venta</h3>
            <div className="form-grid">
              <div className="form-group full">
                <label>Vehiculo *</label>
                <select value={form.vehiculo_id} onChange={e => f('vehiculo_id', e.target.value)}>
                  <option value="">-- Selecciona vehiculo --</option>
                  {vehiculosStock.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.marca} {v.modelo} {v.anio ? `(${v.anio})` : ''} {v.matricula ? `- ${v.matricula}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Cliente *</label>
                <input value={form.cliente_nombre} onChange={e => f('cliente_nombre', e.target.value)} placeholder="Nombre completo" />
              </div>
              <div className="form-group">
                <label>Telefono cliente</label>
                <input value={form.cliente_telefono} onChange={e => f('cliente_telefono', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Precio venta (EUR) *</label>
                <input type="number" step="0.01" value={form.precio_venta} onChange={e => f('precio_venta', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Fecha venta</label>
                <input type="date" value={form.fecha_venta} onChange={e => f('fecha_venta', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Forma de pago</label>
                <select value={form.forma_pago} onChange={e => f('forma_pago', e.target.value)}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="financiado">Financiado</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
              <div className="form-group">
                <label>Comision agente (EUR)</label>
                <input type="number" step="0.01" value={form.comision_agente} onChange={e => f('comision_agente', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Notas</label>
                <textarea value={form.notas} onChange={e => f('notas', e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={save}>Registrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
