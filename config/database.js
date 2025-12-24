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

// Create tables
db.serialize(() => {
  // 🔹 REMINDERS TABLE (existing)
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
      console.error('❌ Reminders table error:', err.message);
    } else {
      console.log('✅ Reminders table ready');
    }
  });

  // 🔹 USERS TABLE — FINAL WEEK 2 VERSION
  db.run(`CREATE TABLE IF NOT EXISTS users (
    whatsapp TEXT PRIMARY KEY,
    consent_status TEXT DEFAULT 'active',
    onboarding_day INTEGER DEFAULT 0,
    memory TEXT DEFAULT '{}'
  )`, (err) => {
    if (err) {
      console.error('❌ Users table error:', err.message);
    } else {
      console.log('✅ Users table ready (with onboarding + memory)');
    }
  });
});

module.exports = db;