// server.js
// 🌟 LIFE LINE REMINDER - SCHEDULED WHATSAPP MESSAGES

// Step 1: Load required modules
const express = require("express");
const fs = require("fs");
const path = require("path");
const twilio = require("twilio");
require('dotenv').config();
const app = express();

// 🧩 NEW: Import node-cron to schedule jobs
const cron = require("node-cron");

// 🧩 SECURE: Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID; // 🔒 FROM .env FILE
const authToken = process.env.TWILIO_AUTH_TOKEN;   // 🔒 FROM .env FILE
const client = twilio(accountSid, authToken);

// Step 2: Setup server port
const PORT = process.env.PORT || 3000;

// Step 3: Ensure a 'data' folder exists
const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
  console.log("📁 Created 'data' folder");
}

// Step 4: Where to save reminders
const filePath = path.join(dataDir, "reminders.csv");

// Step 5: Enable form submissions
app.use(express.urlencoded({ extended: true }));

// Step 6: Serve static files (e.g., index.html)
app.use(express.static(__dirname));

// ✳️ NEW: Function to send WhatsApp message
async function sendWhatsAppMessage(name, what, who, datetime, whatsapp) {
  try {
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio sandbox number
      to: `whatsapp:${whatsapp}`,
      body: `🔔 Hi ${name}, this is a reminder for "${what}" (for ${who}) scheduled on ${datetime}.`,
    });
    console.log("📲 Reminder sent:", message.sid);
  } catch (err) {
    console.error("❌ Failed to send reminder:", err.message);
  }
}

// ✳️ NEW: Schedule a one-time reminder using setTimeout
function scheduleReminder(name, what, who, datetime, whatsapp) {
  const delay = new Date(datetime) - new Date();
  if (delay <= 0) {
    console.log("⚠️ Reminder time already passed:", datetime);
    return;
  }

  console.log(`⏰ Reminder scheduled for ${datetime} (${Math.round(delay / 1000)}s from now)`);

  setTimeout(() => {
    sendWhatsAppMessage(name, what, who, datetime, whatsapp);
  }, delay);
}

// Step 7: Handle form submission
app.post("/submit", async (req, res) => {
  const { name, what, who, datetime, whatsapp } = req.body;
  const row = `${name},${what},${who},${datetime},${whatsapp || ""}\n`;

  fs.appendFile(filePath, row, async (err) => {
    if (err) {
      console.error("❌ Error saving reminder:", err);
      return res.send("❌ Failed to save reminder.");
    }

    console.log("✅ Saved reminder:", row.trim());

    // 🧩 NEW: Schedule reminder for later (not instant)
    if (whatsapp) scheduleReminder(name, what, who, datetime, whatsapp);

    // 🧩 Optional: Send immediate confirmation message
    try {
      if (whatsapp) {
        const confirmMsg = await client.messages.create({
          from: "whatsapp:+14155238886",
          to: `whatsapp:${whatsapp}`,
          body: `✅ Hi ${name}, your reminder for "${what}" on ${datetime} has been set successfully.`,
        });
        console.log("📩 Confirmation sent:", confirmMsg.sid);
      }
    } catch (err) {
      console.error("❌ Error sending confirmation:", err.message);
    }

    res.send(`
      <html>
        <head><title>Success!</title></head>
        <body style="font-family:sans-serif;">
          <h2>✅ LifeLine Reminder Set!</h2>
          <p><strong>Reminder:</strong> ${what}</p>
          <p><strong>For:</strong> ${who}</p>
          <p><strong>When:</strong> ${datetime}</p>
          <p><em>You’ll receive a WhatsApp reminder at the scheduled time.</em></p>
          <a href="/">← Set another reminder</a>
        </body>
      </html>
    `);
  });
});

// Step 8: On server start, reload and reschedule all future reminders
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

// ✅ NEW: Route for cron-job.org
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

      // Skip if already marked as sent
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
          updatedLines.push(line); // keep it unsent if failure
        }
      } else {
        updatedLines.push(line);
      }
    }

    fs.writeFileSync(filePath, updatedLines.join("\n"), "utf8");
    console.log(`🕒 Checked reminders — sent ${sentCount} message(s)`);
    res.send(`Checked reminders — sent ${sentCount} message(s)`);
  } catch (error) {
    console.error("❌ Error in /check-reminders route:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// Step 9: Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📝 Reminders saved to: ${filePath}`);
});
