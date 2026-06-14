const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();

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

router.post('/', async (req, res, next) => {
  try {
    const { messages, system } = req.body;
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor' });
    }
    const content = await claudeChat(messages, system);
    res.json({ content });
  } catch (err) { next(err); }
});

module.exports = router;
