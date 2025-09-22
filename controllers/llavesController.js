const db = require('../config/db');

exports.getEncuentrosEquipos = async(req, res) => {
  try {
    const query = `select
	ee.id idEncuentros,
	t.id idTorneo,
	t.nombre nombreTorneo,
	el.nombre nombreEquipoLocal,
	ev.nombre nombreEquipoVisitante,
	ee.puntos_local puntosLocal,
	ee.puntos_visitantes  puntosVisitante,
	eg.nombre nombreEquipoGanador,
	ee.nivel_ronda nivelRonda,
	ee.orden_llave ordenLlave,
	g.nombre nombreGrupo,
  g.id idGrupo,
  ee.id_equipo_local idEquipoLocal,
  ee.id_equipo_visitante idEquipoVisitante,
  ee.id_equipo_ganador idEquipoGanador
  FROM encuentros_equipos ee
  INNER JOIN equipos el ON ee.id_equipo_local  = el.id
  INNER JOIN equipos ev ON ee.id_equipo_visitante = ev.id
  INNER JOIN equipo_jugadores ejl ON el.id = ejl.id_equipo
  INNER JOIN equipo_jugadores ejv ON ev.id = ejv.id_equipo
  INNER JOIN jugadores jl ON jl.id = ejl.id_jugador 
  INNER JOIN jugadores jv ON jv.id = ejv.id_jugador
  INNER JOIN torneos t ON t.id = ee.id_torneo
  INNER join grupos g on g.id = el.id_grupo 
  LEFT JOIN equipos eg ON ee.id_equipo_ganador = eg.id`;

  const [rows] = await db.query(query);
  res.json(rows);

  } catch (err) {
    console.error('❌ Error al obtener encuentros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.getEncuentrosEquiposPorTorneo = async(req, res) => {
  try {
    const { idTorneo } = req.params; // <- obtiene el id de la URL
    const query = `select
	ee.id idEncuentros,
	t.id idTorneo,
	t.nombre nombreTorneo,
	el.nombre nombreEquipoLocal,
	ev.nombre nombreEquipoVisitante,
	ee.puntos_local puntosLocal,
	ee.puntos_visitantes  puntosVisitante,
	eg.nombre nombreEquipoGanador,
	ee.nivel_ronda nivelRonda,
	ee.orden_llave ordenLlave,
	g.nombre nombreGrupo,
  g.id idGrupo,
  ee.id_equipo_local idEquipoLocal,
  ee.id_equipo_visitante idEquipoVisitante,
  ee.id_equipo_ganador idEquipoGanador,
  ee.tipoRonda
  FROM encuentros_equipos ee
  INNER JOIN equipos el ON ee.id_equipo_local  = el.id
  INNER JOIN equipos ev ON ee.id_equipo_visitante = ev.id
  INNER JOIN equipo_jugadores ejl ON el.id = ejl.id_equipo
  INNER JOIN equipo_jugadores ejv ON ev.id = ejv.id_equipo
  INNER JOIN jugadores jl ON jl.id = ejl.id_jugador 
  INNER JOIN jugadores jv ON jv.id = ejv.id_jugador
  INNER JOIN torneos t ON t.id = ee.id_torneo
  INNER join grupos g on g.id = ee.id_grupo
  LEFT JOIN equipos eg ON ee.id_equipo_ganador = eg.id
  WHERE t.id = ?`;

  const [rows] = await db.query(query,[idTorneo]);
  res.json(rows);

  } catch (err) {
    console.error('❌ Error al obtener encuentros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


/** Inserta un equipo en un torneo */
async function crearEquipo(conn, idTorneo, nombre,idGrupo) {
  const [result] = await conn.query(
    'INSERT INTO equipos (id_torneo, nombre,id_grupo) VALUES (?, ?,?)',
    [idTorneo, nombre, idGrupo]
  );
  return result.insertId;
}

/** Inserta un equipo en un grupo */
async function crearGrupo(conn, idTorneo, nombre) {
  const [result] = await conn.query(
    'INSERT INTO grupos (id_torneo, nombre) VALUES (?, ?)',
    [idTorneo, nombre]
  );
  return result.insertId;
}

/** Inserta el encuentro entre dos equipos */
async function crearEncuentroEquipos(conn, idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,tipoRonda,idProximoEncuentro) {
  console.log("idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,tipoRonda,idProximoEncuentro");
  console.log(idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,tipoRonda,idProximoEncuentro);
  const [result] = await conn.query(
    'INSERT INTO encuentros_equipos (id_equipo_local, id_equipo_visitante, id_torneo, nivel_ronda, orden_llave,id_grupo,tipoRonda,id_proximo_encuentro) VALUES (?, ?, ?, ?, ?,?,?,?)',
    [idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,tipoRonda,idProximoEncuentro]
  );
  return result.insertId;
}

/** Inserta jugadores en un equipo */
async function asignarJugadores(conn, idEquipo, jugadores) {
  for (const jugador of jugadores) {
    await conn.query(
      'INSERT INTO equipo_jugadores (id_equipo, id_jugador) VALUES (?, ?)',
      [idEquipo, jugador.id]
    );
  }
}

async function asignarEquipoAGrupo(conn, idEquipo, idGrupo) {
  const [result] = await conn.query(
    'INSERT INTO grupo_equipos (id_equipo, id_grupo) VALUES (?, ?)',
    [idEquipo, idGrupo]
  );
  return result.insertId;
}

async function actualizarGrupoEnfrenta(conn,idGrupo,idGrupoEnfrenta){

  if (!idGrupo) {
    return 'idGrupo es requerido';
  }

  const sql = `
    UPDATE grupos
    SET id_grupo_enfrenta = ?
    WHERE id = ?
  `;

  const [result] = await conn.query(
    sql,
    [idGrupoEnfrenta,idGrupo]
  );

  return result;
};

// Crear nuevo torneo
exports.createLlaves = async (req, res) => {
  const llavesBody = req.body;

  try{
  const conn = await db.getConnection();

  var llaves = llavesBody.map (
    el => {
        return {
            "equipo1": el.equipo1,
            "equipo2": el.equipo2,
            "ordenLlave":el.ordenLlave,
            "nivelRonda":el.nivelRonda,
            "numeroGrupo":el.numeroGrupo
        }
    }
  );

  let idTorneo = 0;
  await conn.beginTransaction();

  let idGrupo = 0;
  let idProximoEncuentro1 = null;
  let idProximoEncuentro2 = null;
  let idGrupo1 = null;
  let idGrupo2 = null;
  for(var i = 0; i < llaves.length; i++){
    idTorneo = llaves[i].equipo1.torneo.id;
    const jugadortesEquipo1 = llaves[i].equipo1.jugadores;
    const jugadortesEquipo2 = llaves[i].equipo2.jugadores;
    const nombreEquipo1 = llaves[i].equipo1.nombre;
    const nombreEquipo2 = llaves[i].equipo2.nombre;
    const ordenLlave = llaves[i].ordenLlave;
    const nivelRonda = llaves[i].nivelRonda;   
    const numeroGrupo = "Grupo " + llaves[i].numeroGrupo;   

    let grupo = await getGrupoByName(conn, idTorneo,numeroGrupo);
    //grupo
    if(grupo == null){
      idGrupo = await crearGrupo(conn,idTorneo,numeroGrupo);
      if(idGrupo1 == null){
        idGrupo1 = idGrupo;
      }else{
        if(idGrupo2 == null){
          idGrupo2 = idGrupo;
          
          await actualizarGrupoEnfrenta(conn,idGrupo1,idGrupo2);
          await actualizarGrupoEnfrenta(conn,idGrupo2,idGrupo1);
          idGrupo1 = null;
          idGrupo2 = null;
        }
      }
    }else{
      idGrupo = grupo.id;
    } 

    // Equipo 1
    const idEquipo1 = await crearEquipo(conn, idTorneo, nombreEquipo1,idGrupo);
    await asignarJugadores(conn, idEquipo1, jugadortesEquipo1);

    // Equipo 2
    const idEquipo2 = await crearEquipo(conn, idTorneo, nombreEquipo2,idGrupo);
    await asignarJugadores(conn, idEquipo2, jugadortesEquipo2);

    // Encuentro
    if(idProximoEncuentro1 == null){
      idProximoEncuentro1 = await crearEncuentroEquipos(conn, idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,'Normal',null);
    }else{      
        idProximoEncuentro2 = await crearEncuentroEquipos(conn, idEquipo1, idEquipo2, idTorneo, nivelRonda, ordenLlave,idGrupo,'Normal',idProximoEncuentro1);      
        await actualizarProximoEncuentro(conn,idProximoEncuentro1,idProximoEncuentro2);

        idProximoEncuentro1 = null;
        idProximoEncuentro2 = null;
    }    

    await asignarEquipoAGrupo(conn,idEquipo1,idGrupo);
    await asignarEquipoAGrupo(conn,idEquipo2,idGrupo);

    await conn.commit();
  }

  res.json({
    message: 'Encuentro creado correctamente'
  });

  } catch (err) {
    console.error('❌ Error al obtener encuentros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


async function getLlaveById(conn, idLlave) {
  const [result] = await conn.query(
    'SELECT * FROM encuentros_equipos WHERE id = ?',
    [idLlave]
  );
  return result[0];
}

async function getTipoTorneoByIdTorneo(conn, idTorneo) {
  const query = `
  SELECT 
    tt.id, 
    tt.nombre, 
    tipo_clasificacion_primera_face tipoClasificacion,
    num_equipos_por_grupo cantidadEquipoPorGrupo,
    num_clasificados_por_grupo cantidadClasificadosPorGrupo
  FROM tipo_torneo tt
  INNER JOIN torneos t ON t.id_tipo_torneo = tt.id
  WHERE t.id = ?;
`;
  const [result] = await conn.query(
    query,
    [idTorneo]
  );
  return result[0];
}

async function getGrupoByName(conn, idTorneo, nombreGrupo) {
  const [result] = await conn.query(
    'SELECT * FROM grupos WHERE id_torneo = ? AND nombre = ?',
    [idTorneo, nombreGrupo]
  );

  return result.length > 0 ? result[0] : null;
}

async function getGrupoById(conn, idTorneo, idGrupo) {
  const [result] = await conn.query(
    'SELECT * FROM grupos WHERE id_torneo = ? AND id = ?',
    [idTorneo, idGrupo]
  );

  return result.length > 0 ? result[0] : null;
}

async function getMaxOrderGrupo(conn, idTorneo,idGrupo,nivelRonda) {
  const [result] = await conn.query(
    'SELECT MAX(orden_llave) orden_llave FROM encuentros_equipos WHERE id_torneo = ? AND id_grupo = ? AND nivel_ronda = ?;',
    [idTorneo,idGrupo,nivelRonda]
  );

  if(result.length == 0){
    return {};
  }

  return result[0].orden_llave;
}

async function getEncuentroRonda(conn, idTorneo,idGrupo,nivelRonda) {
  const [result] = await conn.query(
    'SELECT COUNT(id) cantidadEncuentros FROM encuentros_equipos WHERE id_torneo = ? AND id_grupo = ? AND nivel_ronda = ?;',
    [idTorneo,idGrupo,nivelRonda]
  );

  if(result.length == 0){
    return 0;
  }

  return result[0].cantidadEncuentros;
}

// encuentros.controller.js
async function actualizarMarcador(conn,idEncuentro,puntos_local,puntos_visitantes,idEquipoGanador){

  if (!idEncuentro) {
    return 'idEncuentro es requerido';
  }

  const sql = `
    UPDATE encuentros_equipos
    SET puntos_local = ?, puntos_visitantes = ?, id_equipo_ganador = ?
    WHERE id = ?
  `;

  const [result] = await conn.query(
    sql,
    [puntos_local,puntos_visitantes,idEquipoGanador,idEncuentro]
  );

  return result;
};

async function actualizarClasificacionGrupo(conn,idGrupo,idEquipo,puntosFavor,puntosContra){

  if (!idGrupo) {
    return 'idGrupo es requerido';
  }

  const sql = `
    UPDATE grupo_equipos
    SET puntos_favor = ?, puntos_contra = ?, clasificado = 1
    WHERE id_grupo = ? AND id_equipo = ?
  `;

  const [result] = await conn.query(
    sql,
    [puntosFavor,puntosContra,idGrupo,idEquipo]
  );

  return result;
};

async function actualizarFinalizadoGrupo(conn,idGrupo){

  if (!idGrupo) {
    return 'idGrupo es requerido';
  }

  const sql = `
    UPDATE grupos
    SET finalizado = 1
    WHERE id = ?
  `;

  const [result] = await conn.query(
    sql,
    [idGrupo]
  );

  return result;
};

async function actualizarProximoEncuentro(conn,idEncuentro,idProximoEncuentro){

  if (!idEncuentro) {
    return 'idEncuentro es requerido';
  }

  const sql = `
    UPDATE encuentros_equipos
    SET id_proximo_encuentro = ?
    WHERE id = ?
  `;

  const [result] = await conn.query(
    sql,
    [idProximoEncuentro,idEncuentro]
  );

  return result;
};

async function actualizarEncutroAFinalista(conn,idTorneo,idGrupo,nivelRonda){

  if (!idTorneo) {
    return 'idTorneo es requerido';
  }

  const sql = `
    UPDATE encuentros_equipos
    SET tipoRonda = 'Final'
    WHERE id_torneo = ? AND id_grupo = ? AND nivel_ronda = ?
  `;

  const [result] = await conn.query(
    sql,
    [idTorneo,idGrupo,nivelRonda]
  );

  return result;
};

async function getEncuentrosTorneosByGrupo(conn, idTorneo,idGrupo) {
  const [result] = await conn.query(
    'SELECT * FROM encuentros_equipos WHERE id_torneo = ? AND id_grupo = ?;',
    [idTorneo,idGrupo]
  );
  return result;
}

async function obtenerUltimoNivelFinalizado(conn, idTorneo,idGrupo,cantidadEquipoGrupo) {
  let encuentrosTorneo = await getEncuentrosTorneosByGrupo(conn,idTorneo,idGrupo);
  let maxNivel = 10;
  let cantidadEncuentrosPorNivel = {
    "1": (cantidadEquipoGrupo / 2),//64
    "2": (cantidadEquipoGrupo / 2),//64
    "3": ((cantidadEquipoGrupo / 2) / 2),//32
    "4": (((cantidadEquipoGrupo / 2) / 2) / 2),//16
    "5": ((((cantidadEquipoGrupo / 2) / 2) / 2) / 2),//8
    "6": (((((cantidadEquipoGrupo / 2) / 2) / 2) / 2) / 2),//4
    "7": ((((((cantidadEquipoGrupo / 2) / 2) / 2) / 2) / 2) / 2),//2
    "8": (((((((cantidadEquipoGrupo / 2) / 2) / 2) / 2) / 2) / 2) / 2)//1
  };
  let ultimoNivelFinalizado = 0;
  for (let indexNivel = 1; indexNivel < maxNivel; indexNivel++) {
    let encuentrosNivel = encuentrosTorneo.filter(e => e.nivel_ronda == indexNivel);
    if(encuentrosNivel.length > 0){
      let encuentrosNivelCompeltados = encuentrosNivel.filter(en => en.id_equipo_ganador != null);
      if(encuentrosNivelCompeltados.length > 0){
        let cantidadEncuentrosNivel = cantidadEncuentrosPorNivel[indexNivel];
        if(encuentrosNivelCompeltados.length == cantidadEncuentrosNivel){
          ultimoNivelFinalizado = indexNivel;
        }
      }
    }else{
      maxNivel = 11;
    }
    
  }

 return ultimoNivelFinalizado;
}

async function getTotalPuntosEquipo(conn, idTorneo,idEquipo) {
  const query = `select SUM(pt.totalFavorPuntos) totalFavorPuntos, SUM(pt.totalContraPuntos) totalContraPuntos from (
SELECT SUM(puntos_local) totalFavorPuntos,SUM(puntos_visitantes) totalContraPuntos FROM encuentros_equipos 
WHERE id_torneo = ? AND (id_equipo_local = ?)
union
SELECT SUM(puntos_visitantes) totalFavorPuntos,SUM(puntos_local) totalContraPuntos FROM encuentros_equipos 
WHERE id_torneo = ? AND (id_equipo_visitante = ?)
) as pt`;
  const [result] = await conn.query(query,[idTorneo,idEquipo,idTorneo,idEquipo]
  );

  if(result.length == 0){
    return {
      totalFavorPuntos:0,
      totalContraPuntos:0
    };
  }

  return {
    totalFavorPuntos:result[0].totalFavorPuntos,
    totalContraPuntos:result[0].totalContraPuntos
  };
}

async function getEquiposClasificadosByGrupo(conn,idGrupo) {
  const [result] = await conn.query(
    'SELECT * FROM grupo_equipos WHERE clasificado = 1 AND id_grupo = ? order by puntos_favor;',
    [idGrupo]
  );
  return result;
}

async function armarLlavesDeGruposFinalizados(conn, idTorneo,idGrupoFinalizado,nivelRonda) {
  let grupoFinalizado = await getGrupoById(conn,idTorneo,idGrupoFinalizado);
  console.log("---->1");

  if(grupoFinalizado){
    console.log("---->2");
    if(grupoFinalizado.id_grupo_enfrenta != null && grupoFinalizado.finalizado){
      console.log("---->3");
      let grupoEnfrenta = await getGrupoById(conn,idTorneo,grupoFinalizado.id_grupo_enfrenta);
      if(grupoEnfrenta == null){
        console.log("---->3.1.1.");
        return;
      }
      if(grupoEnfrenta.finalizado){
        console.log("---->4");
        let equiposClasificadosFinalizado = await getEquiposClasificadosByGrupo(conn,idGrupoFinalizado);
        let equiposClasificadosEnfrenta = await getEquiposClasificadosByGrupo(conn,grupoFinalizado.id_grupo_enfrenta);

        if(equiposClasificadosFinalizado.length == equiposClasificadosEnfrenta.length){
          console.log("---->5");
            let idGrupoGrupos = await crearGrupo(conn,idTorneo,grupoFinalizado.nombre +" vs " + grupoEnfrenta.nombre);
            let ordenLlave = 1;
            nivelRonda = nivelRonda + 1;

            let idProximoEncuentro1 = null;
            let idProximoEncuentro2 = null;

            for (let index = 0; index < equiposClasificadosFinalizado.length; index++) {
              const equipoF = equiposClasificadosFinalizado[index];
              const equipoE = equiposClasificadosEnfrenta[index];

              await asignarEquipoAGrupo(conn,equipoF.id_equipo,idGrupoGrupos);
              await asignarEquipoAGrupo(conn,equipoE.id_equipo,idGrupoGrupos); 

              if(idProximoEncuentro1 == null){
                console.log("---->6");
                idProximoEncuentro1 = await crearEncuentroEquipos(conn, equipoF.id_equipo, equipoE.id_equipo, idTorneo, nivelRonda, ordenLlave,idGrupoGrupos,'Normal',null);
              }else{
                console.log("---->7");
                idProximoEncuentro2 = await crearEncuentroEquipos(conn, equipoF.id_equipo, equipoE.id_equipo, idTorneo, nivelRonda, ordenLlave,idGrupoGrupos,'Normal',idProximoEncuentro1);
                await actualizarProximoEncuentro(conn,idProximoEncuentro1,idProximoEncuentro2);
              }
              ordenLlave++;
            }            
        }
      }
    }    
  }
}

exports.actualizarMarcador = async (req, res) => {
  const { idEncuentro,puntosLocal,puntosVisitante} = req.body;
  let idEquipoGanador = 0;
  let idEquipoPerdedor = 0;
  let ultimoNivelFinalizado = -1;
  try{
  const conn = await db.getConnection();

  await conn.beginTransaction();

  let llave = await getLlaveById(conn,idEncuentro);

  if(!llave.id){
    res.json({
      message: 'No existe una llave con ese id',
      data:llave,
      resultUodate:resultUodate
    });
  }

  if(puntosLocal == puntosVisitante){
    res.json({
      message: 'Debe haber un ganador',
      data:llave,
      resultUodate:resultUodate
    });
  }

  let tipoTorneo = await getTipoTorneoByIdTorneo(conn,llave.id_torneo);

  if(puntosLocal > puntosVisitante){
    idEquipoGanador = llave.id_equipo_local;
    idEquipoPerdedor = llave.id_equipo_visitante;
  }else{
    idEquipoGanador = llave.id_equipo_visitante;
    idEquipoPerdedor = llave.id_equipo_local;
  }

  let resultUodate = await actualizarMarcador(conn,llave.id,puntosLocal,puntosVisitante,idEquipoGanador);

  let llavePar = await getLlaveById(conn, llave.id_proximo_encuentro);
  if(llavePar == null){
    //verificar si el torneo acabo

  }else{

     if(llavePar.id_equipo_ganador){
      let nivelRonda = llave.nivel_ronda + 1;
      let ordenLlave = await getMaxOrderGrupo(conn, llave.id_torneo,llave.id_grupo,nivelRonda);
      if(ordenLlave){
        ordenLlave = ordenLlave + 1;
      }else{
        ordenLlave = 1;
      }

      let idProximoEncuentro = await crearEncuentroEquipos(conn, llavePar.id_equipo_ganador,idEquipoGanador, llave.id_torneo, nivelRonda, ordenLlave,llave.id_grupo,'Ganadores');
      
      if(tipoTorneo.tipoClasificacion == "DobleEliminacion" && llave.nivel_ronda == 1){
        let idPerdedorllaveAnterior = llavePar.id_equipo_local;
        if(llavePar.id_equipo_ganador == llavePar.id_equipo_local){
          idPerdedorllaveAnterior = llavePar.id_equipo_visitante;
        }

        let idProximoEncuentroPerdedro = await crearEncuentroEquipos(conn, idPerdedorllaveAnterior,idEquipoPerdedor, llave.id_torneo, nivelRonda, ordenLlave,llave.id_grupo,'Perdedores',idProximoEncuentro);
        await actualizarProximoEncuentro(conn,idProximoEncuentro,idProximoEncuentroPerdedro);
      }

      if(tipoTorneo.tipoClasificacion == "Llave" || (tipoTorneo.tipoClasificacion == "DobleEliminacion" && llave.nivel_ronda > 1)){
        ultimoNivelFinalizado = await obtenerUltimoNivelFinalizado(conn, llave.id_torneo,llave.id_grupo,tipoTorneo.cantidadEquipoPorGrupo);
        if(ultimoNivelFinalizado == llave.nivel_ronda){
          let llaveFinalista = await getLlaveById(conn, idProximoEncuentro);
          let cantidadEncuentrosSiguienteRonda = await getEncuentroRonda(conn, llaveFinalista.id_torneo,llaveFinalista.id_grupo,(ultimoNivelFinalizado + 1)) 
          if((cantidadEncuentrosSiguienteRonda * 2) >= tipoTorneo.cantidadClasificadosPorGrupo){
            await actualizarEncutroAFinalista(conn,llaveFinalista.id_torneo,llaveFinalista.id_grupo,(ultimoNivelFinalizado + 1));

            let puntosLocalFinal = await getTotalPuntosEquipo(conn,llaveFinalista.id_torneo,llaveFinalista.id_equipo_local);
            let puntosVisitanteFinal = await getTotalPuntosEquipo(conn,llaveFinalista.id_torneo,llaveFinalista.id_equipo_visitante);
            let resultUodate = await actualizarMarcador(
              conn,llaveFinalista.id,
              puntosLocalFinal.totalFavorPuntos - puntosLocalFinal.totalContraPuntos,
              puntosVisitanteFinal.totalFavorPuntos - puntosVisitanteFinal.totalContraPuntos,
              null
            );
            await actualizarClasificacionGrupo(conn,llaveFinalista.id_grupo,llaveFinalista.id_equipo_local,puntosLocalFinal.totalFavorPuntos,puntosLocalFinal.totalContraPuntos);
            await actualizarClasificacionGrupo(conn,llaveFinalista.id_grupo,llaveFinalista.id_equipo_visitante,puntosVisitanteFinal.totalFavorPuntos,puntosVisitanteFinal.totalContraPuntos);

            await actualizarFinalizadoGrupo(conn,llaveFinalista.id_grupo);
            await armarLlavesDeGruposFinalizados(conn,llave.id_torneo,llaveFinalista.id_grupo,nivelRonda);
          }
        }
      }
    }
  }

  await conn.commit();

  res.json({
    message: 'Encuentro creado correctamente',
    data:llave,
    resultUodate:resultUodate,
    llavePar:llavePar,
    ultimoNivelFinalizado:ultimoNivelFinalizado
  });

  } catch (err) {
    await conn.rollback()
    console.error('❌ Error al obtener encuentros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
