// Crea un archivo test-twilio.js
const twilio = require('twilio');
require('dotenv').config();

const testClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function testCredentials() {
  try {
    const call = await testClient.calls.create({
      url: 'http://demo.twilio.com/docs/voice.xml',
      to: process.env.TWILIO_PHONE_NUMBER, // Llama a tu propio número
      from: process.env.TWILIO_PHONE_NUMBER
    });
    console.log('✅ Test exitoso. Call SID:', call.sid);
  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testCredentials();