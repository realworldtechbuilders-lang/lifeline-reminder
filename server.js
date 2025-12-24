// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

app.use(express.urlencoded({ extended: true }));

// ✅ ADD HEALTH CHECK ROUTE HERE (before other routes)
app.get('/health', (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Register routes
require('./routes/whatsapp')(app);
require('./routes/admin')(app);

// Load reminders on startup
const { loadAndScheduleReminders } = require('./services/scheduler');
loadAndScheduleReminders();

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`🖥️ Admin Dashboard: http://localhost:${PORT}/admin`);
  console.log(`📱 WhatsApp Webhook: http://localhost:${PORT}/whatsapp`);
});