# Run Match Day locally

## Quick start

```bash
cd world-cup-planner
npm install
npm run dev:clean
```

Open **http://localhost:3000** in your browser.

> **Important:** This app is **not** the Kargo glossary. Run commands from the `world-cup-planner` folder only.

## If the page is blank or shows an error

The Next.js cache can break after hot reloads. Fix it with:

```bash
cd world-cup-planner
lsof -ti:3000 | xargs kill -9 2>/dev/null
npm run dev:clean
```

Then hard-refresh the browser (`Cmd+Shift+R`).

## What you should see

- **Match Day** header (yellow ball logo)
- France vs Senegal live scorecard
- **Match guide** chat on the left
- **Live map** with heat zones on the right

## Ports

- Match Day: **http://localhost:3000**
- If port 3000 is taken, kill the other process first (see above).
