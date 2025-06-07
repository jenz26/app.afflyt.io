// apps/web/src/components/support/faqData.ts
import { FAQItem } from './FAQAccordion';

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: 'create-first-link',
    question: 'Come creo il mio primo link di affiliazione?',
    answer: 'Vai nella Dashboard e clicca su "Crea Link". Inserisci l\'URL di destinazione, personalizza il link se necessario, e salva. Il tuo link sarà immediatamente attivo e tracciabile.',
    category: 'getting-started'
  },
  {
    id: 'track-clicks',
    question: 'Come posso vedere i click sui miei link?',
    answer: 'Nella sezione Analytics della dashboard puoi vedere tutti i click in tempo reale, con statistiche dettagliate su geographic location, dispositivi utilizzati e molto altro.',
    category: 'getting-started'
  },
  {
    id: 'what-is-afflyt',
    question: 'Che cos\'è Afflyt e come funziona?',
    answer: 'Afflyt è una piattaforma avanzata per la gestione di link di affiliazione. Ti permette di creare, tracciare e ottimizzare i tuoi link con analytics dettagliati e strumenti di A/B testing.',
    category: 'getting-started'
  },
  {
    id: 'account-setup',
    question: 'Come configuro il mio account per la prima volta?',
    answer: 'Dopo la registrazione, completa il tuo profilo nelle Impostazioni, genera la tua prima API key se necessario, e crea il tuo primo link di test per familiarizzare con la piattaforma.',
    category: 'getting-started'
  },

  // Links Management
  {
    id: 'custom-domains',
    question: 'Posso usare il mio dominio personalizzato?',
    answer: 'Sì! Nella sezione Impostazioni puoi configurare il tuo dominio personalizzato per i link. Questo aumenta la fiducia degli utenti e migliora il branding.',
    category: 'links'
  },
  {
    id: 'link-expiration',
    question: 'I miei link hanno una scadenza?',
    answer: 'No, i link creati con Afflyt non scadono mai a meno che tu non li disattivi manualmente. Puoi sempre modificare o eliminare i tuoi link dalla dashboard.',
    category: 'links'
  },
  {
    id: 'bulk-creation',
    question: 'Posso creare più link contemporaneamente?',
    answer: 'Sì, puoi utilizzare la funzione di importazione CSV o le nostre API per creare centinaia di link contemporaneamente. Perfetto per campagne su larga scala.',
    category: 'links'
  },
  {
    id: 'link-editing',
    question: 'Posso modificare un link dopo averlo creato?',
    answer: 'Sì, puoi modificare la destinazione URL, il titolo, le note e altri parametri di qualsiasi link dalla sezione "I miei Link". Le modifiche sono applicate immediatamente.',
    category: 'links'
  },
  {
    id: 'qr-codes',
    question: 'Posso generare QR code per i miei link?',
    answer: 'Assolutamente! Ogni link include un QR code generato automaticamente che puoi scaricare in alta risoluzione per materiali stampati o presentazioni.',
    category: 'links'
  },

  // Analytics
  {
    id: 'analytics-delay',
    question: 'Perché le statistiche non sono in tempo reale?',
    answer: 'Le statistiche di base sono disponibili in tempo reale. Quelle più complesse (geographic data, device analytics) possono richiedere fino a 5 minuti per essere elaborate.',
    category: 'analytics'
  },
  {
    id: 'export-data',
    question: 'Posso esportare i miei dati analytics?',
    answer: 'Assolutamente! Puoi esportare tutti i tuoi dati in formato CSV o JSON direttamente dalla dashboard, oppure utilizzare le nostre API per integrazioni personalizzate.',
    category: 'analytics'
  },
  {
    id: 'click-attribution',
    question: 'Come funziona l\'attribuzione dei click?',
    answer: 'Tracciamo ogni click con timestamp preciso, IP address (anonimizzato per privacy), user agent, referrer e geolocalizzazione. Ogni sessione unica viene identificata ma rispettando la privacy degli utenti.',
    category: 'analytics'
  },
  {
    id: 'conversion-tracking',
    question: 'Come posso tracciare le conversioni?',
    answer: 'Puoi impostare pixel di conversione o webhook per tracciare quando un click si trasforma in vendita. Supportiamo integrazione con Google Analytics, Facebook Pixel e sistemi custom.',
    category: 'analytics'
  },

  // API
  {
    id: 'api-limits',
    question: 'Ci sono limiti alle chiamate API?',
    answer: 'Il piano gratuito include 1.000 chiamate API al mese. I piani premium offrono limiti più alti. Puoi sempre controllare il tuo utilizzo nella sezione API Keys.',
    category: 'api'
  },
  {
    id: 'api-documentation',
    question: 'Dove trovo la documentazione delle API?',
    answer: 'La documentazione completa è disponibile su docs.afflyt.io. Include esempi di codice, tutorial e reference completo per tutti gli endpoint.',
    category: 'api'
  },
  {
    id: 'api-authentication',
    question: 'Come autentico le chiamate API?',
    answer: 'Utilizza le API keys generate nella tua dashboard. Includi l\'header "Authorization: Bearer YOUR_API_KEY" in tutte le richieste. Le chiavi possono essere rigenerate in qualsiasi momento.',
    category: 'api'
  },
  {
    id: 'webhooks',
    question: 'Supportate i webhook per eventi in tempo reale?',
    answer: 'Sì! Puoi configurare webhook per ricevere notifiche istantanee su click, conversioni, e altri eventi. Supportiamo retry automatici e firme di sicurezza.',
    category: 'api'
  },

  // Billing
  {
    id: 'pricing-plans',
    question: 'Quali sono i piani di prezzo disponibili?',
    answer: 'Offriamo un piano gratuito per iniziare, e piani premium con funzionalità avanzate. Tutti i piani includono analytics completi, supporto tecnico e accesso alle API.',
    category: 'billing'
  },
  {
    id: 'upgrade-downgrade',
    question: 'Posso cambiare piano in qualsiasi momento?',
    answer: 'Sì, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. Le modifiche sono applicate immediatamente e fatturate pro-rata.',
    category: 'billing'
  },

  // Technical
  {
    id: 'tracking-issues',
    question: 'I click non vengono tracciati correttamente',
    answer: 'Verifica che il link sia stato copiato correttamente e che non ci siano redirect intermedi. Se il problema persiste, contattaci con l\'ID del link specifico.',
    category: 'technical'
  },
  {
    id: 'browser-compatibility',
    question: 'Afflyt funziona su tutti i browser?',
    answer: 'Sì, Afflyt è compatibile con tutti i browser moderni inclusi Chrome, Firefox, Safari, Edge. Per la migliore esperienza consigliamo di mantenere il browser aggiornato.',
    category: 'technical'
  },
  {
    id: 'ssl-security',
    question: 'I miei link sono sicuri?',
    answer: 'Tutti i link utilizzano HTTPS e sono protetti con certificati SSL. Implementiamo anche protezioni contro spam, bot e click fraudolenti.',
    category: 'technical'
  },
  {
    id: 'data-retention',
    question: 'Per quanto tempo conservate i miei dati?',
    answer: 'I dati analytics sono conservati indefinitamente per il tuo account attivo. Se chiudi l\'account, i dati sono mantenuti per 30 giorni prima della cancellazione definitiva.',
    category: 'technical'
  }
];