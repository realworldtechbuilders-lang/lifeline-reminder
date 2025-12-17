// routes/whatsapp.js
const fs = require('fs');
const path = require('path');
const chrono = require('chrono-node');
const db = require('../config/database');
const { scheduleReminder } = require('../services/scheduler');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'reminders.csv');

// 🔁 Helper: Handle all "every" recurring patterns
function handleRecurringInstruction(instruction) {
  const lowerInst = instruction.toLowerCase();
  const now = new Date();
  let what, parsedDate;

  // 📅 Daily: "every day", "daily", "every morning", etc.
  if (
    lowerInst.includes("every day") ||
    lowerInst.includes("daily") ||
    (lowerInst.includes("every") && (lowerInst.includes("morning") || lowerInst.includes("evening") || lowerInst.includes("night")))
  ) {
    const next8am = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    if (now > next8am) {
      next8am.setDate(next8am.getDate() + 1);
    }
    parsedDate = next8am;
    // Clean task: remove "every ... morning" etc.
    what = instruction
      .replace(/\s*every\s+(day|morning|evening|night|daily)(\s+at\s+\d+(:\d+)?\s*(am|pm)?)?/gi, '')
      .trim() || instruction;
    console.log("🔄 Daily recurring: next at 8:00 AM");
  }
  // 📆 Weekly: "every Monday", "every week", etc.
  else if (
    lowerInst.includes("every week") ||
    lowerInst.includes("weekly") ||
    (lowerInst.includes("every") && /monday|tuesday|wednesday|thursday|friday|saturday|sunday/.test(lowerInst))
  ) {
    const now = new Date();
    let targetDayIndex;

    // Map day names to weekday index (Sunday=0, Monday=1, ..., Saturday=6)
    if (/monday/.test(lowerInst)) targetDayIndex = 1;
    else if (/tuesday/.test(lowerInst)) targetDayIndex = 2;
    else if (/wednesday/.test(lowerInst)) targetDayIndex = 3;
    else if (/thursday/.test(lowerInst)) targetDayIndex = 4;
    else if (/friday/.test(lowerInst)) targetDayIndex = 5;
    else if (/saturday/.test(lowerInst)) targetDayIndex = 6;
    else if (/sunday/.test(lowerInst)) targetDayIndex = 0;
    else targetDayIndex = 1; // default to Monday

    const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
    let daysUntilTarget = targetDayIndex - currentDay;

    // If today is after the target day this week, go to next week
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }

    const nextTargetDate = new Date(now);
    nextTargetDate.setDate(now.getDate() + daysUntilTarget);
    parsedDate = new Date(nextTargetDate.getFullYear(), nextTargetDate.getMonth(), nextTargetDate.getDate(), 9, 0, 0);

    // Clean task
    what = instruction
      .replace(/\s*every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|weekly)(\s+at\s+\d+(:\d+)?\s*(am|pm)?)?/gi, '')
      .trim() || instruction;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log(`🔄 Weekly recurring: next ${dayNames[targetDayIndex]} at 9:00 AM`);
  }
  // 📅 Monthly: "every 28th"
  else {
    const dayMatch = instruction.match(/every\s+(\d{1,2})(?:st|nd|rd|th)?/i);
    if (dayMatch) {
      const day = Math.min(31, Math.max(1, parseInt(dayMatch[1], 10)));
      let month = now.getMonth();
      let year = now.getFullYear();
      if (now.getDate() > day) {
        month += 1;
        if (month > 11) {
          month = 0;
          year += 1;
        }
      }
      parsedDate = new Date(year, month, day, 9, 0, 0);
      what = instruction
        .replace(/\s*every\s+\d{1,2}(?:st|nd|rd|th)?(\s+at\s+\d+(:\d+)?\s*(am|pm)?)?/gi, '')
        .trim() || instruction;
      console.log(`🔄 Monthly recurring: day ${day} at 9:00 AM`);
    } else {
      return null; // trigger clarification
    }
  }

  return { what, parsedDate, isRecurring: true };
}

module.exports = function (app) {
  app.post('/whatsapp', async (req, res) => {
    const incoming = req.body.Body?.trim();
    const from = req.body.From;

    console.log("\n💬 Incoming:", incoming);
    console.log("👤 From:", from);

    if (!incoming) {
      return res.type("text/xml").send(`<Response></Response>`);
    }

    const lower = incoming.toLowerCase();
    if (["hi", "hello"].includes(lower)) {
      return res.type("text/xml").send(`
        <Response><Message>
        👋 Hi! I'm LifeLine Reminder.
        Examples:
        • Remind me to stretch in 30 minutes
        • Remind me to drink water after 1 hour
        • Remind me to pray later today
        • Remind me to call Mom next Friday at 10am
        </Message></Response>
      `);
    }

    if (!lower.startsWith("remind me to ")) {
      return res.type("text/xml").send(`
        <Response><Message>
        🤖 Please start with "Remind me to ..."
        Example: "Remind me to call Mom tomorrow at 3pm"
        </Message></Response>
      `);
    }

    const instruction = incoming.substring(13).trim();
    console.log("📝 Original instruction:", instruction);

    // 👇 CRITICAL FIX: Handle "every" BEFORE chrono
    const lowerInst = instruction.toLowerCase();
    let what, parsedDate, isRecurring = false;

    if (lowerInst.includes('every')) {
      console.log("🔁 Detected 'every' — bypassing chrono, using custom logic");
      const recurringResult = handleRecurringInstruction(instruction);
      if (!recurringResult) {
        return res.type("text/xml").send(`
          <Response><Message>
          🔁 I support:
          • "every day" (daily at 8 AM)
          • "every Monday" (weekly)
          • "every 28th" (monthly)
          
          Could you rephrase your reminder?
          </Message></Response>
        `);
      }
      ({ what, parsedDate, isRecurring } = recurringResult);
    } else {
      // 🧠 Normal parsing for non-recurring
      let normalizedInstruction = instruction
        .replace(/\bafter\s+(\d+)\s*(?:min|minute|minutes?)\b/gi, 'in $1 minutes')
        .replace(/\bafter\s+(\d+)\s*(?:hour|hours?)\b/gi, 'in $1 hours')
        .replace(/\bafter\s+(\d+)\s*(?:day|days?)\b/gi, 'in $1 days')
        .replace(/\blater today\b/gi, 'in 2 hours')
        .replace(/\bthis evening\b/gi, 'today at 7pm')
        .replace(/\btonight\b/gi, 'today at 8pm');

      console.log("🔧 Normalized instruction:", normalizedInstruction);

      const results = chrono.parse(normalizedInstruction);
      console.log("🧠 Chrono parse results:", results);

      if (results.length > 0) {
        const timeRef = results[0];
        const timeText = timeRef.text;
        console.log("⏰ Time text found:", timeText);
        
        what = instruction
          .replace(new RegExp(timeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
          .replace(/\s+/g, ' ')
          .trim();
        
        if (what === instruction) {
          const normalizedWhat = normalizedInstruction
            .replace(new RegExp(timeText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '')
            .trim();
          what = normalizedWhat;
        }
        
        what = what.replace(/\s+(?:at|on|by|in|after|around|to|for)$/i, '').trim();
        parsedDate = timeRef.start.date();
      } else {
        console.log("⚠️ No time found by chrono, using fallbacks");
        let fallbackUsed = false;

        // 🌆 "later today"
        if (instruction.toLowerCase().includes("later today")) {
          what = instruction.replace(/later today/gi, "").trim() || "this";
          parsedDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
          fallbackUsed = true;
          console.log("🌙 'later today' → 2 hours from now");
        }
        // 🌃 "tonight"
        else if (instruction.toLowerCase().includes("tonight")) {
          what = instruction.replace(/tonight/gi, "").trim() || "this";
          const now = new Date();
          parsedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
          fallbackUsed = true;
          console.log("🌃 'tonight' → 8 PM today");
        }
        // 🌅 "tomorrow"
        else if (instruction.toLowerCase().includes("tomorrow")) {
          what = instruction.replace(/tomorrow/gi, "").trim() || "this";
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          parsedDate = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0, 0);
          fallbackUsed = true;
          console.log("🌅 'tomorrow' → 9 AM tomorrow");
        }

        if (!fallbackUsed) {
          return res.type("text/xml").send(`
            <Response><Message>
            🤔 When should I remind you? I couldn't find a clear time in: "${instruction}"
            Try adding a time like:
            • "in 30 minutes"
            • "after 1 hour"
            • "tomorrow at 9am"
            • "on the 28th"
            • "later today"
            Example: "Remind me to ${instruction.split(' ')[0] || 'do it'} in 1 hour"
            </Message></Response>
          `);
        }
      }
    }

    // ... rest of validation, saving, and response (unchanged) ...
    console.log("📅 Parsed date:", parsedDate);
    console.log("✅ Task extracted:", what);

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      return res.type("text/xml").send(`
        <Response><Message>
        ❌ I couldn't understand the time in your message.
        Try: "Remind me to ${what} tomorrow at 3pm"
        </Message></Response>
      `);
    }

    if (parsedDate.getTime() <= Date.now()) {
      return res.type("text/xml").send(`
        <Response><Message>
        ⚠️ That time is in the past! Please choose a future time.
        </Message></Response>
      `);
    }

    const datetimeISO = parsedDate.toISOString();
    const name = "User";
    const who = "You";
    const whatsapp = from.replace("whatsapp:", "");

    // Save to CSV
    const row = `${name},${what},${who},${datetimeISO},${whatsapp}\n`;
    fs.appendFileSync(filePath, row);

    // Save to SQLite
    const stmt = db.prepare(`
      INSERT INTO reminders (name, task, for_whom, datetime_iso, whatsapp, is_recurring)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(name, what, who, datetimeISO, whatsapp, isRecurring ? 1 : 0, (err) => {
      if (err) {
        console.error('❌ SQLite insert error:', err.message);
      } else {
        console.log('✅ Saved to SQLite');
      }
    });
    stmt.finalize();

    // Schedule
    scheduleReminder(name, what, who, datetimeISO, whatsapp);

    const displayDate = parsedDate.toLocaleString('en-NG', {
      timeZone: 'Africa/Lagos',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });

    res.type("text/xml").send(`
      <Response><Message>
      ${isRecurring ? '🔁' : '✅'} Done! I'll remind you to *${what}* at *${displayDate}*.
      </Message></Response>
    `);
  });
};