import React, { useMemo, useState } from 'react';
import { ResilientImage } from '../components/ResilientImage';
import { AURELLE_IMAGES, CITY_CONTEXTS } from '../data/initialWardrobe';
import { calculateGarmentCpw, useAurelleStore } from '../hooks/useAurelleStore';
import { Garment } from '../types/wardrobe';

const KNIT_ALTERNATIVES = ['g-cashmere', 'g-silk-shirt', 'g-oxford', 'g-merino-turtle'];
const BOTTOM_ALTERNATIVES = ['g-trousers', 'g-pleated-skirt', 'g-flare-taupe'];

export function HoyView() {
  const {
    garments,
    selectedCity,
    setSelectedCityId,
    hoyFeedback,
    setHoyFeedbackForCity,
    logOutfitWear,
    saveLookbook,
    sendGarmentToStudio,
    wearLogs,
    showToast,
    setActiveTab,
  } = useAurelleStore();

  const [eveningPreview, setEveningPreview] = useState(false);
  const [knitIdx, setKnitIdx] = useState(0);
  const [bottomIdx, setBottomIdx] = useState(0);
  const [swapping, setSwapping] = useState(false);
  const [wornToday, setWornToday] = useState(false);
  const [savedLookbook, setSavedLookbook] = useState(false);
  const [inspectedGarment, setInspectedGarment] = useState<Garment | null>(null);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [customEvents, setCustomEvents] = useState<Record<string, Array<{ time: string; title: string; dressCode: string }>>>({});
  const [newEventTime, setNewEventTime] = useState('17:00');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCode, setNewEventCode] = useState('Smart Casual');

  const findGarment = (id: string, fallbackIdx = 0) =>
    garments.find((g) => g.id === id) ?? garments[fallbackIdx] ?? garments[0];

  const outerGarment = useMemo(() => {
    if (eveningPreview) {
      return findGarment('g-blazer-navy', 3);
    }
    return findGarment('g-trench', 0);
  }, [eveningPreview, garments]);

  const topGarment = useMemo(() => {
    const id = KNIT_ALTERNATIVES[knitIdx % KNIT_ALTERNATIVES.length];
    return findGarment(id, 1);
  }, [knitIdx, garments]);

  const bottomGarment = useMemo(() => {
    const id = BOTTOM_ALTERNATIVES[bottomIdx % BOTTOM_ALTERNATIVES.length];
    return findGarment(id, 2);
  }, [bottomIdx, garments]);

  const shoeGarment = useMemo(() => findGarment('g-chelsea', 4), [garments]);
  const bagGarment = useMemo(() => findGarment('g-tote-cognac', 12), [garments]);

  // Use the editorial lookbook photos from Hoy HTML when showing the default hero items
  const outerImg =
    outerGarment.id === 'g-trench' ? AURELLE_IMAGES.hoyTrench : outerGarment.imageUrl;
  const topImg =
    topGarment.id === 'g-cashmere' ? AURELLE_IMAGES.hoyCashmere : topGarment.imageUrl;
  const bottomImg =
    bottomGarment.id === 'g-trousers' ? AURELLE_IMAGES.hoyTrousers : bottomGarment.imageUrl;
  const shoeImg =
    shoeGarment.id === 'g-chelsea' ? AURELLE_IMAGES.hoyChelsea : shoeGarment.imageUrl;
  const bagImg =
    bagGarment.id === 'g-tote-cognac' ? AURELLE_IMAGES.hoyTote : bagGarment.imageUrl;

  const currentOutfitIds = [
    outerGarment.id,
    topGarment.id,
    bottomGarment.id,
    shoeGarment.id,
    bagGarment.id,
  ];

  const harmonyScore = useMemo(() => {
    const base = eveningPreview ? 97.6 : 98.4;
    const offset = ((knitIdx * 3 + bottomIdx * 2) % 5) * 0.2;
    return (base - offset).toFixed(1);
  }, [eveningPreview, knitIdx, bottomIdx]);

  const outerCpw = calculateGarmentCpw(outerGarment).toFixed(2).replace('.', ',');
  const tempDelta = selectedCity.tempAfternoon - selectedCity.tempMorning;
  const currentAgenda = [
    ...selectedCity.agenda,
    ...(customEvents[selectedCity.id] ?? []),
  ];

  const currentVote = hoyFeedback[selectedCity.id] ?? null;

  const handleCycleCity = () => {
    const idx = CITY_CONTEXTS.findIndex((c) => c.id === selectedCity.id);
    const next = CITY_CONTEXTS[(idx + 1) % CITY_CONTEXTS.length];
    setSelectedCityId(next.id);
    setWornToday(false);
    setSavedLookbook(false);
    showToast(`Contexto climático actualizado: ${next.city} (${next.tempCurrent}°C)`);
  };

  const handleSwapPiece = () => {
    setSwapping(true);
    setWornToday(false);
    setSavedLookbook(false);
    window.setTimeout(() => {
      if (knitIdx % 2 === 0) {
        setKnitIdx((prev) => prev + 1);
      } else {
        setKnitIdx((prev) => prev + 1);
        setBottomIdx((prev) => prev + 1);
      }
      setSwapping(false);
      showToast('Alternativa AI aplicada al conjunto');
    }, 450);
  };

  const handleWearToday = () => {
    const result = logOutfitWear(
      currentOutfitIds,
      eveningPreview ? 'Cena Informal 19:30' : `${selectedCity.city} · ${currentAgenda[0]?.title ?? 'Curaduría Diaria'}`
    );
    setWornToday(true);
    const diffPct =
      result.prevAvg > 0
        ? Math.max(0.4, ((result.prevAvg - result.newAvg) / result.prevAvg) * 100).toFixed(1)
        : '2.4';
    showToast(
      `Uso registrado: +${result.updatedCount} prendas actualizadas. CPW optimizado (-${diffPct}%).`
    );
  };

  const handleSaveLookbook = () => {
    saveLookbook({
      name: eveningPreview
        ? `Noche ${selectedCity.city} · Blazer`
        : `${selectedCity.city} · ${topGarment.name}`,
      garmentIds: currentOutfitIds,
      harmonyScore: Number(harmonyScore),
      occasion: eveningPreview ? 'Cena Informal 19:30' : currentAgenda[0]?.dressCode ?? 'Formal / Tailored',
      source: 'hoy',
    });
    setSavedLookbook(true);
    showToast('Outfit guardado en tu Lookbook');
  };

  const handleAddAgendaEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    setCustomEvents((prev) => ({
      ...prev,
      [selectedCity.id]: [
        ...(prev[selectedCity.id] ?? []),
        { time: newEventTime, title: newEventTitle.trim(), dressCode: newEventCode },
      ],
    }));
    setNewEventTitle('');
    setShowAgendaModal(false);
    showToast('Compromiso sincronizado con tu agenda de vestimenta');
  };

  const swatches = [
    outerGarment.colorHex,
    topGarment.colorHex,
    bottomGarment.colorHex,
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* LEFT COLUMN: Context + Outfit Hero Collage */}
        <div className="lg:col-span-7 space-y-4">
          {/* CONTEXTUAL INTELLIGENCE HEADER */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCycleCity}
                className="flex flex-col text-left group cursor-pointer"
                title="Cambiar ciudad y contexto climático"
              >
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.08em]">
                  {selectedCity.dateLabel}
                </span>
                <span className="font-editorial text-[20px] sm:text-[24px] font-semibold text-on-surface flex items-center gap-1.5">
                  <span>
                    {selectedCity.city} · {selectedCity.district}
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-primary opacity-70 group-hover:opacity-100 transition-opacity">
                    swap_horiz
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={handleCycleCity}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-high hover:bg-surface-container-highest rounded-full shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span className="material-symbols-outlined material-symbols-filled text-[18px] text-primary">
                  {selectedCity.weatherIcon}
                </span>
                <div className="flex items-baseline gap-1 tabular-nums">
                  <span className="text-[16px] font-semibold text-on-surface">
                    {selectedCity.tempCurrent}°C
                  </span>
                  <span className="text-[10px] font-semibold text-secondary">
                    {selectedCity.rainChance}% lluvia
                  </span>
                </div>
              </button>
            </div>

            {/* Shedding strategy alert banner */}
            <div className="p-3 bg-surface-container rounded-xl flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  thermostat
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-on-surface tracking-[0.02em]">
                    Estrategia de Capas Activa
                  </p>
                  <span className="text-[10px] font-semibold text-tertiary px-2 py-0.5 rounded bg-tertiary-fixed/40 tabular-nums shrink-0">
                    Delta {tempDelta}°C
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant mt-0.5 leading-snug">
                  Mañana fresca ({selectedCity.tempMorning}°C) → Tarde templada (
                  {selectedCity.tempAfternoon}°C). Capa exterior desmontable recomendada para movilidad.
                </p>
              </div>
            </div>

            {/* Agenda Synchronization Context */}
            <button
              type="button"
              onClick={() => setShowAgendaModal(true)}
              className="w-full p-3 bg-surface-container-low hover:bg-surface-container rounded-xl flex items-center gap-2.5 text-left transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                event_upcoming
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-secondary uppercase tracking-[0.06em]">
                  Compromisos de Hoy ({currentAgenda.length})
                </p>
                <p className="text-[12px] text-on-surface truncate">
                  {currentAgenda.map((ev, idx) => (
                    <React.Fragment key={`${ev.time}-${idx}`}>
                      {idx > 0 && ' · '}
                      <span className="font-semibold text-primary tabular-nums">{ev.time}</span>{' '}
                      {ev.title} ({ev.dressCode})
                    </React.Fragment>
                  ))}
                </p>
              </div>
              <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                add_circle_outline
              </span>
            </button>
          </section>

          {/* AI RECOMMENDATION HERO CARD */}
          <section className="bg-surface-container-lowest rounded-xl p-4 sm:p-5 border border-outline-variant/30 shadow-xs space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 relative z-10">
              <div>
                <span className="text-[10px] text-tertiary font-bold tracking-[0.08em] uppercase flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  {eveningPreview ? 'Transición Cena 19:30' : 'Curaduría Matutina'}
                </span>
                <h1 className="font-editorial text-[22px] sm:text-[26px] font-medium text-on-surface mt-0.5">
                  Outfit Recomendado
                </h1>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container rounded-full text-on-secondary-container shrink-0">
                <span className="material-symbols-outlined text-[14px]">model_training</span>
                <span className="text-[10px] font-semibold tracking-wide tabular-nums whitespace-nowrap">
                  CLIP {harmonyScore}% Armonía
                </span>
              </div>
            </div>

            {/* Atelier Fashion Collage (Asymmetric Grid) */}
            <div className="grid grid-cols-12 gap-2 relative">
              {/* Outerwear Anchor Piece (7 Cols) */}
              <button
                type="button"
                onClick={() => setInspectedGarment(outerGarment)}
                className="col-span-7 relative rounded-lg overflow-hidden bg-surface-container-low group text-left cursor-pointer"
              >
                <ResilientImage
                  src={outerImg}
                  alt={outerGarment.name}
                  fallbackLabel={outerGarment.name}
                  className="w-full aspect-[3/4.2] object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/15 to-transparent flex flex-col justify-end p-2.5 sm:p-3">
                  <span className="text-[10px] text-surface-bright/90 uppercase tracking-[0.08em] font-semibold">
                    Capa Exterior
                  </span>
                  <p className="text-[15px] sm:text-[16px] font-semibold text-on-primary leading-tight">
                    {outerGarment.name === 'Trench Coat Clásico'
                      ? 'Trench Lana Beige'
                      : outerGarment.name}
                  </p>
                  <span className="text-[11px] font-semibold text-tertiary-fixed tabular-nums mt-0.5">
                    CPW: {outerCpw} €/uso
                  </span>
                </div>
              </button>

              {/* Right Column Grid: Sweater + Trousers (5 Cols) */}
              <div className="col-span-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedGarment(topGarment)}
                  className="relative rounded-lg overflow-hidden bg-surface-container-low flex-1 group text-left cursor-pointer"
                >
                  <ResilientImage
                    src={topImg}
                    alt={topGarment.name}
                    fallbackLabel={topGarment.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/10 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[9px] text-surface-bright/90 uppercase tracking-[0.08em] font-semibold">
                      Top Base
                    </span>
                    <p className="text-[12px] font-semibold text-on-primary truncate">
                      {topGarment.name === 'Jersey Cachemira'
                        ? 'Cachemira Marfil'
                        : topGarment.name}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedGarment(bottomGarment)}
                  className="relative rounded-lg overflow-hidden bg-surface-container-low flex-1 group text-left cursor-pointer"
                >
                  <ResilientImage
                    src={bottomImg}
                    alt={bottomGarment.name}
                    fallbackLabel={bottomGarment.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/10 to-transparent flex flex-col justify-end p-2">
                    <span className="text-[9px] text-surface-bright/90 uppercase tracking-[0.08em] font-semibold">
                      Pantalón
                    </span>
                    <p className="text-[12px] font-semibold text-on-primary truncate">
                      {bottomGarment.name === 'Pantalón Pinzas Lana'
                        ? 'Gris Marengo'
                        : bottomGarment.name}
                    </p>
                  </div>
                </button>
              </div>

              {/* Horizontal Accents Bar: Chelsea Boots & Leather Tote */}
              <button
                type="button"
                onClick={() => setInspectedGarment(shoeGarment)}
                className="col-span-6 relative rounded-lg overflow-hidden bg-surface-container-low h-28 group text-left cursor-pointer"
              >
                <ResilientImage
                  src={shoeImg}
                  alt={shoeGarment.name}
                  fallbackLabel={shoeGarment.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/15 to-transparent flex items-end p-2.5">
                  <div>
                    <span className="text-[9px] text-surface-bright/85 uppercase tracking-[0.08em] font-semibold block">
                      Calzado
                    </span>
                    <p className="text-[12px] font-semibold text-on-primary">
                      Chelsea Cuero Negro
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setInspectedGarment(bagGarment)}
                className="col-span-6 relative rounded-lg overflow-hidden bg-surface-container-low h-28 group text-left cursor-pointer"
              >
                <ResilientImage
                  src={bagImg}
                  alt={bagGarment.name}
                  fallbackLabel={bagGarment.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-background/80 via-on-background/15 to-transparent flex items-end p-2.5">
                  <div>
                    <span className="text-[9px] text-surface-bright/85 uppercase tracking-[0.08em] font-semibold block">
                      Accesorio Clave
                    </span>
                    <p className="text-[12px] font-semibold text-on-primary">Tote Piel Coñac</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Color Palette Harmony & Structural Metrics */}
            <div className="p-3 bg-surface-container rounded-lg space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.06em]">
                  Cromática & Morfología
                </span>
                <span className="text-[11px] font-semibold text-primary">
                  Neutro Cálido · Kibbe Classic
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className="flex items-center gap-3">
                  {swatches.map((hex, i) => (
                    <div key={`${hex}-${i}`} className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full shadow-inner border border-outline-variant/40 inline-block"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                      <span className="text-[10px] text-on-surface-variant font-mono uppercase">
                        {hex}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1 text-tertiary">
                  <span className="material-symbols-outlined text-[16px]">balance</span>
                  <span className="text-[10px] font-semibold tabular-nums">Vertical 1.618</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: 3-Layer Strategy, Feedback & Thumb-Zone Action Dock */}
        <div className="lg:col-span-5 space-y-4">
          {/* DECISION FATIGUE REDUCER: 3-Layer Breakdown & Day-to-Night Swap */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-on-surface">
                Estrategia Modular 3 Capas
              </h2>
              <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.06em]">
                Anti-Fatiga Térmica
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-surface-container rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-secondary uppercase font-semibold tracking-wider">
                    Capa 1
                  </span>
                  <p className="text-[12px] text-on-surface font-semibold mt-1">Base Skin</p>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">
                  Camiseta técnica modal transpirable.
                </p>
              </div>

              <div className="p-3 bg-surface-container rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-primary uppercase font-semibold tracking-wider">
                    Capa 2
                  </span>
                  <p className="text-[12px] text-on-surface font-semibold mt-1">Confort A/C</p>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">
                  {topGarment.name} para oficina 21°C.
                </p>
              </div>

              <div className="p-3 bg-surface-container rounded-lg flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-tertiary uppercase font-semibold tracking-wider">
                    Capa 3
                  </span>
                  <p className="text-[12px] text-on-surface font-semibold mt-1">Escudo Ext.</p>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-2 leading-tight">
                  {eveningPreview
                    ? 'Blazer marino desestructurado noche.'
                    : 'Trench repelente viento y bruma matinal.'}
                </p>
              </div>
            </div>

            {/* Evening Transition Quick Toggle */}
            <div className="p-3 bg-surface-container-high rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-on-secondary shrink-0">
                  <span className="material-symbols-outlined text-[18px]">nightlife</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] text-on-surface font-semibold truncate">
                    Alternativa Cena 19:30
                  </p>
                  <p className="text-[11px] text-on-surface-variant truncate">
                    Swap instantáneo: Blazer desestructurado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEveningPreview((prev) => !prev);
                  setWornToday(false);
                }}
                className={`px-3 py-2 min-h-[40px] rounded-md text-[11px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  eveningPreview
                    ? 'bg-secondary text-on-secondary shadow-xs'
                    : 'bg-surface-container-lowest text-primary shadow-xs hover:bg-primary hover:text-on-primary'
                }`}
              >
                {eveningPreview ? 'Restaurar' : 'Previsualizar'}
              </button>
            </div>
          </section>

          {/* QUICK FEEDBACK BAR */}
          <section className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-tertiary">
                sentiment_satisfied
              </span>
              <span className="text-[12px] text-on-surface font-medium">
                ¿Te convence esta propuesta?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = currentVote === 'like' ? null : 'like';
                  setHoyFeedbackForCity(selectedCity.id, next);
                  if (next === 'like') showToast('Preferencia registrada para futuras curadurías');
                }}
                aria-label="Excelente match"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
                  currentVote === 'like'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-secondary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">thumb_up</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = currentVote === 'dislike' ? null : 'dislike';
                  setHoyFeedbackForCity(selectedCity.id, next);
                  if (next === 'dislike') {
                    handleSwapPiece();
                  }
                }}
                aria-label="Descartar combinación"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-xs cursor-pointer ${
                  currentVote === 'dislike'
                    ? 'bg-error text-on-error'
                    : 'bg-surface-container-lowest text-on-surface hover:bg-error-container'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">thumb_down</span>
              </button>
            </div>
          </section>

          {/* ERGONOMIC THUMB-ZONE ACTION DOCK */}
          <section className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={handleWearToday}
              className={`w-full h-12 rounded-md text-[14px] font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all cursor-pointer ${
                wornToday
                  ? 'bg-primary text-on-primary'
                  : 'bg-on-background text-surface-bright hover:bg-secondary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {wornToday ? 'task_alt' : 'checkroom'}
              </span>
              <span>{wornToday ? '¡Guardado para Hoy!' : 'Vestir Hoy & Registrar Uso'}</span>
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleSwapPiece}
                disabled={swapping}
                className="h-11 bg-surface-container hover:bg-surface-container-high rounded-md text-[12px] text-on-surface font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[18px] text-primary ${
                    swapping ? 'animate-spin' : ''
                  }`}
                >
                  {swapping ? 'progress_activity' : 'sync_alt'}
                </span>
                <span>{swapping ? 'Buscando...' : 'Alternar Pieza (AI)'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveLookbook}
                className="h-11 bg-surface-container hover:bg-surface-container-high rounded-md text-[12px] text-on-surface font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[18px] text-tertiary ${
                    savedLookbook ? 'material-symbols-filled' : ''
                  }`}
                >
                  {savedLookbook ? 'bookmark_check' : 'bookmark_add'}
                </span>
                <span>{savedLookbook ? 'Guardado' : 'Guardar en Lookbook'}</span>
              </button>
            </div>
          </section>

          {/* Recent Wear Logs Card (Desktop & Mobile Quick Audit) */}
          {wearLogs.length > 0 && (
            <section className="p-3.5 bg-surface-container-lowest border border-outline-variant/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">
                  Historial de Registro Reciente
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('cpw-eco')}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                >
                  Ver Auditoría CPW
                </button>
              </div>
              <div className="space-y-1.5">
                {wearLogs.slice(0, 3).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between text-[12px] py-1 border-b border-outline-variant/20 last:border-b-0"
                  >
                    <span className="text-on-surface font-medium truncate pr-2">
                      {log.occasion}
                    </span>
                    <span className="text-primary font-semibold tabular-nums shrink-0">
                      CPW Global €{log.resultingAvgCpw.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* GARMENT INSPECTOR MODAL */}
      {inspectedGarment && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setInspectedGarment(null)}
        >
          <div
            className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary">
                  {inspectedGarment.subCategoryLabel} · {inspectedGarment.fabric}
                </span>
                <h3 className="font-editorial text-[22px] font-semibold text-on-surface">
                  {inspectedGarment.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedGarment(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center bg-surface-container-low p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-secondary uppercase">Usos</span>
                <p className="text-[18px] font-bold text-on-surface tabular-nums">
                  {inspectedGarment.wearCount}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase">CPW Actual</span>
                <p className="text-[18px] font-bold text-primary tabular-nums">
                  €{calculateGarmentCpw(inspectedGarment).toFixed(2)}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase">Reventa Est.</span>
                <p className="text-[18px] font-bold text-tertiary tabular-nums">
                  €{inspectedGarment.resaleEstimate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  sendGarmentToStudio(inspectedGarment);
                  setInspectedGarment(null);
                }}
                className="h-11 bg-surface-container hover:bg-surface-container-high rounded-lg text-[12px] font-semibold text-on-surface flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">layers</span>
                <span>Abrir en Studio</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInspectedGarment(null);
                  setActiveTab('armario');
                }}
                className="h-11 bg-on-surface text-on-primary rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">checkroom</span>
                <span>Ver en Armario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGENDA MODAL */}
      {showAgendaModal && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowAgendaModal(false)}
        >
          <div
            className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-editorial text-[20px] font-semibold text-on-surface">
                Agenda {selectedCity.city}
              </h3>
              <button
                type="button"
                onClick={() => setShowAgendaModal(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              {currentAgenda.map((ev, idx) => (
                <div
                  key={`${ev.time}-${idx}`}
                  className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="text-[13px] font-semibold text-on-surface">
                      <span className="text-primary tabular-nums mr-1.5">{ev.time}</span>
                      {ev.title}
                    </p>
                    <p className="text-[11px] text-secondary">Dress Code: {ev.dressCode}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddAgendaEvent} className="space-y-2.5 pt-2 border-t border-outline-variant/30">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Añadir Compromiso
              </p>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="col-span-1 h-10 px-2.5 rounded-lg border border-outline-variant bg-surface text-[12px]"
                />
                <input
                  type="text"
                  placeholder="Ej. Reunión Galería"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="col-span-2 h-10 px-3 rounded-lg border border-outline-variant bg-surface text-[12px]"
                  required
                />
              </div>
              <select
                value={newEventCode}
                onChange={(e) => setNewEventCode(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface text-[12px]"
              >
                <option value="Formal/Tailored">Formal/Tailored</option>
                <option value="Smart Casual">Smart Casual</option>
                <option value="Cocktail Minimal">Cocktail Minimal</option>
              </select>
              <button
                type="submit"
                className="w-full h-11 bg-primary text-on-primary rounded-lg text-[13px] font-semibold cursor-pointer"
              >
                Sincronizar Compromiso
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
