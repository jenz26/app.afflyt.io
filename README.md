Assolutamente. Ho capito perfettamente. Il `README.md` che mi hai mostrato è un buon punto di partenza, ma è obsoleto e non riflette la complessità, la maturità e lo stato attuale del progetto che ho analizzato in dettaglio. Hai bisogno di un documento che sia il vero **centro di gravità del repository**: una guida completa per te, per futuri collaboratori e una testimonianza della qualità del lavoro svolto.

Basandomi su **tutto il codice** che mi hai fornito (backend, frontend, hooks, contesti, tipi, servizi) e sulla cronologia dei tuoi file di versione, ho preparato il `README.md` completo, dettagliato e critico che hai richiesto.

Ho prestato particolare attenzione alla tua nota: "occhio che la dashboard dinamica non è implementata". Ho corretto la roadmap e lo stato attuale per riflettere che la dashboard principale è la `StaticDashboard` e che la versione drag-and-drop è una feature futura, garantendo che il documento sia accurato.

---

# Afflyt.io - Piattaforma di Affiliate Marketing & Analytics (v1.8.0-alpha)

![CI/CD](https://img.shields.io/github/actions/workflow/status/jenz26/app.afflyt.io/ci.yml?branch=main&style=for-the-badge)
![Version](https://img.shields.io/badge/version-v1.8.0--alpha-blue?style=for-the-badge)
![License](https://img.shields.io/github/license/jenz26/app.afflyt.io?style=for-the-badge)

**Trasforma i tuoi link affiliati in una macchina di conversione.**

Afflyt.io è una piattaforma SaaS completa per affiliate marketing che unisce la gestione centralizzata di link affiliati con l'automazione multi-canale e analytics avanzati. È progettata per **creator, influencer e marketer "data-driven"** che richiedono strumenti potenti ma intuitivi.

## 🚀 Stato Attuale del Progetto (v1.8.0-alpha)

Il progetto ha raggiunto lo stato di **MVP Stabile Avanzato**. Il backend è completo e production-ready, mentre il frontend è interamente funzionale, integrato con le API reali e offre un'esperienza utente di livello enterprise.

- ✅ **Backend API Completo (v1.3.0):** Tutti gli endpoint per la gestione di utenti, link, conversioni, API keys, e analytics sono implementati e ottimizzati.
- ✅ **Frontend Core MVP Completo (v1.8.0-alpha):** Tutta l'interfaccia utente è stata implementata, inclusa una dashboard operativa (`StaticDashboard`), pagine di gestione dettagliate per Link, API Keys e Profilo, e un flusso di autenticazione sicuro.
- ✅ **Gestione Multi-Entità:** Supporto completo per la gestione di multipli **Amazon Tags** per diversi marketplace e multipli **Canali** (siti, social) per un tracking granulare.

## ✨ Funzionalità Principali

*   **Dashboard Operativa:** Una dashboard che funge da centro di controllo, con widget per la salute dell'account, azioni rapide contestuali e una panoramica delle performance.
*   **Analytics Avanzati:** Una pagina dedicata con widget interattivi (Heatmap oraria, distribuzioni geografiche/dispositivi, top link) alimentati da dati reali.
*   **Gestione Link Affiliati:** Creazione di short URL tracciabili, con validazione, associazione a Tag/Canali e statistiche dettagliate.
*   **Gestione Multi-Entità:** Sistema avanzato per gestire più Amazon Associate Tags per diversi marketplace e più canali di pubblicazione.
*   **Gestione API Keys:** Interfaccia CRUD completa per permettere agli utenti di generare e gestire le proprie chiavi API.
*   **Autenticazione Sicura:** Sistema moderno passwordless basato su Magic Links (via email) e JWT.
*   **Internazionalizzazione (i18n):** Supporto completo per Italiano e Inglese in tutta l'interfaccia.

## 🛠️ Stack Tecnologico

| Categoria      | Tecnologia                                                              |
| -------------- | ----------------------------------------------------------------------- |
| **Monorepo**   | Turborepo + pnpm                                                        |
| **Frontend**   | Next.js 14 (App Router), TypeScript, Tailwind CSS, DND Kit, Recharts    |
| **Backend**    | Node.js, Express 4, TypeScript                                          |
| **Database**   | MongoDB (con driver nativo)                                             |
| **Caching**    | Redis (con fallback in-memory)                                          |
| **Auth**       | JWT, Magic Links (Resend)                                               |
| **Testing**    | Vitest, Supertest                                                       |
| **Deployment** | Vercel (Web), Render.com (API)                                          |

## 📁 Struttura del Progetto

```
/
├── apps/               # Applicazioni
│   ├── api/            # Backend Express.js (API RESTful)
│   ├── web/            # Frontend Next.js (Interfaccia utente)
│   ├── bot/            # Futuro: Bot Telegram
│   └── worker/         # Futuro: Worker per task in background
├── packages/           # Packages condivisi
│   ├── eslint-config/  # Configurazioni ESLint
│   └── typescript-config/ # Configurazioni TypeScript
├── scripts/            # Script di utility
└── docs/               # Documentazione versionata
```

## 🚀 Getting Started

### Prerequisiti
- Node.js v20.18.0 LTS
- pnpm v8.15.6
- MongoDB
- Redis

### Installazione e Avvio
1.  **Clonare il repository:**
    ```cmd
    git clone https://github.com/jenz26/app.afflyt.io.git
    cd app.afflyt.io
    ```
2.  **Installare le dipendenze:**
    ```cmd
    pnpm install
    ```
3.  **Configurare le variabili d'ambiente:**
    Copia i file `.example` in `.env` (per `apps/api`) e `.env.local` (per `apps/web`) e compilali con le tue credenziali.
4.  **Avviare l'applicazione:**
    ```cmd
    pnpm dev
    ```
    *   **Frontend**: `http://localhost:3000`
    *   **Backend**: `http://localhost:3001`
    *   **API Docs (Swagger)**: `http://localhost:3001/docs`

## 🔌 Documentazione API (Sintesi v1.8.0-alpha)

L'API è protetta da JWT e segue le best practice RESTful. Gli endpoint sono organizzati per funzione e versione.

### Autenticazione (`/api/v1/auth`)
| Metodo | Endpoint                  | Descrizione                                        |
| ------ | ------------------------- | -------------------------------------------------- |
| `POST` | `/register`               | Registra un nuovo utente.                          |
| `POST` | `/magic-link`             | Invia un magic link per il login passwordless.     |
| `POST` | `/magic-link/verify`      | Verifica un token magic link e restituisce un JWT. |

---

### Gestione Utente (`/api/user`)
| Metodo        | Endpoint                   | Descrizione                              |
| ------------- | -------------------------- | ---------------------------------------- |
| `GET`         | `/me`                      | Recupera il profilo utente completo.         |
| `PUT`         | `/me`                      | Aggiorna il profilo utente.          |
| `GET`, `POST` | `/keys`                    | Recupera o crea una API Key.             |
| `PATCH`, `DEL`| `/keys/:keyId`             | Aggiorna o elimina una API Key.          |
| `GET`, `POST` | `/amazon-tags`             | Recupera o crea un Amazon Tag.           |
| `GET`, `PATCH`, `DEL` | `/amazon-tags/:tagId`    | Gestisce un singolo Amazon Tag.          |
| `GET`, `POST` | `/channels`                | Recupera o crea un Canale.               |
| `GET`, `PATCH`, `DEL` | `/channels/:channelId`     | Gestisce un singolo Canale.              |

---

### Gestione Link (`/api/v1/links`)
| Metodo | Endpoint | Descrizione                           |
| ------ | -------- | ------------------------------------- |
| `POST` | `/`      | Crea un nuovo link affiliato.         |
| `GET`  | `/`      | Recupera la lista dei link dell'utente. |
| `GET`  | `/:hash` | Recupera i dettagli di un singolo link. |

**Esempio: Creazione Link (con Multi-Entità)**
```cmd
curl -X POST http://localhost:3001/api/v1/links ^
  -H "Authorization: Bearer <tuo_jwt_token>" ^
  -H "Content-Type: application/json" ^
  -d '{
        "originalUrl": "https://www.amazon.it/dp/B08N5WRWNW",
        "tag": "black-friday",
        "channelId": "ID_DEL_TUO_CANALE",
        "amazonTagId": "ID_DEL_TUO_AMAZON_TAG"
      }'
```

---

### Analytics (`/api/user/analytics`)
| Metodo | Endpoint                     | Descrizione                                                               |
| ------ | ---------------------------- | ------------------------------------------------------------------------- |
| `GET`  | `/summary`                   | Restituisce un sommario delle metriche chiave.                            |
| `GET`  | `/clicks-trend`              | Restituisce i dati per il grafico dell'andamento dei click.               |
| `GET`  | `/hourly-heatmap`            | Restituisce i dati per la heatmap oraria delle attività.                  |
| `GET`  | `/top-performing-links`      | Restituisce la lista dei link più performanti.                            |
| `GET`  | `/distribution/:type`        | Restituisce la distribuzione per `geo`, `device`, `browser`, `referer`.    |

---

### Endpoint Pubblici
| Metodo | Endpoint           | Descrizione                                              |
| ------ | ------------------ | -------------------------------------------------------- |
| `GET`  | `/r/:hash`         | Reindirizza all'URL originale e traccia il click.        |
| `POST` | `/track/conversion`| Endpoint per postback/pixel per tracciare le conversioni. |

## 🗺️ Roadmap e Stato di Avanzamento

-   [x] **Fase 0 - Fondazione**: Setup del monorepo e delle tecnologie base.
-   [x] **Fase 1.3 - Backend Completo**: API production-ready con tutti gli endpoint.
-   [x] **Fase 1.8 - Core MVP Frontend Completo**: Interfaccia utente completa e integrata.
    -   [x] Homepage e flusso di autenticazione.
    -   [x] Dashboard "Home Operativa" con widget e dati reali.
    -   [x] Pagine di gestione (Link, API Keys, Profilo) funzionali.
    -   [x] Pagina di Analytics avanzati.
    -   [x] Supporto completo a Multi-Tag e Multi-Channel.
-   [ ] **Fase 2 - Automazione & Ottimizzazione (PROSSIMO)**:
    -   [ ] Sviluppo del **Bot Telegram** (`apps/bot`).
    -   [ ] Implementazione del framework di **A/B Testing**.
    -   [ ] **Dashboard Dinamica (Drag-and-Drop)** con `useDashboardLayout` e DND Kit.
-   [ ] **Fase 3 - Piattaforma Inserzionista**: Sviluppo della dashboard per i merchant.

---
**Afflyt.io © 2025 - Built for ambitious creators.**