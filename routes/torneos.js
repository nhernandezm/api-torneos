const express = require('express');
const router = express.Router();
const torneosController = require('../controllers/torneosController');

router.get('/', torneosController.getAllTorneos);
router.post('/', torneosController.createTorneo);
router.get('/tipo-torneo/:id', torneosController.getTipoTorneoPorId);
router.get('/tipos-torneo', torneosController.getTiposTorneo);
router.put('/marcar-principal/:id', torneosController.actualizarPrincipal);

module.exports = router;
