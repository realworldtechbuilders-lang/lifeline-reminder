// server.js
// 🌟 LIFE LINE REMINDER - WHATSAPP REMINDER SYSTEM

// Load required modules
const express = require("express");
const fs = require("fs");
const path = require("path");
const twilio = require("twilio");
require("dotenv").config();
const app = express();

// ⚠️ NOTE: Removed node-cron import — not used yet.

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Port
const PORT = process.env.PORT || 3000;

// Ensure data folder exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log("📁 Created 'data' folder");
}

// Path to CSV
const filePath = path.join(dataDir, "reminders.csv");

// Keep this temporarily (form still works during migration)
app.use(express.urlencoded({ extended: true }));

// ❌ REMOVED app.use(express.static(__dirname));
// Reason: We are moving away from HTML form → WhatsApp chat.

// Send WhatsApp message
async function sendWhatsAppMessage(name, what, who, datetime, whatsapp) {
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM, // ✔️ moved to .env
      to: `whatsapp:${whatsapp}`,
      body: `🔔 Hi ${name}, reminder: "${what}" for ${who} at ${datetime}.`,
    });
    console.log("📲 Reminder sent:", message.sid);
  } catch (err) {
    console.error("❌ Failed to send reminder:", err.message);
  }
}

// Schedule reminder using setTimeout
function scheduleReminder(name, what, who, datetime, whatsapp) {
  const targetTime = new Date(datetime);
  const now = new Date();
  const delay = targetTime - now;

  if (delay <= 0) {
    console.log("⚠️ Reminder time has passed:", datetime);
    return;
  }

  console.log(`⏰ Reminder scheduled for ${targetTime}`);

  setTimeout(() => {
    sendWhatsAppMessage(name, what, who, datetime, whatsapp);
  }, delay);
}

// ❌ REMOVED: The entire /submit route
// Reason: users will now chat via WhatsApp, not fill forms.

// Re-schedule reminders on startup (keep temporarily)
fs.readFile(filePath, "utf8", (err, data) => {
  if (err) return console.log("ℹ️ No existing reminders yet.");

  const now = new Date();
  const lines = data.trim().split("\n");

  lines.forEach((line) => {
    const [name, what, who, datetime, whatsapp] = line.split(",");
    if (new Date(datetime) > now && whatsapp) {
      scheduleReminder(name, what, who, datetime, whatsapp);
    }
  });
});

// ✔️ KEEP /check-reminders for now (cron-job fallback)
app.get("/check-reminders", async (req, res) => {
  try {
    const now = new Date();

    if (req.query.key !== process.env.CRON_SECRET) {
      return res.status(403).send("Forbidden");
    }

    if (!fs.existsSync(filePath)) {
      return res.send("No reminders yet.");
    }

    const data = fs.readFileSync(filePath, "utf8");
    const lines = data.trim().split("\n");
    let sentCount = 0;
    let updatedLines = [];

    for (const line of lines) {
      let [name, what, who, datetime, whatsapp, sent] = line.split(",");

      if (sent === "sent") {
        updatedLines.push(line);
        continue;
      }

      if (whatsapp && new Date(datetime) <= now) {
        try {
          await sendWhatsAppMessage(name, what, who, datetime, whatsapp);
          sentCount++;
          updatedLines.push(`${name},${what},${who},${datetime},${whatsapp},sent`);
        } catch (err) {
          console.error("❌ Error sending scheduled message:", err.message);
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    }

    fs.writeFileSync(filePath, updatedLines.join("\n"), "utf8");
    console.log(`🕒 Checked reminders — sent ${sentCount}`);
    res.send(`Checked reminders — sent ${sentCount}`);
  } catch (error) {
    console.error("❌ Error in /check-reminders:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ NEW: WhatsApp Chat Webhook (users can chat directly with the bot)
app.post("/whatsapp", express.urlencoded({ extended: true }), async (req, res) => {
  const incomingMessage = req.body.Body?.trim();
  const from = req.body.From;

  console.log("💬 Incoming message:", incomingMessage);

  // Step 1: Handle greeting messages
  if (!incomingMessage) {
    return res.send("<Response></Response>");
  }

  if (incomingMessage.toLowerCase() === "hi" || incomingMessage.toLowerCase() === "hello") {
    return res.send(`
      <Response>
        <Message>
          👋 Hi! I'm LifeLine Reminder.  
          You can say things like:  
          "Remind me to call John tomorrow at 8am"
        </Message>
      </Response>
    `);
  }

  // Step 2: Very simple rule-based parser
  const pattern = /remind me to (.*) (on|at|by) (.*)/i;
  const match = incomingMessage.match(pattern);

  if (!match) {
    return res.send(`
      <Response>
        <Message>
          🤖 I didn't understand that.  
          Try: "Remind me to take medicine at 9pm"
        </Message>
      </Response>
    `);
  }

  const what = match[1];
  const datetime = match[3];

  const name = "User"; 
  const who = "You";
  const whatsapp = from.replace("whatsapp:", "");

  const row = `${name},${what},${who},${datetime},${whatsapp}\n`;
  fs.appendFileSync(filePath, row);

  // Step 4: Schedule the reminder
  scheduleReminder(name, what, who, datetime, whatsapp);

  // Step 5: Confirm to user
  res.send(`
    <Response>
      <Message>
        ✅ All set!  
        I’ll remind you to *${what}* on *${datetime}*.
      </Message>
    </Response>
  `);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Saving reminders in: ${filePath}`);
});
