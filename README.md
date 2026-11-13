# OneHealth InfoSys (SCOHIS / Yakap)

Modern, user-friendly, and responsive web application based on the SCOHIS/Yakap reference for primary care facilities and PhilHealth e-Claims synchronization.

## Tech Stack
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS + shadcn/ui (Radix Primitives)
- **Data Tables**: MUI DataGrid (for Registered Yakap & PhilHealth Master List)
- **Icons**: Lucide React
- **Analytics**: Recharts
- **State Management**: Zustand
- **Routing**: React Router DOM (v6)

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```

### 3. Production build
```bash
npm run build
npm run preview
```

## Adding New UI Components (shadcn/ui CLI)
shadcn/ui CLI is configured to use `npm`:
```bash
npx shadcn@latest add [component-name]
```
