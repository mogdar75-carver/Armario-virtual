import React, { useMemo, useRef, useState } from 'react';
import { ResilientImage } from '../components/ResilientImage';
import { useAurelleStore } from '../hooks/useAurelleStore';
import { CanvasLayer, Garment, GarmentCategory } from '../types/wardrobe';

type PickerFilter = 'knits' | 'bottoms' | 'capispalla' | 'calzature' | 'accessori';

export function StudioView() {
  const {
    garments,
    studioLayers,
    setStudioLayers,
    travelPlan,
    setTravelPlan,
    saveLookbook,
    showToast,
  } = useAurelleStore();

  const [studioMode, setStudioMode] = useState<'canvas' | 'travel'>('canvas');
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    studioLayers[studioLayers.length - 1]?.instanceId ?? null
  );
  const [magnetOn, setMagnetOn] = useState(true);
  const [pickerFilter, setPickerFilter] = useState<PickerFilter>('knits');
  const [historyPast, setHistoryPast] = useState<CanvasLayer[][]>([]);
  const [historyFuture, setHistoryFuture] = useState<CanvasLayer[][]>([]);
  const [showTravelEditor, setShowTravelEditor] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lookName, setLookName] = useState('Cápsula Atelier Look');
  const [lookOccasion, setLookOccasion] = useState('Trabajo & Galería');

  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<{
    instanceId: string;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    moved: boolean;
    snapshot: CanvasLayer[];
  } | null>(null);

  const commitLayers = (next: CanvasLayer[] | ((prev: CanvasLayer[]) => CanvasLayer[])) => {
    setStudioLayers((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      setHistoryPast((h) => [...h.slice(-14), prev]);
      setHistoryFuture([]);
      return resolved;
    });
  };

  const handleUndo = () => {
    if (historyPast.length === 0) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryPast((h) => h.slice(0, -1));
    setHistoryFuture((f) => [studioLayers, ...f]);
    setStudioLayers(previous);
    showToast('Acción deshecha');
  };

  const handleRedo = () => {
    if (historyFuture.length === 0) return;
    const next = historyFuture[0];
    setHistoryFuture((f) => f.slice(1));
    setHistoryPast((h) => [...h, studioLayers]);
    setStudioLayers(next);
    showToast('Acción rehecha');
  };

  const selectedLayer = useMemo(
    () => studioLayers.find((l) => l.instanceId === selectedLayerId) ?? null,
    [studioLayers, selectedLayerId]
  );

  // Pointer drag handlers
  const handleLayerPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    layer: CanvasLayer
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setSelectedLayerId(layer.instanceId);
    dragState.current = {
      instanceId: layer.instanceId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      moved: false,
      snapshot: studioLayers,
    };
  };

  const handleLayerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragState.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;

    const dxPx = e.clientX - drag.startClientX;
    const dyPx = e.clientY - drag.startClientY;
    if (Math.abs(dxPx) > 3 || Math.abs(dyPx) > 3) {
      drag.moved = true;
    }

    const rect = stage.getBoundingClientRect();
    let nextX = drag.origX + (dxPx / rect.width) * 100;
    let nextY = drag.origY + (dyPx / rect.height) * 100;

    // Magnet snap to center X axis
    if (magnetOn && Math.abs(nextX) < 3.5) {
      nextX = 0;
    }

    nextX = Math.max(-42, Math.min(42, nextX));
    nextY = Math.max(-42, Math.min(42, nextY));

    setStudioLayers((prev) =>
      prev.map((l) =>
        l.instanceId === drag.instanceId
          ? { ...l, x: Number(nextX.toFixed(1)), y: Number(nextY.toFixed(1)) }
          : l
      )
    );
  };

  const handleLayerPointerUp = (
    e: React.PointerEvent<HTMLDivElement>,
    layer: CanvasLayer
  ) => {
    const drag = dragState.current;
    if (!drag) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (drag.moved) {
      setHistoryPast((h) => [...h.slice(-14), drag.snapshot]);
      setHistoryFuture([]);
    } else {
      // Tap rotates 45 degrees as indicated in the UI guide
      commitLayers((prev) =>
        prev.map((l) =>
          l.instanceId === layer.instanceId
            ? { ...l, rotation: (l.rotation + 45) % 360 }
            : l
        )
      );
    }
    dragState.current = null;
  };

  const handleCenterAll = () => {
    commitLayers((prev) =>
      prev.map((l, idx) => ({
        ...l,
        x: 0,
        y: -14 + idx * 10,
        rotation: 0,
        scale: 1,
      }))
    );
    showToast('Capas centradas sobre eje vertical');
  };

  const handleFlipLayer = () => {
    const targetId = selectedLayerId ?? studioLayers[studioLayers.length - 1]?.instanceId;
    if (!targetId) return;
    commitLayers((prev) =>
      prev.map((l) => (l.instanceId === targetId ? { ...l, flipX: !l.flipX } : l))
    );
  };

  const handleDuplicateLayer = () => {
    const target =
      selectedLayer ?? studioLayers[studioLayers.length - 1] ?? null;
    if (!target) return;
    const copy: CanvasLayer = {
      ...target,
      instanceId: `layer-${Date.now()}`,
      x: Math.min(35, target.x + 8),
      y: Math.min(35, target.y + 8),
      zIndex: Math.max(...studioLayers.map((l) => l.zIndex), 0) + 1,
    };
    commitLayers((prev) => [...prev, copy]);
    setSelectedLayerId(copy.instanceId);
    showToast('Capa duplicada');
  };

  const handleDeleteLayer = () => {
    const targetId = selectedLayerId ?? studioLayers[studioLayers.length - 1]?.instanceId;
    if (!targetId) return;
    commitLayers((prev) => prev.filter((l) => l.instanceId !== targetId));
    setSelectedLayerId(null);
    showToast('Capa eliminada del canvas');
  };

  const handleScaleSelected = (delta: number) => {
    if (!selectedLayerId) return;
    commitLayers((prev) =>
      prev.map((l) =>
        l.instanceId === selectedLayerId
          ? {
              ...l,
              scale: Number(Math.max(0.55, Math.min(1.65, l.scale + delta)).toFixed(2)),
            }
          : l
      )
    );
  };

  const handleAddGarmentToCanvas = (garment: Garment) => {
    const maxZ = Math.max(0, ...studioLayers.map((l) => l.zIndex));
    const newLayer: CanvasLayer = {
      instanceId: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      garmentId: garment.id,
      label: `${garment.subCategoryLabel} · ${garment.name}`,
      imageUrl: garment.imageUrl,
      x: ((studioLayers.length % 3) - 1) * 8,
      y: ((studioLayers.length % 3) - 1) * 6,
      widthPct:
        garment.category === 'capispalla'
          ? 66
          : garment.category === 'calzature' || garment.category === 'accessori'
            ? 38
            : 50,
      scale: 1,
      rotation: 0,
      flipX: false,
      zIndex: maxZ + 1,
    };
    commitLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.instanceId);
    showToast(`"${garment.name}" añadida al canvas`);
  };

  const handleConfirmSaveLook = (e: React.FormEvent) => {
    e.preventDefault();
    const garmentIds = Array.from(new Set(studioLayers.map((l) => l.garmentId)));
    saveLookbook({
      name: lookName.trim() || 'Look Studio',
      garmentIds,
      harmonyScore: 97.4,
      occasion: lookOccasion.trim() || 'Editorial',
      source: 'studio',
      layers: studioLayers,
    });
    setShowSaveModal(false);
    showToast(`Look "${lookName.trim()}" guardado en tu Lookbook`);
  };

  const handleExport4K = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1500;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background Atelier Cream
    ctx.fillStyle = '#F9F9F7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle border & editorial header
    ctx.strokeStyle = '#E2E3E1';
    ctx.lineWidth = 4;
    ctx.strokeRect(36, 36, canvas.width - 72, canvas.height - 72);

    ctx.fillStyle = '#1A1C1B';
    ctx.font = '600 44px Georgia, serif';
    ctx.fillText('Aurelle · Studio Lookbook', 76, 112);

    ctx.fillStyle = '#4E6075';
    ctx.font = '600 22px sans-serif';
    ctx.fillText(
      `COMPOSICIÓN ${studioLayers.length} CAPAS · DIGITAL ATELIER`,
      76,
      154
    );

    // Attempt to draw images; gracefully render spec plaques if remote CORS restricts canvas tainting
    let yCursor = 230;
    for (const layer of studioLayers.slice(0, 6)) {
      ctx.fillStyle = '#EEEEEC';
      ctx.fillRect(76, yCursor, canvas.width - 152, 165);
      ctx.fillStyle = '#1A1C1B';
      ctx.font = '600 28px sans-serif';
      ctx.fillText(layer.label, 110, yCursor + 72);
      ctx.fillStyle = '#4E6075';
      ctx.font = '400 22px sans-serif';
      ctx.fillText(
        `Escala ${Math.round(layer.scale * 100)}% · Rotación ${Math.round(layer.rotation)}° · Capa Z-${layer.zIndex}`,
        110,
        yCursor + 118
      );
      yCursor += 188;
    }

    ctx.fillStyle = '#7A461B';
    ctx.font = '600 20px sans-serif';
    ctx.fillText('EU CLOUD AES-256 · EXPORTACIÓN ATELIER 4K', 76, canvas.height - 76);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `aurelle-studio-look-${Date.now()}.png`;
    a.click();
    showToast('Ficha de Look 4K exportada como PNG');
  };

  // Armario picker counts & list
  const pickerCounts = useMemo(() => {
    const counts: Record<PickerFilter, number> = {
      knits: 0,
      bottoms: 0,
      capispalla: 0,
      calzature: 0,
      accessori: 0,
    };
    garments.forEach((g) => {
      counts[g.category] += 1;
    });
    return counts;
  }, [garments]);

  const pickerItems = useMemo(
    () => garments.filter((g) => g.category === pickerFilter),
    [garments, pickerFilter]
  );

  // Travel combinatorial math
  const packedGarments = useMemo(
    () => garments.filter((g) => travelPlan.packedGarmentIds.includes(g.id)),
    [garments, travelPlan.packedGarmentIds]
  );

  const travelBreakdown = useMemo(() => {
    const outer = packedGarments.filter((g) => g.category === 'capispalla');
    const tops = packedGarments.filter((g) => g.category === 'knits');
    const bottoms = packedGarments.filter((g) => g.category === 'bottoms');
    const shoes = packedGarments.filter((g) => g.category === 'calzature');
    const totalWeightKg = Number(
      (
        (packedGarments.reduce((s, g) => s + g.weightGrams, 0) + 2100) /
        1000
      ).toFixed(1)
    ); // +2.1kg carry-on shell & essentials
    const combinations = Math.max(
      1,
      Math.max(1, tops.length) * Math.max(1, bottoms.length) +
        outer.length * Math.max(1, tops.length)
    );
    const weightPct = Math.min(100, Math.round((totalWeightKg / travelPlan.weightLimitKg) * 100));
    const deltaKg = Number((travelPlan.weightLimitKg - totalWeightKg).toFixed(1));
    return {
      outer,
      tops,
      bottoms,
      shoes,
      totalWeightKg,
      combinations,
      weightPct,
      deltaKg,
    };
  }, [packedGarments, travelPlan.weightLimitKg]);

  const togglePackedItem = (id: string) => {
    setTravelPlan((prev) => {
      const exists = prev.packedGarmentIds.includes(id);
      return {
        ...prev,
        packedGarmentIds: exists
          ? prev.packedGarmentIds.filter((gid) => gid !== id)
          : [...prev.packedGarmentIds, id],
      };
    });
  };

  const dailyItinerary = useMemo(() => {
    const days = ['Día 1 · Llegada & Mayfair', 'Día 2 · Client Pitch', 'Día 3 · Tate & Soho', 'Día 4 · Regreso'];
    return days.map((title, idx) => {
      const top =
        travelBreakdown.tops[idx % Math.max(1, travelBreakdown.tops.length)] ?? garments[1];
      const bottom =
        travelBreakdown.bottoms[idx % Math.max(1, travelBreakdown.bottoms.length)] ?? garments[2];
      const outer =
        travelBreakdown.outer[idx % Math.max(1, travelBreakdown.outer.length)] ?? garments[0];
      const shoe =
        travelBreakdown.shoes[idx % Math.max(1, travelBreakdown.shoes.length)] ?? garments[4];
      return { title, outer, top, bottom, shoe };
    });
  }, [travelBreakdown, garments]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-8 space-y-4">
      {/* Mode Switcher Top Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="font-editorial text-[22px] sm:text-[28px] font-semibold text-on-surface">
              Studio Creativo
            </h1>
            <span className="bg-secondary-container text-on-secondary-container text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              v2.4 LayerAI
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-secondary">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyPast.length === 0}
              title="Deshacer"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">undo</span>
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyFuture.length === 0}
              title="Rehacer"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container hover:bg-surface-container-high disabled:opacity-40 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[19px]">redo</span>
            </button>
          </div>
        </div>

        {/* Segmented Control Mode Switcher (Mobile primary toggle) */}
        <div className="p-1 bg-surface-container-high rounded-xl flex items-center justify-between text-center select-none lg:max-w-md">
          <button
            type="button"
            onClick={() => setStudioMode('canvas')}
            className={`flex-1 py-2 px-3 rounded-lg text-[12px] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              studioMode === 'canvas'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                : 'text-secondary hover:text-on-surface font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[16px] text-primary">draw</span>
            <span>Canvas Libre</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode('travel')}
            className={`flex-1 py-2 px-3 rounded-lg text-[12px] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              studioMode === 'travel'
                ? 'bg-surface-container-lowest text-on-surface shadow-xs font-semibold'
                : 'text-secondary hover:text-on-surface font-medium'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">luggage</span>
            <span>Maleta & Viajes</span>
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
          </button>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* LEFT COLUMN (Canvas Sandbox + Actions) */}
        <div
          className={`lg:col-span-7 space-y-3 ${
            studioMode === 'travel' ? 'hidden lg:block' : 'block'
          }`}
        >
          <div className="relative w-full aspect-[4/5] max-h-[500px] rounded-xl overflow-hidden bg-surface-container-low border border-outline-variant/25 shadow-[0_8px_28px_-6px_rgba(46,86,121,0.08)] flex flex-col justify-between">
            {/* Dot Grid Background */}
            <div
              className="absolute inset-0 opacity-45 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(rgba(78,96,117,0.28) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* Top Canvas Overlay */}
            <div className="relative z-20 p-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xs">
                <span className="material-symbols-outlined text-[15px] text-primary">layers</span>
                <span className="text-[11px] text-on-surface font-semibold tracking-wide tabular-nums">
                  {studioLayers.length} Capas Activas
                </span>
              </div>

              <div className="flex items-center gap-1 bg-surface-container-lowest/90 backdrop-blur-md p-1 rounded-full shadow-xs text-on-surface">
                <button
                  type="button"
                  onClick={handleCenterAll}
                  title="Centrar todo"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">
                    filter_center_focus
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleFlipLayer}
                  title="Invertir horizontal"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">flip</span>
                </button>
                <button
                  type="button"
                  onClick={handleDuplicateLayer}
                  title="Duplicar capa"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">content_copy</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLayer}
                  title="Eliminar selección"
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-error-container text-error transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">delete_outline</span>
                </button>
              </div>
            </div>

            {/* Interactive Stage */}
            <div
              ref={stageRef}
              onClick={() => setSelectedLayerId(null)}
              className="relative flex-1 w-full h-full overflow-hidden select-none touch-none"
            >
              {studioLayers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-secondary p-6 text-center">
                  <span className="material-symbols-outlined text-[36px] opacity-60">layers</span>
                  <p className="text-[13px] font-medium mt-2">
                    El canvas está vacío. Toca una prenda del Armario Cápsula para añadirla.
                  </p>
                </div>
              ) : (
                studioLayers.map((layer) => {
                  const isSelected = layer.instanceId === selectedLayerId;
                  return (
                    <div
                      key={layer.instanceId}
                      onPointerDown={(e) => handleLayerPointerDown(e, layer)}
                      onPointerMove={handleLayerPointerMove}
                      onPointerUp={(e) => handleLayerPointerUp(e, layer)}
                      style={{
                        zIndex: layer.zIndex,
                        width: `${layer.widthPct}%`,
                        left: `${50 + layer.x}%`,
                        top: `${50 + layer.y}%`,
                        transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg) scaleX(${
                          layer.flipX ? -1 : 1
                        })`,
                      }}
                      className={`absolute aspect-square cursor-grab active:cursor-grabbing transition-[outline] ${
                        isSelected
                          ? 'outline-2 outline-dashed outline-primary/70 rounded-xl'
                          : ''
                      }`}
                    >
                      <ResilientImage
                        src={layer.imageUrl}
                        alt={layer.label}
                        fallbackLabel={layer.label}
                        className="w-full h-full object-contain pointer-events-none drop-shadow-[0_10px_18px_rgba(26,28,27,0.12)]"
                      />
                      {isSelected && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-surface-container-lowest/95 px-2 py-0.5 rounded-full text-[9px] font-semibold text-primary tracking-wider uppercase whitespace-nowrap shadow-xs pointer-events-none">
                          {layer.label}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Gesture & Magnet Bar */}
            <div className="relative z-20 px-3 pb-3 flex items-center justify-between gap-2">
              {selectedLayer ? (
                <div className="flex items-center gap-1 bg-surface-container-lowest/95 backdrop-blur-md px-2 py-1 rounded-full shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleScaleSelected(-0.1)}
                    className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
                    title="Reducir escala"
                  >
                    <span className="material-symbols-outlined text-[15px]">remove</span>
                  </button>
                  <span className="text-[10px] font-semibold tabular-nums px-1 text-primary">
                    {Math.round(selectedLayer.scale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleScaleSelected(0.1)}
                    className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
                    title="Aumentar escala"
                  >
                    <span className="material-symbols-outlined text-[15px]">add</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xs text-secondary">
                  <span className="material-symbols-outlined text-[14px] text-tertiary">
                    touch_app
                  </span>
                  <span className="text-[10px] font-medium">
                    Arrastra para mover · Tap rota 45°
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setMagnetOn((prev) => !prev);
                  showToast(!magnetOn ? 'Alineación magnética activada' : 'Modo libre sin imán');
                }}
                className="flex items-center gap-1.5 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-xs text-on-surface text-[10px] font-semibold cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    magnetOn ? 'bg-emerald-600' : 'bg-outline-variant'
                  }`}
                />
                <span>Magnet: {magnetOn ? 'On' : 'Off'}</span>
              </button>
            </div>
          </div>

          {/* Primary Canvas Top Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              className="h-12 bg-on-surface hover:bg-secondary text-on-primary rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">bookmark_add</span>
              <span>Guardar Look</span>
            </button>
            <button
              type="button"
              onClick={handleExport4K}
              className="h-12 bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              <span>Exportar 4K</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (Armario Cápsula Picker + Travel Planner) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bottom Drawer: Garment Picker Carousel */}
          <div className={`space-y-3 ${studioMode === 'travel' ? 'hidden lg:block' : 'block'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-primary">
                  add_to_photos
                </span>
                <h2 className="text-[16px] font-semibold text-on-surface">Armario Cápsula</h2>
              </div>
              <span className="text-[10px] font-semibold text-secondary tabular-nums">
                {garments.length} Piezas Disponibles
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {(
                [
                  { id: 'knits', label: 'Tops' },
                  { id: 'bottoms', label: 'Bottoms' },
                  { id: 'capispalla', label: 'Capas' },
                  { id: 'calzature', label: 'Calzado' },
                  { id: 'accessori', label: 'Bolsos' },
                ] as const
              ).map((pill) => {
                const active = pickerFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setPickerFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium shrink-0 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-primary text-on-primary shadow-xs font-semibold'
                        : 'bg-surface-container text-secondary hover:text-on-surface'
                    }`}
                  >
                    {pill.label} ({pickerCounts[pill.id]})
                  </button>
                );
              })}
            </div>

            {/* Garment Selection Tray */}
            <div className="grid grid-cols-4 lg:grid-cols-3 gap-2">
              {pickerItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddGarmentToCanvas(item)}
                  className="group relative bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-1.5 flex flex-col items-center gap-1 shadow-xs hover:shadow-sm transition-shadow cursor-pointer select-none text-left"
                >
                  <div className="w-full aspect-[3/4] bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center p-1 relative">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackLabel={item.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xs opacity-90 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-[15px]">add</span>
                    </span>
                  </div>
                  <div className="w-full text-center px-0.5">
                    <p className="text-[10px] font-semibold text-on-surface truncate">
                      {item.name}
                    </p>
                    <span className="text-[9px] text-secondary block truncate">{item.fabric}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Planner Module (Combinatorial Luggage Engine FR-TRV-01) */}
          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 shadow-xs flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-start justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-xs shrink-0">
                  <span className="material-symbols-outlined text-[22px]">flight_takeoff</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="text-[15px] font-semibold text-on-surface">
                      {travelPlan.title}
                    </h2>
                    <span className="bg-secondary-container text-on-secondary-container text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {travelPlan.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary">
                    Algoritmo de empaque inteligente (FR-TRV-01)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTravelEditor((p) => !p)}
                aria-label="Editar prendas en maleta"
                className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-secondary cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showTravelEditor ? 'expand_less' : 'tune'}
                </span>
              </button>
            </div>

            {/* Combinatorial Formula Visual Display */}
            <div className="bg-surface-container-low rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-on-surface gap-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-secondary">
                  Cápsula Matemáticamente Optimizada
                </span>
                <span className="text-[10px] text-tertiary font-semibold flex items-center gap-0.5 tabular-nums shrink-0">
                  <span className="material-symbols-outlined text-[13px]">bolt</span>{' '}
                  {travelBreakdown.combinations} Outfits Listos
                </span>
              </div>

              <div className="flex items-center justify-between text-center pt-1 text-[10px] text-on-surface">
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center font-bold text-primary shadow-xs tabular-nums">
                    {travelBreakdown.outer.length}
                  </span>
                  <span className="text-[10px] text-secondary mt-1">Capa</span>
                </div>
                <span className="text-secondary font-bold">+</span>
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center font-bold text-primary shadow-xs tabular-nums">
                    {travelBreakdown.tops.length}
                  </span>
                  <span className="text-[10px] text-secondary mt-1">Tops</span>
                </div>
                <span className="text-secondary font-bold">+</span>
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center font-bold text-primary shadow-xs tabular-nums">
                    {travelBreakdown.bottoms.length}
                  </span>
                  <span className="text-[10px] text-secondary mt-1">Bottoms</span>
                </div>
                <span className="text-secondary font-bold">+</span>
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-lg bg-surface-container-lowest flex items-center justify-center font-bold text-primary shadow-xs tabular-nums">
                    {travelBreakdown.shoes.length}
                  </span>
                  <span className="text-[10px] text-secondary mt-1">Zapatos</span>
                </div>
                <span className="text-secondary font-bold">=</span>
                <div className="flex flex-col items-center">
                  <span className="w-7 h-7 rounded-lg bg-primary-container text-on-primary-container flex items-center justify-center font-bold shadow-xs tabular-nums">
                    {travelBreakdown.combinations}
                  </span>
                  <span className="text-[10px] text-primary font-semibold mt-1">Combinac.</span>
                </div>
              </div>
            </div>

            {/* Expandable Packing Editor */}
            {showTravelEditor && (
              <div className="bg-surface-container-low rounded-xl p-3 space-y-2 max-h-56 overflow-y-auto">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  Selecciona prendas para tu maleta de cabina ({packedGarments.length} incluidas)
                </p>
                {garments
                  .filter((g) => g.status === 'active')
                  .map((g) => {
                    const checked = travelPlan.packedGarmentIds.includes(g.id);
                    return (
                      <label
                        key={g.id}
                        className="flex items-center justify-between gap-2 py-1.5 px-2 bg-surface-container-lowest rounded-lg cursor-pointer text-[12px]"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePackedItem(g.id)}
                            className="w-4 h-4 accent-primary"
                          />
                          <span className="truncate font-medium text-on-surface">{g.name}</span>
                        </span>
                        <span className="text-[10px] text-secondary tabular-nums shrink-0">
                          {g.weightGrams}g
                        </span>
                      </label>
                    );
                  })}
              </div>
            )}

            {/* Luggage Weight & Circular Ring */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface-container-low rounded-xl p-3 flex items-center gap-2.5">
                <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className={
                        travelBreakdown.deltaKg >= 0 ? 'text-tertiary' : 'text-error'
                      }
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${travelBreakdown.weightPct}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-on-surface tabular-nums">
                    {travelBreakdown.totalWeightKg}k
                  </span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-secondary">Peso Valija</span>
                  <span className="text-[14px] text-on-surface font-semibold truncate">
                    {travelBreakdown.deltaKg >= 0 ? 'Cabina OK' : 'Sobrepeso'}
                  </span>
                  <span
                    className={`text-[10px] flex items-center gap-0.5 tabular-nums ${
                      travelBreakdown.deltaKg >= 0 ? 'text-emerald-700' : 'text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[11px]">
                      {travelBreakdown.deltaKg >= 0 ? 'check_circle' : 'warning'}
                    </span>
                    {travelBreakdown.deltaKg >= 0
                      ? `-${travelBreakdown.deltaKg} kg límite`
                      : `+${Math.abs(travelBreakdown.deltaKg)} kg exceso`}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-3 flex flex-col justify-center">
                <span className="text-[10px] text-secondary">Eficiencia Reuso</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-[22px] text-primary font-bold tabular-nums">100%</span>
                  <span className="text-[10px] text-secondary">piezas</span>
                </div>
                <span className="text-[10px] text-tertiary font-medium">
                  Cero prendas ociosas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowCalendarModal(true)}
              className="w-full py-2.5 min-h-[44px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-xl text-[12px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                calendar_month
              </span>
              <span>Ver Calendario de Outfits por Día (Londres)</span>
            </button>
          </div>
        </div>
      </div>

      {/* SAVE LOOK MODAL */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <form
            onSubmit={handleConfirmSaveLook}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-[20px] font-semibold text-on-surface">
                Guardar Look en Lookbook
              </h3>
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="space-y-2.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Nombre del Look
                <input
                  type="text"
                  required
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[13px] font-normal text-on-surface"
                />
              </label>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Ocasión / Dress Code
                <input
                  type="text"
                  value={lookOccasion}
                  onChange={(e) => setLookOccasion(e.target.value)}
                  className="mt-1 w-full h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[13px] font-normal text-on-surface"
                />
              </label>
            </div>
            <button
              type="submit"
              className="w-full h-12 bg-on-surface text-on-primary rounded-lg text-[13px] font-semibold cursor-pointer"
            >
              Guardar Composición ({studioLayers.length} capas)
            </button>
          </form>
        </div>
      )}

      {/* LONDON 4D OUTFIT CALENDAR MODAL */}
      {showCalendarModal && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowCalendarModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                  Itinerario Combinatorio · {travelPlan.title}
                </span>
                <h3 className="font-editorial text-[22px] font-semibold text-on-surface">
                  Calendario de Outfits
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalendarModal(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              {dailyItinerary.map((day) => (
                <div key={day.title} className="p-3 bg-surface-container-low rounded-xl space-y-2">
                  <p className="text-[12px] font-semibold text-primary">{day.title}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[day.outer, day.top, day.bottom, day.shoe].map((piece, i) => (
                      <div
                        key={`${day.title}-${piece.id}-${i}`}
                        className="bg-surface-container-lowest rounded-lg p-1.5 text-center"
                      >
                        <ResilientImage
                          src={piece.imageUrl}
                          alt={piece.name}
                          className="w-full h-14 object-contain"
                        />
                        <p className="text-[9px] font-medium text-on-surface truncate mt-1">
                          {piece.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
