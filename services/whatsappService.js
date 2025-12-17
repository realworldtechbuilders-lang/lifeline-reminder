// services/whatsappService.js
require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(name, what, who, datetime, whatsapp) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${whatsapp}`,
      body: `🔔 Hi ${name}, reminder: "${what}" for ${who} at ${datetime}.`,
    });
    console.log("📲 Message SID:", message.sid);
  } catch (err) {
    console.log("❌ Send error:", err.message);
  }
}

module.exports = { sendWhatsAppMessage };