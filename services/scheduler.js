// services/scheduler.js
const fs = require('fs');
const path = require('path');
const { sendWhatsAppMessage } = require('./whatsappService');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'reminders.csv');

function scheduleReminder(name, what, who, datetime, whatsapp) {
  const target = new Date(datetime);
  const now = new Date();
  const delay = target - now;

  if (delay <= 0) {
    console.log("⚠️ Past date ignored:", datetime);
    return;
  }

  console.log("⏰ Scheduling reminder for:", target);
  setTimeout(() => {
    sendWhatsAppMessage(name, what, who, datetime, whatsapp);
  }, delay);
}

function loadAndScheduleReminders() {
  if (!fs.existsSync(filePath)) {
    console.log("📂 No reminders file found, skipping reschedule.");
    return;
  }

  const data = fs.readFileSync(filePath, 'utf8').trim();
  if (!data) {
    console.log("📂 Reminders file is empty, skipping reschedule.");
    return;
  }

  console.log("\n🔄 Loading and rescheduling reminders from CSV...");
  const lines = data.split('\n');
  let rescheduledCount = 0;
  let skippedCount = 0;

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 5) continue;

    const [name, what, who, datetimeISO, whatsapp] = parts;
    const target = new Date(datetimeISO);
    const now = new Date();

    if (target > now) {
      const timeUntil = Math.round((target - now) / 1000 / 60);
      console.log(`   ✅ Rescheduling: "${what}" in ${timeUntil} minutes for ${whatsapp}`);
      scheduleReminder(name, what, who, datetimeISO, whatsapp);
      rescheduledCount++;
    } else {
      console.log(`   ⏭️ Skipping past reminder: "${what}" (was due: ${target.toLocaleString()})`);
      skippedCount++;
    }
  }

  console.log(`📊 Reschedule complete: ${rescheduledCount} reminders rescheduled, ${skippedCount} past reminders skipped.`);
}

module.exports = { scheduleReminder, loadAndScheduleReminders };