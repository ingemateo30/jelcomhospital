const axios = require("axios");

// Configuración
const CONFIG = {
  wabaId: "2592525027780110", // ⚠️ Aquí va el WhatsApp Business Account ID
  accessToken: "EAAQwHZBVmMvoBPmkZCat3xE11xYzjhZAUvwMJExZCHdRYadI7200RZBCjzrb4C4UiMlZA1MmMSJHQJIJCv4tD2FE36ZAIVbAnrzJEZA1IliZApcBWlLNEqarsvap6qic8ZCzXrC0S0QfzxtkCp6iCsdApZCgP5xC1LUer9XBLb6iPMZC4TN0ArjermCPzOmybuhNlZBvrHd1zK4GTQWrKJuY3EXhNPwuiXx5AMsdoFguKOoelCLLWUHSW2UsJruZBHmgDsiAZDZD", // ⚠️ Tu token válido
  apiVersion: "v22.0"
};

const API_URL = `https://graph.facebook.com/${CONFIG.apiVersion}/${CONFIG.wabaId}/message_templates`;

async function listarPlantillas() {
  try {
    const response = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${CONFIG.accessToken}` }
    });

    console.log("📋 Plantillas disponibles:\n");

    response.data.data.forEach((tpl) => {
      console.log(`📝 Nombre: ${tpl.name}`);
      console.log(`🌐 Idioma: ${tpl.language}`);
      console.log(`📌 Estado: ${tpl.status}`);

      if (tpl.components) {
        tpl.components.forEach((comp) => {
          console.log(`   🔹 Tipo: ${comp.type}`);
          if (comp.text) console.log(`   📄 Texto: ${comp.text}`);
          if (comp.buttons) {
            comp.buttons.forEach((btn, i) => {
              console.log(
                `   🔘 Botón ${i + 1}: ${btn.text} | Tipo: ${btn.type} | URL: ${btn.url || "N/A"}`
              );
            });
          }
          if (comp.example) {
            console.log(`   🧩 Ejemplos: ${JSON.stringify(comp.example)}`);
          }
        });
      }

      console.log("=".repeat(40));
    });
  } catch (error) {
    console.error("❌ Error obteniendo plantillas:", error.response?.data || error.message);
  }
}

listarPlantillas();
