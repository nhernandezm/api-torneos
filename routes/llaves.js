const express = require('express');
const router = express.Router();
const llavesController = require('../controllers/llavesController');

router.get('/', llavesController.getEncuentrosEquipos);
router.post('/', llavesController.createLlaves);
router.post('/actualizar-marcador', llavesController.actualizarMarcador);
router.get('/torneo/:idTorneo', llavesController.getEncuentrosEquiposPorTorneo);

module.exports = router;
