const express = require("express");
const router = express.Router();
const pronosticoController = require("../controllers/pronosticoController");

// POST /api/pronosticos
router.post("/", pronosticoController.crearPronostico);

// GET /api/pronosticos/resultados-comunidad/:jornada
router.get(
  "/resultados-comunidad/:jornada",
  pronosticoController.obtenerResultadosComunidad
);

module.exports = router;
