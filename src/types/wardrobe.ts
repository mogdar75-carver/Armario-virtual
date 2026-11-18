export type AppTab = 'hoy' | 'armario' | 'studio' | 'cpw-eco';

export type GarmentCategory =
  | 'capispalla'
  | 'knits'
  | 'bottoms'
  | 'calzature'
  | 'accessori';

export type GarmentStatus = 'active' | 'listed_resale' | 'archived';

export interface Garment {
  id: string;
  name: string;
  category: GarmentCategory;
  subCategoryLabel: string;
  imageUrl: string;
  colorHex: string;
  colorLabel: string;
  fabric: string;
  purchasePrice: number;
  maintenanceCost: number;
  resaleEstimate: number;
  wearCount: number;
  inCapsule: boolean;
  badge?: string;
  badgeTone?: 'tertiary' | 'secondary' | 'error';
  weightGrams: number;
  status: GarmentStatus;
  lastWorn?: string;
  brand?: string;
}

export interface CanvasLayer {
  instanceId: string;
  garmentId: string;
  label: string;
  imageUrl: string;
  x: number; // percentage offset from center (-45 to 45)
  y: number; // percentage offset from center (-45 to 45)
  widthPct: number;
  scale: number;
  rotation: number;
  flipX: boolean;
  zIndex: number;
}

export interface Lookbook {
  id: string;
  name: string;
  createdAt: string;
  garmentIds: string[];
  harmonyScore: number;
  occasion: string;
  source: 'hoy' | 'studio';
  layers?: CanvasLayer[];
}

export interface WearLog {
  id: string;
  date: string;
  occasion: string;
  garmentIds: string[];
  resultingAvgCpw: number;
}

export interface CityContext {
  id: string;
  city: string;
  district: string;
  dateLabel: string;
  tempCurrent: number;
  tempMorning: number;
  tempAfternoon: number;
  rainChance: number;
  weatherIcon: string;
  agenda: Array<{ time: string; title: string; dressCode: string }>;
}

export interface TravelPlan {
  id: string;
  title: string;
  tag: string;
  days: number;
  weightLimitKg: number;
  packedGarmentIds: string[];
}
