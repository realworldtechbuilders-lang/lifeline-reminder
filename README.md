# LifeLine Reminder – Starter Template

This is a beginner-friendly starter for Week 5.

## Files
- `index.html` — the web form (what users fill)
- `server.js` — Node.js server that handles submissions
- `package.json` — dependencies and start script
- `reminders.csv` — will be created after first submission

## Quick steps (for Monday)
1. Unzip the folder.
2. Open a terminal inside the folder.
3. Run:
    npm install
    npm start

4. Open your browser to `http://localhost:3000`
5. Fill and submit the form.
6. Watch the terminal — you'll see the reminder printed.
7. Check `reminders.csv` — it has the saved data.

## Troubleshooting (common beginner issues)
- If `npm install` fails: make sure Node.js is installed. Use Node v14+.
- If `npm start` says port in use: change `PORT` in `server.js` to another number (e.g., 3001).
- If you see permission errors writing the CSV, try running terminal as normal user and ensure the folder is writable.

## Next steps (Tue/Wed)
- Tue: Set up VS Code and run the server locally.
- Wed: Start editing `index.html` or `server.js` as instructed.

If anything breaks, paste the terminal output in the group and I’ll help.
