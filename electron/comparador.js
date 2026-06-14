const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function buscarPrecios({ marca, modelo, anioMin, anioMax, combustible, transmision, kmMax }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { resultados: [], errores: { coches: 'ANTHROPIC_API_KEY no configurada' }, stats: null };
  }

  const client = new Anthropic({ apiKey });

  const filtros = [
    anioMin && `año desde ${anioMin}`,
    anioMax && `año hasta ${anioMax}`,
    combustible && combustible,
    transmision && transmision,
    kmMax && `menos de ${kmMax} km`,
  ].filter(Boolean).join(', ');

  const descripcion = `${marca} ${modelo}${filtros ? ', ' + filtros : ''}`;

  const systemPrompt = `Eres un experto en el mercado de coches de segunda mano en España.
Usa web_search para buscar precios actuales en coches.net, autoscout24.es, autocasion y milanuncios.
Tras buscar, responde UNICAMENTE con un objeto JSON valido, sin texto antes ni despues, sin bloques de codigo markdown.`;

  const userPrompt = `Busca precios actuales de "${descripcion}" de segunda mano en España.

Responde UNICAMENTE con este JSON exacto (sin texto adicional, sin \`\`\`json):
{
  "resultados": [
    { "fuente": "coches.net", "titulo": "titulo del anuncio", "precio": 18500, "anio": "2020", "km": "45.000 km", "url": "https://..." }
  ],
  "resumen": {
    "precioMinimo": 14000,
    "precioMaximo": 25000,
    "precioMedio": 18000,
    "precioRecomendado": 17500,
    "total": 8
  }
}

Reglas: precios en euros como enteros, entre 5 y 15 resultados, omite url si no la tienes exacta.`;

  try {
    // web_search_20250305 es un "server tool": Anthropic ejecuta la busqueda y
    // devuelve los resultados en la misma respuesta (web_search_tool_result).
    // NO hay que hacer un loop de tool_result manual como con client tools normales.
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      tool_choice: { type: 'auto' },
      messages: [{ role: 'user', content: userPrompt }],
    });

    const fullText = (response.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    if (!fullText.includes('{')) {
      throw new Error('El modelo no devolvio JSON. Respuesta: ' + fullText.slice(0, 300));
    }

    // Extraer JSON aunque venga envuelto en markdown code block
    const jsonMatch = fullText.match(/```(?:json)?\s*([\s\S]*?)```/) || fullText.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      throw new Error('No se encontro JSON en la respuesta: ' + fullText.slice(0, 300));
    }
    const jsonStr = jsonMatch[1] || jsonMatch[0];

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseErr) {
      throw new Error('JSON invalido en respuesta del modelo: ' + parseErr.message);
    }

    const resultados = (data.resultados || []).map(r => ({
      fuente: r.fuente || 'Web',
      titulo: r.titulo || `${marca} ${modelo}`,
      precio: parseInt(r.precio) || 0,
      anio: r.anio ? String(r.anio) : null,
      km: r.km || null,
      url: r.url || null,
    })).filter(r => r.precio > 0);

    const precios = resultados.map(r => r.precio).sort((a, b) => a - b);
    const resumen = data.resumen || {};

    const stats = precios.length > 0 ? {
      minimo: resumen.precioMinimo || precios[0],
      maximo: resumen.precioMaximo || precios[precios.length - 1],
      media: resumen.precioMedio || Math.round(precios.reduce((a, b) => a + b, 0) / precios.length),
      mediana: precios[Math.floor(precios.length / 2)],
      precioRecomendado: resumen.precioRecomendado || Math.round(precios.reduce((a, b) => a + b, 0) / precios.length),
      total: resumen.total || resultados.length,
      q1: precios[Math.floor(precios.length * 0.25)] || precios[0],
      q3: precios[Math.floor(precios.length * 0.75)] || precios[precios.length - 1],
    } : null;

    return { resultados, errores: { coches: null }, stats };

  } catch (err) {
    console.error('[comparador] Error:', err.message);
    return {
      resultados: [],
      errores: { coches: err.message },
      stats: null,
    };
  }
};
