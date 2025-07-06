const Pronostico = require("../models/Pronostico");
const Jornada = require("../models/Jornada"); // Asegúrate de importar el modelo de Jornada

const LIMITE_PRONOSTICOS = 30;

// Validación de goles
function esPronosticoValido(predictions) {
  return predictions.every(({ golesLocal, golesVisitante }) => {
    if (
      typeof golesLocal !== "number" ||
      typeof golesVisitante !== "number" ||
      golesLocal < 0 ||
      golesVisitante < 0 ||
      golesLocal > 15 ||
      golesVisitante > 15 ||
      Math.abs(golesLocal - golesVisitante) > 10
    ) {
      return false;
    }
    return true;
  });
}

// Obtener IP real del usuario
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

exports.crearPronostico = async (req, res) => {
  try {
    const { user, jornada, predictions } = req.body;
    const ip = getClientIp(req);

    // 1. Validación de goles
    if (!esPronosticoValido(predictions)) {
      return res
        .status(400)
        .json({ error: "Pronóstico con goles improbables o inválidos." });
    }

    // 2. Validación de cierre de pronósticos (24h antes del primer partido)
    const jornadaDoc = await Jornada.findOne({ jornada });
    if (!jornadaDoc) {
      return res.status(400).json({ error: "Jornada no encontrada." });
    }

    // Utilidad para obtener la fecha en formato YYYY-MM-DD
    function getFechaString(fecha) {
      if (fecha instanceof Date) {
        return fecha.toISOString().split("T")[0];
      }
      if (typeof fecha === "string") {
        return fecha.split("T")[0];
      }
      return "";
    }

    // Ordena partidos por fecha+hora
    const partidosOrdenados = [...jornadaDoc.partidos].sort((a, b) => {
      const fechaA = new Date(
        `${getFechaString(a.fecha)}T${a.hora || "00:00"}`
      );
      const fechaB = new Date(
        `${getFechaString(b.fecha)}T${b.hora || "00:00"}`
      );
      return fechaA - fechaB;
    });

    const primerPartido = partidosOrdenados[0];
    // Log para depuración
    //console.log(
    //      "primerPartido.fecha:",
    //primerPartido.fecha,
    //"primerPartido.hora:",
    //primerPartido.hora
    //);

    const fechaPrimerPartido = new Date(
      `${getFechaString(primerPartido.fecha)}T${primerPartido.hora || "00:00"}`
    );

    if (isNaN(fechaPrimerPartido)) {
      return res
        .status(400)
        .json({ error: "Fecha del primer partido inválida." });
    }

    const ahora = new Date();
    const diferenciaHoras = (fechaPrimerPartido - ahora) / (1000 * 60 * 60);
    if (diferenciaHoras <= 24) {
      return res.status(400).json({
        error:
          "El registro de pronósticos está cerrado porque la jornada está por iniciar.",
      });
    }

    // 3. Doble validación: correo o IP ya usaron pronóstico en la jornada
    const existe = await Pronostico.findOne({
      jornada,
      $or: [{ user }, { ip }],
    });
    if (existe) {
      return res.status(400).json({
        error:
          "Ya existe un pronóstico para esta jornada desde este correo o IP.",
      });
    }

    // 4. Límite de pronósticos por jornada
    const total = await Pronostico.countDocuments({ jornada });
    if (total >= LIMITE_PRONOSTICOS) {
      return res
        .status(400)
        .json({ error: "Límite de pronósticos alcanzado para esta jornada." });
    }

    // 5. Guardar el pronóstico
    const nuevoPronostico = new Pronostico({ user, jornada, predictions, ip });
    await nuevoPronostico.save();
    res.status(201).json(nuevoPronostico);
  } catch (error) {
    console.error("Error real al guardar el pronóstico:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Ya existe un pronóstico para este usuario en esta jornada.",
      });
    }
    res.status(500).json({ error: "Error al guardar el pronóstico backend." });
  }
};

exports.obtenerResultadosComunidad = async (req, res) => {
  try {
    const { jornada } = req.params;
    // 1. Obtener todos los pronósticos de la jornada
    const pronosticos = await Pronostico.find({ jornada: Number(jornada) });
    // 2. Obtener el documento de la jornada
    const jornadaDoc = await Jornada.findOne({ jornada: Number(jornada) });
    if (!jornadaDoc) {
      return res.status(404).json({ error: "Jornada no encontrada." });
    }
    // 3. Crear un mapa de partidos por _id (como string)
    const partidosMap = {};
    jornadaDoc.partidos.forEach((partido) => {
      // Asegúrate de que cada partido tenga un _id
      partidosMap[partido._id.toString()] = partido;
    });
    // 4. Construir la respuesta enriquecida
    const resultados = pronosticos.map((pronostico) => ({
      user: pronostico.user,
      predictions: pronostico.predictions
        .map((pred) => {
          const partido = partidosMap[pred.matchId];
          if (!partido) return null; // Si no se encuentra el partido, omitir
          return {
            local: partido.local,
            visitante: partido.visitante,
            escudoLocal: partido.escudos.local,
            escudoVisitante: partido.escudos.visitante,
            golesLocal: pred.golesLocal,
            golesVisitante: pred.golesVisitante,
            fecha: partido.fecha,
            hora: partido.hora,
          };
        })
        .filter(Boolean), // Elimina nulos
    }));
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener resultados comunidad." });
  }
};
