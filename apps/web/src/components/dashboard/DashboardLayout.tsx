// apps/web/src/components/dashboard/DashboardLayout.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TotalClicksWidget } from './widgets/TotalClicksWidget';
import { RevenueWidget } from './widgets/RevenueWidget';
import { RecentLinksWidget } from './widgets/RecentLinksWidget';
import { Edit, Eye, EyeOff, Grip, Save, X } from 'lucide-react';

// Widget Registry basato sui tuoi widget types
const WIDGET_COMPONENTS = {
  'stats-summary': TotalClicksWidget, // Mapping temporaneo
  'clicks-trend': TotalClicksWidget,
  'revenue-trend': RevenueWidget,
  'recent-links': RecentLinksWidget,
  'top-performing': RecentLinksWidget, // Mapping temporaneo
} as const;

export const DashboardLayout = () => {
  // ✅ Hooks sempre al top level
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
    clearError,
  } = useDashboardLayout();

  const [activeId, setActiveId] = useState<string | null>(null);

  // ✅ DND Kit sensors
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const sensors = useSensors(pointerSensor);

  // ✅ Widget IDs per DND
  const widgetIds = useMemo(() => {
    return visibleWidgets.map(widget => widget.id);
  }, [visibleWidgets]);

  // ✅ Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  // ✅ Handle drag end - usa la tua reorderWidgets
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const activeIndex = visibleWidgets.findIndex(w => w.id === active.id);
    const overIndex = visibleWidgets.findIndex(w => w.id === over.id);

    if (activeIndex === -1 || overIndex === -1) return;

    // Crea il nuovo ordine
    const newOrder = [...widgetIds];
    const [movedId] = newOrder.splice(activeIndex, 1);
    newOrder.splice(overIndex, 0, movedId);

    reorderWidgets(newOrder);
  }, [visibleWidgets, widgetIds, reorderWidgets]);

  // ✅ Render widget usando il tuo type system
  const renderWidget = useCallback((widget: typeof visibleWidgets[0]) => {
    const WidgetComponent = WIDGET_COMPONENTS[widget.type as keyof typeof WIDGET_COMPONENTS];
    
    if (!WidgetComponent) {
      return (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-red-500">Widget type "{widget.type}" not found</p>
        </div>
      );
    }

    return <WidgetComponent key={widget.id} />;
  }, []);

  // ✅ Grid size classes basate sui tuoi size types
  const getSizeClass = useCallback((size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-1';
      case 'large': return 'col-span-1 md:col-span-2';
      case 'full': return 'col-span-1 md:col-span-3';
      default: return 'col-span-1';
    }
  }, []);

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">Caricamento dashboard...</span>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-800 mb-2">
          Errore nel caricamento della dashboard
        </h3>
        <p className="text-red-600">{error}</p>
        <button
          onClick={clearError}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Riprova
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600 mt-1">
            Personalizza il layout trascinando i widget
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleEditMode}
            className={`flex items-center px-4 py-2 rounded-md ${
              isEditMode 
                ? 'bg-gray-600 text-white hover:bg-gray-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            disabled={isSaving}
          >
            {isEditMode ? (
              <>
                <X className="h-4 w-4 mr-1" />
                {isSaving ? 'Salvataggio...' : 'Esci'}
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-1" />
                Modifica Layout
              </>
            )}
          </button>
        </div>
      </div>

      {/* Edit Mode Controls */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-3">Controlli Widget</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {layout.widgets.map(widget => (
              <div
                key={widget.id}
                className="flex items-center justify-between bg-white px-3 py-2 rounded-md border"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate">{widget.title}</span>
                  {widget.description && (
                    <p className="text-xs text-gray-500 truncate">{widget.description}</p>
                  )}
                </div>
                <button
                  onClick={() => toggleWidgetVisibility(widget.id)}
                  className={`ml-2 p-1 rounded flex-shrink-0 ${
                    widget.isVisible
                      ? 'text-green-600 hover:bg-green-100'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {widget.isVisible ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgetIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleWidgets.map(widget => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                isEditMode={isEditMode}
                getSizeClass={getSizeClass}
                renderWidget={renderWidget}
                updateWidgetSize={updateWidgetSize}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="transform rotate-2 opacity-90">
              {(() => {
                const activeWidget = visibleWidgets.find(w => w.id === activeId);
                return activeWidget ? renderWidget(activeWidget) : null;
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty State */}
      {visibleWidgets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Edit className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun widget visibile
          </h3>
          <p className="text-gray-600 mb-4">
            Attiva alcuni widget per vedere i tuoi dati analytics
          </p>
          <button
            onClick={toggleEditMode}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Modifica Layout
          </button>
        </div>
      )}
    </div>
  );
};

// Draggable Widget Component
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { WidgetConfig } from '@/hooks/useDashboardLayout';

interface DraggableWidgetProps {
  widget: WidgetConfig;
  isEditMode: boolean;
  getSizeClass: (size: string) => string;
  renderWidget: (widget: WidgetConfig) => JSX.Element;
  updateWidgetSize: (widgetId: string, size: WidgetConfig['size']) => void;
}

const DraggableWidget = ({ 
  widget, 
  isEditMode, 
  getSizeClass, 
  renderWidget,
  updateWidgetSize
}: DraggableWidgetProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${getSizeClass(widget.size)}
        ${isDragging ? 'opacity-50' : ''}
        ${isEditMode ? 'relative group' : ''}
      `}
    >
      {isEditMode && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div
            {...attributes}
            {...listeners}
            className="p-1 bg-white border rounded shadow-sm cursor-grab active:cursor-grabbing"
          >
            <Grip className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}
      {renderWidget(widget)}
    </div>
  );
};