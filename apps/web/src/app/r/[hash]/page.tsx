import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import PreviewClient from './PreviewClient';

// Tipi per la risposta dell'API (basati sulla struttura reale)
interface ApiResponse {
  success: boolean;
  data: {
    link: {
      hash: string;
      originalUrl: string;
      tag?: string;
      isActive: boolean;
      createdAt: string;
    };
    branding: {
      themeColor?: string | null;
      backgroundColor?: string | null;
      showAffiliateBadge?: boolean;
      customAffiliateText?: string;
    };
    owner: {
      displayName: string;
    };
  };
  timestamp: string;
  message: string;
}

interface PreviewPageProps {
  params: {
    hash: string;
  };
}

// Funzione per fetch dei dati del link
async function getLinkData(hash: string): Promise<ApiResponse | null> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${API_BASE}/api/public/links/${hash}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`API responded with status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    // Validazione dei dati essenziali
    if (!data || !data.success || !data.data || !data.data.link || !data.data.link.originalUrl) {
      console.error('Invalid data structure: missing required fields');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching link data:', error);
    return null;
  }
}

// Funzione per tracciare il click lato server
async function trackClick(hash: string): Promise<void> {
  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    await fetch(`${API_BASE}/api/public/track/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hash }),
      cache: 'no-store',
    });
  } catch (error) {
    console.error('Error tracking click:', error);
  }
}

// Metadata dinamici
export async function generateMetadata({ params }: PreviewPageProps): Promise<Metadata> {
  const linkData = await getLinkData(params.hash);

  if (!linkData) {
    return {
      title: 'Link not found',
      description: 'The requested link could not be found.',
    };
  }

  const displayName = linkData.data.owner.displayName || 'Creator';

  return {
    title: linkData.data.link.tag || `Link by ${displayName}`,
    description: `Affiliate link shared by ${displayName}`,
    robots: 'noindex, nofollow',
  };
}

// Componente principale - Server Component che passa dati al Client Component
export default async function PreviewPage({ params }: PreviewPageProps) {
  const { hash } = params;

  // Fetch dei dati e tracking in parallelo
  const [linkData] = await Promise.all([
    getLinkData(hash),
    trackClick(hash),
  ]);

  // Se non troviamo il link, mostriamo 404
  if (!linkData) {
    notFound();
  }

  // Estrazione dei dati dalla risposta API
  const ownerData = {
    displayName: linkData.data.owner.displayName || 'Creator sconosciuto',
    themeColor: linkData.data.branding.themeColor || null,
    customAffiliateText: linkData.data.branding.customAffiliateText || 'In qualità di Affiliato, ricevo un guadagno dagli acquisti idonei.',
    backgroundColor: linkData.data.branding.backgroundColor || null,
    showAffiliateBadge: linkData.data.branding.showAffiliateBadge ?? true, // Default true se undefined
  };

  // Estrai il dominio dalla URL di destinazione
  let destinationDomain: string;
  try {
    destinationDomain = new URL(linkData.data.link.originalUrl).hostname;
  } catch (error) {
    console.error('Invalid URL:', linkData.data.link.originalUrl);
    destinationDomain = 'destinazione sconosciuta';
  }

  // Determina il colore del pulsante: usa themeColor o fallback al gradiente Afflyt
  const buttonStyle = ownerData.themeColor 
    ? { backgroundColor: ownerData.themeColor }
    : {};

  const buttonClasses = ownerData.themeColor
    ? "bg-current hover:opacity-90"
    : "bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700";

  // Passa tutti i dati necessari al Client Component
  return (
    <PreviewClient
      hash={hash}
      originalUrl={linkData.data.link.originalUrl}
      ownerData={ownerData}
      destinationDomain={destinationDomain}
      buttonStyle={buttonStyle}
      buttonClasses={buttonClasses}
    />
  );
}