// backend/routes/voiceRoutes.js
const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

router.post('/programar-llamada', voiceController.programarLlamada);
router.get('/handle-call/:citaId', voiceController.manejarLlamada);
router.post('/status-callback/:citaId', voiceController.actualizarEstadoLlamada);

module.exports = router;