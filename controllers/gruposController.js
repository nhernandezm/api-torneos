const db = require('../config/db');

// Obtener todos los jugadores
exports.getAllGrupos = async(req, res) => {

  try {
    const [rows] = await db.query('SELECT id,nombre FROM grupos;');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }

};


// Obtener uno por ID
exports.obtenerGruposByTorneoId = async(req, res) => {
let query = `select	
                g.id_torneo idTorneo,
                g.id idGrupo,
                e.id idEquipo,
                g.nombre nombreGrupo,
                e.nombre nombreEquipo
            from grupos g
            inner join grupo_equipos ge on ge.id_grupo = g.id
            inner join equipos e on e.id = ge.id_equipo
            inner join torneos t on t.id = g.id_torneo
            WHERE g.id_torneo = ?;`;
  try {
    const { idTorneo } = req.params;
    const [results] = await db.query(query,[idTorneo]);
    if (results.length === 0) return res.status(404).send('No encontrado');
    res.json(results);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};
