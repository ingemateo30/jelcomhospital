const express = require("express");
const { body } = require("express-validator");
const { loginLimiter } = require("../middlewares/rateLimiter"); // 🔒 Importar middleware
const router = express.Router();
const {
    register,
    login,
    listarUsuarios,
    solicitarRecuperacion,
    resetearPassword,
    actualizarEstado
} = require("../controllers/authController");
const { verificarRol } = require("../middlewares/auth");

const validateRegister = [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),
    body("nombre").trim().escape().notEmpty().withMessage("El nombre es obligatorio")
];

const validateLogin = [
    body("email").isEmail().withMessage("Email inválido"),
    body("password").notEmpty().withMessage("Contraseña obligatoria")
];

router.post("/register", validateRegister, register);
router.post("/login", loginLimiter, validateLogin, login);
router.post("/forgot-password", body("email").isEmail(), solicitarRecuperacion);
router.post("/reset-password", body("password").isLength({ min: 6 }), resetearPassword);

router.get("/usuarios", verificarRol(["admin"]), listarUsuarios);
router.put("/usuarios/:id/estado", verificarRol(["admin"]), actualizarEstado);

module.exports = router;






