const express = require('express');
const router = express.Router();
const gruposController = require('../controllers/gruposController');

router.get('/torneo/:idTorneo', gruposController.obtenerGruposByTorneoId);
router.get('/', gruposController.getAllGrupos);

module.exports = router;