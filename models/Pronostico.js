const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema({
  matchId: { type: String, required: true },
  golesLocal: { type: Number, required: true },
  golesVisitante: { type: Number, required: true },
});

const PronosticoSchema = new mongoose.Schema({
  user: { type: String, required: true }, // correo electrónico
  jornada: { type: Number, required: true },
  predictions: [PredictionSchema],
  ip: { type: String }, // <--- NUEVO CAMPO
  createdAt: { type: Date, default: Date.now },
});

PronosticoSchema.index({ user: 1, jornada: 1 }, { unique: true });

module.exports = mongoose.model("Pronostico", PronosticoSchema);
