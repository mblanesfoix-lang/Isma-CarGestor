import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Vehiculos from './pages/Vehiculos';
import Ventas from './pages/Ventas';
import Gastos from './pages/Gastos';
import Finanzas from './pages/Finanzas';
import Ajustes from './pages/Ajustes';
import Isma from './pages/Isma';
import Login from './pages/Login';
import { supabase } from './supabaseClient';

const ICONS = {
  isma: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M4 17c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15" cy="5" r="2" fill="currentColor" opacity=".5"/>
      <path d="M14.5 3.5v3M13 5h3" stroke="white" strokeWidth="1" strokeLinecap="round"/>
    </svg>
  ),
  dashboard: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor"/>
      <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
      <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity=".5"/>
    </svg>
  ),
  vehiculos: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 11.5L5 7h10l1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <rect x="2" y="11" width="16" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="6" cy="16.5" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="16.5" r="1.5" fill="currentColor"/>
      <path d="M6 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
  ventas: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10h14M3 6h14M3 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="15.5" cy="14.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14.5 14.5h2M15.5 13.5v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  gastos: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3v14M7 6.5C7 5.12 8.34 4 10 4s3 1.12 3 2.5S11.66 9 10 9s-3 1.12-3 2.5S8.34 14 10 14s3-1.12 3-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  finanzas: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 14l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
    </svg>
  ),
  ajustes: (
    <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const PAGES = [
  { id: 'dashboard',  label: 'Dashboard',  icon: ICONS.dashboard },
  { id: 'vehiculos',  label: 'Vehículos',  icon: ICONS.vehiculos },
  { id: 'ventas',     label: 'Ventas',     icon: ICONS.ventas },
  { id: 'gastos',     label: 'Gastos',     icon: ICONS.gastos },
  { id: 'finanzas',   label: 'Finanzas',   icon: ICONS.finanzas },
  { id: 'isma',       label: 'Isma IA',    icon: ICONS.isma, highlight: true },
  { id: 'ajustes',    label: 'Ajustes',    icon: ICONS.ajustes },
];

const PAGE_COMPONENTS = {
  dashboard:  Dashboard,
  vehiculos:  Vehiculos,
  ventas:     Ventas,
  gastos:     Gastos,
  finanzas:   Finanzas,
  isma:       Isma,
  ajustes:    Ajustes,
};

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [animKey, setAnimKey] = useState(0);
  const [session, setSession] = useState(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const navigate = (id) => {
    setMenuOpen(false);
    if (id === page) return;
    setPage(id);
    setAnimKey(k => k + 1);
  };

  if (session === undefined) return null;
  if (!session) return <Login />;

  const PageComponent = PAGE_COMPONENTS[page] || Dashboard;

  return (
    <div className="app">
      <div className="mobile-topbar">
        <div className="mobile-topbar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13L5 8h10l2 5H3z" fill="white" fillOpacity=".9"/>
              <circle cx="6.5" cy="14.5" r="1.5" fill="white"/>
              <circle cx="13.5" cy="14.5" r="1.5" fill="white"/>
              <path d="M7 10h6M8 8l-1-3h6l-1 3" stroke="white" strokeWidth="1" strokeLinecap="round" fillOpacity=".4" fill="none"/>
            </svg>
          </div>
          <h1>Car<span>Gestor</span></h1>
        </div>
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            {menuOpen ? (
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && <div className="mobile-overlay" onClick={() => setMenuOpen(false)} />}

      <nav className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 13L5 8h10l2 5H3z" fill="white" fillOpacity=".9"/>
              <circle cx="6.5" cy="14.5" r="1.5" fill="white"/>
              <circle cx="13.5" cy="14.5" r="1.5" fill="white"/>
              <path d="M7 10h6M8 8l-1-3h6l-1 3" stroke="white" strokeWidth="1" strokeLinecap="round" fillOpacity=".4" fill="none"/>
            </svg>
          </div>
          <h1>Car<span>Gestor</span></h1>
          <p>Importacion de vehiculos</p>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {PAGES.slice(0, 5).map(p => (
            <button
              key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => navigate(p.id)}
            >
              <span className="nav-icon-wrap">{p.icon}</span>
              <span className="nav-label">{p.label}</span>
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: '8px' }}>Herramientas</div>
          {PAGES.slice(5, 6).map(p => (
            <button
              key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''} ${p.highlight ? 'nav-item--isma' : ''}`}
              onClick={() => navigate(p.id)}
            >
              <span className="nav-icon-wrap">{p.icon}</span>
              <span className="nav-label">{p.label}</span>
              {p.highlight && <span className="nav-item-badge">IA</span>}
            </button>
          ))}

          <div className="nav-section-label" style={{ marginTop: '8px' }}>Sistema</div>
          {PAGES.slice(6).map(p => (
            <button
              key={p.id}
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => navigate(p.id)}
            >
              <span className="nav-icon-wrap">{p.icon}</span>
              <span className="nav-label">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => supabase.auth.signOut()}>
            <span className="nav-label">Cerrar sesión</span>
          </button>
          <div className="sidebar-version">v1.0 &nbsp;·&nbsp; 2025</div>
        </div>
      </nav>

      <main className="main" key={animKey} style={{ animation: 'fade-up 0.3s ease both' }}>
        <PageComponent />
      </main>
    </div>
  );
}
