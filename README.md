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
│   ├── web/              # Next.js Frontend (✅ Completo)
│   ├── api/              # Express Backend (✅ Completo)
│   ├── bot/              # Telegram Bot (📋 Pianificato)
│   └── worker/           # Background Jobs (📋 Pianificato)
├── packages/
│   ├── ui/               # Shared Components (📋 Pianificato)
│   ├── eslint-config/    # ESLint Config (✅ Configurato)
│   └── typescript-config/# TypeScript Config (✅ Configurato)
├── scripts/              # Utility Scripts (📋 Pianificato)
└── docs/                 # Documentazione Versionata
    └── versions/
        ├── v1.0.0.md     # Setup iniziale monorepo
        ├── v1.1.0.md     # Frontend base + i18n
        └── v1.2.0.md     # Backend API completo
```

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Start frontend only
cd apps/web && pnpm dev

# Start backend only  
cd apps/api && pnpm dev

# Build all apps
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## 🌐 URLs di Sviluppo

- **Frontend**: http://localhost:3000 (Next.js)
- **Backend API**: http://localhost:3001 (Express)
- **Health Check**: http://localhost:3001/health
- **API Info**: http://localhost:3001/api/v1

### Internazionalizzazione
- 🇮🇹 http://localhost:3000/it - Homepage italiana
- 🇬🇧 http://localhost:3000/en - Homepage inglese

## 🔌 API Endpoints (v1.2.0)

### Authentication
- `POST /api/v1/auth/register` - Registrazione utente
- `POST /api/v1/auth/login` - Login con credenziali
- `POST /api/v1/auth/magic-link` - Richiesta magic link
- `GET /api/v1/auth/profile` - Profilo utente
- `POST /api/v1/auth/api-keys` - Generazione API key

### Link Management
- `POST /api/v1/links` - Creazione link affiliato
- `GET /api/v1/links` - Lista link utente
- `GET /api/v1/links/recent` - Link recenti
- `GET /api/v1/links/top-performing` - Link top performance
- `GET /api/v1/links/stats` - Statistiche utente

### Public Routes
- `GET /r/{hash}` - Redirect link con tracking

## 📋 Requirements

- Node.js v20.18.0 LTS
- pnpm 8.15.6
- MongoDB (locale o Atlas)
- Redis (opzionale, fallback in-memory)

## ⚙️ Configurazione

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/afflyt_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
RESEND_API_KEY=your-resend-key
ALLOWED_ORIGINS=http://localhost:3000
```

## 🗺️ Roadmap

- [x] **Fase 0**: Fondazione & Servizi Core
  - [x] Monorepo setup con Turborepo
  - [x] Packages condivisi (TypeScript, ESLint)
  - [x] Frontend Next.js 14 con Tailwind
  - [x] Internazionalizzazione (i18next)
  - [x] Homepage responsive con design moderno
- [x] **Fase 1**: MVP Backend API
  - [x] ✅ **Backend Express completo**
  - [x] ✅ **Sistema autenticazione JWT + Magic Links**
  - [x] ✅ **Database MongoDB + Redis caching**
  - [x] ✅ **API gestione link affiliati**
  - [x] ✅ **Middleware sicurezza e rate limiting**
- [ ] **Fase 1.5**: Integrazione Frontend-Backend
  - [ ] Connessione API al dashboard Next.js
  - [ ] Dashboard drag-and-drop con dati reali
  - [ ] Pages autenticazione funzionanti
  - [ ] Form creazione link integrato
  - [ ] Widget analytics con dati live
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

**Versione**: v1.2.0  
**Ultima Build**: ✅ Backend + Frontend Funzionanti  
**Features Implementate**: 25/100+ pianificate

### ✅ Completato (v1.2.0)
- ✅ Setup monorepo con Turborepo
- ✅ Configurazione TypeScript e ESLint condivise
- ✅ Frontend Next.js 14 con App Router
- ✅ Internazionalizzazione completa (IT/EN)
- ✅ Homepage responsive con design moderno
- ✅ **Backend Express API completo**
- ✅ **Sistema autenticazione JWT + Magic Links**
- ✅ **Database MongoDB con modelli tipizzati**
- ✅ **Redis caching con fallback**
- ✅ **API endpoints per gestione link**
- ✅ **Middleware sicurezza e rate limiting**
- ✅ **Click tracking e analytics**

### 🚧 In Sviluppo (v1.3.0)
- Integrazione frontend-backend
- Dashboard con dati reali
- User authentication UI
- Link creation interface

### 📋 Prossimi Step
1. Connettere frontend alle API backend
2. Sostituire mock data con chiamate API reali
3. Implementare form autenticazione
4. Creare interfaccia gestione link

## 🧪 Quick Test

```bash
# Start backend
cd apps/api && pnpm dev

# In another terminal, test API
curl http://localhost:3001/health

# Register test user
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@afflyt.io","password":"password123"}'
```

## 🔧 Configurazione i18n

Files di traduzione:
- `apps/web/public/it/common.json` - Italiano
- `apps/web/public/en/common.json` - Inglese

Per aggiungere nuove traduzioni, aggiorna entrambi i file seguendo la struttura JSON esistente.

## 🎯 Demo

### Frontend
```bash
cd apps/web
pnpm dev
```
Naviga su http://localhost:3000/it per vedere la homepage italiana.

### Backend API
```bash
cd apps/api  
pnpm dev
```
Testa http://localhost:3001/api/v1 per vedere gli endpoints disponibili.

## 📚 Documentazione

- [v1.0.0](./docs/versions/v1.0.0.md) - Setup iniziale monorepo
- [v1.1.0](./docs/versions/v1.1.0.md) - Frontend base + i18n  
- [v1.2.0](./docs/versions/v1.2.0.md) - Backend API completo

## 🤝 Sviluppo

Questo progetto segue un approccio di sviluppo incrementale con:
- Commit frequenti e semantici
- Documentazione versionata per ogni milestone
- Testing continuo delle features
- Architettura scalabile e modulare

## 📝 Licenza

Proprietario - Afflyt.io © 2025