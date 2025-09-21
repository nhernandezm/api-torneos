const express = require('express');
const router = express.Router();
const jugadoresController = require('../controllers/jugadoresController');

router.get('/:id', jugadoresController.obtenerJugador);
router.get('/', jugadoresController.getAllJugadores);
router.post('/', jugadoresController.createJugador);

module.exports = router;