import React, { useEffect, useState } from 'react';
import { api } from '../utils';

export default function Ajustes() {
  const [cfg, setCfg] = useState({ socio1_nombre: 'Socio 1', socio2_nombre: 'Socio 2', moneda: 'EUR' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api('config:get').then(c => { if (c) setCfg(c); });
  }, []);

  const save = async () => {
    await Promise.all([
      api('config:set', { clave: 'socio1_nombre', valor: cfg.socio1_nombre }),
      api('config:set', { clave: 'socio2_nombre', valor: cfg.socio2_nombre }),
      api('config:set', { clave: 'moneda', valor: cfg.moneda }),
    ]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <>
      <div className="page-header">
        <h2>Ajustes</h2>
      </div>

      <div className="detail-panel" style={{ maxWidth: 480 }}>
        <h3>Configuracion general</h3>
        <div className="form-grid" style={{ marginTop: 16 }}>
          <div className="form-group">
            <label>Nombre Socio 1</label>
            <input value={cfg.socio1_nombre || ''} onChange={e => setCfg(p => ({ ...p, socio1_nombre: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Nombre Socio 2</label>
            <input value={cfg.socio2_nombre || ''} onChange={e => setCfg(p => ({ ...p, socio2_nombre: e.target.value }))} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={save}>Guardar cambios</button>
          {saved && <span className="alert alert-success" style={{ padding: '6px 12px' }}>Guardado</span>}
        </div>
      </div>

      <div className="detail-panel" style={{ maxWidth: 480 }}>
        <h3>Acerca de</h3>
        <div className="detail-row"><span className="dk">Version</span><span className="dv">1.0.0</span></div>
        <div className="detail-row"><span className="dk">Base de datos</span><span className="dv">SQLite local</span></div>
        <div className="detail-row"><span className="dk">Ubicacion datos</span><span className="dv">%APPDATA%/car-gestor/</span></div>
      </div>
    </>
  );
}
