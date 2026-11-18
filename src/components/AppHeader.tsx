import React from 'react';
import { AURELLE_IMAGES } from '../data/initialWardrobe';
import { useAurelleStore } from '../hooks/useAurelleStore';
import { AppTab } from '../types/wardrobe';
import { ResilientImage } from './ResilientImage';

interface AppHeaderProps {
  onOpenProfile: () => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; icon: string }> = [
  { id: 'hoy', label: 'Hoy', icon: 'auto_awesome' },
  { id: 'armario', label: 'Armario', icon: 'checkroom' },
  { id: 'studio', label: 'Studio', icon: 'layers' },
  { id: 'cpw-eco', label: 'CPW & Eco', icon: 'insert_chart' },
];

export function AppHeader({ onOpenProfile }: AppHeaderProps) {
  const { activeTab, setActiveTab } = useAurelleStore();

  return (
    <header className="fixed top-0 inset-x-0 z-50 pt-safe bg-surface/88 backdrop-blur-xl border-b border-outline-variant/25 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto h-14 sm:h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <button
          type="button"
          onClick={() => setActiveTab('hoy')}
          className="flex items-center gap-2 shrink-0 text-left focus-visible:outline-2 focus-visible:outline-primary rounded-md"
        >
          <ResilientImage
            src={AURELLE_IMAGES.logo}
            alt="Aurelle Logo"
            fallbackIcon="stylus"
            className="h-7 w-7 sm:h-8 sm:w-8 object-contain rounded-sm"
          />
          <span className="font-editorial text-[20px] font-semibold text-on-surface tracking-tight whitespace-nowrap">
            Aurelle
          </span>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`relative py-2 px-1 text-[14px] whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'text-on-surface font-semibold'
                    : 'text-secondary hover:text-on-surface font-medium'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isActive ? 'text-primary material-symbols-filled' : ''
                  }`}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Zone: Sovereignty Indicator + Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-high rounded-full"
            title="Soberanía de datos y cifrado europeo AES-256"
          >
            <span className="material-symbols-outlined text-secondary text-[14px]">
              verified_user
            </span>
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.06em] whitespace-nowrap">
              EU Cloud AES-256
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            aria-label="Abrir perfil, lookbooks y ajustes"
            className="w-11 h-11 flex items-center justify-center rounded-full hover:opacity-85 active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
          >
            <ResilientImage
              src={AURELLE_IMAGES.avatar}
              alt="Perfil de usuario"
              fallbackIcon="person"
              className="w-8 h-8 rounded-full object-cover shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
