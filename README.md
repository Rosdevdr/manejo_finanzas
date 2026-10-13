# AUREUS · Dashboard Client

> 🇪🇸 Versión en español: [README.es.md](./README.es.md)

The React client of **AUREUS**, a zero-friction household finance assistant. Expenses and bills are captured through chat (Telegram first) by the [backend](https://github.com/Rosdevdr/manejo_finanzas-backend). This app is the **optional dashboard**: a place to review reports, upcoming due dates, and correct anything the assistant got wrong.

> **Status: in transition.** The client was built for the original fintech version of AUREUS and still works with local storage. It is being adapted to read data from the new backend. The previous version lives in the [`legacy-aureus`](../../tree/legacy-aureus) branch.

## Role in the System

```
Chat (Telegram / WhatsApp)  →  Backend (ledger + Sentinel)  →  Dashboard (this repo)
```

- **Read:** spending summaries, category breakdowns, cash flow, upcoming bills.
- **Correct:** change a category or amount; the correction is sent to the backend and stored as training data.
- **Not a data-entry tool:** daily capture happens in the chat, not here.

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · Capacitor (Android, optional) · Vitest · Vercel

## Roadmap

- [x] Responsive layout with dark and light themes
- [x] Dashboard with KPIs, charts and cash-flow history
- [x] Subscription and payment module removed (no monetization for now)
- [ ] Replace local storage with the backend API
- [ ] Authentication against the backend
- [ ] Bill Sentinel view (due dates and reminder status)
- [ ] Correction flow for extracted expenses
- [ ] Weekly summary view

## Getting Started

Requirements: Node.js 20+ and npm 10+.

```bash
git clone https://github.com/Rosdevdr/manejo_finanzas.git
npm install
npm run dev      # development server
npm run test     # unit tests
npm run build    # production build
```

The dev server proxies `/api` to the backend at `http://localhost:3001`.

## Branch Strategy

| Branch | Purpose |
|---|---|
| `develop` | Active development |
| `qa` | Quality assurance and regression |
| `main` | Stable, deployed to Vercel |
| `legacy-aureus` | Frozen snapshot of the original fintech version |
