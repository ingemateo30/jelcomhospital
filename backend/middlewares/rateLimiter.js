const rateLimit = require("express-rate-limit");


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // ⏳ 15 minutos
    max: 5,
    message: {
        message: "Demasiados intentos de inicio de sesión. Intenta nuevamente en 15 minutos.",
    },
    standardHeaders: true, 
    legacyHeaders: false,
});

module.exports = { loginLimiter };
