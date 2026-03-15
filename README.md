# fincal

**An interactive SIP (Systematic Investment Plan) calculator for projecting investment growth.**

> Live demo: _coming soon_

---

## What it is

fincal helps you visualize the long-term growth of a monthly SIP investment using compound interest. Adjust your monthly amount, expected return rate, and investment horizon — the results update instantly.

## Features

- **Interactive sliders** — drag to adjust inputs, values update in real time
- **Summary panel** — final corpus, total invested, and wealth gained at a glance
- **Pie chart** — shows the split between invested principal and returns
- **Line chart** — year-by-year projection of portfolio value vs. invested amount
- **INR formatting** — large numbers displayed in Lakh (L) / Crore (Cr) notation
- **Responsive layout** — works on desktop and mobile

## Formula

SIP future value using the standard annuity-due formula:

```
FV = P × ((1 + r)^n − 1) / r × (1 + r)
```

Where:
- `P` = monthly SIP amount
- `r` = monthly interest rate = annual rate / 12 / 100
- `n` = total number of months = years × 12

## Tech stack

| Layer | Library |
|---|---|
| UI framework | React 19 |
| Language | TypeScript |
| Build tool | Vite |
| Charts | Recharts |

## Getting started

```bash
npm install
npm run dev      # start dev server at http://localhost:5173
npm run build    # production build
npm run preview  # preview production build locally
```

## Input ranges

| Parameter | Min | Max | Step |
|---|---|---|---|
| Monthly SIP | ₹500 | ₹1,00,000 | ₹500 |
| Annual return | 1% | 30% | 0.5% |
| Duration | 1 yr | 40 yrs | 1 yr |

## Disclaimer

This tool has been designed for information purposes only. Actual results may vary depending on various factors involved in capital market. Investor should not consider above as a recommendation for any schemes of HDFC Mutual Fund. Past performance may or may not be sustained in future and is not a guarantee of any future returns.

## License

MIT © 2026
