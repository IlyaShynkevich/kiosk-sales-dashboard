# Kiosk Sales Dashboard

Simple browser-based dashboard for kiosk sales tracking from Excel reports.

## Features
- Upload `.xlsx` / `.xls` report files directly in the browser
- Filter by sheet range (`from` -> `to`)
- Search by product name
- View per-product metrics:
  - Opening stock
  - Sold
  - Leftover
  - Replenishment needed
  - Estimated revenue
- Switch replenishment logic:
  - `By sales` (needed = sold)
  - `As in file` (uses the value from the Excel report)

## Tech
- Static frontend: `index.html`, `styles.css`, `app.js`
- Excel parsing in browser via SheetJS (`xlsx` from CDN)
- Deploy-ready for Netlify (`netlify.toml` included)

## Local development
You can open `index.html` directly in a browser, or run any static server if needed.

## Deploy (Netlify Drop)
1. Open `https://app.netlify.com/drop`
2. Drag and drop the project folder
3. Share the generated URL

## Notes
- Excel files are processed in the browser.
- If you still see an old version after deploy, force refresh with `Ctrl + F5`.

