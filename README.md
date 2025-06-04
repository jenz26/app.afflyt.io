# Afflyt.io MVP

**Trasforma i tuoi link affiliati in una macchina di conversione.**

Afflyt.io è una piattaforma SaaS completa per affiliate marketing che unisce la gestione centralizzata di link affiliati con l'automazione multi-canale e analytics avanzati.

## 🚀 Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS 3 + i18next
- **Backend**: Express 4 + TypeScript + MongoDB + Redis
- **Monorepo**: Turborepo 2.5.4 + pnpm 8.15.6
- **Auth**: JWT + Magic Links (Resend)
- **Analytics**: PostHog Cloud EU
- **Deployment**: Vercel (web) + Render.com (api)

## 📁 Struttura del Progetto

```
afflyt-mvp/
├── apps/
│   ├── web/              # Next.js Frontend (✅ Configurato)
│   ├── api/              # Express Backend (🚧 In sviluppo)
│   ├── bot/              # Telegram Bot (📋 Pianificato)
│   └── worker/           # Background Jobs (📋 Pianificato)
├── packages/
│   ├── ui/               # Shared Components (📋 Pianificato)
│   ├── eslint-config/    # ESLint Config (✅ Configurato)
│   └── typescript-config/# TypeScript Config (✅ Configurato)
├── scripts/              # Utility Scripts (📋 Pianificato)
└── docs/                 # Documentazione Versionata
    └── versions/
        ├── v1.0.0.md     # Setup iniziale
        └── v1.1.0.md     # Frontend base + i18n
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

## 🌐 Internazionalizzazione

L'app supporta attualmente:
- 🇮🇹 Italiano (default)
- 🇬🇧 Inglese

URLs:
- http://localhost:3000/it - Homepage italiana
- http://localhost:3000/en - Homepage inglese

## 📋 Requirements

- Node.js v20.18.0 LTS
- pnpm 8.15.6

## 🗺️ Roadmap

- [x] **Fase 0**: Fondazione & Servizi Core
  - [x] Monorepo setup con Turborepo
  - [x] Packages condivisi (TypeScript, ESLint)
  - [x] Frontend Next.js 14 con Tailwind
  - [x] Internazionalizzazione (i18next)
  - [x] Homepage responsive con design moderno
- [ ] **Fase 1**: MVP Orientato all'Utente
  - [ ] Dashboard drag-and-drop personalizzabile
  - [ ] Sistema di autenticazione JWT + Magic Links
  - [ ] API Express per gestione link
  - [ ] Database MongoDB + Redis caching
  - [ ] Widget analytics e gestione link
- [ ] **Fase 2**: Automazione & Advanced Analytics
  - [ ] Bot Telegram integrato
  - [ ] A/B testing per messaggi
  - [ ] Integrazione Keepa per offerte Amazon
  - [ ] Analytics avanzati con segmentazione
- [ ] **Fase 3**: Piattaforma Inserzionista
  - [ ] Dashboard per advertiser
  - [ ] Gestione campagne e creatività
  - [ ] Sistema pagamenti integrato
- [ ] **Fase 4**: Scaling & Funzionalità Enterprise
  - [ ] Team management e permessi
  - [ ] API pubbliche
  - [ ] Webhooks e notifiche avanzate
  - [ ] Programma referral

## 📊 Status Attuale

**Versione**: v1.1.0  
**Ultima Build**: ✅ Funzionante  
**Features Implementate**: 15/100+ pianificate

### ✅ Completato
- Setup monorepo con Turborepo
- Configurazione TypeScript e ESLint condivise
- Frontend Next.js 14 con App Router
- Internazionalizzazione completa (IT/EN)
- Homepage responsive con design moderno
- Sistema di routing locale-based
- Componenti UI base (Navbar, Footer)
- Mock data e hooks per sviluppo

### 🚧 In Sviluppo
- Backend Express API
- Sistema di autenticazione
- Database MongoDB integration

### 📋 Prossimi Step
1. Setup backend Express con TypeScript
2. Configurazione MongoDB e Redis
3. Sistema di autenticazione JWT + Magic Links
4. API per gestione link affiliati

## 🔧 Configurazione i18n

Files di traduzione:
- `apps/web/public/it/common.json` - Italiano
- `apps/web/public/en/common.json` - Inglese

Per aggiungere nuove traduzioni, aggiorna entrambi i file seguendo la struttura JSON esistente.

## 🎯 Demo

L'app è attualmente in fase di sviluppo. Per testare:

```bash
cd apps/web
pnpm dev
```

Naviga su http://localhost:3000/it per vedere la homepage italiana.

## 🤝 Sviluppo

Questo progetto segue un approccio di sviluppo incrementale con commit frequenti e documentazione versionata per ogni milestone importante.

## 📝 Licenza

Proprietario - Afflyt.io © 2025