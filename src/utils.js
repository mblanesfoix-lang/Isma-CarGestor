import { supabase } from './supabaseClient';

const ROUTES = {
  'vehiculos:list': () => ({ method: 'GET', url: '/api/vehiculos' }),
  'vehiculos:get': (id) => ({ method: 'GET', url: `/api/vehiculos/${id}` }),
  'vehiculos:create': (data) => ({ method: 'POST', url: '/api/vehiculos', body: data }),
  'vehiculos:update': ({ id, ...data }) => ({ method: 'PUT', url: `/api/vehiculos/${id}`, body: data }),
  'vehiculos:delete': (id) => ({ method: 'DELETE', url: `/api/vehiculos/${id}` }),

  'gastos:list': (vehiculoId) => ({ method: 'GET', url: vehiculoId ? `/api/gastos?vehiculo_id=${vehiculoId}` : '/api/gastos' }),
  'gastos:create': (data) => ({ method: 'POST', url: '/api/gastos', body: data }),
  'gastos:update': ({ id, ...data }) => ({ method: 'PUT', url: `/api/gastos/${id}`, body: data }),
  'gastos:delete': (id) => ({ method: 'DELETE', url: `/api/gastos/${id}` }),

  'ventas:list': () => ({ method: 'GET', url: '/api/ventas' }),
  'ventas:create': (data) => ({ method: 'POST', url: '/api/ventas', body: data }),
  'ventas:delete': (id) => ({ method: 'DELETE', url: `/api/ventas/${id}` }),

  'caja:list': () => ({ method: 'GET', url: '/api/movimientos-caja' }),
  'caja:create': (data) => ({ method: 'POST', url: '/api/movimientos-caja', body: data }),
  'caja:delete': (id) => ({ method: 'DELETE', url: `/api/movimientos-caja/${id}` }),
  'caja:resumen': () => ({ method: 'GET', url: '/api/movimientos-caja/resumen' }),

  'dashboard:stats': () => ({ method: 'GET', url: '/api/dashboard/stats' }),

  'config:get': () => ({ method: 'GET', url: '/api/config' }),
  'config:set': (data) => ({ method: 'POST', url: '/api/config', body: data }),

  'comparador:buscar': (data) => ({ method: 'POST', url: '/api/comparador', body: data }),
};

async function doFetch(url, method, body, accessToken) {
  const headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 120000);

  try {
    const r = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const text = await r.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Respuesta invalida del servidor: ${text.slice(0, 200)}`);
    }
    if (!r.ok) {
      const error = new Error(data?.error || `Error ${r.status}`);
      error.status = r.status;
      throw error;
    }
    return data;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Timeout: la peticion tardo demasiado');
    throw err;
  }
}

export async function api(channel, ...args) {
  const build = ROUTES[channel];
  if (!build) return Promise.resolve([]);
  const { method, url, body } = build(...args);

  const { data: { session } } = await supabase.auth.getSession();

  try {
    return await doFetch(url, method, body, session?.access_token);
  } catch (err) {
    if (err.status === 401 && session) {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session) {
        return await doFetch(url, method, body, refreshed.session.access_token);
      }
      await supabase.auth.signOut();
    }
    throw err;
  }
}

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
