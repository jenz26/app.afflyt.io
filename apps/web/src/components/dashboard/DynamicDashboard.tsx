'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  getFirstCollision,
  pointerWithin,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TotalClicksWidget } from './widgets/TotalClicksWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { RecentLinksWidget } from './widgets/RecentLinksWidget';
import { 
  Edit, 
  Eye, 
  EyeOff, 
  GripVertical, 
  X, 
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Plus,
  Sparkles,
  Layout,
  Palette,
  ChevronDown
} from 'lucide-react';

// Widget Components Registry con mapping preciso ai tuoi types
const WIDGET_COMPONENTS = {
  'stats-summary': TotalClicksWidget,
  'clicks-trend': TotalClicksWidget,
  'revenue-trend': RevenueWidget,
  'recent-links': RecentLinksWidget,
  'top-performing': RecentLinksWidget,
} as const;

// Enhanced Grid Configuration per layout intelligente
const GRID_CONFIG = {
  cols: 12, // 12-column grid per massima flessibilità
  rowHeight: 80, // Altezza base ottimale per widget
  margin: 24, // Spacing tra widget
  containerPadding: 24,
} as const;

// Widget Size Mapping Intelligente
const WIDGET_SIZES = {
  small: { w: 3, h: 3, minW: 2, maxW: 4 },
  medium: { w: 4, h: 4, minW: 3, maxW: 6 },
  large: { w: 6, h: 5, minW: 4, maxW: 8 },
  full: { w: 12, h: 6, minW: 6, maxW: 12 },
} as const;

// Dashboard Templates Pre-configurati (Premium Feature)
const DASHBOARD_TEMPLATES: DashboardTemplate[] = [
  {
    id: 'analytics-focused',
    name: 'Analytics Pro',
    icon: '📊',
    description: 'Focus su metriche e trend',
    layout: [
      { i: 'stats-summary', x: 0, y: 0, w: 12, h: 2 },
      { i: 'clicks-trend', x: 0, y: 2, w: 6, h: 4 },
      { i: 'revenue-trend', x: 6, y: 2, w: 6, h: 4 },
      { i: 'recent-links', x: 0, y: 6, w: 6, h: 3 },
      { i: 'top-performing', x: 6, y: 6, w: 6, h: 3 },
    ]
  },
  {
    id: 'links-management',
    name: 'Links Manager',
    icon: '🔗',
    description: 'Gestione link ottimizzata',
    layout: [
      { i: 'recent-links', x: 0, y: 0, w: 8, h: 5 },
      { i: 'top-performing', x: 8, y: 0, w: 4, h: 5 },
      { i: 'stats-summary', x: 0, y: 5, w: 6, h: 3 },
      { i: 'revenue-trend', x: 6, y: 5, w: 6, h: 3 },
    ]
  },
  {
    id: 'revenue-focus',
    name: 'Revenue Focus',
    icon: '💰',
    description: 'Massimizza profitti',
    layout: [
      { i: 'revenue-trend', x: 0, y: 0, w: 8, h: 5 },
      { i: 'stats-summary', x: 8, y: 0, w: 4, h: 5 },
      { i: 'top-performing', x: 0, y: 5, w: 12, h: 3 },
    ]
  }
];

// Enhanced Sortable Widget Component
interface SortableWidgetProps {
  widget: any;
  isEditMode: boolean;
  onResize?: (widgetId: string, size: any) => void;
  onSettings?: (widgetId: string) => void;
}

function SortableWidget({ widget, isEditMode, onResize, onSettings }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: widget.id,
    data: {
      type: 'widget',
      widget,
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Dynamic grid size based on widget size
  const getGridClasses = (size: string) => {
    const sizeConfig = WIDGET_SIZES[size as keyof typeof WIDGET_SIZES];
    return `col-span-${Math.min(sizeConfig.w, 12)} row-span-${sizeConfig.h}`;
  };

  const WidgetComponent = WIDGET_COMPONENTS[widget.type as keyof typeof WIDGET_COMPONENTS];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${getGridClasses(widget.size)}
        relative group transition-all duration-300 ease-out
        ${isDragging ? 'z-50 scale-105 rotate-1 opacity-90' : ''}
        ${isEditMode ? 'hover:scale-[1.02] hover:z-10' : ''}
      `}
    >
      {/* Enhanced Edit Mode Controls */}
      {isEditMode && (
        <>
          {/* Drag Handle - Premium Design */}
          <div 
            className="absolute -top-3 -left-3 w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl 
                       flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200
                       cursor-grab active:cursor-grabbing z-20 shadow-lg shadow-blue-500/25 border border-white/20"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-white" />
          </div>

          {/* Widget Controls */}
          <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20">
            {/* Settings */}
            <button
              onClick={() => onSettings?.(widget.id)}
              className="w-7 h-7 bg-slate-700/90 backdrop-blur-sm border border-white/20 rounded-lg
                         flex items-center justify-center hover:bg-slate-600/90 transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-white/80" />
            </button>
            
            {/* Resize */}
            <button
              onClick={() => {
                const currentSize = widget.size;
                const sizes: Array<keyof typeof WIDGET_SIZES> = ['small', 'medium', 'large', 'full'];
                const currentIndex = sizes.indexOf(currentSize);
                const nextSize = sizes[(currentIndex + 1) % sizes.length];
                onResize?.(widget.id, nextSize);
              }}
              className="w-7 h-7 bg-slate-700/90 backdrop-blur-sm border border-white/20 rounded-lg
                         flex items-center justify-center hover:bg-slate-600/90 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>

          {/* Resize Handle - Bottom Right */}
          <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-r from-slate-600 to-slate-700 
                          rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 
                          transition-opacity duration-200 cursor-se-resize z-20 border border-white/10">
            <div className="w-2 h-2 border-r-2 border-b-2 border-white/60" />
          </div>

          {/* Size Indicator */}
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white/70 
                          opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
            {widget.size}
          </div>
        </>
      )}

      {/* Widget Content with Enhanced States */}
      <div className={`
        h-full transition-all duration-300 
        ${isDragging 
          ? 'shadow-2xl shadow-blue-500/30 ring-2 ring-blue-500/50 bg-slate-800/90' 
          : 'shadow-lg shadow-black/10'
        }
        ${isEditMode ? 'ring-1 ring-white/10' : ''}
      `}>
        {WidgetComponent ? <WidgetComponent /> : (
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 h-full flex items-center justify-center">
            <p className="text-gray-400">Widget "{widget.type}" non trovato</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced Drag Overlay
function DragOverlayWidget({ activeWidget }: { activeWidget: any }) {
  if (!activeWidget) return null;

  const WidgetComponent = WIDGET_COMPONENTS[activeWidget.type as keyof typeof WIDGET_COMPONENTS];
  
  return (
    <div className="transform rotate-3 scale-110 opacity-95 filter blur-[0.5px]">
      <div className="bg-slate-800/95 backdrop-blur-xl border-2 border-blue-500/60 rounded-2xl 
                      shadow-2xl shadow-blue-500/40 ring-4 ring-blue-500/20">
        {WidgetComponent ? <WidgetComponent /> : (
          <div className="w-64 h-32 flex items-center justify-center text-white">
            Moving {activeWidget.type}...
          </div>
        )}
      </div>
    </div>
  );
}

// Drop Zone Indicator
function DropZone({ isActive, position }: { isActive: boolean; position?: { x: number; y: number } }) {
  if (!isActive) return null;

  return (
    <div 
      className="absolute inset-0 z-30 pointer-events-none"
      style={{ 
        background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
      }}
    >
      <div className="absolute inset-4 border-2 border-dashed border-blue-500/60 rounded-2xl 
                      bg-blue-500/10 backdrop-blur-sm animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="px-4 py-2 bg-blue-600/90 text-white rounded-lg font-medium text-sm shadow-lg">
            Drop widget here
          </div>
        </div>
      </div>
    </div>
  );
}

// Template type definition
type DashboardTemplate = {
  id: string;
  name: string;
  icon: string;
  description: string;
  layout: Array<{
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }>;
};

// Template Selector Modal
function TemplateSelector({ isOpen, onClose, onApply }: {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: DashboardTemplate) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl p-6 
                      max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-400" />
            Dashboard Templates
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DASHBOARD_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                onApply(template);
                onClose();
              }}
              className="p-4 bg-slate-700/50 border border-white/10 rounded-xl hover:border-white/20 
                         transition-all duration-200 text-left group"
            >
              <div className="text-3xl mb-2">{template.icon}</div>
              <h4 className="text-white font-medium mb-1">{template.name}</h4>
              <p className="text-gray-400 text-sm">{template.description}</p>
              
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-gray-500">
                  {template.layout.length} widgets
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-medium">Pro Feature</span>
          </div>
          <p className="text-sm text-gray-300">
            I template sono disponibili nel piano Pro. Upgrade per accedere a layout ottimizzati per diversi use case.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main Enhanced Dashboard Layout Component
export const DashboardLayout = () => {
  const {
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
    updateWidgetSize,
    resetToDefault,
    clearError,
  } = useDashboardLayout();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Enhanced sensors for better interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10, // Prevent accidental drags
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Smart collision detection
  const collisionDetectionStrategy = useCallback((args: any) => {
    const pointerIntersections = pointerWithin(args);
    const intersections = pointerIntersections.length > 0 
      ? pointerIntersections 
      : rectIntersection(args);
    
    return getFirstCollision(intersections, args.active.id);
  }, []);

  const widgetIds = useMemo(() => visibleWidgets.map(w => w.id), [visibleWidgets]);
  const activeWidget = visibleWidgets.find(w => w.id === activeId);

  // Enhanced drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setIsDropZoneActive(!!event.over);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setIsDropZoneActive(false);
    
    if (!over || active.id === over.id) return;

    const activeIndex = visibleWidgets.findIndex(w => w.id === active.id);
    const overIndex = visibleWidgets.findIndex(w => w.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Create new order for reorderWidgets
    const newOrder = [...widgetIds];
    const [movedId] = newOrder.splice(activeIndex, 1);
    newOrder.splice(overIndex, 0, movedId);

    reorderWidgets(newOrder);
    
    // Success feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]);
    }
  }, [visibleWidgets, widgetIds, reorderWidgets]);

  // Template application
  const applyTemplate = useCallback((template: DashboardTemplate) => {
    setSelectedTemplate(template.id);
    // Here you would implement template application logic
    // For now, we'll just show feedback
    console.log('Applying template:', template.name);
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="col-span-12 sm:col-span-6 lg:col-span-4 h-64 bg-slate-800/30 rounded-2xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-medium text-red-400 mb-2">
          Errore Dashboard
        </h3>
        <p className="text-red-300 mb-4">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={clearError}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Reset Layout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Analytics</h2>
            <p className="text-gray-400 text-sm">
              {isEditMode ? 'Trascina i widget per riorganizzare' : 'Monitora le performance in tempo reale'}
            </p>
          </div>
          
          {isSaving && (
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-400 text-sm">Salvando...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Template Selector Button */}
          <button
            onClick={() => setShowTemplates(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg 
                       hover:bg-purple-700 transition-colors"
          >
            <Layout className="w-4 h-4" />
            Templates
          </button>

          {/* Edit Mode Toggle */}
          <button
            onClick={toggleEditMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isEditMode 
                ? 'bg-slate-600 text-white hover:bg-slate-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isSaving}
          >
            {isEditMode ? (
              <>
                <X className="w-4 h-4" />
                Esci
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Personalizza
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Mode Panel */}
      {isEditMode && (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-400" />
              Controlli Widget
            </h3>
            
            <button
              onClick={resetToDefault}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-gray-300 rounded-lg 
                         hover:bg-slate-700 transition-colors text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Default
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {layout.widgets.map(widget => (
              <div
                key={widget.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  widget.isVisible
                    ? 'bg-slate-700/30 border-green-500/30'
                    : 'bg-slate-700/20 border-white/10'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">{widget.title}</span>
                    <span className="text-xs px-2 py-0.5 bg-slate-600/50 text-gray-300 rounded">
                      {widget.size}
                    </span>
                  </div>
                  {widget.description && (
                    <p className="text-xs text-gray-400 truncate">{widget.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`ml-3 p-1.5 rounded transition-colors ${
                    widget.isVisible
                      ? 'text-green-400 hover:bg-green-500/20'
                      : 'text-gray-500 hover:bg-gray-500/20'
                  }`}
                >
                  {widget.isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Dashboard Grid */}
      <div className="relative">
        <DropZone isActive={isDropZoneActive} />
        
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
            <div className={`
              grid grid-cols-12 gap-6 transition-all duration-300 ease-out
              ${isDropZoneActive ? 'scale-[0.98] opacity-80' : ''}
              ${isEditMode ? 'bg-slate-900/20 rounded-2xl p-4' : ''}
            `}>
              {visibleWidgets.map(widget => (
                <SortableWidget
                  key={widget.id}
                  widget={widget}
                  isEditMode={isEditMode}
                  onResize={updateWidgetSize}
                  onSettings={(widgetId) => console.log('Settings for:', widgetId)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            <DragOverlayWidget activeWidget={activeWidget} />
          </DragOverlay>
        </DndContext>
      </div>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full 
                          flex items-center justify-center mx-auto mb-6">
            <Layout className="w-8 h-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">
            Dashboard Vuota
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Non ci sono widget visibili. Attiva alcuni widget per iniziare a monitorare le tue metriche.
          </p>
          <button
            onClick={toggleEditMode}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Personalizza Dashboard
          </button>
        </div>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onApply={applyTemplate}
      />
    </div>
  );
};