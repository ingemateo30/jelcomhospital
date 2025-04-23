const axios = require("axios");

const verifyCaptcha = async (req, res, next) => {
    const { captchaToken } = req.body;

    if (!captchaToken) {
        return res.status(400).json({ error: "Captcha es obligatorio" });
    }

    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: secretKey,
                response: captchaToken
            }
        });

        if (!response.data.success) {
            return res.status(400).json({ error: "Captcha inválido" });
        }

        next();
    } catch (error) {
        console.error("Error verificando el captcha:", error);
        return res.status(500).json({ error: "Error al verificar el captcha" });
    }
};

module.exports = verifyCaptcha;
