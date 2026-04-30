# don't buy the jeans — Chrome extension

A spending deterrent. Click the icon, type a number, watch it become a much larger number.

## Install (Developer Mode)

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked**.
4. Select this `extension/` folder.
5. Pin the extension in your toolbar (puzzle-piece menu → pin).
6. Click the icon. Type a number. Despair responsibly.

## Files

- `manifest.json` — MV3 manifest
- `popup.html` / `popup.css` / `popup.js` — the popup UI and live compounding calc (7% real, S&P 500 historical)
- `background.js` — service worker that watches the active tab and stamps a red `!` badge on the icon when you're on a known shopping domain
- `icons/` — toolbar icons (16/32/48/128)

## Shopping-site detection

The badge lights up on: amazon, zara, asos, nike, uniqlo, h&m, ebay, etsy, target, walmart, bestbuy, nordstrom, farfetch, ssense, revolve, aritzia, sephora, shopify-hosted stores, and anything starting with `shop.`. When you open the popup on one of those tabs, a small black strip tells you which site it noticed.

## Notes

- The last amount you typed persists across popup opens (via `chrome.storage.local`).
- `Esc` resets.
- No telemetry, no accounts, no network calls. Everything is local.
- Not financial advice.
