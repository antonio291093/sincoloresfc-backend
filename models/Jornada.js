const mongoose = require("mongoose");

const PartidoSchema = new mongoose.Schema({
  local: String,
  visitante: String,
  fecha: Date,
  hora: String,
  probabilidades: Object,
  goles_esperados: Object,
  analisis: Object,
  escudos: Object,
  resultado_sugerido: Object,
});

const JornadaSchema = new mongoose.Schema({
  jornada: { type: Number, unique: true },
  partidos: [PartidoSchema],
});

module.exports = mongoose.model("Jornada", JornadaSchema, "ligas");
