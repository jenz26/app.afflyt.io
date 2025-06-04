# Afflyt.io MVP

**Trasforma i tuoi link affiliati in una macchina di conversione.**

Afflyt.io è una piattaforma SaaS completa per affiliate marketing che unisce la gestione centralizzata di link affiliati con l'automazione multi-canale e analytics avanzati.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS 3
- **Backend**: Express 4 + TypeScript + MongoDB + Redis
- **Monorepo**: Turborepo 2.5.4 + pnpm 8.15.6
- **Auth**: JWT + Magic Links
- **Deployment**: Vercel (web) + Render.com (api)

## 📁 Struttura del Progetto

```
afflyt-mvp/
├── apps/
│   ├── web/              # Next.js Frontend
│   ├── api/              # Express Backend
│   ├── bot/              # Telegram Bot
│   └── worker/           # Background Jobs
├── packages/
│   ├── ui/               # Shared Components
│   ├── eslint-config/    # ESLint Config
│   └── typescript-config/# TypeScript Config
└── scripts/              # Utility Scripts
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 📋 Requirements

- Node.js v20.18.0 LTS
- pnpm 8.15.6

## 🗺️ Roadmap

- [x] **Fase 0**: Fondazione & Servizi Core
- [ ] **Fase 1**: MVP Orientato all'Utente
- [ ] **Fase 2**: Automazione & Advanced Analytics
- [ ] **Fase 3**: Piattaforma Inserzionista
- [ ] **Fase 4**: Scaling & Funzionalità Enterprise