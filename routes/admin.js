// routes/admin.js
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

const dataDir = path.join(__dirname, '../data');
const filePath = path.join(dataDir, 'reminders.csv');

module.exports = function (app) {
  app.get('/admin', (req, res) => {
    // Try SQLite first (more reliable)
    db.all('SELECT * FROM reminders ORDER BY datetime_iso DESC', (err, rows) => {
      if (err || rows.length === 0) {
        // Fallback to CSV (for transition)
        if (!fs.existsSync(filePath)) {
          return res.send(`
            <html><body style="font-family: Arial; padding: 20px;">
              <h1>📋 LifeLine Reminders Admin</h1>
              <p style="color: red;">No reminders in DB or CSV.</p>
            </body></html>
          `);
        }

        const data = fs.readFileSync(filePath, 'utf8').trim();
        if (!data) {
          return res.send(`
            <html><body style="font-family: Arial; padding: 20px;">
              <h1>📋 LifeLine Reminders Admin</h1>
              <p>CSV fallback: No reminders found.</p>
            </body></html>
          `);
        }

        // Render CSV (your existing logic) — omitted for brevity
        // But ideally, migrate fully to SQLite
      } else {
        // Render from SQLite (cleaner!)
        let html = `
          <html>
          <head>
            <title>LifeLine Reminders Admin</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              h1 { color: #2c3e50; }
              table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
              tr:hover { background: #f9f9f9; }
              .future { color: #27ae60; }
              .past { color: #95a5a6; }
            </style>
          </head>
          <body>
            <h1>📋 LifeLine Reminders Admin (SQLite)</h1>
            <table>
              <tr>
                <th>ID</th>
                <th>Task</th>
                <th>Time (Nigeria)</th>
                <th>WhatsApp</th>
                <th>Recurring</th>
                <th>Status</th>
              </tr>
        `;

        const now = new Date();
        rows.forEach(row => {
          const reminderTime = new Date(row.datetime_iso);
          const isFuture = reminderTime > now;
          const status = isFuture ? '⏰ Future' : '✅ Sent';
          const statusClass = isFuture ? 'future' : 'past';
          const formattedTime = reminderTime.toLocaleString('en-NG', {
            timeZone: 'Africa/Lagos',
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          html += `
            <tr>
              <td>${row.id}</td>
              <td><strong>${row.task}</strong></td>
              <td>${formattedTime}</td>
              <td>${row.whatsapp}</td>
              <td>${row.is_recurring ? '🔁 Yes' : '❌ No'}</td>
              <td class="${statusClass}">${status}</td>
            </tr>
          `;
        });

        html += `
            </table>
            <p style="margin-top: 20px; color: #7f8c8d;">
              📊 Total: ${rows.length} reminders | 🔄 Auto-refresh in 30s
            </p>
            <script>setTimeout(() => location.reload(), 30000);</script>
          </body>
          </html>
        `;
        res.send(html);
      }
    });
  });
};