import React, { useMemo, useState } from 'react';
import { ResilientImage } from '../components/ResilientImage';
import { AURELLE_IMAGES } from '../data/initialWardrobe';
import { calculateGarmentCpw, useAurelleStore } from '../hooks/useAurelleStore';

export function CpwEcoView() {
  const {
    garments,
    lookbooks,
    wearLogs,
    metrics,
    monetizeGarment,
    addGarment,
    setActiveTab,
    showToast,
  } = useAurelleStore();

  const [formulaOpen, setFormulaOpen] = useState(false);
  const [conservationTab, setConservationTab] = useState<'linen' | 'plastic'>('linen');
  const [exporting, setExporting] = useState(false);
  const [exportedDone, setExportedDone] = useState(false);
  const [gapAdded, setGapAdded] = useState(false);

  const goldDress = useMemo(
    () => garments.find((g) => g.id === 'g-gold-dress'),
    [garments]
  );

  const capispallaCount = useMemo(
    () => garments.filter((g) => g.category === 'capispalla').length,
    [garments]
  );

  const topEfficient = useMemo(() => {
    return [...garments]
      .filter((g) => g.status === 'active')
      .sort((a, b) => calculateGarmentCpw(a) - calculateGarmentCpw(b))
      .slice(0, 4);
  }, [garments]);

  const handleGapAction = () => {
    if (gapAdded) {
      setActiveTab('armario');
      return;
    }
    addGarment({
      name: 'Sobrecamisa Lino Neutra',
      category: 'capispalla',
      subCategoryLabel: 'Capispalla',
      imageUrl: AURELLE_IMAGES.hoyTrench,
      colorHex: '#D5C7B2',
      colorLabel: 'Lino Arena',
      fabric: '100% Lino Orgánico',
      purchasePrice: 135,
      maintenanceCost: 6,
      resaleEstimate: 45,
      wearCount: 1,
      inCapsule: true,
      badge: 'Brecha Resuelta',
      badgeTone: 'secondary',
      weightGrams: 340,
      status: 'active',
      lastWorn: 'Hoy',
      brand: 'Atelier Capsule',
    });
    setGapAdded(true);
    showToast('Sobrecamisa añadida: +8 combinaciones desbloqueadas en tu cápsula');
  };

  const handleExportGdpr = () => {
    setExporting(true);
    window.setTimeout(() => {
      const payload = {
        schema: 'Aurelle-GDPR-Art20-v1.0',
        exportedAt: new Date().toISOString(),
        sovereignty: 'EU Cloud AES-256 · Zero-Knowledge Image Pipeline',
        portfolioMetrics: metrics,
        garments: garments.map((g) => ({
          id: g.id,
          name: g.name,
          category: g.category,
          fabric: g.fabric,
          purchasePriceEur: g.purchasePrice,
          maintenanceCostEur: g.maintenanceCost,
          resaleEstimateEur: g.resaleEstimate,
          wearCount: g.wearCount,
          calculatedCpwEur: calculateGarmentCpw(g),
          status: g.status,
        })),
        lookbooksCount: lookbooks.length,
        wearLogs,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `aurelle-auditoria-gdpr-art20-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setExporting(false);
      setExportedDone(true);
      showToast('Informe GDPR Art. 20 descargado en formato JSON');
      window.setTimeout(() => setExportedDone(false), 3000);
    }, 650);
  };

  // Marker position on CPW efficiency bar (0..100%)
  const markerLeftPct = Math.min(92, Math.max(8, (metrics.weightedAvgCpw / 10) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
        {/* LEFT COLUMN: Portfolio Metrics + Fast Fashion Paradox */}
        <div className="lg:col-span-6 space-y-5">
          {/* Section 1: Key Portfolio Metrics (Textile Asset Accounting) */}
          <section className="flex flex-col bg-secondary text-on-secondary rounded-xl p-5 sm:p-6 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-secondary-fixed">
                  account_balance_wallet
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-secondary-fixed">
                  Auditoría Textil Patrimonial
                </span>
              </div>
              <span className="px-2.5 py-0.5 bg-secondary-fixed/20 text-secondary-fixed rounded-full text-[10px] font-semibold">
                Q3 Balance
              </span>
            </div>

            <div className="mt-4 z-10">
              <p className="text-[12px] font-medium text-secondary-fixed-dim">
                Valor Activo de Armario
              </p>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-editorial text-[30px] sm:text-[34px] font-medium tracking-tight tabular-nums">
                  €
                  {metrics.totalPortfolioValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-[11px] font-medium text-secondary-fixed flex items-center gap-0.5 tabular-nums">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>{' '}
                  {garments.length} prendas
                </span>
              </div>
            </div>

            {/* Micro Split Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-4 bg-secondary-container/12 rounded-lg p-3.5 z-10">
              <div>
                <p className="text-[10px] text-secondary-fixed-dim uppercase tracking-wider font-medium">
                  CPW Promedio Ponderado
                </p>
                <p className="font-editorial text-[22px] font-semibold text-on-secondary mt-0.5 tabular-nums">
                  €{metrics.weightedAvgCpw.toFixed(2)}{' '}
                  <span className="font-sans text-[11px] font-normal text-secondary-fixed">
                    / uso
                  </span>
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-surface-container-lowest/15 rounded text-[10px] text-secondary-fixed font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-fixed" />
                  <span>
                    {metrics.weightedAvgCpw <= 3 ? 'Cat. Excelente' : 'En Optimización'}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-secondary-fixed-dim uppercase tracking-wider font-medium">
                  Ahorro Proyectado Anual
                </p>
                <p className="font-editorial text-[22px] font-semibold text-secondary-fixed mt-0.5 tabular-nums">
                  +€{metrics.annualProjectedSavings.toFixed(2)}
                </p>
                <p className="text-[11px] text-secondary-fixed-dim mt-1">
                  vs compra impulsiva
                </p>
              </div>
            </div>

            {/* Formula Accordion */}
            <div className="mt-4 z-10">
              <button
                type="button"
                onClick={() => setFormulaOpen((prev) => !prev)}
                className="flex items-center justify-between w-full py-2 px-3 bg-surface-container-lowest/12 hover:bg-surface-container-lowest/20 rounded-lg text-left transition-colors cursor-pointer"
              >
                <span className="text-[11px] text-secondary-fixed tracking-wider font-mono">
                  CPW = (P.Compra + Manut. - Reventa) / N.Usos
                </span>
                <span
                  className={`material-symbols-outlined text-[16px] text-secondary-fixed transition-transform duration-200 ${
                    formulaOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {formulaOpen && (
                <div className="mt-2 p-3 bg-surface-container-lowest/12 rounded-lg text-[12px] text-surface-bright/95 leading-relaxed">
                  Métrica algorítmica regulada que imputa gastos de tintorería y valor residual de
                  mercado real para erradicar la falacia del bajo coste inmediato.
                </div>
              )}
            </div>
          </section>

          {/* Section 2: The Fast Fashion Economic Paradox */}
          <section className="flex flex-col bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-semibold text-on-surface">
                  La Paradoja Fast Fashion
                </h2>
                <p className="text-[12px] text-on-surface-variant">
                  Coste emocional versus contabilidad empírica
                </p>
              </div>
              <span className="material-symbols-outlined text-tertiary text-[24px]">balance</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Caso A */}
              <div className="flex flex-col bg-surface-container-low rounded-lg p-3 relative">
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                </div>
                <div className="w-full aspect-[4/3] rounded overflow-hidden bg-surface-container mb-2">
                  <ResilientImage
                    src={AURELLE_IMAGES.cpwFastDress}
                    alt="Vestido Fast Fashion"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wide text-error font-semibold">
                  Caso A: Vestido Fast
                </span>
                <p className="font-editorial text-[20px] font-semibold text-on-surface mt-0.5 tabular-nums">
                  €9.00 <span className="font-sans text-[11px] text-on-surface-variant">/uso</span>
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 tabular-nums">
                  P. Compra: €45
                </p>
                <p className="text-[10px] font-semibold text-error mt-1.5">
                  5 usos • Deformado & Obsoleto
                </p>
              </div>

              {/* Caso B */}
              <div className="flex flex-col bg-surface-container-high rounded-lg p-3 relative">
                <div className="absolute top-2.5 right-2.5 z-10">
                  <span className="material-symbols-outlined text-primary text-[16px]">
                    verified
                  </span>
                </div>
                <div className="w-full aspect-[4/3] rounded overflow-hidden bg-surface-container mb-2">
                  <ResilientImage
                    src={AURELLE_IMAGES.cpwCamelCoat}
                    alt="Abrigo Sartorial"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] uppercase tracking-wide text-primary font-semibold">
                  Caso B: Abrigo Sartorial
                </span>
                <p className="font-editorial text-[20px] font-semibold text-primary mt-0.5 tabular-nums">
                  €1.13 <span className="font-sans text-[11px] text-on-surface-variant">/uso</span>
                </p>
                <p className="text-[11px] text-on-surface-variant mt-0.5 tabular-nums">
                  €400 + €20 sast. - €80 rev.
                </p>
                <p className="text-[10px] text-primary font-semibold mt-1.5">
                  300 usos • 8x Más Rentable
                </p>
              </div>
            </div>

            {/* Visual Benchmark Scale */}
            <div className="pt-1">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                  Escala de Eficiencia CPW
                </span>
                <span className="text-[11px] text-primary font-semibold tabular-nums">
                  Tu Promedio: €{metrics.weightedAvgCpw.toFixed(2)}
                </span>
              </div>
              <div className="relative h-2.5 w-full bg-surface-container rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: '25%' }} />
                <div className="h-full bg-secondary" style={{ width: '25%' }} />
                <div className="h-full bg-tertiary-container" style={{ width: '30%' }} />
                <div className="h-full bg-error" style={{ width: '20%' }} />
                <span
                  className="absolute top-0 bottom-0 w-1 bg-on-surface shadow-xs"
                  style={{ left: `${markerLeftPct}%` }}
                  title={`Tu promedio: €${metrics.weightedAvgCpw.toFixed(2)}`}
                />
              </div>
              <div className="grid grid-cols-4 text-center mt-1.5 text-[9px] font-medium text-on-surface-variant">
                <div>&lt;€1 Básicos</div>
                <div>€1-€3 Calzado</div>
                <div>€3-€7 Sastrería</div>
                <div className="text-error font-semibold">&gt;€30 Crítico</div>
              </div>
            </div>
          </section>

          {/* Live Wardrobe Efficiency Ranking */}
          <section className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold text-on-surface">
                Prendas Más Rentables (Tiempo Real)
              </h3>
              <button
                type="button"
                onClick={() => setActiveTab('armario')}
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Ver Armario
              </button>
            </div>
            <div className="space-y-1.5">
              {topEfficient.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1.5 px-2.5 bg-surface-container-low rounded-lg text-[12px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.colorHex }}
                    />
                    <span className="font-medium text-on-surface truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    <span className="text-[11px] text-secondary">{item.wearCount} usos</span>
                    <span className="font-semibold text-primary">
                      €{calculateGarmentCpw(item).toFixed(2)}/uso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN: Cognitive Bias Audit + Conservation + GDPR Export */}
        <div className="lg:col-span-6 space-y-5">
          {/* Section 3: Cognitive Bias Audit & Gap Analysis */}
          <section className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                psychology
              </span>
              <h2 className="text-[18px] font-semibold text-on-surface">
                Auditoría de Sesgos Cognitivos
              </h2>
            </div>

            {/* Bias Card 1: Duplicate Item Bias */}
            <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 shadow-xs flex items-start gap-3">
              <div className="p-2 bg-error-container text-on-error-container rounded-lg shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[15px] font-semibold text-on-surface">
                    Sesgo de Duplicidad
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-error-container text-on-error-container rounded">
                    Alerta
                  </span>
                </div>
                <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                  Identificados{' '}
                  <strong className="text-on-surface">
                    {capispallaCount} abrigos/blazers estructurados
                  </strong>{' '}
                  con solapamiento funcional. Diluye la frecuencia de uso en un 25% e incrementa el
                  CPW conjunto a <span className="text-error font-semibold tabular-nums">€12.40</span>.
                </p>
              </div>
            </div>

            {/* Bias Card 2: Sunk Cost Alert */}
            {goldDress && (
              <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 shadow-xs flex flex-col space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-tertiary-fixed text-on-tertiary-fixed rounded-lg shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">price_change</span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-on-surface">
                        Falacia de Coste Hundido
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed rounded">
                        {goldDress.status === 'listed_resale' ? 'Publicado' : 'Acción AI'}
                      </span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mt-1">
                      <strong className="text-on-surface">{goldDress.name}:</strong> Coste €
                      {goldDress.purchasePrice}, {goldDress.wearCount} solo uso registrado (
                      <span className="text-error font-semibold tabular-nums">
                        CPW €{calculateGarmentCpw(goldDress).toFixed(2)}
                      </span>
                      ).
                    </p>
                  </div>
                </div>

                <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] text-on-surface-variant font-medium">
                      Valor reventa Vestiaire / Vinted
                    </p>
                    <p className="text-[16px] font-semibold text-on-surface tabular-nums">
                      Est. €{goldDress.resaleEstimate.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      monetizeGarment(goldDress.id);
                      showToast(
                        goldDress.status === 'listed_resale'
                          ? 'Prenda retirada de reventa'
                          : `Prenda listada en Vestiaire/Vinted (+€${goldDress.resaleEstimate} estimados)`
                      );
                    }}
                    className={`px-4 py-2.5 min-h-[40px] rounded-md text-[12px] font-semibold transition-colors cursor-pointer shrink-0 ${
                      goldDress.status === 'listed_resale'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-primary text-on-primary hover:bg-secondary'
                    }`}
                  >
                    {goldDress.status === 'listed_resale'
                      ? 'En Reventa (Publicado)'
                      : 'Monetizar Prenda'}
                  </button>
                </div>
              </div>
            )}

            {/* Bias Card 3: Wardrobe Gap Analysis */}
            <div className="bg-surface-container-lowest border border-outline-variant/25 rounded-xl p-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-secondary-container text-on-secondary-container rounded-lg shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[15px] font-semibold text-on-surface">
                      Análisis de Brecha Cápsula
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded">
                      +8 Looks
                    </span>
                  </div>
                  <p className="text-[12px] text-on-surface-variant mt-1 leading-relaxed">
                    Falta 1 prenda clave de transición (
                    <strong className="text-on-surface">
                      Sobrecamisa de lino o gabardina neutra
                    </strong>
                    ). Incorporarla desbloqueará 8 combinaciones dormidas reduciendo el CPW global.
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleGapAction}
                  className="px-3.5 py-2 rounded-md bg-surface-container hover:bg-surface-container-high text-[12px] font-semibold text-primary cursor-pointer transition-colors"
                >
                  {gapAdded ? 'Ver en Armario →' : '+ Simular Incorporación a Cápsula'}
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Physical Textile Conservation Protocol */}
          <section className="flex flex-col bg-surface-container-low rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-[22px]">
                dry_cleaning
              </span>
              <div>
                <h2 className="text-[17px] font-semibold text-on-surface">
                  Protocolo de Conservación Textil
                </h2>
                <p className="text-[12px] text-on-surface-variant">
                  Alarga los ciclos de uso y preserva el valor residual
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 bg-surface-container-high p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setConservationTab('linen')}
                className={`py-2 px-2 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                  conservationTab === 'linen'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cajas de Lino
              </button>
              <button
                type="button"
                onClick={() => setConservationTab('plastic')}
                className={`py-2 px-2 rounded-md text-[12px] font-semibold transition-all cursor-pointer ${
                  conservationTab === 'plastic'
                    ? 'bg-surface-container-lowest text-on-surface shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Cajas Rígidas
              </button>
            </div>

            {conservationTab === 'linen' ? (
              <div className="flex flex-col space-y-2.5 bg-surface-container-lowest p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">air</span>
                  <h3 className="text-[15px] font-semibold text-on-surface">
                    Almacenamiento Transpirable
                  </h3>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Ideal para cachemira, lanas vírgenes y suéteres de punto grueso. Permite la
                  circulación de aire evitando el apelmazado de fibras naturales y la retención de
                  olores de estancia.
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-primary text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Recomendado para 18 prendas de tu cápsula de invierno</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2.5 bg-surface-container-lowest p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    shield
                  </span>
                  <h3 className="text-[15px] font-semibold text-on-surface">
                    Aislamiento Hermético Estacional
                  </h3>
                </div>
                <p className="text-[12px] text-on-surface-variant leading-relaxed">
                  Óptimo para prendas de algodón y trajes en trasteros o sótanos. Protección 100%
                  estanca contra humedad relativa fluctuante, polvo y polillas durante 6+ meses.
                </p>
                <div className="flex items-center gap-1.5 pt-1 text-secondary text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Añade siempre desecante de sílice de grado textil</span>
                </div>
              </div>
            )}

            <div className="bg-surface-container-high rounded-lg p-3.5 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
                verified
              </span>
              <p className="text-[12px] text-on-surface leading-relaxed">
                <strong>Regla de Oro:</strong> 100% lavado y secado biológico previo al empaque +
                saquitos de madera de cedro o flor de lavanda natural para garantizar cero desgaste
                orgánico.
              </p>
            </div>
          </section>

          {/* Section 5: GDPR Data Export Action */}
          <section className="flex flex-col items-center pt-1">
            <button
              type="button"
              onClick={handleExportGdpr}
              disabled={exporting}
              className="w-full py-3.5 px-5 min-h-[48px] bg-surface-container-high hover:bg-surface-container-highest text-on-surface rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  exporting
                    ? 'animate-spin text-primary'
                    : exportedDone
                      ? 'text-primary'
                      : 'text-secondary'
                }`}
              >
                {exporting
                  ? 'sync'
                  : exportedDone
                    ? 'check_circle'
                    : 'download_for_offline'}
              </span>
              <span>
                {exporting
                  ? 'Generando Archivo Cifrado...'
                  : exportedDone
                    ? 'Informe Exportado Exitosamente'
                    : 'Descargar Informe de Auditoría GDPR (JSON Art. 20)'}
              </span>
            </button>
            <p className="text-[11px] text-on-surface-variant mt-2 text-center">
              Portabilidad garantizada de datos de desgaste, adquisición y trazabilidad de huella
              ecológica.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
