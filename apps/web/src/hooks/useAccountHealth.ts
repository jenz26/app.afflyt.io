// apps/web/src/hooks/useAccountHealth.ts
'use client';

import { useMemo } from 'react';
import { useUserProfile, useApiKeys } from './useApi';
import { useAuth } from './useAuth';

export interface HealthMetric {
  id: string;
  label: string;
  value: string | number;
  status: 'excellent' | 'good' | 'warning' | 'error' | 'critical';
  score: number; // 1-4 for calculations
  description: string;
  actionable: boolean;
  link?: string;
  priority: number; // 1-5, higher = more important
}

export interface OverallHealth {
  score: number; // 0-100
  label: string;
  color: 'green' | 'blue' | 'yellow' | 'red' | 'gray';
  criticalIssues: number;
  warningIssues: number;
}

export interface AccountHealthData {
  metrics: HealthMetric[];
  overall: OverallHealth;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  
  // ✨ NEW: Quick access to multi-entity stats
  amazonTags: {
    count: number;
    active: number;
    hasDefault: boolean;
    marketplaces: number;
  };
  channels: {
    count: number;
    active: number;
    hasDefault: boolean;
    types: number;
  };
  legacy: {
    hasAmazonTag: boolean;
    hasWebsite: boolean;
    isUsingLegacy: boolean;
  };
}

export function useAccountHealth(): AccountHealthData {
  const { data: profile, isLoading: profileLoading, error: profileError, refetch } = useUserProfile();
  const { data: apiKeys, isLoading: apiKeysLoading, error: apiKeysError } = useApiKeys();
  const { user, isEmailVerified, userRole } = useAuth();

  const healthData = useMemo(() => {
    if (!profile || !user) {
      return {
        metrics: [],
        overall: { score: 0, label: 'Sconosciuto', color: 'gray' as const, criticalIssues: 0, warningIssues: 0 },
        amazonTags: { count: 0, active: 0, hasDefault: false, marketplaces: 0 },
        channels: { count: 0, active: 0, hasDefault: false, types: 0 },
        legacy: { hasAmazonTag: false, hasWebsite: false, isUsingLegacy: false }
      };
    }

    // ✨ Calculate multi-entity stats
    const amazonTagsCount = profile.amazonTags?.length || 0;
    const activeAmazonTags = profile.amazonTags?.filter(tag => tag.isActive !== false).length || 0;
    const hasDefaultAmazonTag = profile.amazonTags?.some(tag => tag.isDefault) || false;
    const uniqueMarketplaces = new Set(profile.amazonTags?.map(tag => tag.marketplace) || []).size;

    const channelsCount = profile.channels?.length || 0;
    const activeChannels = profile.channels?.filter(channel => channel.isActive !== false).length || 0;
    const hasDefaultChannel = profile.channels?.some(channel => channel.isDefault) || false;
    const uniqueChannelTypes = new Set(profile.channels?.map(channel => channel.type) || []).size;

    // Legacy status
    const hasLegacyAmazonTag = !!user.amazonAssociateTag;
    const hasLegacyWebsite = !!user.websiteUrl;
    const isUsingLegacy = (hasLegacyAmazonTag || hasLegacyWebsite) && (amazonTagsCount === 0 && channelsCount === 0);

    const amazonTagsData = {
      count: amazonTagsCount,
      active: activeAmazonTags,
      hasDefault: hasDefaultAmazonTag,
      marketplaces: uniqueMarketplaces
    };

    const channelsData = {
      count: channelsCount,
      active: activeChannels,
      hasDefault: hasDefaultChannel,
      types: uniqueChannelTypes
    };

    const legacyData = {
      hasAmazonTag: hasLegacyAmazonTag,
      hasWebsite: hasLegacyWebsite,
      isUsingLegacy
    };

    const metrics: HealthMetric[] = [];

    // 1. Email Verification (CRITICAL)
    metrics.push({
      id: 'email_verification',
      label: 'Verifica Email',
      value: isEmailVerified ? 'Verificata' : 'Richiesta',
      status: isEmailVerified ? 'excellent' : 'critical',
      score: isEmailVerified ? 4 : 1,
      description: isEmailVerified 
        ? 'Email verificata - accesso completo alle funzionalità' 
        : 'Verifica la tua email per utilizzare tutte le funzionalità',
      actionable: !isEmailVerified,
      priority: 5
    });

    // 2. Amazon Tags Configuration (HIGH PRIORITY)
    let amazonStatus: HealthMetric['status'];
    let amazonScore: number;
    let amazonDescription: string;

    if (amazonTagsCount === 0 && !hasLegacyAmazonTag) {
      amazonStatus = 'critical';
      amazonScore = 1;
      amazonDescription = 'Configura almeno un Amazon tag per iniziare a creare link affiliati';
    } else if (amazonTagsCount >= 3 && hasDefaultAmazonTag && uniqueMarketplaces >= 2) {
      amazonStatus = 'excellent';
      amazonScore = 4;
      amazonDescription = `${activeAmazonTags} tag attivi su ${uniqueMarketplaces} marketplace con default configurato - configurazione ottimale`;
    } else if (amazonTagsCount >= 1 && hasDefaultAmazonTag) {
      amazonStatus = 'good';
      amazonScore = 3;
      amazonDescription = `${activeAmazonTags} tag attivi con default configurato`;
    } else if (amazonTagsCount >= 1 || hasLegacyAmazonTag) {
      amazonStatus = 'warning';
      amazonScore = 2;
      amazonDescription = amazonTagsCount > 0 
        ? 'Imposta un tag predefinito per automatizzare la creazione di link' 
        : 'Tag legacy configurato - migra ai nuovi Amazon Tags per funzionalità avanzate';
    } else {
      amazonStatus = 'error';
      amazonScore = 1;
      amazonDescription = 'Configurazione Amazon incompleta';
    }

    metrics.push({
      id: 'amazon_tags',
      label: 'Amazon Tags',
      value: amazonTagsCount === 0 
        ? (hasLegacyAmazonTag ? 'Legacy' : 'Nessuno') 
        : `${amazonTagsCount} (${uniqueMarketplaces} marketplace)`,
      status: amazonStatus,
      score: amazonScore,
      description: amazonDescription,
      actionable: amazonTagsCount === 0 || !hasDefaultAmazonTag,
      link: '/dashboard/profile#amazon-tags',
      priority: 4
    });

    // 3. Channels Configuration (MEDIUM PRIORITY)
    let channelStatus: HealthMetric['status'];
    let channelScore: number;
    let channelDescription: string;

    if (channelsCount === 0 && !hasLegacyWebsite) {
      channelStatus = 'warning';
      channelScore = 2;
      channelDescription = 'Aggiungi canali per tracking granulare delle performance per fonte';
    } else if (channelsCount >= 3 && hasDefaultChannel && uniqueChannelTypes >= 2) {
      channelStatus = 'excellent';
      channelScore = 4;
      channelDescription = `${activeChannels} canali attivi su ${uniqueChannelTypes} tipi diversi con default - tracking ottimale`;
    } else if (channelsCount >= 1 && hasDefaultChannel) {
      channelStatus = 'good';
      channelScore = 3;
      channelDescription = `${activeChannels} canali configurati con default`;
    } else if (channelsCount >= 1 || hasLegacyWebsite) {
      channelStatus = 'warning';
      channelScore = 2;
      channelDescription = channelsCount > 0
        ? 'Imposta un canale predefinito per automazione'
        : 'Sito legacy configurato - migra ai nuovi Canali per tracking avanzato';
    } else {
      channelStatus = 'warning';
      channelScore = 2;
      channelDescription = 'Nessun canale configurato';
    }

    metrics.push({
      id: 'channels',
      label: 'Canali',
      value: channelsCount === 0 
        ? (hasLegacyWebsite ? 'Sito legacy' : 'Nessuno') 
        : `${channelsCount} (${uniqueChannelTypes} tipi)`,
      status: channelStatus,
      score: channelScore,
      description: channelDescription,
      actionable: channelsCount === 0 || !hasDefaultChannel,
      link: '/dashboard/profile#channels',
      priority: 3
    });

    // 4. API Keys (MEDIUM PRIORITY)
    const apiKeysActive = apiKeys?.filter(key => key.isActive).length || 0;
    let apiKeysStatus: HealthMetric['status'];
    let apiKeysScore: number;

    if (apiKeysActive === 0) {
      apiKeysStatus = 'warning';
      apiKeysScore = 2;
    } else if (apiKeysActive >= 2) {
      apiKeysStatus = 'excellent';
      apiKeysScore = 4;
    } else {
      apiKeysStatus = 'good';
      apiKeysScore = 3;
    }

    metrics.push({
      id: 'api_keys',
      label: 'API Keys',
      value: `${apiKeysActive}/10`,
      status: apiKeysStatus,
      score: apiKeysScore,
      description: apiKeysActive === 0 
        ? 'Crea almeno una API key per automazione e integrazioni'
        : `${apiKeysActive} chiavi API attive per automazione`,
      actionable: apiKeysActive === 0,
      link: '/dashboard/api-keys',
      priority: 3
    });

    // 5. Profile Completeness (LOWER PRIORITY)
    const profileFields = [
      { field: 'name', value: profile.name, weight: 1 },
      { field: 'firstName', value: profile.firstName, weight: 0.5 },
      { field: 'lastName', value: profile.lastName, weight: 0.5 },
      { field: 'companyName', value: profile.companyName, weight: 0.5 },
    ];
    
    const totalWeight = profileFields.reduce((sum, field) => sum + field.weight, 0);
    const completedWeight = profileFields.reduce((sum, field) => sum + (field.value ? field.weight : 0), 0);
    const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

    let profileStatus: HealthMetric['status'];
    let profileScore: number;

    if (completionPercentage >= 90) { profileStatus = 'excellent'; profileScore = 4; }
    else if (completionPercentage >= 75) { profileStatus = 'good'; profileScore = 3; }
    else if (completionPercentage >= 50) { profileStatus = 'warning'; profileScore = 2; }
    else { profileStatus = 'error'; profileScore = 1; }

    metrics.push({
      id: 'profile_completeness',
      label: 'Profilo Completo',
      value: `${completionPercentage}%`,
      status: profileStatus,
      score: profileScore,
      description: `Informazioni personali completate al ${completionPercentage}%`,
      actionable: completionPercentage < 90,
      link: '/dashboard/profile',
      priority: 2
    });

    // 6. System Migration Status (LOW PRIORITY - only if using legacy)
    if (isUsingLegacy) {
      metrics.push({
        id: 'system_migration',
        label: 'Migrazione Sistema',
        value: 'Richiesta',
        status: 'warning',
        score: 2,
        description: 'Migra ai nuovi Amazon Tags e Canali per funzionalità avanzate e analytics dettagliate',
        actionable: true,
        link: '/dashboard/profile',
        priority: 1
      });
    } else if (amazonTagsCount > 0 || channelsCount > 0) {
      metrics.push({
        id: 'system_migration',
        label: 'Sistema',
        value: 'Aggiornato',
        status: 'excellent',
        score: 4,
        description: 'Stai usando le funzionalità più avanzate della piattaforma',
        actionable: false,
        priority: 1
      });
    }

    // Calculate overall health
    const totalScore = metrics.reduce((sum, metric) => sum + (metric.score * metric.priority), 0);
    const totalPossibleScore = metrics.reduce((sum, metric) => sum + (4 * metric.priority), 0);
    const overallScore = Math.round((totalScore / totalPossibleScore) * 100);

    const criticalIssues = metrics.filter(m => m.status === 'critical' || m.status === 'error').length;
    const warningIssues = metrics.filter(m => m.status === 'warning').length;

    let overallLabel: string;
    let overallColor: OverallHealth['color'];

    if (overallScore >= 90 && criticalIssues === 0) {
      overallLabel = 'Eccellente';
      overallColor = 'green';
    } else if (overallScore >= 75 && criticalIssues === 0) {
      overallLabel = 'Buono';
      overallColor = 'blue';
    } else if (overallScore >= 50 || criticalIssues <= 1) {
      overallLabel = 'Attenzione';
      overallColor = 'yellow';
    } else {
      overallLabel = 'Critico';
      overallColor = 'red';
    }

    const overall: OverallHealth = {
      score: overallScore,
      label: overallLabel,
      color: overallColor,
      criticalIssues,
      warningIssues
    };

    return { 
      metrics: metrics.sort((a, b) => b.priority - a.priority), 
      overall,
      amazonTags: amazonTagsData,
      channels: channelsData,
      legacy: legacyData
    };
  }, [profile, user, apiKeys, isEmailVerified, userRole]);

  return {
    ...healthData,
    isLoading: profileLoading || apiKeysLoading,
    error: profileError || apiKeysError || null,
    refresh: refetch
  };
}