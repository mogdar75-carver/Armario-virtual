import React from 'react';
import { useAurelleStore } from '../hooks/useAurelleStore';
import { AppTab } from '../types/wardrobe';

const TABS: Array<{ id: AppTab; label: string; icon: string }> = [
  { id: 'hoy', label: 'Hoy', icon: 'auto_awesome' },
  { id: 'armario', label: 'Armario', icon: 'checkroom' },
  { id: 'studio', label: 'Studio', icon: 'layers' },
  { id: 'cpw-eco', label: 'CPW & Eco', icon: 'insert_chart' },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useAurelleStore();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 pb-safe bg-surface/92 backdrop-blur-2xl border-t border-outline-variant/25 shadow-[0_-1px_12px_rgba(59,77,97,0.05)]"
      aria-label="Navegación inferior"
    >
      <div className="grid grid-cols-4 items-center h-16 px-2 max-w-lg mx-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] transition-colors cursor-pointer ${
                isActive
                  ? 'text-on-surface font-semibold'
                  : 'text-secondary hover:text-on-surface font-medium'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[24px] ${
                  isActive ? 'material-symbols-filled text-on-surface' : ''
                }`}
              >
                {tab.icon}
              </span>
              <span className="text-[10px] tracking-[0.06em] mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-1.5 right-5 w-1.5 h-1.5 rounded-full bg-tertiary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
