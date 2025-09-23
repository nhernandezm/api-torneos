const db = require('../config/db');

// Obtener todos los jugadores
exports.getAllTorneos = async (req, res) => {

  try {
    const [rows] = await db.query('SELECT t.id, t.nombre, t.descripcion, (activo = 1) as activo,(principal = 1) as principal, t.fecha_inicio as fechaInicio,t.fecha_registro fechaRegistro,id_tipo_torneo idTipoTorneo, tt.nombre nombreTipoTorneo FROM torneos t inner join tipo_torneo tt on tt.id = t.id_tipo_torneo');
    res.json(rows);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Crear nuevo torneo
exports.createTorneo = async(req, res) => {
  const { nombre, descripcion, idTipoTorneo, fechaInicio} = req.body;
  const sql = 'INSERT INTO torneos (nombre, descripcion, activo,id_tipo_torneo, fecha_inicio) VALUES (?, ?, ?, ?, ?)';
  try {
    let [result] = await db.query(sql,[nombre, descripcion, true, idTipoTorneo,fechaInicio]);
    res.status(201).json({ id: result.insertId, message: 'Torneo creado' });
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }

};

// Tipo torneo
exports.getTipoTorneoPorId = async(req, res) => {
  const { id } = req.params; // <- obtiene el id de la URL

  const query = `
    SELECT 
      tt.id, 
      tt.nombre, 
      tt.descripcion, 
      cantidad_grupos AS cantidadGrupos, 
      max_cantidad_equipos AS maxCantidadEquipos, 
      num_equipos_por_grupo AS numEquiposPorGrupo, 
      num_participante_por_equipo AS numParticipantePorEquipo, 
      num_clasificados_por_grupo AS numClasificadosPorGrupo,
      tipo_clasificacion_primera_face AS tipoClasificacionPrimeraFace
    FROM tipo_torneo tt
    INNER JOIN torneos t ON t.id_tipo_torneo = tt.id
    WHERE t.id = ?;
  `;

  try {
    const [rows] = await db.query(query,[id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Tipo de torneo no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getTiposTorneo = async(req, res) => {
  const query = `
    SELECT 
      tt.id, 
      tt.nombre, 
      tt.descripcion, 
      cantidad_grupos AS cantidadGrupos, 
      max_cantidad_equipos AS maxCantidadEquipos, 
      num_equipos_por_grupo AS numEquiposPorGrupo, 
      num_participante_por_equipo AS numParticipantePorEquipo, 
      num_clasificados_por_grupo AS numClasificadosPorGrupo,
      tipo_clasificacion_primera_face AS tipoClasificacionPrimeraFace
    FROM tipo_torneo tt
  `;

  try {
    const [rows] = await db.query(query);

    res.json(rows);
  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.actualizarPrincipal = async(req, res) => {

  const { id } = req.params;

  if (!id) {
    return 'id torneo es requerido';
  }

  try{

      const [result1] = await await db.query(
      `
      UPDATE torneos
      SET principal = 0
      `
      );
    
    const sql = `
      UPDATE torneos
      SET 
          principal = 1
      WHERE id = ?;
    `;

    const [result] = await await db.query(
      sql,
      [id]
    );

    res.status(200).json({ id: result.insertId, message: 'Torneo actualizado' });

  } catch (err) {
    console.error('❌ Error:', err);
    res.status(500).json({ error: err.message });
  }
};