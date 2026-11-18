import React, { useMemo, useState } from 'react';
import { ResilientImage } from '../components/ResilientImage';
import { AURELLE_IMAGES } from '../data/initialWardrobe';
import { calculateGarmentCpw, useAurelleStore } from '../hooks/useAurelleStore';
import { Garment, GarmentCategory } from '../types/wardrobe';

type SortMode = 'cpw-asc' | 'cpw-desc' | 'wears-desc' | 'price-desc';

const PIPELINES = [
  { id: 'camera', name: 'Cámara Directa', code: 'FR-UPL-01', icon: 'camera', highlight: false },
  { id: 'batch', name: 'Carga Masiva', code: 'FR-UPL-02', icon: 'drive_folder_upload', highlight: false },
  { id: 'receipt', name: 'Parsing Pedidos', code: 'FR-UPL-03', icon: 'receipt_long', highlight: false },
  { id: 'catalog', name: 'Catálogo Global', code: 'FR-UPL-04', icon: 'public', highlight: false },
  { id: 'dissect', name: 'Disección Outfit', code: 'FR-UPL-05', icon: 'content_cut', highlight: true },
] as const;

const PRESET_IMPORTS: Array<Omit<Garment, 'id'>> = [
  {
    name: 'Sobrecamisa Lino Arena',
    category: 'capispalla',
    subCategoryLabel: 'Capispalla',
    imageUrl: AURELLE_IMAGES.hoyTrench,
    colorHex: '#D5C7B2',
    colorLabel: 'Lino Natural',
    fabric: '100% Lino Belga',
    purchasePrice: 145,
    maintenanceCost: 6,
    resaleEstimate: 48,
    wearCount: 1,
    inCapsule: true,
    badge: 'Brecha Cápsula',
    badgeTone: 'secondary',
    weightGrams: 340,
    status: 'active',
    lastWorn: 'Nuevo',
    brand: 'Massimo Dutti Studio',
  },
  {
    name: 'Mocasines Cuero Espresso',
    category: 'calzature',
    subCategoryLabel: 'Calzature',
    imageUrl: AURELLE_IMAGES.studioBagLoafers,
    colorHex: '#4E3427',
    colorLabel: 'Espresso Oscuro',
    fabric: 'Piel Boxcalf',
    purchasePrice: 230,
    maintenanceCost: 10,
    resaleEstimate: 95,
    wearCount: 12,
    inCapsule: true,
    weightGrams: 690,
    status: 'active',
    lastWorn: 'Reciente',
    brand: 'Sebago Atelier',
  },
  {
    name: 'Blazer Desestructurado Gris',
    category: 'capispalla',
    subCategoryLabel: 'Capispalla',
    imageUrl: AURELLE_IMAGES.armarioBlazer,
    colorHex: '#5A6169',
    colorLabel: 'Gris Pizarra',
    fabric: 'Lana Virgen Ligera',
    purchasePrice: 260,
    maintenanceCost: 10,
    resaleEstimate: 85,
    wearCount: 8,
    inCapsule: true,
    weightGrams: 560,
    status: 'active',
    lastWorn: 'Hace 1 semana',
    brand: 'Theory Tailored',
  },
];

export function ArmarioView() {
  const {
    garments,
    metrics,
    incrementGarmentWear,
    addGarment,
    updateGarment,
    deleteGarment,
    sendGarmentToStudio,
    showToast,
  } = useAurelleStore();

  const [categoryFilter, setCategoryFilter] = useState<'all' | GarmentCategory>('all');
  const [sortMode, setSortMode] = useState<SortMode>('cpw-asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedGarment, setSelectedGarment] = useState<Garment | null>(null);

  // Add / Pipeline Modal State
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [activePipeline, setActivePipeline] = useState<string>('Cámara Directa');
  const [isProcessingMatting, setIsProcessingMatting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<GarmentCategory>('knits');
  const [newFabric, setNewFabric] = useState('Lana Merino');
  const [newPrice, setNewPrice] = useState('140');
  const [newColorHex, setNewColorHex] = useState('#C5A079');
  const [newImageUrl, setNewImageUrl] = useState(AURELLE_IMAGES.armarioCashmere);

  const counts = useMemo(() => {
    const map: Record<'all' | GarmentCategory, number> = {
      all: garments.length,
      capispalla: 0,
      knits: 0,
      bottoms: 0,
      calzature: 0,
      accessori: 0,
    };
    garments.forEach((g) => {
      map[g.category] += 1;
    });
    return map;
  }, [garments]);

  const filteredGarments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = garments.filter((g) => {
      const catOk = categoryFilter === 'all' || g.category === categoryFilter;
      const searchOk =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.fabric.toLowerCase().includes(q) ||
        g.subCategoryLabel.toLowerCase().includes(q);
      return catOk && searchOk;
    });

    return [...list].sort((a, b) => {
      if (sortMode === 'cpw-asc') return calculateGarmentCpw(a) - calculateGarmentCpw(b);
      if (sortMode === 'cpw-desc') return calculateGarmentCpw(b) - calculateGarmentCpw(a);
      if (sortMode === 'wears-desc') return b.wearCount - a.wearCount;
      return b.purchasePrice - a.purchasePrice;
    });
  }, [garments, categoryFilter, sortMode, searchQuery]);

  const cycleSortMode = () => {
    const order: SortMode[] = ['cpw-asc', 'cpw-desc', 'wears-desc', 'price-desc'];
    const next = order[(order.indexOf(sortMode) + 1) % order.length];
    setSortMode(next);
  };

  const sortLabel = {
    'cpw-asc': 'Por CPW (Menor)',
    'cpw-desc': 'Por CPW (Mayor)',
    'wears-desc': 'Más Usos',
    'price-desc': 'Mayor Valor',
  }[sortMode];

  const handleOpenPipeline = (pipelineName: string) => {
    setActivePipeline(pipelineName);
    setShowIngestModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewImageUrl(reader.result);
        if (!newName) {
          setNewName(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddGarmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setIsProcessingMatting(true);

    const subLabelMap: Record<GarmentCategory, string> = {
      capispalla: 'Capispalla',
      knits: 'Tops & Knits',
      bottoms: 'Pantaloni',
      calzature: 'Calzature',
      accessori: 'Accessori',
    };

    window.setTimeout(() => {
      const priceNum = Math.max(10, Number(newPrice) || 120);
      addGarment({
        name: newName.trim(),
        category: newCategory,
        subCategoryLabel: subLabelMap[newCategory],
        imageUrl: newImageUrl,
        colorHex: newColorHex,
        colorLabel: 'Personalizado',
        fabric: newFabric.trim() || 'Tejido Natural',
        purchasePrice: priceNum,
        maintenanceCost: Math.round(priceNum * 0.05),
        resaleEstimate: Math.round(priceNum * 0.35),
        wearCount: 1,
        inCapsule: true,
        badge: 'Recién Indexada',
        badgeTone: 'secondary',
        weightGrams: 420,
        status: 'active',
        lastWorn: 'Hoy',
      });
      setIsProcessingMatting(false);
      setShowIngestModal(false);
      setNewName('');
      showToast(`"${newName.trim()}" recortada en 300ms e indexada en tu armario`);
    }, 350);
  };

  const handlePresetImport = (preset: Omit<Garment, 'id'>) => {
    addGarment(preset);
    setShowIngestModal(false);
    showToast(`"${preset.name}" importada vía ${activePipeline}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 space-y-4">
      {/* Header Section */}
      <div className="flex items-end justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Digital Atelier Core
          </span>
          <h1 className="font-editorial text-[28px] sm:text-[34px] font-medium text-on-surface tracking-tight leading-tight mt-0.5">
            Armario Inteligente
          </h1>
        </div>
        <div className="flex items-center gap-1.5 bg-surface-container-high px-3 py-1.5 rounded-full shadow-xs shrink-0">
          <span className="material-symbols-outlined material-symbols-filled text-[15px] text-primary">
            cloud_done
          </span>
          <span className="text-[10px] text-on-surface-variant font-semibold">Sincronizado</span>
        </div>
      </div>

      {/* Top Desktop Grid: Ingestion Strip + Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* 5 Ingestion Pipelines */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-on-surface font-semibold tracking-wide flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
              5 Pipelines de Ingesta IA
            </span>
            <span className="text-[10px] font-medium text-secondary">Auto-cutout 300ms</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <button
              type="button"
              onClick={() => handleOpenPipeline('Cámara Directa')}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 min-h-[46px] bg-tertiary text-on-tertiary rounded-xl shadow-xs hover:opacity-92 active:scale-95 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span className="text-[12px] font-semibold whitespace-nowrap">+ Añadir Prenda</span>
            </button>

            {PIPELINES.map((pipe) => (
              <button
                key={pipe.id}
                type="button"
                onClick={() => handleOpenPipeline(pipe.name)}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 min-h-[46px] bg-surface-container-lowest border border-outline-variant/25 text-on-surface rounded-xl shadow-xs hover:bg-surface-container transition-colors cursor-pointer"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    pipe.highlight
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{pipe.icon}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[12px] font-semibold leading-tight whitespace-nowrap">
                    {pipe.name}
                  </span>
                  <span className="text-[10px] text-secondary whitespace-nowrap">{pipe.code}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Wardrobe Overview & Stats Ribbon */}
        <div className="lg:col-span-5 bg-surface-container-low rounded-xl p-3 border border-outline-variant/25 flex flex-col justify-between">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center gap-2.5 p-2 bg-surface-container-lowest rounded-lg">
              <div className="w-8 h-8 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed shrink-0">
                <span className="material-symbols-outlined text-[17px]">dry_cleaning</span>
              </div>
              <div>
                <span className="text-[18px] font-bold leading-tight block text-on-surface tabular-nums">
                  {garments.length}
                </span>
                <span className="text-[10px] font-medium text-secondary leading-none">
                  Prendas Creadas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 bg-surface-container-lowest rounded-lg">
              <div className="w-8 h-8 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shrink-0">
                <span className="material-symbols-outlined text-[17px]">repeat</span>
              </div>
              <div>
                <span className="text-[18px] font-bold leading-tight block text-tertiary tabular-nums">
                  {metrics.rotationRate}%
                </span>
                <span className="text-[10px] font-medium text-secondary leading-none">
                  Tasa de Rotación
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-on-surface-variant text-[10px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>{metrics.capsuleCount} activas en Cápsula Otoño</span>
            </div>
            <div className="flex items-center gap-1 text-secondary">
              <span className="material-symbols-outlined text-[13px]">lock</span>
              <span>GDPR Zero-Knowledge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: 'all', label: 'Todas' },
              { id: 'capispalla', label: 'Capispalla' },
              { id: 'knits', label: 'Tops & Knits' },
              { id: 'bottoms', label: 'Pantaloni & Gonne' },
              { id: 'calzature', label: 'Calzature' },
              { id: 'accessori', label: 'Accessori' },
            ] as const
          ).map((tab) => {
            const active = categoryFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`flex-shrink-0 px-3.5 py-2 min-h-[38px] rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-on-surface text-on-primary shadow-xs'
                    : 'text-secondary bg-surface-container-high hover:bg-surface-container-highest'
                }`}
              >
                {tab.label}{' '}
                <span className={`font-normal tabular-nums ${active ? 'opacity-80' : 'opacity-70'}`}>
                  ({counts[tab.id]})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative sm:w-64 shrink-0">
          <span className="material-symbols-outlined text-[18px] text-secondary absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prenda o tejido..."
            className="w-full h-10 pl-9 pr-3 bg-surface-container-lowest border border-outline-variant/50 rounded-full text-[12px] text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Count & Sort Sub-bar */}
      <div className="flex items-center justify-between px-0.5">
        <span className="text-[10px] text-secondary uppercase tracking-[0.06em] font-semibold">
          Catálogo Indexado (Vector 4096-D) · {filteredGarments.length} visibles
        </span>
        <button
          type="button"
          onClick={cycleSortMode}
          className="flex items-center gap-1 text-[11px] text-on-surface font-semibold hover:opacity-75 py-1 px-2 rounded-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">swap_vert</span>
          <span>{sortLabel}</span>
        </button>
      </div>

      {/* Garment Grid */}
      {filteredGarments.length === 0 ? (
        <div className="p-10 text-center bg-surface-container-low rounded-xl space-y-2">
          <span className="material-symbols-outlined text-[32px] text-secondary">checkroom</span>
          <p className="text-[14px] font-semibold text-on-surface">
            No se encontraron prendas con este filtro
          </p>
          <button
            type="button"
            onClick={() => {
              setCategoryFilter('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-on-surface text-on-primary rounded-md text-[12px] font-semibold cursor-pointer"
          >
            Mostrar todas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {filteredGarments.map((garment) => {
            const cpw = calculateGarmentCpw(garment);
            const badgeClass =
              garment.badgeTone === 'error'
                ? 'bg-error-container text-on-error-container'
                : garment.badgeTone === 'secondary'
                  ? 'bg-secondary-container text-on-secondary-container'
                  : 'bg-tertiary-fixed text-on-tertiary-fixed';

            return (
              <div
                key={garment.id}
                className="group flex flex-col bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-2.5 shadow-xs hover:shadow-md transition-shadow relative"
              >
                {garment.badge && (
                  <div className="absolute top-3 left-3 z-10 pointer-events-none">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shadow-xs ${badgeClass}`}
                    >
                      {garment.badge}
                    </span>
                  </div>
                )}

                {/* Quick Action Menu Trigger */}
                <div className="absolute top-2.5 right-2.5 z-20">
                  <button
                    type="button"
                    aria-label={`Opciones para ${garment.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId((prev) => (prev === garment.id ? null : garment.id));
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-bright/85 text-secondary hover:text-on-surface backdrop-blur-md cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">more_vert</span>
                  </button>

                  {openMenuId === garment.id && (
                    <div
                      className="absolute right-0 mt-1 w-44 bg-surface-container-lowest border border-outline-variant/40 rounded-xl shadow-xl py-1 z-30"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          incrementGarmentWear(garment.id);
                          setOpenMenuId(null);
                          showToast(`+1 uso registrado en "${garment.name}"`);
                        }}
                        className="w-full px-3 py-2 text-left text-[12px] hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          add_circle
                        </span>
                        <span>Registrar +1 uso</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuId(null);
                          sendGarmentToStudio(garment);
                        }}
                        className="w-full px-3 py-2 text-left text-[12px] hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-secondary">
                          layers
                        </span>
                        <span>Enviar a Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateGarment(garment.id, { inCapsule: !garment.inCapsule });
                          setOpenMenuId(null);
                          showToast(
                            garment.inCapsule
                              ? 'Retirada de Cápsula Otoño'
                              : 'Añadida a Cápsula Otoño'
                          );
                        }}
                        className="w-full px-3 py-2 text-left text-[12px] hover:bg-surface-container flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px] text-tertiary">
                          auto_awesome
                        </span>
                        <span>{garment.inCapsule ? 'Quitar de Cápsula' : 'Añadir a Cápsula'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteGarment(garment.id);
                          setOpenMenuId(null);
                          showToast(`"${garment.name}" eliminada`);
                        }}
                        className="w-full px-3 py-2 text-left text-[12px] text-error hover:bg-error-container/30 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                        <span>Eliminar prenda</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Image */}
                <button
                  type="button"
                  onClick={() => setSelectedGarment(garment)}
                  className="relative w-full aspect-[3/4] bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center mb-2 cursor-pointer"
                >
                  <ResilientImage
                    src={garment.imageUrl}
                    alt={garment.name}
                    fallbackLabel={garment.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                  />
                </button>

                {/* Metadata */}
                <button
                  type="button"
                  onClick={() => setSelectedGarment(garment)}
                  className="flex flex-col gap-1 text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-secondary uppercase font-semibold tracking-wider">
                      {garment.subCategoryLabel}
                    </span>
                    <span
                      className="w-2.5 h-2.5 rounded-full shadow-inner border border-outline-variant/40"
                      style={{ backgroundColor: garment.colorHex }}
                      title={garment.colorLabel}
                    />
                  </div>
                  <h3 className="text-[15px] font-semibold text-on-surface truncate">
                    {garment.name}
                  </h3>
                  <div className="flex items-center justify-between mt-1 pt-1.5 bg-surface-container-low px-2 py-1 rounded-md">
                    <div className="flex items-center gap-1 text-secondary">
                      <span className="material-symbols-outlined text-[13px]">history</span>
                      <span className="text-[10px] font-medium tabular-nums">
                        {garment.wearCount} usos
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-secondary">CPW</span>
                      <span
                        className={`text-[12px] font-semibold tabular-nums ${
                          cpw < 2.5 ? 'text-tertiary' : cpw > 30 ? 'text-error' : 'text-primary'
                        }`}
                      >
                        €{cpw.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Zero-Knowledge Processing Notice */}
      <div className="w-full bg-surface-container-high rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex-shrink-0 flex items-center justify-center text-primary shadow-xs">
          <span className="material-symbols-outlined text-[18px]">enhanced_encryption</span>
        </div>
        <div className="flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[12px] font-semibold text-on-surface">
              Segmentación Stateless & Soberanía de Datos
            </span>
            <span className="bg-primary-fixed text-on-primary-fixed text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase">
              EU AI ACT
            </span>
          </div>
          <p className="text-[12px] text-on-surface-variant mt-0.5 leading-relaxed">
            Las fotos crudas originales se eliminan irreversiblemente tras procesar el recorte
            vectorial de la prenda. Metadatos de tejido y colorimetría encriptados localmente.
          </p>
        </div>
      </div>

      {/* GARMENT DETAIL MODAL */}
      {selectedGarment && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setSelectedGarment(null)}
        >
          <div
            className="w-full sm:max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
                  {selectedGarment.subCategoryLabel} · {selectedGarment.brand || 'Colección Privada'}
                </span>
                <h3 className="font-editorial text-[22px] font-semibold text-on-surface">
                  {selectedGarment.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGarment(null)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="w-full h-52 bg-surface-container-low rounded-xl flex items-center justify-center p-3">
              <ResilientImage
                src={selectedGarment.imageUrl}
                alt={selectedGarment.name}
                className="h-full w-auto object-contain"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 bg-surface-container-low p-3 rounded-xl text-center">
              <div>
                <span className="text-[10px] text-secondary uppercase">Compra</span>
                <p className="text-[15px] font-bold text-on-surface tabular-nums">
                  €{selectedGarment.purchasePrice}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase">Usos</span>
                <p className="text-[15px] font-bold text-on-surface tabular-nums">
                  {garments.find((g) => g.id === selectedGarment.id)?.wearCount ??
                    selectedGarment.wearCount}
                </p>
              </div>
              <div>
                <span className="text-[10px] text-secondary uppercase">CPW Real</span>
                <p className="text-[15px] font-bold text-primary tabular-nums">
                  €
                  {calculateGarmentCpw(
                    garments.find((g) => g.id === selectedGarment.id) ?? selectedGarment
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="text-[12px] text-on-surface-variant space-y-1">
              <p>
                <strong className="text-on-surface">Tejido:</strong> {selectedGarment.fabric}
              </p>
              <p>
                <strong className="text-on-surface">Peso viaje:</strong> {selectedGarment.weightGrams}g
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  incrementGarmentWear(selectedGarment.id);
                  showToast(`+1 uso registrado en "${selectedGarment.name}"`);
                }}
                className="h-11 bg-on-surface text-on-primary rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Registrar +1 Uso</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedGarment;
                  setSelectedGarment(null);
                  sendGarmentToStudio(target);
                }}
                className="h-11 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">layers</span>
                <span>Abrir en Studio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE / ADD GARMENT INGESTION MODAL */}
      {showIngestModal && (
        <div
          className="fixed inset-0 z-50 bg-on-background/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowIngestModal(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                  Pipeline IA · {activePipeline}
                </span>
                <h3 className="font-editorial text-[22px] font-semibold text-on-surface">
                  Indexar Nueva Prenda
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Quick 1-click preset imports for Parsing / Catalog / Dissection */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                Importación Rápida Detectada ({activePipeline})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PRESET_IMPORTS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetImport(preset)}
                    className="p-2 bg-surface-container-low hover:bg-surface-container rounded-lg flex sm:flex-col items-center gap-2 text-left sm:text-center cursor-pointer transition-colors"
                  >
                    <ResilientImage
                      src={preset.imageUrl}
                      alt={preset.name}
                      className="w-10 h-12 sm:w-12 sm:h-14 object-contain rounded"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-on-surface truncate">
                        {preset.name}
                      </p>
                      <span className="text-[10px] text-primary font-semibold tabular-nums">
                        €{preset.purchasePrice} · + Importar
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleAddGarmentSubmit}
              className="space-y-3 pt-3 border-t border-outline-variant/30"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
                O Sube Foto / Registro Manual
              </p>

              <div className="flex items-center gap-3">
                <div className="w-16 h-20 bg-surface-container-low rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-outline-variant/40">
                  <ResilientImage
                    src={newImageUrl}
                    alt="Vista previa"
                    className="w-full h-full object-contain p-1"
                  />
                </div>
                <label className="flex-1 h-11 px-3 rounded-lg border border-dashed border-outline bg-surface-container-low hover:bg-surface-container flex items-center justify-center gap-2 text-[12px] font-medium text-on-surface cursor-pointer">
                  <span className="material-symbols-outlined text-[18px] text-primary">
                    upload_file
                  </span>
                  <span>Subir imagen local (recorte stateless)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  placeholder="Nombre (ej. Cárdigan Alpaca)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[13px]"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as GarmentCategory)}
                  className="h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[13px]"
                >
                  <option value="capispalla">Capispalla (Abrigos/Blazers)</option>
                  <option value="knits">Tops & Knits</option>
                  <option value="bottoms">Pantaloni & Gonne</option>
                  <option value="calzature">Calzature</option>
                  <option value="accessori">Accessori</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <input
                  type="text"
                  placeholder="Tejido"
                  value={newFabric}
                  onChange={(e) => setNewFabric(e.target.value)}
                  className="col-span-1 h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[12px]"
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Precio €"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="col-span-1 h-11 px-3 rounded-lg border border-outline-variant bg-surface text-[12px] tabular-nums"
                />
                <label className="col-span-1 h-11 px-2 rounded-lg border border-outline-variant bg-surface flex items-center justify-between text-[12px]">
                  <span className="text-secondary">Color</span>
                  <input
                    type="color"
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isProcessingMatting}
                className="w-full h-12 bg-on-surface hover:bg-secondary text-on-primary rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isProcessingMatting ? 'animate-spin' : ''
                  }`}
                >
                  {isProcessingMatting ? 'progress_activity' : 'auto_fix_high'}
                </span>
                <span>
                  {isProcessingMatting
                    ? 'Procesando recorte vectorial (300ms)...'
                    : 'Indexar Prenda en Armario'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
