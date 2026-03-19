# Budget Buddy

A responsive, colorful budget tracking UI built with **Next.js** and **Tailwind CSS**.

This project is a frontend-only prototype that lets you add expenses, categorize them, and view a summary of your spending. It includes dummy data and is structured for future backend and login integrations.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Features

- Add expenses with description, amount, category, and date.
- Filter expenses by category.
- Summary cards for total spending and top category.
- Responsive layout and colorful UI.
- Dark/light theme toggle.
- Weekly + monthly insights page with charts.
- Data persisted to `localStorage` so your transactions stay between reloads.

## Pages

- `/` — Dashboard (add & list expenses)
- `/insights` — Insights (weekly/monthly charts + full expense log)

## Next Steps (Future)

- Add login and per-user data persistence.
- Save expenses to a backend or database.
- Expand charts with category breakdowns and export options.
