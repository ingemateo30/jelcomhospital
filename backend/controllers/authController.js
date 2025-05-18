const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/user');
const transporter = require('../config/emailConfig');
const crypto = require('crypto');
const { body, validationResult } = require("express-validator");
require('dotenv').config();

exports.register = async (req, res) => {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    try {
        const salt = bcrypt.genSaltSync(12);
        const hashedPassword = bcrypt.hashSync(password, salt);

        await db.query(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );

        res.status(201).json({ message: 'Usuario registrado con éxito' });
    } catch (err) {
        console.error('❌ Error en registro:', err);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

exports.login = async (req, res) => {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const user = await User.buscarPorEmail(email);
        if (!user) return res.status(401).json({ message: "Credenciales inválidas" });

        if (user.estado === "inactivo") {
            return res.status(403).json({ message: "Cuenta inactiva. Contacta al administrador." });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ message: "Credenciales inválidas" });

        const token = jwt.sign(
            { id: user.id, rol: user.rol },
            process.env.JWT_SECRET,
            { expiresIn: "1h", algorithm: "HS256" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            message: "Login exitoso",
            token,
            rol: user.rol,
            estado: user.estado,
        });

    } catch (error) {
        console.error("❌ Error en login:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
};


exports.solicitarRecuperacion = async (req, res) => {
    const { email } = req.body;
    
    try {
        const [rows] = await db.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(200).json({ message: 'Si el correo está registrado, recibirás un enlace.' });
        }

        const usuario = rows[0];

        const resetToken = crypto.createHmac('sha256', process.env.JWT_SECRET)
                                .update(crypto.randomBytes(32))
                                .digest('hex');
        const tokenExpiration = new Date(Date.now() + 3600000); 

        await db.query(
            'UPDATE usuarios SET reset_token = ?, reset_token_expiration = ? WHERE id = ?', 
            [resetToken, tokenExpiration, usuario.id]
        );

        const resetLink = `http://localhost:3001/reset-password?token=${resetToken}`;
        await transporter.sendMail({
            from: 'no-reply@jelcom.com',
            to: email,
            subject: 'Recuperación de Contraseña',
            html: `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                   <a href="${resetLink}">${resetLink}</a>`
        });

        res.json({ message: 'Si el correo está registrado, recibirás un enlace.' });

    } catch (error) {
        console.error("❌ Error en recuperación:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};


exports.resetearPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const [rows] = await db.query(
            "SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expiration > NOW()",
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: "⚠️ Token inválido o expirado. Solicita uno nuevo." });
        }

        const usuario = rows[0];
        const hashedPassword = bcrypt.hashSync(newPassword, bcrypt.genSaltSync(12));

        await db.query(
            "UPDATE usuarios SET password = ?, reset_token = NULL, reset_token_expiration = NULL WHERE id = ?",
            [hashedPassword, usuario.id]
        );

        res.json({ message: "✅ Contraseña restablecida correctamente. Ahora puedes iniciar sesión." });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "❌ Error en el servidor. Inténtalo más tarde." });
    }
};

exports.listarUsuarios = async (req, res) => {
    try {
        const usuarios = await User.listarUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};


exports.actualizarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!['activo', 'inactivo'].includes(estado)) {
            return res.status(400).json({ message: 'Estado inválido' });
        }

        await User.actualizarEstado(id, estado);
        res.json({ message: `Usuario ${estado} correctamente` });

    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el estado', error });
    }
};




