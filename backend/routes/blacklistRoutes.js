const express = require("express");
const router = express.Router();
const {
  obtenerBlacklist,
  agregarABlacklist,
  verificarBlacklist,
  eliminarDeBlacklist,
  eliminarDeBlacklistPorTelefono,
  actualizarBlacklist
} = require("../controllers/blacklistController");

// Obtener todos los números bloqueados
router.get("/", obtenerBlacklist);

// Agregar un número a la lista negra
router.post("/", agregarABlacklist);

// Verificar si un número está bloqueado
router.get("/verificar/:telefono", verificarBlacklist);

// Eliminar un número de la lista negra por ID
router.delete("/:id", eliminarDeBlacklist);

// Eliminar un número de la lista negra por teléfono
router.delete("/telefono/:telefono", eliminarDeBlacklistPorTelefono);

// Actualizar la razón de bloqueo
router.put("/:id", actualizarBlacklist);

module.exports = router;
