// Нормативы и коэффициенты проекта

export const NORMS = {
  // Радиаторы
  radiators: {
    ops: {
      rad_mount_base: 0.5, // 30 минут
      rad_heavy_coef: 1.5, // Коэффициент для базового монтажа при весе > 20 кг
      rad_mount_with_brackets: 0.7, // не используется
      thermostatic_valve_install: 0.3, // 18 минут (комбинированно: термостатический + балансировочный)
      air_vent_install: 0.1, // 6 минут
      valves_pair_install: 0.2, // не используется
      // Подводящие к приборам (мин/м = 5)
      pipe_per_m_base: 0.08333333333333333, // 5 минут за метр
      // Старые значения по способу прокладки (не используются, оставлены для совместимости)
      pipe_per_m_floor: 0.22,
      pipe_per_m_chase: 0.88,
      pipe_per_m_ceiling: 0.35,
      pipe_per_m_open: 0.66,
      // Дополнительные опции подключения
      bottom_connection_unit: 0.16666666666666666, // 10 минут
      wall_connection: 0.3333333333333333, // 20 минут
      chrome_tubes: 0.3333333333333333, // 20 минут
      pre_mount_tubes: 1.0, // 60 минут (без радиатора)
      manifold_connection: 0.4,
      tee_connection: 0.6,
      bypass_add: 0.5, // 30 минут
    }
  },

  // Коллекторы (нормы из Google Sheets)
  collectors: {
    ops: {
      base_mount: 0.5, // Базовый монтаж коллектора
      output_connection: 0.25, // Выход коллектора - 15 мин
      supply_pipe_per_m: 0.08333333333333333, // Подводящая коллектора - 5 мин на метр
      mixing_group: 1.0, // Наличие смесительной группы - 1 час
      cabinet_install: 0.33, // Наличие шкафа - 20 мин
    }
  },

  // Водоснабжение
  water: {
    ops: {
      fixture_install_base: 0.5,
      pipe_per_m_floor: 0.18,
      pipe_per_m_chase: 0.72,
      pipe_per_m_ceiling: 0.23,
      pipe_per_m_open: 0.54,
      valve_install: 0.15,
      filter_install: 0.3,
      connection_tee: 0.2,
      connection_collector: 0.4,
      pressure_test: 0.5,
    }
  },

  // Факторы проекта
  factors: {
    wall: {
      brick: 1.2,
      aerated_concrete: 1.0,
      concrete: 1.3,
      wooden_frame: 1.4,
      glued_beam_frame: 1.3,
    },
    
    cramped: { 
      none: 1.0, 
      medium: 1.1, 
      high: 1.25 
    },
    
    // Коэффициент удаленности: каждые 10 км добавляют 0.03
    getDistanceCoefficient: (distance: number): number => {
      if (distance <= 0) return 1.0;
      return 1.0 + (Math.ceil(distance / 10) * 0.03);
    },
    
    // Коэффициенты для материалов труб
    pipeMaterial: {
      "PEX": 1.2,
      "PEX-AL-PEX": 1.0,
      "PP": 1.3,
      "Cu": 4.0,
      "Steel": 4.0,
    },
    
    // Коэффициенты для диаметра труб подводящих коллектора
    pipeDiameter: {
      "16": 1.0,   // 16 мм - базовый
      "20": 1.3,   // 20 мм - +30%
      "25": 2.0,   // 25 мм - +100%
      "32": 2.5,   // 32 мм - +150%
    },

    // Коэффициенты способа прокладки для радиаторов
    laying: {
      floor: 1.0,
      ceiling: 1.5,
      open: 1.5,
      chase: 3.0,
    } as Record<string, number>,

    // Коэффициенты типа отопительного прибора
    radiatorType: {
      panel: 1.0,
      sectional: 1.1,
      tubular: 2.0,
      infloor: 1.6,
    } as Record<string, number>,
  },
};
