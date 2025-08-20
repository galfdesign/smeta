import { 
  RadiatorItem, 
  SystemBlock, 
  ProjectState,
  WaterItem,
  WaterSection
} from '../types';
import { NORMS } from '../data/norms';

// Генератор уникальных ID
export function uid(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Преобразование в число
export function toNumber(value: any): number {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
}

// Форматирование валюты (всегда в рублях)
export function fmtCurrency(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Форматирование времени: часы -> минуты (целые минуты)
export function fmtMinutes(hours: number): string {
  const minutes = Math.round(hours * 60);
  return `${minutes} мин`;
}

// Форматирование: если суммарно ≥ 60 минут, показываем "H ч M мин", иначе "M мин"
export function fmtHoursMinutes(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes >= 60) {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h} ч ${m} мин`;
  }
  return `${totalMinutes} мин`;
}

// Расчет часов для радиаторов
export function calcRadiatorHours(item: RadiatorItem, section: SystemBlock, proj: ProjectState) {
  let totalHours = 0;

  // Базовый монтаж радиатора (+ коэффициент тяжёлого веса только на базовую операцию)
  let baseMount = NORMS.radiators.ops.rad_mount_base;
  if (item.isHeavy) {
    baseMount *= NORMS.radiators.ops.rad_heavy_coef;
  }
  totalHours += baseMount;
  
  // Воздухоотводчик (добавляем базовое время)
  totalHours += NORMS.radiators.ops.air_vent_install;
  
  // Термостатический и балансировочный клапан — только для бокового подключения
  if (item.connection === 'side' && item.thermostatAndBalanceValve) {
    totalHours += NORMS.radiators.ops.thermostatic_valve_install; // 18 минут
  }

  // (старый блок опций удалён — см. ниже условные опции по типу подключения)
  
  // Трубы: базовое время 13 мин/м, умножаем на коэффициент способа прокладки
  const laying = item.laying === 'inherit' ? section.defaultLaying : item.laying;
  const pipeLength = item.supplyLenM;
  const layingCoef = NORMS.factors.laying[laying] ?? 1;
  totalHours += pipeLength * NORMS.radiators.ops.pipe_per_m_base * layingCoef;
  
  // Соединения учитываются на карточках систем (коллекторы/тройники) — здесь не добавляем
  
  // Байпас — только для бокового подключения
  if (item.connection === 'side' && item.bypass) {
    totalHours += NORMS.radiators.ops.bypass_add;
  }

  // Опции подключения
  if (item.connection === 'bottom') {
    if (item.bottomConnectionUnit) {
      totalHours += NORMS.radiators.ops.bottom_connection_unit;
    }
    if (item.preMountTubes) {
      totalHours += NORMS.radiators.ops.pre_mount_tubes;
    }
  }
  if (item.connection === 'side') {
    if (item.preMountTubesSide) {
      totalHours += NORMS.radiators.ops.pre_mount_tubes;
    }
  }
  // Общие для обоих типов
  if (item.wallConnection) {
    totalHours += NORMS.radiators.ops.wall_connection;
  }
  if (item.chromeTubes) {
    totalHours += NORMS.radiators.ops.chrome_tubes;
  }
  
  // Применяем коэффициенты условий
  totalHours *= NORMS.factors.wall[proj.factors.wall];
  totalHours *= NORMS.factors.cramped[proj.factors.cramped];
  totalHours *= NORMS.factors.getDistanceCoefficient(proj.factors.distance);
  
  // Применяем коэффициенты: тип прибора и материал труб
  totalHours *= NORMS.factors.radiatorType[item.radiatorType] ?? 1;
  totalHours *= NORMS.factors.pipeMaterial[section.defaultPipeMaterial];
  
  // Рассчитываем стоимость
  const avgRate = (proj.hourlyRates.expert + proj.hourlyRates.master + proj.hourlyRates.assistant) / 3;
  const cost = totalHours * avgRate;
  
  return { hours: totalHours, cost };
}

export function calcWaterHours(item: WaterItem, section: WaterSection, proj: ProjectState) {
  let totalHours = 0;

  // Базовый монтаж сантехники
  totalHours += item.quantity * NORMS.water.ops.fixture_install_base;
  
  // Трубы
  const pipeLength = item.supplyLenM;
  
  // Используем базовое время для труб (можно добавить логику выбора способа укладки)
  totalHours += pipeLength * NORMS.water.ops.pipe_per_m_floor;
  
  // Вентили
  if (item.hasValve) {
    totalHours += NORMS.water.ops.valve_install;
  }
  
  // Фильтры
  if (item.hasFilter) {
    totalHours += NORMS.water.ops.filter_install;
  }
  
  // Соединения
  if (section.scheme === 'collector') {
    totalHours += NORMS.water.ops.connection_collector;
  } else {
    totalHours += NORMS.water.ops.connection_tee;
  }
  
  // Опрессовка (добавляем если есть горячая вода)
  if (section.hasHotWater) {
    totalHours += NORMS.water.ops.pressure_test;
  }
  
  // Применяем коэффициенты условий
  totalHours *= NORMS.factors.wall[proj.factors.wall];
  totalHours *= NORMS.factors.cramped[proj.factors.cramped];
  totalHours *= NORMS.factors.getDistanceCoefficient(proj.factors.distance);
  
  // Применяем коэффициент материала труб для водоснабжения
  totalHours *= NORMS.factors.pipeMaterial[section.defaultMaterial];
  
  // Рассчитываем стоимость
  const avgRate = (proj.hourlyRates.expert + proj.hourlyRates.master + proj.hourlyRates.assistant) / 3;
  const cost = totalHours * avgRate;
  
  return { hours: totalHours, cost };
}
