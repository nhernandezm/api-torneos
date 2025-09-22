const express = require('express');
const router = express.Router();
const jugadoresController = require('../controllers/jugadoresController');

router.get('/:id', jugadoresController.obtenerJugador);
router.get('/', jugadoresController.getAllJugadores);
router.post('/', jugadoresController.createJugador);
router.put('/:id', jugadoresController.actualizarJugador);

module.exports = router;