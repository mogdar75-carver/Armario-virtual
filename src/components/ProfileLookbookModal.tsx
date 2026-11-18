import React from 'react';
import { ResilientImage } from './ResilientImage';
import { AURELLE_IMAGES } from '../data/initialWardrobe';
import { useAurelleStore } from '../hooks/useAurelleStore';

interface ProfileLookbookModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfileLookbookModal({ open, onClose }: ProfileLookbookModalProps) {
  const {
    garments,
    lookbooks,
    wearLogs,
    metrics,
    loadLookbookToStudio,
    deleteLookbook,
    logOutfitWear,
    resetDemoData,
    showToast,
  } = useAurelleStore();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
      >
        {/* Profile Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <ResilientImage
              src={AURELLE_IMAGES.avatar}
              alt="Elena Marchetti"
              fallbackIcon="person"
              className="w-12 h-12 rounded-full object-cover shadow-xs"
            />
            <div>
              <h2 className="font-editorial text-[20px] font-semibold text-on-surface">
                Elena Marchetti
              </h2>
              <p className="text-[11px] text-secondary font-medium">
                Kibbe Classic · Neutro Cálido · EU Cloud AES-256
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar perfil"
            className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-3 rounded-xl text-center">
          <div>
            <span className="text-[10px] uppercase text-secondary font-semibold">Prendas</span>
            <p className="text-[16px] font-bold text-on-surface tabular-nums">
              {garments.length}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-secondary font-semibold">CPW Medio</span>
            <p className="text-[16px] font-bold text-primary tabular-nums">
              €{metrics.weightedAvgCpw.toFixed(2)}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase text-secondary font-semibold">Lookbooks</span>
            <p className="text-[16px] font-bold text-tertiary tabular-nums">
              {lookbooks.length}
            </p>
          </div>
        </div>

        {/* Saved Lookbooks */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-on-surface">
              Lookbooks Guardados ({lookbooks.length})
            </h3>
            <span className="text-[10px] text-secondary uppercase tracking-wider">
              {wearLogs.length} registros de uso
            </span>
          </div>

          {lookbooks.length === 0 ? (
            <p className="text-[12px] text-secondary bg-surface-container-low p-4 rounded-xl text-center">
              Aún no has guardado lookbooks personalizados. Guarda una propuesta desde Hoy o Studio.
            </p>
          ) : (
            <div className="space-y-2">
              {lookbooks.map((lb) => (
                <div
                  key={lb.id}
                  className="p-3 bg-surface-container-low rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-on-surface truncate">
                        {lb.name}
                      </p>
                      <span className="text-[10px] font-semibold text-primary tabular-nums shrink-0">
                        CLIP {lb.harmonyScore}%
                      </span>
                    </div>
                    <p className="text-[11px] text-secondary truncate">
                      {lb.occasion} · {lb.garmentIds.length} piezas · {lb.createdAt}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        logOutfitWear(lb.garmentIds, lb.name);
                        showToast(`Uso registrado para "${lb.name}"`);
                      }}
                      title="Vestir hoy"
                      className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-primary hover:text-on-primary text-primary flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">checkroom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        loadLookbookToStudio(lb);
                        onClose();
                      }}
                      title="Abrir en Studio"
                      className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-secondary hover:text-on-secondary text-on-surface flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">layers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteLookbook(lb.id);
                        showToast(`Lookbook "${lb.name}" eliminado`);
                      }}
                      title="Eliminar lookbook"
                      className="w-9 h-9 rounded-lg bg-surface-container-lowest hover:bg-error-container text-error flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[17px]">delete_outline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Demo Data */}
        <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-3">
          <span className="text-[11px] text-secondary">
            Persistencia local cifrada activa
          </span>
          <button
            type="button"
            onClick={() => {
              resetDemoData();
              onClose();
            }}
            className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-[11px] font-semibold text-on-surface cursor-pointer"
          >
            Restaurar Datos Demo
          </button>
        </div>
      </div>
    </div>
  );
}
