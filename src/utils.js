function apiFallback(channel, ...args) {
  if (channel === 'comparador:buscar') {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    return fetch('http://localhost:3001/api/comparador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args[0] || {}),
      signal: ctrl.signal,
    })
      .then(r => {
        clearTimeout(timer);
        return r.text().then(text => {
          try {
            const data = JSON.parse(text);
            if (data.error) throw new Error(data.error);
            return data;
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.startsWith('Unexpected')) throw parseErr;
            throw new Error(`Servidor devolvio respuesta invalida: ${text.slice(0, 200)}`);
          }
        });
      })
      .catch(err => {
        clearTimeout(timer);
        if (err.name === 'AbortError') throw new Error('Timeout: la busqueda tardo mas de 2 minutos');
        if (err.message.includes('Failed to fetch') || err.message.includes('ECONNREFUSED')) {
          throw new Error('No se puede conectar al servidor local. Asegurate de abrir la app con Electron (npm start).');
        }
        throw err;
      });
  }
  return Promise.resolve([]);
}

export const api = window.api
  ? (channel, ...args) => window.api.invoke(channel, ...args)
  : apiFallback;

export function fmt(n, decimals = 0) {
  if (n == null) return '-';
  return Number(n).toLocaleString('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

export function fmtEur(n) {
  if (n == null) return '-';
  return Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}

export function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('es-ES');
}

export function today() {
  return new Date().toISOString().split('T')[0];
}

export const CATEGORIAS_GASTO = [
  { value: 'transporte', label: 'Transporte' },
  { value: 'itv', label: 'ITV' },
  { value: 'reparacion', label: 'Reparacion' },
  { value: 'homologacion', label: 'Homologacion' },
  { value: 'impuesto', label: 'Impuesto' },
  { value: 'seguro', label: 'Seguro' },
  { value: 'comision', label: 'Comision' },
  { value: 'otro', label: 'Otro' },
];

export const ESTADOS_VEHICULO = [
  { value: 'en_stock', label: 'En Stock' },
  { value: 'en_preparacion', label: 'En Preparacion' },
  { value: 'reservado', label: 'Reservado' },
  { value: 'vendido', label: 'Vendido' },
];

export function badgeClass(estado) {
  const map = {
    en_stock: 'badge-stock',
    vendido: 'badge-vendido',
    en_preparacion: 'badge-preparacion',
    reservado: 'badge-reservado'
  };
  return `badge ${map[estado] || ''}`;
}

export function estadoLabel(estado) {
  const found = ESTADOS_VEHICULO.find(e => e.value === estado);
  return found ? found.label : estado;
}
