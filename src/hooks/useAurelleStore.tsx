import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  CITY_CONTEXTS,
  INITIAL_GARMENTS,
  INITIAL_LOOKBOOKS,
  INITIAL_STUDIO_LAYERS,
  INITIAL_TRAVEL_PLAN,
} from '../data/initialWardrobe';
import {
  AppTab,
  CanvasLayer,
  CityContext,
  Garment,
  Lookbook,
  TravelPlan,
  WearLog,
} from '../types/wardrobe';

const STORAGE_KEY = 'aurelle_atelier_state_v1';

export function calculateGarmentCpw(garment: Garment): number {
  const uses = Math.max(1, garment.wearCount);
  const netCost = Math.max(garment.purchasePrice * 0.15, garment.purchasePrice + garment.maintenanceCost - garment.resaleEstimate);
  return Number((netCost / uses).toFixed(2));
}

export function calculateRawFormulaCpw(garment: Garment): number {
  const uses = Math.max(1, garment.wearCount);
  const netCost = Math.max(0, garment.purchasePrice + garment.maintenanceCost - garment.resaleEstimate);
  return Number((netCost / uses).toFixed(2));
}

interface PersistedState {
  garments: Garment[];
  lookbooks: Lookbook[];
  wearLogs: WearLog[];
  studioLayers: CanvasLayer[];
  travelPlan: TravelPlan;
  selectedCityId: string;
  hoyFeedback: Record<string, 'like' | 'dislike' | null>;
}

interface AurelleContextValue {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  garments: Garment[];
  lookbooks: Lookbook[];
  wearLogs: WearLog[];
  studioLayers: CanvasLayer[];
  setStudioLayers: React.Dispatch<React.SetStateAction<CanvasLayer[]>>;
  travelPlan: TravelPlan;
  setTravelPlan: React.Dispatch<React.SetStateAction<TravelPlan>>;
  selectedCity: CityContext;
  setSelectedCityId: (id: string) => void;
  hoyFeedback: Record<string, 'like' | 'dislike' | null>;
  setHoyFeedbackForCity: (cityId: string, vote: 'like' | 'dislike' | null) => void;
  logOutfitWear: (garmentIds: string[], occasion: string) => { updatedCount: number; prevAvg: number; newAvg: number };
  incrementGarmentWear: (garmentId: string) => void;
  addGarment: (garment: Omit<Garment, 'id'>) => Garment;
  updateGarment: (id: string, patch: Partial<Garment>) => void;
  deleteGarment: (id: string) => void;
  monetizeGarment: (id: string) => void;
  saveLookbook: (lookbook: Omit<Lookbook, 'id' | 'createdAt'>) => Lookbook;
  deleteLookbook: (id: string) => void;
  loadLookbookToStudio: (lookbook: Lookbook) => void;
  sendGarmentToStudio: (garment: Garment) => void;
  resetDemoData: () => void;
  metrics: {
    totalPortfolioValue: number;
    weightedAvgCpw: number;
    rotationRate: number;
    capsuleCount: number;
    annualProjectedSavings: number;
    resaleRecovered: number;
  };
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AurelleContext = createContext<AurelleContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (Array.isArray(parsed.garments) && parsed.garments.length > 0) {
        return {
          garments: parsed.garments,
          lookbooks: parsed.lookbooks ?? INITIAL_LOOKBOOKS,
          wearLogs: parsed.wearLogs ?? [],
          studioLayers: parsed.studioLayers ?? INITIAL_STUDIO_LAYERS,
          travelPlan: parsed.travelPlan ?? INITIAL_TRAVEL_PLAN,
          selectedCityId: parsed.selectedCityId ?? 'milano',
          hoyFeedback: parsed.hoyFeedback ?? {},
        };
      }
    }
  } catch {
    // Fallback to initial seed
  }
  return {
    garments: INITIAL_GARMENTS,
    lookbooks: INITIAL_LOOKBOOKS,
    wearLogs: [],
    studioLayers: INITIAL_STUDIO_LAYERS,
    travelPlan: INITIAL_TRAVEL_PLAN,
    selectedCityId: 'milano',
    hoyFeedback: {},
  };
}

export function AurelleProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadInitialState(), []);

  const [activeTab, setActiveTab] = useState<AppTab>('hoy');
  const [garments, setGarments] = useState<Garment[]>(initial.garments);
  const [lookbooks, setLookbooks] = useState<Lookbook[]>(initial.lookbooks);
  const [wearLogs, setWearLogs] = useState<WearLog[]>(initial.wearLogs);
  const [studioLayers, setStudioLayers] = useState<CanvasLayer[]>(initial.studioLayers);
  const [travelPlan, setTravelPlan] = useState<TravelPlan>(initial.travelPlan);
  const [selectedCityId, setSelectedCityId] = useState<string>(initial.selectedCityId);
  const [hoyFeedback, setHoyFeedback] = useState<Record<string, 'like' | 'dislike' | null>>(
    initial.hoyFeedback
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const payload: PersistedState = {
        garments,
        lookbooks,
        wearLogs,
        studioLayers,
        travelPlan,
        selectedCityId,
        hoyFeedback,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [garments, lookbooks, wearLogs, studioLayers, travelPlan, selectedCityId, hoyFeedback]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const selectedCity = useMemo(
    () => CITY_CONTEXTS.find((c) => c.id === selectedCityId) ?? CITY_CONTEXTS[0],
    [selectedCityId]
  );

  const computeMetrics = (list: Garment[]) => {
    const active = list.filter((g) => g.status === 'active');
    const totalPortfolioValue = list.reduce((sum, g) => sum + g.purchasePrice, 0);
    const totalNetCost = active.reduce(
      (sum, g) => sum + Math.max(g.purchasePrice * 0.15, g.purchasePrice + g.maintenanceCost - g.resaleEstimate),
      0
    );
    const totalWears = Math.max(
      1,
      active.reduce((sum, g) => sum + g.wearCount, 0)
    );
    const weightedAvgCpw = Number((totalNetCost / totalWears).toFixed(2));
    const rotated = active.filter((g) => g.wearCount >= 10).length;
    const rotationRate = active.length > 0 ? Math.round((rotated / active.length) * 100) : 0;
    const capsuleCount = active.filter((g) => g.inCapsule).length;
    const resaleRecovered = list
      .filter((g) => g.status === 'listed_resale')
      .reduce((sum, g) => sum + g.resaleEstimate, 0);
    const annualProjectedSavings = Math.round(680 + wearLogs.length * 18 + resaleRecovered * 0.5);

    return {
      totalPortfolioValue,
      weightedAvgCpw,
      rotationRate,
      capsuleCount,
      annualProjectedSavings,
      resaleRecovered,
    };
  };

  const metrics = useMemo(() => computeMetrics(garments), [garments, wearLogs.length]);

  const logOutfitWear = (garmentIds: string[], occasion: string) => {
    const prevAvg = metrics.weightedAvgCpw;
    const uniqueIds = Array.from(new Set(garmentIds));
    const nextGarments = garments.map((g) =>
      uniqueIds.includes(g.id) ? { ...g, wearCount: g.wearCount + 1, lastWorn: 'Hoy' } : g
    );
    const nextMetrics = computeMetrics(nextGarments);
    setGarments(nextGarments);
    setWearLogs((prev) => [
      {
        id: `wear-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        occasion,
        garmentIds: uniqueIds,
        resultingAvgCpw: nextMetrics.weightedAvgCpw,
      },
      ...prev,
    ]);
    return {
      updatedCount: uniqueIds.length,
      prevAvg,
      newAvg: nextMetrics.weightedAvgCpw,
    };
  };

  const incrementGarmentWear = (garmentId: string) => {
    setGarments((prev) =>
      prev.map((g) =>
        g.id === garmentId ? { ...g, wearCount: g.wearCount + 1, lastWorn: 'Hoy' } : g
      )
    );
  };

  const addGarment = (garment: Omit<Garment, 'id'>) => {
    const created: Garment = {
      ...garment,
      id: `g-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setGarments((prev) => [created, ...prev]);
    return created;
  };

  const updateGarment = (id: string, patch: Partial<Garment>) => {
    setGarments((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  };

  const deleteGarment = (id: string) => {
    setGarments((prev) => prev.filter((g) => g.id !== id));
    setStudioLayers((prev) => prev.filter((l) => l.garmentId !== id));
  };

  const monetizeGarment = (id: string) => {
    setGarments((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: g.status === 'listed_resale' ? 'active' : 'listed_resale',
              badge: g.status === 'listed_resale' ? 'CPW Crítico' : 'En Venta',
              badgeTone: g.status === 'listed_resale' ? 'error' : 'secondary',
            }
          : g
      )
    );
  };

  const saveLookbook = (lookbook: Omit<Lookbook, 'id' | 'createdAt'>) => {
    const created: Lookbook = {
      ...lookbook,
      id: `lb-${Date.now()}`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setLookbooks((prev) => [created, ...prev]);
    return created;
  };

  const deleteLookbook = (id: string) => {
    setLookbooks((prev) => prev.filter((l) => l.id !== id));
  };

  const loadLookbookToStudio = (lookbook: Lookbook) => {
    if (lookbook.layers && lookbook.layers.length > 0) {
      setStudioLayers(lookbook.layers);
    } else {
      const rebuilt: CanvasLayer[] = lookbook.garmentIds
        .map((gid, idx) => {
          const item = garments.find((g) => g.id === gid);
          if (!item) return null;
          return {
            instanceId: `lb-layer-${Date.now()}-${idx}`,
            garmentId: item.id,
            label: `L${idx} · ${item.name}`,
            imageUrl: item.imageUrl,
            x: (idx % 2 === 0 ? -1 : 1) * (idx === 0 ? 0 : 8),
            y: -18 + idx * 12,
            widthPct: idx === 0 ? 64 : 46,
            scale: 1,
            rotation: idx % 2 === 0 ? -1 : 1.2,
            flipX: false,
            zIndex: idx + 1,
          } as CanvasLayer;
        })
        .filter((x): x is CanvasLayer => x !== null);
      if (rebuilt.length > 0) {
        setStudioLayers(rebuilt);
      }
    }
    setActiveTab('studio');
    showToast(`Look "${lookbook.name}" cargado en Studio`);
  };

  const sendGarmentToStudio = (garment: Garment) => {
    const newLayer: CanvasLayer = {
      instanceId: `layer-${Date.now()}`,
      garmentId: garment.id,
      label: `${garment.subCategoryLabel} · ${garment.name}`,
      imageUrl: garment.imageUrl,
      x: 0,
      y: 0,
      widthPct: garment.category === 'capispalla' ? 66 : garment.category === 'accessori' || garment.category === 'calzature' ? 38 : 50,
      scale: 1,
      rotation: 0,
      flipX: false,
      zIndex: studioLayers.length + 1,
    };
    setStudioLayers((prev) => [...prev, newLayer]);
    setActiveTab('studio');
    showToast(`"${garment.name}" añadido al Canvas de Studio`);
  };

  const setHoyFeedbackForCity = (cityId: string, vote: 'like' | 'dislike' | null) => {
    setHoyFeedback((prev) => ({ ...prev, [cityId]: vote }));
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setGarments(INITIAL_GARMENTS);
    setLookbooks(INITIAL_LOOKBOOKS);
    setWearLogs([]);
    setStudioLayers(INITIAL_STUDIO_LAYERS);
    setTravelPlan(INITIAL_TRAVEL_PLAN);
    setSelectedCityId('milano');
    setHoyFeedback({});
    showToast('Datos del atelier restaurados');
  };

  return (
    <AurelleContext.Provider
      value={{
        activeTab,
        setActiveTab,
        garments,
        lookbooks,
        wearLogs,
        studioLayers,
        setStudioLayers,
        travelPlan,
        setTravelPlan,
        selectedCity,
        setSelectedCityId,
        hoyFeedback,
        setHoyFeedbackForCity,
        logOutfitWear,
        incrementGarmentWear,
        addGarment,
        updateGarment,
        deleteGarment,
        monetizeGarment,
        saveLookbook,
        deleteLookbook,
        loadLookbookToStudio,
        sendGarmentToStudio,
        resetDemoData,
        metrics,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </AurelleContext.Provider>
  );
}

export function useAurelleStore() {
  const ctx = useContext(AurelleContext);
  if (!ctx) {
    throw new Error('useAurelleStore must be used inside AurelleProvider');
  }
  return ctx;
}
