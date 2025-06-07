// apps/web/src/components/support/FAQAccordion.tsx
'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Maximize2, Minimize2 } from 'lucide-react';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'getting-started' | 'links' | 'analytics' | 'api' | 'billing' | 'technical';
}

export const CATEGORIES = {
  'getting-started': { label: 'Primi Passi', icon: '🚀' },
  'links': { label: 'Gestione Link', icon: '🔗' },
  'analytics': { label: 'Analytics', icon: '📊' },
  'api': { label: 'API', icon: '⚡' },
  'billing': { label: 'Fatturazione', icon: '💳' },
  'technical': { label: 'Tecnico', icon: '🔧' }
};

interface FAQAccordionProps {
  items: FAQItem[];
  searchTerm: string;
}

export const FAQAccordion = ({ items, searchTerm }: FAQAccordionProps) => {
  // ✅ MIGLIORAMENTO 1: Prima domanda aperta di default
  const [openItems, setOpenItems] = useState<Set<string>>(
    new Set(items.length > 0 ? [items[0].id] : [])
  );

  // ✅ MIGLIORAMENTO 3: useCallback per ottimizzare performance
  const toggleItem = useCallback((id: string) => {
    setOpenItems(prev => {
      const newOpenItems = new Set(prev);
      if (newOpenItems.has(id)) {
        newOpenItems.delete(id);
      } else {
        newOpenItems.add(id);
      }
      return newOpenItems;
    });
  }, []);

  // ✅ MIGLIORAMENTO 2: Funzioni Espandi/Comprimi tutto
  const expandAll = useCallback(() => {
    const filteredItems = items.filter(item => 
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setOpenItems(new Set(filteredItems.map(item => item.id)));
  }, [items, searchTerm]);

  const collapseAll = useCallback(() => {
    setOpenItems(new Set());
  }, []);

  const filteredItems = items.filter(item => 
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, FAQItem[]>);

  return (
    <div className="space-y-6">
      {/* ✅ NUOVO: Header con controlli Espandi/Comprimi */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
          </div>
          Domande Frequenti
        </h2>
        
        {filteredItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-all"
            >
              <Maximize2 className="w-3 h-3" />
              Espandi tutto
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-300 hover:bg-gray-500/10 border border-gray-500/20 rounded-lg transition-all"
            >
              <Minimize2 className="w-3 h-3" />
              Comprimi tutto
            </button>
          </div>
        )}
      </div>

      {/* FAQ Grouped by Category */}
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{CATEGORIES[category as keyof typeof CATEGORIES]?.icon}</span>
            <h3 className="text-lg font-semibold text-white">
              {CATEGORIES[category as keyof typeof CATEGORIES]?.label}
            </h3>
            <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent flex-1 ml-3" />
            <span className="text-xs text-gray-500 font-medium bg-slate-800/50 px-2 py-1 rounded-full">
              {categoryItems.length} {categoryItems.length === 1 ? 'domanda' : 'domande'}
            </span>
          </div>
          
          {categoryItems.map((item) => {
            const isOpen = openItems.has(item.id);
            
            return (
              <div
                key={item.id}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden transition-all hover:border-white/20"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors group"
                >
                  <span className="text-white font-medium pr-4 group-hover:text-purple-200 transition-colors">
                    {item.question}
                  </span>
                  <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors flex-shrink-0" />
                  </div>
                </button>
                
                {isOpen && (
                  <div className="px-6 pb-4 border-t border-white/10 bg-slate-900/30 animate-in slide-in-from-top-2 duration-200">
                    <div className="pt-4">
                      <p className="text-gray-300 leading-relaxed">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
      
      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-800/50 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Nessun risultato trovato</h3>
          <p className="text-gray-400 mb-4">
            Prova con termini di ricerca diversi o contattaci direttamente
          </p>
          <button
            onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Vai al modulo di contatto
          </button>
        </div>
      )}
    </div>
  );
};