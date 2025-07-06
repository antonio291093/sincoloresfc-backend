const Jornada = require("../models/Jornada");

const getJornada = async (req, res) => {
  try {
    const jornada = await Jornada.findOne({ jornada: req.params.numero });
    if (!jornada)
      return res.status(404).json({ error: "Jornada no encontrada" });
    res.json(jornada);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener la jornada" });
  }
};

const getAllJornadas = async (_req, res) => {
  try {
    const jornadas = await Jornada.find().sort({ jornada: 1 });
    res.json(jornadas);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener jornadas" });
  }
};

const getProximaJornada = async (req, res) => {
  try {
    // Puedes obtener la fecha por query param o usar la actual
    const fechaParam = req.query.fecha;
    const fechaReferencia = fechaParam ? new Date(fechaParam) : new Date();
    //const fechaReferencia = new Date("2025-07-15T00:00:00Z");

    // Busca todas las jornadas con al menos un partido futuro
    const jornadas = await Jornada.find({
      partidos: { $elemMatch: { fecha: { $gte: fechaReferencia } } },
    });

    let jornadaMasProxima = null;
    let fechaMasProxima = null;

    // Recorre todas las jornadas y partidos para encontrar el partido más próximo
    for (const jornada of jornadas) {
      for (const partido of jornada.partidos) {
        const fechaPartido = new Date(partido.fecha);
        if (fechaPartido >= fechaReferencia) {
          if (!fechaMasProxima || fechaPartido < fechaMasProxima) {
            fechaMasProxima = fechaPartido;
            jornadaMasProxima = jornada;
          }
        }
      }
    }

    if (!jornadaMasProxima) {
      return res.status(404).json({ error: "No hay jornadas próximas" });
    }

    res.json(jornadaMasProxima);
  } catch (err) {
    console.error("Error al obtener la jornada más próxima:", err);
    res.status(500).json({ error: "Error al obtener la jornada más próxima" });
  }
};

module.exports = { getJornada, getAllJornadas, getProximaJornada };
