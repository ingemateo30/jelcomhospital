// backend/routes/voiceRoutes.js
const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');
const programarLlamadas = require('../controllers/programarllamadas');


router.post('/programar-llamada', voiceController.programarLlamada);

router.get('/mensaje/:citaId', voiceController.manejarLlamada);
router.post('/mensaje/:citaId', voiceController.manejarLlamada);

router.post('/status-callback/:citaId', voiceController.actualizarEstadoLlamada);

router.post('/llamar-todos', programarLlamadas.programarLlamadasDelDiaSiguiente);

module.exports = router;
