const db = require('../config/db');

// Obtener todos los jugadores
exports.getAllJugadores = async(req, res) => {

  try {
    const [rows] = await db.query("SELECT id,cedula,nombre, apellido,CONCAT(nombre, ' ', apellido) AS nombreCompleto, fecha_nacimiento fechaNacimiento, ranking_nacional rankingNacional, genero,foto,fecha_registro fechaRegistro FROM jugadores;");
    res.json(rows);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }

};

// Crear nuevo jugador
exports.createJugador = async(req, res) => {
  const { cedula,nombre, apellido, fechaNacimiento, rankingNacional, genero , foto} = req.body;
  const sql = 'INSERT INTO jugadores (cedula,nombre, apellido, fecha_nacimiento, ranking_nacional, genero,foto) VALUES (?, ?, ?, ?, ?,?,?)';

  try {
    const [result] = await db.query(sql, [cedula,nombre, apellido, fechaNacimiento, rankingNacional, genero,foto]);
    res.status(201).json({ id: result.insertId, message: 'Jugador creado' });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Obtener uno por ID
exports.obtenerJugador = async(req, res) => {

  try {
    const [results] = await db.query('SELECT * FROM jugadores WHERE id = ?;');
    if (results.length === 0) return res.status(404).send('No encontrado');
    res.json(results[0]);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarJugador = (req, res) => {
  const camposValidos = ['nombre', 'apellido', 'fecha_nacimiento', 'nacionalidad', 'genero', 'foto'];
  const datosFiltrados = {};
  
  for (const campo of camposValidos) {
    if (jugador[campo] !== undefined) {
      datosFiltrados[campo] = jugador[campo];
    }
  }

};
