# Murcia Housing Data frontend

React + Vite + TypeScript interface for the project's static housing data.
The page reads `public/data/housing.json`; it does not connect to PostgreSQL.

## Local review

Use Node.js 24 LTS or a compatible supported version:

```bash
npm install
npm run dev
```

Open `http://localhost:5173/murcia-housing-data/` in the browser.

Vite serves the project under `/murcia-housing-data/`, matching the GitHub Pages
project-site path. The production output is created in `dist/`:

```bash
npm run build
npm run preview
```

The annual averages are rendered from the generated JSON. Quarterly changes and
price categories are omitted because their original definitions have not been
verified.
