// Типы для стен
export type WallType = "brick" | "aerated_concrete" | "concrete" | "wooden_frame" | "glued_beam_frame";

// Типы для стесненности
export type CrampedType = "none" | "medium" | "high";

// Типы для удаленности объекта
export type DistanceType = number; // расстояние в километрах

// Типы для квалификации специалистов
export type SkillLevel = "expert" | "master" | "assistant";

// Радиаторы
export type RadiatorScheme = "tee" | "manifold";
export type RadiatorType = "panel" | "sectional" | "tubular" | "infloor";
export type LayingCore = "floor" | "chase" | "ceiling" | "open";
export type Laying = LayingCore | "inherit";
export type Connection = "bottom" | "side";

// Водоснабжение
export type WaterScheme = "sequential" | "collector";
export type PipeMaterial = "PEX" | "PEX-AL-PEX" | "PP" | "Cu" | "Steel";
export type PipeDiameter = "16" | "20" | "25" | "32" | "40" | "50";
export type CollectorSupplyDiameter = "16" | "20" | "25" | "32";
export type ConnectionType = "manifold" | "tee"; // Коллекторное или тройниковое подключение

// Факторы проекта
export interface ProjectFactors {
  wall: WallType;
  cramped: CrampedType;
  distance: DistanceType;
}

// Состояние проекта
export interface ProjectState {
  title: string;
  hourlyRates: Record<SkillLevel, number>;
  factors: ProjectFactors;
}

// Радиаторы
export interface SystemBlock {
  id: string;
  name: string;
  scheme: RadiatorScheme;
  defaultLaying: LayingCore;
  defaultPipeMaterial: PipeMaterial;
  defaultDiameter: PipeDiameter;
  collectors: CollectorConfig[];
}

export interface RadiatorSection {
  systems: SystemBlock[]; // Массив систем
}

export interface CollectorConfig {
  id: string;
  name: string;
  location?: string; // Расположение коллектора (необязательно)
  connectionType?: ConnectionType; // Тип подключения (по умолчанию коллекторное)
  loops: number; // Длина подводящих коллектора
  outputs: number; // Количество выходов коллектора
  layingType: 'chase' | 'external' | 'ceiling' | 'floor'; // Способ прокладки
  hasPump: boolean; // Наличие насосной группы
  hasCabinet: boolean; // Наличие коллекторного шкафа
  cabinetType?: 'built-in' | 'surface-mounted'; // Тип шкафа (встроенный/накладной)
  material: PipeMaterial; // Материал коллектора
  supplyDiameter: CollectorSupplyDiameter; // Диаметр труб подводящих коллектора
  // Поля для тройникового подключения
  teeMainLengthM?: number;
  teeBranchesCount?: number;
  teeMainDiameter?: CollectorSupplyDiameter;
  teeMainMaterial?: PipeMaterial;
}

export interface RadiatorItem {
  id: string;
  room: string;
  radiatorType: RadiatorType;
  connection: Connection;
  supplyLenM: number;
  laying: Laying;
  // Дополнительные опции
  isHeavy?: boolean; // Вес > 20 кг: коэффициент 1.1 применяется только к базовому монтажу
  thermostatAndBalanceValve: boolean;
  bypass: boolean;
  wallConnection: boolean;
  chromeTubes: boolean;
  preMountTubes: boolean;
  preMountTubesSide: boolean;
  bottomConnectionUnit: boolean;
}

// Водоснабжение
export interface WaterSection {
  scheme: WaterScheme;
  defaultMaterial: PipeMaterial;
  defaultDiameter: PipeDiameter;
  hasHotWater: boolean;
  hasFilters: boolean;
}

export interface WaterItem {
  id: string;
  room: string;
  fixture: string;
  quantity: number;
  supplyLenM: number;
  returnLenM: number;
  material: PipeMaterial;
  diameter: PipeDiameter;
  hasValve: boolean;
  hasFilter: boolean;
}
