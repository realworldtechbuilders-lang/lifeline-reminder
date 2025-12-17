// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/reminders.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection error:', err.message);
  } else {
    console.log('✅ Connected to SQLite database:', dbPath);
  }
});

// Create table
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    task TEXT NOT NULL,
    for_whom TEXT NOT NULL,
    datetime_iso TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    is_recurring BOOLEAN DEFAULT 0,
    recurrence_pattern TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('❌ Table creation error:', err.message);
    } else {
      console.log('✅ Reminders table ready');
    }
  });
});

module.exports = db;