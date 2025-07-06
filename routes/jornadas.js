const express = require("express");
const router = express.Router();
const {
  getJornada,
  getAllJornadas,
  getProximaJornada,
} = require("../controllers/jornadaController");

router.get("/", getAllJornadas); // /api/jornadas
router.get("/proxima", getProximaJornada); // /api/jornadas/proxima
router.get("/:numero", getJornada); // /api/jornadas/5

module.exports = router;
