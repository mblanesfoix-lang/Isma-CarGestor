import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const ISMA_SYSTEM = `Eres Isma, un agente experto en importación de vehículos y mercado de compraventa de coches. Tu perfil:

ESPECIALIDADES:
- Importación de vehículos (Alemania, Japón, EE.UU., Europa del Este, Reino Unido)
- Aranceles, IVA, impuestos de matriculación (DGT), homologación ITV
- Valoración de mercado (Copart, BCA, Manheim, wallapop, milanuncios, autoscout24, mobile.de)
- Financiación y leasing de vehículos, análisis ROI
- Negociación con vendedores, subastas online, intermediarios
- Trámites aduaneros, documentación técnica, certificado de conformidad
- Historial de precios, detección de coches con problemas ocultos
- Mercados emergentes: coches eléctricos, híbridos de importación
- Análisis de márgenes, costes logísticos, gestión de stock

PERSONALIDAD:
- Directo, concreto, sin rodeos
- Hablas con cifras y datos reales
- Siempre orientado a maximizar el beneficio
- Conoces los "trucos del oficio" que los profesionales usan
- Español de España, informal pero preciso

Cuando el usuario pregunta sobre un coche específico, siempre incluyes:
- Precio de compra estimado en origen
- Costes de importación aproximados
- Precio de venta realista en España
- Margen bruto esperado

Tienes acceso al historial de vehículos y finanzas del negocio del usuario cuando te lo pidan.`;

const QUICK_ACTIONS = [
  { label: '¿Cuánto cuesta importar de Alemania?', icon: '🇩🇪' },
  { label: 'Calcula la rentabilidad de un coche', icon: '📊' },
  { label: 'Trámites de homologación ITV', icon: '📋' },
  { label: '¿Cómo funciona una subasta BCA?', icon: '🔨' },
  { label: 'Valorar un vehículo para venta', icon: '💰' },
  { label: 'Costes de logística internacional', icon: '🚢' },
];

const SUGGESTIONS = [
  'Importar un BMW Serie 3 de Alemania',
  'IVA y aranceles al importar de UK',
  'Mejores subastas online para profesionales',
  'Calcular impuesto de matriculación',
  'Margen mínimo recomendado por coche',
  'Documentación para importar de fuera de la UE',
];

function TypingIndicator() {
  return (
    <div className="isma-msg isma-msg--bot isma-msg--typing">
      <div className="isma-avatar">I</div>
      <div className="isma-bubble">
        <span className="isma-dot" />
        <span className="isma-dot" />
        <span className="isma-dot" />
      </div>
    </div>
  );
}

function Message({ msg }) {
  const isBot = msg.role === 'assistant';
  return (
    <div className={`isma-msg isma-msg--${isBot ? 'bot' : 'user'} isma-msg--in`}>
      {isBot && <div className="isma-avatar">I</div>}
      <div className="isma-bubble">
        {msg.content.split('\n').map((line, i) => {
          if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={i} className="isma-bold">{line.slice(2, -2)}</p>;
          }
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return <p key={i} className="isma-li">{line.slice(2)}</p>;
          }
          if (line === '') return <br key={i} />;
          return <p key={i}>{line}</p>;
        })}
        <span className="isma-ts">{msg.time}</span>
      </div>
    </div>
  );
}

function ParticlesBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let w, h;

    const particles = Array.from({ length: 38 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.0003,
      dy: (Math.random() - 0.5) * 0.0003,
      o: Math.random() * 0.4 + 0.1,
    }));

    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.o})`;
        ctx.fill();
      });

      // draw soft lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * w;
          const dy = (particles[i].y - particles[j].y) * h;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x * w, particles[i].y * h);
            ctx.lineTo(particles[j].x * w, particles[j].y * h);
            ctx.strokeStyle = `rgba(99,102,241,${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="isma-particles" />;
}

export default function Isma() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy Isma, tu experto en importación y compraventa de vehículos.\n\n¿En qué te puedo ayudar hoy? Puedo calcular costes de importación, analizar rentabilidades, explicarte trámites o ayudarte a valorar un coche.',
      time: now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    const userMsg = { role: 'user', content: trimmed, time: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const history = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/isma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: history, system: ISMA_SYSTEM }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      const botMsg = {
        role: 'assistant',
        content: data.content,
        time: now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error al conectar con Isma: ${err.message}. Verifica que el servidor está activo.`,
          time: now(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape') setShowSuggestions(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setShowSuggestions(e.target.value.length > 1);
  };

  const filteredSugg = SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(input.toLowerCase())
  ).slice(0, 4);

  return (
    <div className="isma-root">
      <ParticlesBackground />

      {/* Header */}
      <div className="isma-header">
        <div className="isma-header-avatar">
          <span>I</span>
          <div className="isma-online-dot" />
        </div>
        <div className="isma-header-info">
          <h2>Isma</h2>
          <p>Experto en importación &amp; compraventa · En línea</p>
        </div>
        <div className="isma-header-badges">
          <span className="isma-badge">Importación</span>
          <span className="isma-badge">Finanzas</span>
          <span className="isma-badge">Subastas</span>
        </div>
      </div>

      {/* Quick actions */}
      {messages.length <= 1 && (
        <div className="isma-quick-wrap">
          <p className="isma-quick-label">Acciones rápidas</p>
          <div className="isma-quick-grid">
            {QUICK_ACTIONS.map((a, i) => (
              <button
                key={i}
                className="isma-quick-btn"
                onClick={() => send(a.label)}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="isma-quick-icon">{a.icon}</span>
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="isma-msgs">
        {messages.map((m, i) => (
          <Message key={i} msg={m} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="isma-input-area">
        {showSuggestions && filteredSugg.length > 0 && (
          <div className="isma-sugg-list">
            {filteredSugg.map((s, i) => (
              <button key={i} className="isma-sugg-item" onClick={() => { setInput(s); setShowSuggestions(false); inputRef.current?.focus(); }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="isma-input-row">
          <textarea
            ref={inputRef}
            className="isma-textarea"
            placeholder="Pregúntale a Isma... (Enter para enviar)"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            className={`isma-send-btn ${loading ? 'isma-send-btn--loading' : ''}`}
            onClick={() => send()}
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4" strokeDashoffset="10" className="isma-spin-circle" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>
        <p className="isma-hint">Shift+Enter para nueva línea · Esc para cerrar sugerencias</p>
      </div>
    </div>
  );
}

function now() {
  return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}
