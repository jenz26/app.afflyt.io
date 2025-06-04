import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AfflytApiError } from '@/lib/api';

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  description?: string;
  size: 'small' | 'medium' | 'large' | 'full';
  order: number;
  isVisible: boolean;
  settings?: Record<string, any>;
}

export interface DashboardLayout {
  widgets: WidgetConfig[];
  lastModified: string;
}

const defaultWidgets: WidgetConfig[] = [
  {
    id: 'stats-summary',
    type: 'stats-summary',
    title: 'Panoramica Generale',
    description: 'Statistiche principali dell\'account',
    size: 'full',
    order: 0,
    isVisible: true,
  },
  {
    id: 'clicks-trend',
    type: 'clicks-trend',
    title: 'Tendenza Click',
    description: 'Grafico dei click nel tempo',
    size: 'large',
    order: 1,
    isVisible: true,
    settings: { period: '7d', showUniqueClicks: true },
  },
  {
    id: 'revenue-trend',
    type: 'revenue-trend',
    title: 'Tendenza Ricavi',
    description: 'Grafico dei ricavi nel tempo',
    size: 'large',
    order: 2,
    isVisible: true,
    settings: { period: '7d', showConversions: true },
  },
  {
    id: 'recent-links',
    type: 'recent-links',
    title: 'Link Recenti',
    description: 'Ultimi link creati',
    size: 'medium',
    order: 3,
    isVisible: true,
    settings: { limit: 5, showClicks: true },
  },
  {
    id: 'top-performing',
    type: 'top-performing',
    title: 'Top Performance',
    description: 'Link con migliori risultati',
    size: 'medium',
    order: 4,
    isVisible: true,
    settings: { sortBy: 'revenue', limit: 5 },
  },
];

const defaultLayout: DashboardLayout = {
  widgets: defaultWidgets,
  lastModified: new Date().toISOString(),
};

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { getAuthenticatedApiClient, isLoggedIn } = useAuth();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedLayoutRef = useRef<string>('');

  const visibleWidgets = useMemo(() => 
    layout.widgets.filter(widget => widget.isVisible).sort((a, b) => a.order - b.order),
    [layout.widgets]
  );

  const availableWidgets = useMemo(() => 
    layout.widgets.filter(widget => !widget.isVisible),
    [layout.widgets]
  );

  const fetchLayout = useCallback(async () => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await apiClient.get<DashboardLayout>('/api/user/dashboard-layout');
      
      if (result && result.widgets) {
        const savedWidgetIds = result.widgets.map(w => w.id);
        const missingWidgets = defaultWidgets.filter(w => !savedWidgetIds.includes(w.id));
        
        const mergedWidgets = [
          ...result.widgets,
          ...missingWidgets.map(w => ({ ...w, order: result.widgets.length + w.order }))
        ];

        const mergedLayout: DashboardLayout = {
          ...result,
          widgets: mergedWidgets,
        };

        setLayout(mergedLayout);
        lastSavedLayoutRef.current = JSON.stringify(mergedLayout.widgets);
      } else {
        setLayout(defaultLayout);
        lastSavedLayoutRef.current = JSON.stringify(defaultLayout.widgets);
      }
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to load dashboard layout';
      
      console.warn('Failed to load layout, using default:', errorMessage);
      setError(errorMessage);
      setLayout(defaultLayout);
      lastSavedLayoutRef.current = JSON.stringify(defaultLayout.widgets);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const saveLayout = useCallback(async (layoutToSave: DashboardLayout) => {
    if (!isLoggedIn) return;

    const apiClient = getAuthenticatedApiClient();
    if (!apiClient) return;

    const currentLayoutString = JSON.stringify(layoutToSave.widgets);
    if (currentLayoutString === lastSavedLayoutRef.current) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await apiClient.put('/api/user/dashboard-layout', layoutToSave);
      lastSavedLayoutRef.current = currentLayoutString;
    } catch (err) {
      const errorMessage = err instanceof AfflytApiError 
        ? err.message 
        : 'Failed to save dashboard layout';
      
      console.error('Failed to save layout:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [isLoggedIn, getAuthenticatedApiClient]);

  const debouncedSave = useCallback((layoutToSave: DashboardLayout) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveLayout(layoutToSave);
    }, 500);
  }, [saveLayout]);

  const reorderWidgets = useCallback((newOrder: string[]) => {
    setLayout(currentLayout => {
      const updatedWidgets = currentLayout.widgets.map(widget => {
        const newIndex = newOrder.indexOf(widget.id);
        return {
          ...widget,
          order: newIndex >= 0 ? newIndex : widget.order,
        };
      });

      const updatedLayout: DashboardLayout = {
        widgets: updatedWidgets,
        lastModified: new Date().toISOString(),
      };

      if (isEditMode) {
        debouncedSave(updatedLayout);
      }

      return updatedLayout;
    });
  }, [isEditMode, debouncedSave]);

  const toggleWidgetVisibility = useCallback((widgetId: string) => {
    setLayout(currentLayout => {
      const updatedWidgets = currentLayout.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, isVisible: !widget.isVisible };
        }
        return widget;
      });

      const updatedLayout: DashboardLayout = {
        widgets: updatedWidgets,
        lastModified: new Date().toISOString(),
      };

      if (isEditMode) {
        debouncedSave(updatedLayout);
      }

      return updatedLayout;
    });
  }, [isEditMode, debouncedSave]);

  const updateWidgetSettings = useCallback((widgetId: string, settings: Record<string, any>) => {
    setLayout(currentLayout => {
      const updatedWidgets = currentLayout.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, settings: { ...widget.settings, ...settings } };
        }
        return widget;
      });

      const updatedLayout: DashboardLayout = {
        widgets: updatedWidgets,
        lastModified: new Date().toISOString(),
      };

      if (isEditMode) {
        debouncedSave(updatedLayout);
      }

      return updatedLayout;
    });
  }, [isEditMode, debouncedSave]);

  const updateWidgetSize = useCallback((widgetId: string, size: WidgetConfig['size']) => {
    setLayout(currentLayout => {
      const updatedWidgets = currentLayout.widgets.map(widget => {
        if (widget.id === widgetId) {
          return { ...widget, size };
        }
        return widget;
      });

      const updatedLayout: DashboardLayout = {
        widgets: updatedWidgets,
        lastModified: new Date().toISOString(),
      };

      if (isEditMode) {
        debouncedSave(updatedLayout);
      }

      return updatedLayout;
    });
  }, [isEditMode, debouncedSave]);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => {
      const newEditMode = !prev;
      
      if (prev && saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveLayout(layout);
      }
      
      return newEditMode;
    });
  }, [layout, saveLayout]);

  const resetToDefault = useCallback(() => {
    const resetLayout = {
      ...defaultLayout,
      lastModified: new Date().toISOString(),
    };
    
    setLayout(resetLayout);
    
    if (isEditMode) {
      debouncedSave(resetLayout);
    }
  }, [isEditMode, debouncedSave]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchLayout();
    }
  }, [isLoggedIn, fetchLayout]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    layout,
    isLoading,
    error,
    isEditMode,
    isSaving,
    visibleWidgets,
    availableWidgets,
    toggleEditMode,
    reorderWidgets,
    toggleWidgetVisibility,
    updateWidgetSettings,
    updateWidgetSize,
    resetToDefault,
    refetch: fetchLayout,
    clearError,
  };
}