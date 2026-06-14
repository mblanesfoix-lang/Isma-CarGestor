-- Esquema Postgres para Car Gestor (Supabase)
-- Ejecutar en Supabase: SQL Editor -> New query -> pegar todo -> Run

CREATE TABLE IF NOT EXISTS vehiculos (
  id SERIAL PRIMARY KEY,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER,
  bastidor TEXT UNIQUE,
  matricula TEXT,
  color TEXT,
  kilometros INTEGER DEFAULT 0,
  precio_compra REAL NOT NULL DEFAULT 0,
  pais_origen TEXT,
  fecha_compra TEXT,
  estado TEXT NOT NULL DEFAULT 'en_stock' CHECK(estado IN ('en_stock','vendido','en_preparacion','reservado')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gastos (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER REFERENCES vehiculos(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  importe REAL NOT NULL,
  fecha TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'otro' CHECK(categoria IN ('transporte','itv','reparacion','homologacion','impuesto','seguro','comision','otro')),
  pagado_por TEXT NOT NULL DEFAULT 'socio1' CHECK(pagado_por IN ('socio1','socio2','empresa')),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ventas (
  id SERIAL PRIMARY KEY,
  vehiculo_id INTEGER NOT NULL REFERENCES vehiculos(id) ON DELETE RESTRICT,
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  precio_venta REAL NOT NULL,
  fecha_venta TEXT NOT NULL,
  forma_pago TEXT DEFAULT 'transferencia' CHECK(forma_pago IN ('efectivo','transferencia','financiado','mixto')),
  comision_agente REAL DEFAULT 0,
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id SERIAL PRIMARY KEY,
  concepto TEXT NOT NULL,
  importe REAL NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto','aportacion','retirada','deuda_socio1','deuda_socio2')),
  fecha TEXT NOT NULL,
  vehiculo_id INTEGER REFERENCES vehiculos(id),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config (
  clave TEXT PRIMARY KEY,
  valor TEXT
);

INSERT INTO config (clave, valor) VALUES ('socio1_nombre', 'Socio 1') ON CONFLICT (clave) DO NOTHING;
INSERT INTO config (clave, valor) VALUES ('socio2_nombre', 'Socio 2') ON CONFLICT (clave) DO NOTHING;
INSERT INTO config (clave, valor) VALUES ('moneda', 'EUR') ON CONFLICT (clave) DO NOTHING;
