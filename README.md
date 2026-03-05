# Kiosk Sales Dashboard

Browser-based dashboard for kiosk sales analytics from Excel reports.

## Live version
- Netlify: `https://podschet-prodazh-kioska.netlify.app`

## Features
- Upload `.xlsx` / `.xls` files directly in the browser
- Filter by sheet range (`from` -> `to`)
- Search by product name
- Product metrics: opening stock, sold, leftover, replenishment needed, estimated revenue
- Replenishment modes:
  - `By sales` (needed = sold)
  - `As in file` (uses the "need to deliver" value from Excel)
- RU/EN interface switch

## Stack
- Static frontend: `index.html`, `styles.css`, `app.js`
- Excel parsing in browser via SheetJS (`xlsx` from CDN)
- Hosting: Netlify

## Run locally
Use any static server from the project root, for example:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Notes
- Excel files are processed in the browser.
- If you see an old version after deploy, force refresh with `Ctrl + F5`.
