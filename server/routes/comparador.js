const express = require('express');
const buscarPrecios = require('../comparador');

const router = express.Router();

router.post('/', async (req, res, next) => {
  try {
    const result = await buscarPrecios(req.body || {});
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
