import React, { useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { BottomNav } from './components/BottomNav';
import { ProfileLookbookModal } from './components/ProfileLookbookModal';
import { AurelleProvider, useAurelleStore } from './hooks/useAurelleStore';
import { ArmarioView } from './views/ArmarioView';
import { CpwEcoView } from './views/CpwEcoView';
import { HoyView } from './views/HoyView';
import { StudioView } from './views/StudioView';

function AurelleShell() {
  const { activeTab, toastMessage } = useAurelleStore();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <AppHeader onOpenProfile={() => setProfileOpen(true)} />

      <main className="flex-1 w-full pt-14 sm:pt-16 pb-24 md:pb-10">
        {activeTab === 'hoy' && <HoyView />}
        {activeTab === 'armario' && <ArmarioView />}
        {activeTab === 'studio' && <StudioView />}
        {activeTab === 'cpw-eco' && <CpwEcoView />}
      </main>

      <BottomNav />

      <ProfileLookbookModal open={profileOpen} onClose={() => setProfileOpen(false)} />

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5"
        >
          <span className="material-symbols-outlined text-primary-fixed-dim text-[20px] shrink-0">
            verified
          </span>
          <p className="text-[12px] font-medium leading-snug">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AurelleProvider>
      <AurelleShell />
    </AurelleProvider>
  );
}
