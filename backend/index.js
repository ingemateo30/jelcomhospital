require("dotenv").config();
require("./config/cronJobs");

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const db = require("./config/db");

// Importar rutas
const authRoutes = require("./routes/auth");
const citasRoutes = require("./routes/citas");
const correoroutes = require("./routes/correo");
const smsRoutes = require("./routes/smsRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3002" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(require("body-parser").text());
app.use(require("body-parser").raw());
app.use(require("body-parser").json());
app.use(require("body-parser").urlencoded({ extended: true }));


db.getConnection((err, connection) => {
    if (err) {
        console.error("Error al conectar con la base de datos:", err);
    } else {
        console.log("Conectado a la base de datos MySQL");
        connection.release();
    }
});


app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/correo", correoroutes);
app.use("/api/sms", smsRoutes);
const dashboardRoutes = require('./routes/dashboard');
app.use('/api/dashboard', dashboardRoutes);
const whatsappRoutes = require("./routes/whatsappRoutes");
app.use("/api/whatsapp", whatsappRoutes);
const configRoutes = require("./routes/configRoutes");
app.use("/api/config", configRoutes);
const vozRoutes = require("./routes/voiceRoutes");
app.use("/api/voz", vozRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({ message: err.message || "Error interno del servidor" });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en el puerto ${PORT}`);
});
