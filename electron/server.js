const http = require('http');
const Anthropic = require('@anthropic-ai/sdk');
const buscarPrecios = require('./comparador');

const PORT = 3001;

async function claudeChat(messages, system) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1500,
    system,
    messages,
  });
  return response.content[0]?.text || '';
}

function createServer() {
  const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Private-Network', 'true');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'POST' && req.url === '/api/comparador') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const params = JSON.parse(body);
          const result = await buscarPrecios(params);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/api/isma') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const { messages, system } = JSON.parse(body);
          if (!process.env.ANTHROPIC_API_KEY) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY no configurada en .env' }));
            return;
          }
          const content = await claudeChat(messages, system);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ content }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    res.writeHead(404);
    res.end();
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[server] Puerto ${PORT} ocupado — ya hay una instancia corriendo`);
    } else {
      console.error('[server] Error:', err.message);
    }
  });

  server.listen(PORT, () => {
    console.log(`[server] API local en http://localhost:${PORT}`);
  });

  return server;
}

module.exports = createServer;
