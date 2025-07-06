const express = require("express");

const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const jornadasRoutes = require("./routes/jornadas");
const pronosticosRoutes = require("./routes/pronosticos"); // Agrega esta línea

const app = express();
app.set("trust proxy", true); // ¡IMPORTANTE si usas proxy!

// Configuración del rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Límite de 100 peticiones por IP
  message: "Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplica rate limiting a todas las rutas de la API
app.use("/api/", apiLimiter);

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// Registro de rutas
app.use("/api/jornadas", jornadasRoutes);
app.use("/api/pronosticos", pronosticosRoutes); // Agrega esta línea

module.exports = app;
