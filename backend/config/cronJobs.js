const cron = require("node-cron");
const pool = require("../config/db");
const sendEmail = require("../config/enviocorreo");
const smsController = require("../controllers/sms2controller");
const moment = require("moment"); 
moment.locale("es");

cron.schedule("0 8 * * *", async () => {
    console.log("⏳ Ejecutando tarea de recordatorio de citas...");


});

cron.schedule("0 8 * * *", async () => {
    console.log("Ejecutando envío de recordatorios...");
  
  });
