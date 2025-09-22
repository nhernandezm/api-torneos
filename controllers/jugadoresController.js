const db = require('../config/db');

// Obtener todos los jugadores
exports.getAllJugadores = async(req, res) => {

  try {
    const [rows] = await db.query("SELECT id,cedula,nombre, apellido,CONCAT(nombre, ' ', apellido) AS nombreCompleto, DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') fechaNacimiento, ranking_nacional rankingNacional, genero,foto,DATE_FORMAT(fecha_registro, '%Y-%m-%d') fechaRegistro FROM jugadores;");
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
    const { id } = req.params;
    const [results] = await db.query("SELECT id,cedula,nombre, apellido,CONCAT(nombre, ' ', apellido) AS nombreCompleto,DATE_FORMAT(fecha_nacimiento, '%Y-%m-%d') fechaNacimiento, ranking_nacional rankingNacional, genero,foto,DATE_FORMAT(fecha_registro, '%Y-%m-%d') fechaRegistro FROM jugadores WHERE id = ?;",[id]);
    if (results.length === 0) return res.status(404).send('No encontrado');
    res.json(results[0]);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarJugador = async(req, res) => {

  const { id } = req.params;

  if (!id) {
    return 'id jugador es requerido';
  }

  try{

    
    const { cedula,nombre, apellido, fechaNacimiento, rankingNacional, genero , foto} = req.body;

    const sql = `
      UPDATE jugadores
      SET 
          cedula = ?,
          nombre = ?, 
          apellido = ?,
          fecha_nacimiento = ?, 
          ranking_nacional = ?, 
          genero = ?,
          foto = ?
      WHERE id = ?;
    `;

    const [result] = await await db.query(
      sql,
      [cedula,nombre, apellido, fechaNacimiento, rankingNacional, genero , foto, id]
    );
    res.status(200).json({ id: result.insertId, message: 'Jugador actualizado' });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};
