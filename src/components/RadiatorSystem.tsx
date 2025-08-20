import React, { useState, useMemo } from 'react';
import { RadiatorItem, RadiatorSection, CollectorConfig, ProjectState, SystemBlock } from '../types';
import { calcRadiatorHours, fmtCurrency, fmtHoursMinutes } from '../utils/calculations';
import { NORMS } from '../data/norms';
import Modal from './Modal';
import AddRadiatorForm from './AddRadiatorForm';
import CollectorEditor from './CollectorEditor';

interface RadiatorSystemProps {
  section: RadiatorSection;
  setSection: React.Dispatch<React.SetStateAction<RadiatorSection>>;
  items: RadiatorItem[];
  setItems: React.Dispatch<React.SetStateAction<RadiatorItem[]>>;
  project: ProjectState;
  onExport?: () => void;
}

const RadiatorSystem: React.FC<RadiatorSystemProps> = ({ section, setSection, items, setItems, project, onExport }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollectorModalOpen, setIsCollectorModalOpen] = useState(false);
  const [editingCollector, setEditingCollector] = useState<CollectorConfig | null>(null);
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
  const [editingRadiator, setEditingRadiator] = useState<RadiatorItem | null>(null);
  const [detailsCollector, setDetailsCollector] = useState<{collector: CollectorConfig; system: SystemBlock} | null>(null);
  const [detailsRadiator, setDetailsRadiator] = useState<{item: RadiatorItem; system: SystemBlock} | null>(null);
  const [activeInnerTab, setActiveInnerTab] = useState<'settings' | 'calc'>('calc');
  const [showInnerTabs, setShowInnerTabs] = useState<boolean>(false);
  const TEE_BRANCH_HOURS = (20 / 60);
  const [isCommissioningEnabled, setIsCommissioningEnabled] = useState<boolean>(true);
  const [completedRadiators, setCompletedRadiators] = useState<Set<string>>(new Set());

  // Функция для получения русского названия типа радиатора
  const getRadiatorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'panel': 'панельный',
      'sectional': 'секционный', 
      'tubular': 'трубчатый',
      'infloor': 'внутрипольный'
    };
    return labels[type] || type;
  };

  // Функции для управления выполнением радиаторов
  const handleRadiatorComplete = (radiatorId: string) => {
    setCompletedRadiators(prev => {
      const newSet = new Set(prev);
      newSet.add(radiatorId);
      return newSet;
    });
  };

  const handleRadiatorIncomplete = (radiatorId: string) => {
    setCompletedRadiators(prev => {
      const newSet = new Set(prev);
      newSet.delete(radiatorId);
      return newSet;
    });
  };

  const handleAddItem = (item: RadiatorItem) => {
    setItems(prev => [...prev, { ...item, id: Date.now().toString() }]);
    setIsModalOpen(false);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleEditRadiator = (radiator: RadiatorItem) => {
    setEditingRadiator(radiator);
    setIsModalOpen(true);
  };

  const handleUpdateRadiator = (updatedRadiator: RadiatorItem) => {
    setItems(prev => prev.map(item => 
      item.id === updatedRadiator.id ? updatedRadiator : item
    ));
    setEditingRadiator(null);
    setIsModalOpen(false);
  };

  const handleCollectorCreate = (systemId: string) => {
    setEditingCollector(null);
    setEditingSystemId(systemId);
    setIsCollectorModalOpen(true);
  };

  const handleCollectorEdit = (collector: CollectorConfig, systemId: string) => {
    setEditingCollector(collector);
    setEditingSystemId(systemId);
    setIsCollectorModalOpen(true);
  };

  const handleCollectorSave = (collector: CollectorConfig) => {
    if (editingSystemId) {
      setSection(prev => ({
        ...prev,
        systems: prev.systems.map(sys => {
          if (sys.id === editingSystemId) {
            if (editingCollector) {
              // Редактирование существующего коллектора
              return {
                ...sys,
                collectors: sys.collectors.map(c => c.id === collector.id ? collector : c)
              };
            } else {
              // Добавление нового коллектора
              return {
                ...sys,
                collectors: [...sys.collectors, { ...collector, id: `collector_${Date.now()}` }]
              };
            }
          }
          return sys;
        })
      }));
    }
    setIsCollectorModalOpen(false);
    setEditingCollector(null);
    setEditingSystemId(null);
  };

  const handleCollectorDelete = (collectorId: string, systemId: string) => {
    setSection(prev => ({
      ...prev,
      systems: prev.systems.map(sys => {
        if (sys.id === systemId) {
          return {
            ...sys,
            collectors: sys.collectors.filter(c => c.id !== collectorId)
          };
        }
        return sys;
      })
    }));
  };

  // Управление системами пока скрыто из UI; функции удалены для чистоты

  const getLayingTypeLabel = (type: string) => {
    switch (type) {
      case 'chase': return 'В штробе';
      case 'external': return 'Наружная';
      case 'ceiling': return 'По потолку';
      case 'floor': return 'По полу';
      default: return type;
    }
  };

  const getWallCoefficientLabel = (wall: string) => {
    switch (wall) {
      case 'brick': return 'Кирпич';
      case 'aerated_concrete': return 'Газобетон';
      case 'concrete': return 'Бетон';
      case 'wooden_frame': return 'Деревянный каркас';
      case 'glued_beam_frame': return 'Клееный брус';
      default: return wall;
    }
  };

  const getCrampedCoefficientLabel = (cramped: string) => {
    switch (cramped) {
      case 'none': return 'Нет';
      case 'medium': return 'Средняя';
      case 'high': return 'Высокая';
      default: return cramped;
    }
  };

  // Удалены неиспользуемые хелперы

  const calculateCollectorHours = (collector: CollectorConfig, proj: ProjectState) => {
    let totalHours = 0;
    
    if (!collector.connectionType || collector.connectionType === 'manifold') {
      // Коллекторная схема
      totalHours += NORMS.collectors.ops.base_mount;
      totalHours += collector.outputs * NORMS.collectors.ops.output_connection; // 15 мин на выход
      totalHours += collector.loops * NORMS.collectors.ops.supply_pipe_per_m; // 10 мин/м подводящих
      if (collector.hasPump) totalHours += NORMS.collectors.ops.mixing_group; // 1 час
      if (collector.hasCabinet) {
        const isBuiltIn = collector.cabinetType === 'built-in';
        const baseMinutes = isBuiltIn ? 30 : 10;
        const perOutputMinutes = isBuiltIn ? 5 : 1;
        const outputs = collector.outputs || 0;
        totalHours += (baseMinutes + perOutputMinutes * outputs) / 60;
      }
      // Коэффициенты материалов/диаметров подводящих
      totalHours *= NORMS.factors.pipeMaterial[collector.material];
      totalHours *= NORMS.factors.pipeDiameter[collector.supplyDiameter];
      // Коэффициент способа прокладки
      const layingKey = collector.layingType === 'external' ? 'open' : collector.layingType;
      const layingCoef = (NORMS.factors.laying as any)[layingKey] ?? 1;
      totalHours *= layingCoef;
    } else if (collector.connectionType === 'tee') {
      // Тройниковая схема: магистраль как подводящие по нормам, отводы 20 минут/шт
      const mainLen = collector.teeMainLengthM || 0;
      totalHours += mainLen * NORMS.collectors.ops.supply_pipe_per_m; // 10 мин/м
      const branches = collector.teeBranchesCount || 0;
      totalHours += branches * (20 / 60); // 20 минут на отвод
      // Коэффициенты материалов/диаметров магистрали
      const mainMaterial = collector.teeMainMaterial || collector.material;
      const mainDiameter = collector.teeMainDiameter || collector.supplyDiameter;
      totalHours *= NORMS.factors.pipeMaterial[mainMaterial];
      totalHours *= NORMS.factors.pipeDiameter[mainDiameter];
      // Коэффициент способа прокладки магистрали (используем общий layingType)
      const layingKeyTee = collector.layingType === 'external' ? 'open' : collector.layingType;
      const layingCoefTee = (NORMS.factors.laying as any)[layingKeyTee] ?? 1;
      totalHours *= layingCoefTee;
    }
    
    // Общие коэффициенты условий
    totalHours *= NORMS.factors.wall[proj.factors.wall];
    totalHours *= NORMS.factors.cramped[proj.factors.cramped];
    totalHours *= NORMS.factors.getDistanceCoefficient(proj.factors.distance);
    
    // Рассчитываем стоимость
    const avgRate = (proj.hourlyRates.expert + proj.hourlyRates.master + proj.hourlyRates.assistant) / 3;
    const cost = totalHours * avgRate;
    
    return { hours: totalHours, cost };
  };

  // Редактирование элементов реализовано через модалку

  // Общие итоги по всем системам
  const totals = useMemo(() => {
    let totalHours = 0;
    let totalCost = 0;
    
    section.systems.forEach(system => {
      system.collectors.forEach(collector => {
        const c = calculateCollectorHours(collector, project);
        totalHours += c.hours;
        totalCost += c.cost;
      });
    });
    
    items.forEach(item => {
      // Используем первую систему для расчетов (можно доработать логику)
      const system = section.systems[0];
      if (system) {
        const result = calcRadiatorHours(item, system, project);
        totalHours += result.hours;
        totalCost += result.cost;
      }
    });
    
    return { hours: totalHours, cost: totalCost };
  }, [section.systems, items, project]);

  // Пусконаладочные работы: 20 мин на систему, 15 мин на прибор
  const commissioning = useMemo(() => {
    const systemsCount = section.systems.length;
    const radiatorsCount = items.length;
    let hours = systemsCount * (20 / 60) + radiatorsCount * (15 / 60);
    // Применяем глобальные коэффициенты проекта
    hours *= NORMS.factors.wall[project.factors.wall];
    hours *= NORMS.factors.cramped[project.factors.cramped];
    hours *= NORMS.factors.getDistanceCoefficient(project.factors.distance);
    const avgRate = (project.hourlyRates.expert + project.hourlyRates.master + project.hourlyRates.assistant) / 3;
    const cost = hours * avgRate;
    return { hours, cost, systemsCount, radiatorsCount };
  }, [section.systems, items, project]);

  // Итоги таблицы (включая ПНР, если включена)
  const tableTotals = useMemo(() => {
    let hours = totals.hours;
    let cost = totals.cost;
    if (isCommissioningEnabled) {
      hours += commissioning.hours;
      cost += commissioning.cost;
    }
    return { hours, cost };
  }, [totals, isCommissioningEnabled, commissioning]);

  return (
    <div className="card">
      <div className="head">
        <h3>Система отопления</h3>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => setShowInnerTabs(prev => !prev)}
          title={showInnerTabs ? 'Скрыть вкладки' : 'Показать вкладки'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {showInnerTabs ? (
              <path d="M5 15l7-7 7 7"/>
            ) : (
              <path d="M19 9l-7 7-7-7"/>
            )}
          </svg>
        </button>
      </div>

      {/* Внутренние вкладки */}
      {showInnerTabs && (
      <div className="inner-tabs">
        <button
          type="button"
          className={`inner-tab-button ${activeInnerTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveInnerTab('settings')}
        >
          Настройки
        </button>
        <button
          type="button"
          className={`inner-tab-button ${activeInnerTab === 'calc' ? 'active' : ''}`}
          onClick={() => setActiveInnerTab('calc')}
        >
          Расчет
        </button>
      </div>
      )}

      {activeInnerTab === 'settings' ? (
        <div className="norms-section">
          {/* Коэффициенты проекта — перечень всех вариантов */}
          <div style={{display:'grid', gap:12}}>
            {/* Стены */}
            <div className="coeff-table two-col">
              <div className="coeff-header">
                <div>Стены</div>
                <div>Коэффициент</div>
              </div>
              {Object.entries(NORMS.factors.wall).map(([key, val]) => (
                <div key={key} className="coeff-row">
                  <div>{getWallCoefficientLabel(key)}</div>
                  <div>×{val}</div>
                </div>
              ))}
            </div>

            {/* Стеснённость */}
            <div className="coeff-table two-col">
              <div className="coeff-header">
                <div>Стеснённость</div>
                <div>Коэффициент</div>
              </div>
              {Object.entries(NORMS.factors.cramped).map(([key, val]) => (
                <div key={key} className="coeff-row">
                  <div>{getCrampedCoefficientLabel(key)}</div>
                  <div>×{val}</div>
                </div>
              ))}
            </div>

            {/* Удалённость */}
            <div className="coeff-table two-col">
              <div className="coeff-header">
                <div>Удалённость, км</div>
                <div>Коэффициент</div>
              </div>
              <div className="coeff-row"><div>Формула</div><div>×(1 + ceil(d/10)·0.03)</div></div>
              <div className="coeff-row"><div>0 км</div><div>×{NORMS.factors.getDistanceCoefficient(0).toFixed(2)}</div></div>
              <div className="coeff-row"><div>10 км</div><div>×{NORMS.factors.getDistanceCoefficient(10).toFixed(2)}</div></div>
              <div className="coeff-row"><div>50 км</div><div>×{NORMS.factors.getDistanceCoefficient(50).toFixed(2)}</div></div>
              <div className="coeff-row"><div>100 км</div><div>×{NORMS.factors.getDistanceCoefficient(100).toFixed(2)}</div></div>
            </div>
          </div>

          {/* Нормочасы и коэффициенты */}
          <div className="norms-grid">
            <div className="norms-table">
              <div className="norms-title">Коллекторная (лучевая) система</div>
              <div className="norm-row"><span className="norm-key">Базовый монтаж коллектора</span><span className="norm-value">{Math.round(NORMS.collectors.ops.base_mount * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Выход коллектора (шт)</span><span className="norm-value">{Math.round(NORMS.collectors.ops.output_connection * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Подводящая труба (мин/м)</span><span className="norm-value">{Math.round(NORMS.collectors.ops.supply_pipe_per_m * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Смесительная группа</span><span className="norm-value">{Math.round(NORMS.collectors.ops.mixing_group * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Шкаф накладной</span><span className="norm-value">10 мин + 1 мин/выход</span></div>
              <div className="norm-row"><span className="norm-key">Шкаф встроенный</span><span className="norm-value">30 мин + 5 мин/выход</span></div>

              <div className="norms-subtitle">Коэффициенты способа прокладки</div>
              <div className="norm-row"><span className="norm-key">По полу</span><span className="norm-value">{NORMS.factors.laying.floor}</span></div>
              <div className="norm-row"><span className="norm-key">По потолку</span><span className="norm-value">{NORMS.factors.laying.ceiling}</span></div>
              <div className="norm-row"><span className="norm-key">Открыто</span><span className="norm-value">{NORMS.factors.laying.open}</span></div>
              <div className="norm-row"><span className="norm-key">В штробе</span><span className="norm-value">{NORMS.factors.laying.chase}</span></div>

              <div className="norms-subtitle">Коэффициенты подводящих</div>
              {Object.entries(NORMS.factors.pipeMaterial).map(([k, v]) => (
                <div key={`pm_${k}`} className="norm-row"><span className="norm-key">Материал {k}</span><span className="norm-value">{v}</span></div>
              ))}
              {Object.entries(NORMS.factors.pipeDiameter).map(([k, v]) => (
                <div key={`pd_${k}`} className="norm-row"><span className="norm-key">Диаметр {k} мм</span><span className="norm-value">{v}</span></div>
              ))}
            </div>

            <div className="norms-table">
              <div className="norms-title">Тройниковая система</div>
              <div className="norm-row"><span className="norm-key">Магистраль (мин/м)</span><span className="norm-value">{Math.round(NORMS.collectors.ops.supply_pipe_per_m * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Отвод (шт)</span><span className="norm-value">{Math.round(TEE_BRANCH_HOURS * 60)} мин</span></div>

              <div className="norms-subtitle">Коэффициенты магистрали</div>
              {Object.entries(NORMS.factors.pipeMaterial).map(([k, v]) => (
                <div key={`tpm_${k}`} className="norm-row"><span className="norm-key">Материал {k}</span><span className="norm-value">{v}</span></div>
              ))}
              {Object.entries(NORMS.factors.pipeDiameter).map(([k, v]) => (
                <div key={`tpd_${k}`} className="norm-row"><span className="norm-key">Диаметр {k} мм</span><span className="norm-value">{v}</span></div>
              ))}

              <div className="norms-subtitle">Коэффициенты способа прокладки</div>
              <div className="norm-row"><span className="norm-key">По полу</span><span className="norm-value">{NORMS.factors.laying.floor}</span></div>
              <div className="norm-row"><span className="norm-key">По потолку</span><span className="norm-value">{NORMS.factors.laying.ceiling}</span></div>
              <div className="norm-row"><span className="norm-key">Открыто</span><span className="norm-value">{NORMS.factors.laying.open}</span></div>
              <div className="norm-row"><span className="norm-key">В штробе</span><span className="norm-value">{NORMS.factors.laying.chase}</span></div>
            </div>

            <div className="norms-table">
              <div className="norms-title">Отопительные приборы (радиаторы)</div>
              <div className="norm-row"><span className="norm-key">Базовый монтаж</span><span className="norm-value">{Math.round(NORMS.radiators.ops.rad_mount_base * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Коэфф. веса (&gt;20 кг) — к базовому монтажу</span><span className="norm-value">×{NORMS.radiators.ops.rad_heavy_coef}</span></div>
              <div className="norm-row"><span className="norm-key">Термостатический и балансировочный клапан</span><span className="norm-value">{Math.round(NORMS.radiators.ops.thermostatic_valve_install * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Воздухоотводчик</span><span className="norm-value">{Math.round(NORMS.radiators.ops.air_vent_install * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Байпас</span><span className="norm-value">{Math.round(NORMS.radiators.ops.bypass_add * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Подводящие (мин/м)</span><span className="norm-value">{Math.round(NORMS.radiators.ops.pipe_per_m_base * 60)} мин</span></div>
              <div className="norms-subtitle">Коэффициенты способа прокладки</div>
              <div className="norm-row"><span className="norm-key">По полу</span><span className="norm-value">{NORMS.factors.laying.floor}</span></div>
              <div className="norm-row"><span className="norm-key">По потолку</span><span className="norm-value">{NORMS.factors.laying.ceiling}</span></div>
              <div className="norm-row"><span className="norm-key">Открыто</span><span className="norm-value">{NORMS.factors.laying.open}</span></div>
              <div className="norm-row"><span className="norm-key">В штробе</span><span className="norm-value">{NORMS.factors.laying.chase}</span></div>
              <div className="norms-subtitle">Доп. опции подключения</div>
              <div className="norm-row"><span className="norm-key">Узел нижнего подключения</span><span className="norm-value">{Math.round(NORMS.radiators.ops.bottom_connection_unit * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Подключение из стены</span><span className="norm-value">{Math.round(NORMS.radiators.ops.wall_connection * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Хромированные трубки</span><span className="norm-value">{Math.round(NORMS.radiators.ops.chrome_tubes * 60)} мин</span></div>
              <div className="norm-row"><span className="norm-key">Предмонтаж трубок без радиатора</span><span className="norm-value">{Math.round(NORMS.radiators.ops.pre_mount_tubes * 60)} мин</span></div>

              <div className="norms-subtitle">Коэффициенты материала труб (для радиаторов)</div>
              {Object.entries(NORMS.factors.pipeMaterial).map(([k, v]) => (
                <div key={`rpm_${k}`} className="norm-row"><span className="norm-key">Материал {k}</span><span className="norm-value">{v}</span></div>
              ))}

              <div className="norms-subtitle">Коэффициенты типа прибора</div>
              <div className="norm-row"><span className="norm-key">Панельный</span><span className="norm-value">{NORMS.factors.radiatorType.panel}</span></div>
              <div className="norm-row"><span className="norm-key">Секционный</span><span className="norm-value">{NORMS.factors.radiatorType.sectional}</span></div>
              <div className="norm-row"><span className="norm-key">Трубчатый</span><span className="norm-value">{NORMS.factors.radiatorType.tubular}</span></div>
              <div className="norm-row"><span className="norm-key">Внутрипольный конвектор</span><span className="norm-value">{NORMS.factors.radiatorType.infloor}</span></div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Блоки систем */}
      <div className="systems-container">
        <div className="systems-header">
          <h4>Система распределения</h4>
        </div>
        
        {section.systems.map((system) => (
          <div key={system.id} className="system-block">
            {/* Убрана верхняя строка с названием и действиями системы */}

            {/* Настройки системы больше не вводятся здесь — управление через карточки подключения */}

            {/* Настройки коллектора для коллекторной схемы */}
            {system.scheme === 'manifold' && (
              <div className="collector-settings">
                {/* Заголовок убран по требованию */}
                
                {(() => {
                  const requiredPoints = items.length * 2;
                  const providedPoints = system.collectors.reduce((acc, c) => {
                    if (!c.connectionType || c.connectionType === 'manifold') {
                      return acc + (c.outputs || 0);
                    }
                    return acc + (c.teeBranchesCount || 0);
                  }, 0);
                  const mismatch = requiredPoints !== providedPoints;
                  return (
                    mismatch && (
                      <div className="warning-banner">
                        Требуется {requiredPoints} точек подключения (2 на каждый прибор), задано {providedPoints}. Проверьте количество выходов/отводов.
                      </div>
                    )
                  );
                })()}

                {system.collectors.length === 0 ? (
                  <div className="no-collectors">
                    <p>Коллекторы не добавлены. Создайте первый коллектор для начала работы.</p>
                  </div>
                ) : (
                  <div className="collectors-list">
                    {system.collectors.map((collector, index) => (
                      <div key={collector.id} className="collector-info">
                        <div className="collector-header-info">
                          <h5>{collector.connectionType === 'tee' ? `Тройниковая TR${index + 1}` : `Коллектор KR${index + 1}`}</h5>
                          <div className="collector-actions">
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setDetailsCollector({ collector, system })}
                              title="Детальный расчет"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12" y2="16"/>
                              </svg>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleCollectorEdit(collector, system.id)}
                              title="Редактировать коллектор"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-danger btn-sm"
                              onClick={() => handleCollectorDelete(collector.id, system.id)}
                              title={system.collectors.length === 1 ? "Нельзя удалить единственный коллектор" : "Удалить коллектор"}
                              disabled={system.collectors.length === 1}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div className="collector-details">
                          {(!collector.connectionType || collector.connectionType === 'manifold') ? (
                            <>
                              <div className="detail-row">
                                <span>Длина подводящих:</span>
                                <span>{collector.loops} м</span>
                              </div>
                              <div className="detail-row">
                                <span>Выходы коллектора:</span>
                                <span>{collector.outputs} шт</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="detail-row">
                                <span>Длина магистрали:</span>
                                <span>{collector.teeMainLengthM || 0} м</span>
                              </div>
                              <div className="detail-row">
                                <span>Количество отводов:</span>
                                <span>{collector.teeBranchesCount || 0} шт</span>
                              </div>
                            </>
                          )}
                          <div className="detail-row">
                            <span>Способ прокладки:</span>
                            <span>{getLayingTypeLabel(collector.layingType)}</span>
                          </div>
                          <div className="detail-row">
                            <span>Материал подводящих:</span>
                            <span>{collector.material}</span>
                          </div>
                          <div className="equipment-tags">
                            {(!collector.connectionType || collector.connectionType === 'manifold') && (
                              <>
                                {collector.hasPump && <span className="equipment-tag">Насосная группа</span>}
                                {collector.hasCabinet && (
                                  <span className="equipment-tag">
                                    {collector.cabinetType === 'built-in' ? 'Встроенный шкаф' : 'Накладной шкаф'}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          <div className="collector-calculations">
                            {(() => {
                              const calc = calculateCollectorHours(collector, project);
                              return (
                                <>
                                  <div className="calculation-row">
                                    <span>Трудозатраты:</span>
                                    <span>{fmtHoursMinutes(calc.hours)}</span>
                                  </div>
                                  <div className="calculation-row">
                                    <span>Стоимость:</span>
                                    <span>{calc.cost.toFixed(0)} ₽</span>
                                  </div>
                                  <button
                                    type="button"
                                    className="btn btn-sm"
                                    title="Детальный расчет"
                                    onClick={() => setDetailsCollector({ collector, system })}
                                    style={{ alignSelf: 'flex-end' }}
                                  >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"/>
                                      <line x1="12" y1="8" x2="12" y2="12"/>
                                      <line x1="12" y1="16" x2="12" y2="16"/>
                                    </svg>
                                  </button>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Кнопка добавления нового подключения */}
                    <button 
                      className="add-collector-button"
                      onClick={() => handleCollectorCreate(system.id)}
                      type="button"
                    >
                      <div className="add-collector-content">
                        <div className="plus-icon">+</div>
                        <div className="add-text">Добавить распределение</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Список радиаторов */}
      <div className="radiators-list">
        <div className="radiators-header">
          <h4>Добавленные радиаторы R1-R{items.length}</h4>
        </div>
        
        {items.length === 0 ? (
          <div className="no-radiators">
            <p>Радиаторы не добавлены. Создайте первый радиатор для начала работы.</p>
          </div>
        ) : (
          <div className="radiators-grid">
            {items.map((item) => (
              <div key={item.id} className="radiator-card compact">
                <div className="radiator-header">
                  <div className="radiator-title">
                    <strong>R{items.indexOf(item) + 1}</strong>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="radiator-model">{item.radiatorType === 'panel' ? 'Панельный' : item.radiatorType === 'sectional' ? 'Секционный' : item.radiatorType === 'tubular' ? 'Трубчатый' : 'Внутрипольный конвектор'}</span>
                      {item.isHeavy && (
                        <span className="equipment-tag">&gt;20 кг</span>
                      )}
                    </div>
                  </div>
                  <div className="radiator-actions">
                    <button
                      className="btn btn-sm"
                      onClick={() => setDetailsRadiator({ item, system: section.systems[0] })}
                      title="Детальный расчет"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12" y2="16"/>
                      </svg>
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => handleEditRadiator(item)}
                      title="Редактировать"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveItem(item.id)}
                      title={items.indexOf(item) === 0 ? "Нельзя удалить первый радиатор" : "Удалить"}
                      disabled={items.indexOf(item) === 0}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="radiator-details">
                  <div className="detail-row">
                    <span>Подключение:</span>
                    <span>{item.connection === 'bottom' ? 'Нижнее' : 'Боковое'}</span>
                  </div>
                  <div className="detail-row">
                    <span>Длина подводящих:</span>
                    <span>{item.supplyLenM} м</span>
                  </div>

                  <div className="equipment-tags">
                    {/* Опции для нижнего подключения */}
                    {item.connection === 'bottom' && (
                      <>
                        {item.wallConnection && <span className="equipment-tag">Из стены</span>}
                        {item.chromeTubes && <span className="equipment-tag">Хромированные трубки</span>}
                        {item.preMountTubes && <span className="equipment-tag">Предмонтаж трубок</span>}
                        {item.bottomConnectionUnit && <span className="equipment-tag">Узел нижнего подключения</span>}
                      </>
                    )}
                    
                    {/* Опции для бокового подключения */}
                    {item.connection === 'side' && (
                      <>
                        {item.thermostatAndBalanceValve && <span className="equipment-tag">Термостатический и балансировочный клапан</span>}
                        {item.bypass && <span className="equipment-tag">Байпас</span>}
                        {item.wallConnection && <span className="equipment-tag">Из стены</span>}
                        {item.chromeTubes && <span className="equipment-tag">Хромированные трубки</span>}
                        {item.preMountTubesSide && <span className="equipment-tag">Предмонтаж трубок</span>}
                      </>
                    )}
                  </div>
                </div>

                <div className="radiator-totals">
                  <div className="total-row">
                    <span>Трудозатраты:</span>
                    <span className="total-value">{fmtHoursMinutes(calcRadiatorHours(item, section.systems[0], project).hours)}</span>
                  </div>
                  <div className="total-row">
                    <span>Стоимость:</span>
                    <span className="total-value">{fmtCurrency(calcRadiatorHours(item, section.systems[0], project).cost)}</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Кнопка добавления нового радиатора */}
            <button 
              className="add-radiator-button"
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <div className="add-radiator-content">
                <div className="plus-icon">+</div>
                <div className="add-text">Добавить прибор</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Пусконаладочные работы */}
      {isCommissioningEnabled ? (
        <div className="commissioning-card">
          <div className="commissioning-header">
            <h4>Пусконаладочные работы</h4>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setIsCommissioningEnabled(false)}
              title="Удалить"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
            </button>
          </div>
          <div className="commissioning-details">
            <div className="detail-row">
              <span>Системы распределения:</span>
              <span>{commissioning.systemsCount} шт × 20 мин</span>
            </div>
            <div className="detail-row">
              <span>Отопительные приборы:</span>
              <span>{commissioning.radiatorsCount} шт × 15 мин</span>
            </div>
          </div>
          <div className="radiator-totals">
            <div className="total-row">
              <span>Трудозатраты:</span>
              <span className="total-value">{fmtHoursMinutes(commissioning.hours)}</span>
            </div>
            <div className="total-row">
              <span>Стоимость:</span>
              <span className="total-value">{fmtCurrency(commissioning.cost)}</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="add-commissioning-button"
          onClick={() => setIsCommissioningEnabled(true)}
        >
          <div className="add-collector-content">
            <div className="plus-icon">+</div>
            <div className="add-text">Добавить ПНР</div>
          </div>
        </button>
      )}

      {/* Итоги по системе — скрыты по требованию */}

      {/* Детальная таблица расчетов */}
      <div className="calculations-table-container">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
          <h4 style={{margin:0}}>Радиаторное отопление детальный расчет трудозатрат и стоимости</h4>
          {onExport && (
            <button className="btn btn-primary btn-sm" onClick={onExport}>Экспорт PDF</button>
          )}
        </div>

        {/* Общие коэффициенты для всего раздела */}
        <div className="global-coefficients">
          <div className="coefficient-item">
            <span>Стены: {getWallCoefficientLabel(project.factors.wall)}</span>
            <span className="coefficient-value">{NORMS.factors.wall[project.factors.wall]}</span>
          </div>
          <div className="coefficient-item">
            <span>Стеснённость: {getCrampedCoefficientLabel(project.factors.cramped)}</span>
            <span className="coefficient-value">{NORMS.factors.cramped[project.factors.cramped]}</span>
          </div>
          <div className="coefficient-item">
            <span>Удалённость: {project.factors.distance} км</span>
            <span className="coefficient-value">{NORMS.factors.getDistanceCoefficient(project.factors.distance).toFixed(2)}</span>
          </div>
        </div>

        <div className="calculations-table">
          <div className="table-header">
            <div className="header-cell">Элемент</div>
            <div className="header-cell">Тип</div>
            <div className="header-cell">Параметры</div>
            <div className="header-cell">Коэфф. элемента</div>
            <div className="header-cell">Трудозатраты</div>
            <div className="header-cell">Стоимость</div>
          </div>
          
          {/* Коллекторы */}
          {section.systems.map((system) => 
            system.collectors.map((collector, collectorIndex) => {
              const collectorHours = calculateCollectorHours(collector, project);
              return (
                <div key={`${system.id}_${collector.id}`} className="table-row collector-row">
                  <div className="cell">
                    <strong>{(!collector.connectionType || collector.connectionType === 'manifold') ? `Коллектор ${collectorIndex + 1}` : `Тройниковая TR${collectorIndex + 1}`}</strong>
                    <div className="sub-info">{collector.name}</div>
                  </div>
                  <div className="cell">{(!collector.connectionType || collector.connectionType === 'manifold') ? 'Коллекторная система' : 'Тройниковая система'}</div>
                                      <div className="cell">
                    {(() => {
                      const rows: {label: string; h: number}[] = [];
                      if (!collector.connectionType || collector.connectionType === 'manifold') {
                        rows.push({ label: 'Базовый монтаж', h: NORMS.collectors.ops.base_mount });
                        rows.push({ label: `Выходы (${collector.outputs || 0} шт)`, h: (collector.outputs || 0) * NORMS.collectors.ops.output_connection });
                        rows.push({ label: `Подводящие (${collector.loops || 0} м)`, h: (collector.loops || 0) * NORMS.collectors.ops.supply_pipe_per_m });
                        if (collector.hasPump) rows.push({ label: 'Смесительная группа', h: NORMS.collectors.ops.mixing_group });
                        if (collector.hasCabinet) {
                          const baseMin = collector.cabinetType === 'built-in' ? 30 : 10;
                          const perOutMin = collector.cabinetType === 'built-in' ? 5 : 1;
                          const cabH = (baseMin + perOutMin * (collector.outputs || 0)) / 60;
                          rows.push({ label: `Шкаф ${collector.cabinetType === 'built-in' ? 'встроенный' : 'накладной'}`, h: cabH });
                        }
                      } else {
                        const mainM = collector.teeMainLengthM || 0;
                        const branches = collector.teeBranchesCount || 0;
                        rows.push({ label: `Магистраль (${mainM} м)`, h: mainM * NORMS.collectors.ops.supply_pipe_per_m });
                        rows.push({ label: `Отводы (${branches} шт)`, h: branches * (20/60) });
                      }
                      return (
                        <ul style={{margin: 0, paddingLeft: 16}}>
                          {rows.map((r, i) => (
                            <li key={i} style={{listStyle: 'disc'}}>{r.label}: {fmtHoursMinutes(r.h)}</li>
                          ))}
                        </ul>
                      );
                    })()}
                    </div>
                  <div className="cell">
                    {(!collector.connectionType || collector.connectionType === 'manifold') ? (
                      <>
                    <div className="coefficient-item">
                          <span>Материал труб: {collector.material}</span>
                          <span className="coefficient-value">{NORMS.factors.pipeMaterial[collector.material]}</span>
                    </div>
                    <div className="coefficient-item">
                          <span>Диаметр труб: {collector.supplyDiameter} мм</span>
                          <span className="coefficient-value">{NORMS.factors.pipeDiameter[collector.supplyDiameter]}</span>
                    </div>
                    <div className="coefficient-item">
                          <span>Прокладка: {getLayingTypeLabel(collector.layingType)}</span>
                          <span className="coefficient-value">{(NORMS.factors.laying as any)[collector.layingType === 'external' ? 'open' : collector.layingType]}</span>
                    </div>
                      </>
                    ) : (
                      <>
                                          <div className="coefficient-item">
                          <span>Материал труб: {collector.teeMainMaterial || collector.material}</span>
                          <span className="coefficient-value">{NORMS.factors.pipeMaterial[collector.teeMainMaterial || collector.material]}</span>
                      </div>
                      <div className="coefficient-item">
                          <span>Диаметр труб: {collector.teeMainDiameter || collector.supplyDiameter} мм</span>
                          <span className="coefficient-value">{NORMS.factors.pipeDiameter[collector.teeMainDiameter || collector.supplyDiameter]}</span>
                      </div>
                        <div className="coefficient-item">
                          <span>Прокладка: {getLayingTypeLabel(collector.layingType)}</span>
                          <span className="coefficient-value">{(NORMS.factors.laying as any)[collector.layingType === 'external' ? 'open' : collector.layingType]}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="cell">
                    <div className="hours-value">{fmtHoursMinutes(collectorHours.hours)}</div>
                  </div>
                  <div className="cell">
                    <div className="cost-value">{fmtCurrency(collectorHours.cost)}</div>
                  </div>
                </div>
              );
            })
          )}
          
          {/* Радиаторы */}
          {items.map((item, itemIndex) => {
            const system = section.systems[0]; // Используем первую систему для расчетов
            if (!system) return null;
            
            const radiatorHours = calcRadiatorHours(item, system, project);
            return (
              <div key={item.id} className="table-row radiator-row">
                                  <div className="cell">
                    <strong>R{itemIndex + 1}</strong>
                    <div className="sub-info">{item.radiatorType === 'panel' ? 'Панельный' : item.radiatorType === 'sectional' ? 'Секционный' : item.radiatorType === 'tubular' ? 'Трубчатый' : 'Внутрипольный конвектор'}</div>
                  </div>
                <div className="cell">Отопительный прибор</div>
                <div className="cell">
                  {(() => {
                    const rows: {label: string; h: number}[] = [];
                    const baseH = (item.isHeavy ? NORMS.radiators.ops.rad_mount_base * NORMS.radiators.ops.rad_heavy_coef : NORMS.radiators.ops.rad_mount_base);
                    rows.push({ label: `Базовый монтаж${item.isHeavy ? ' (вес > 20 кг)' : ''}`, h: baseH });
                    rows.push({ label: 'Воздухоотводчик', h: NORMS.radiators.ops.air_vent_install });
                    if (item.connection === 'side') {
                      if (item.thermostatAndBalanceValve) rows.push({ label: 'Термостат+баланс', h: NORMS.radiators.ops.thermostatic_valve_install });
                      if (item.bypass) rows.push({ label: 'Байпас', h: NORMS.radiators.ops.bypass_add });
                      if (item.preMountTubesSide) rows.push({ label: 'Предмонтаж', h: NORMS.radiators.ops.pre_mount_tubes });
                    } else {
                      if (item.bottomConnectionUnit) rows.push({ label: 'Узел нижнего подключения', h: NORMS.radiators.ops.bottom_connection_unit });
                      if (item.preMountTubes) rows.push({ label: 'Предмонтаж', h: NORMS.radiators.ops.pre_mount_tubes });
                    }
                    if (item.wallConnection) rows.push({ label: 'Из стены', h: NORMS.radiators.ops.wall_connection });
                    if (item.chromeTubes) rows.push({ label: 'Хромированные трубки', h: NORMS.radiators.ops.chrome_tubes });
                    const laying = item.laying === 'inherit' ? system.defaultLaying : item.laying;
                    const layingCoef = (NORMS.factors.laying as any)[laying] ?? 1;
                    const pipeH = (item.supplyLenM || 0) * NORMS.radiators.ops.pipe_per_m_base * layingCoef;
                    rows.push({ label: `Подводящие (${item.supplyLenM} м)`, h: pipeH });
                    return (
                      <ul style={{margin: 0, paddingLeft: 16}}>
                        {rows.map((r, i) => (
                          <li key={i} style={{listStyle: 'disc'}}>{r.label}: {fmtHoursMinutes(r.h)}</li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
                <div className="cell">
                  <div className="coefficient-item">
                    <span>Материал труб: {system.defaultPipeMaterial}</span>
                    <span className="coefficient-value">{NORMS.factors.pipeMaterial[system.defaultPipeMaterial]}</span>
                  </div>
                  <div className="coefficient-item">
                    <span>Прокладка</span>
                    <span className="coefficient-value">{(NORMS.factors.laying as any)[(item.laying === 'inherit' ? system.defaultLaying : item.laying) as any]}</span>
                  </div>
                  <div className="coefficient-item">
                    <span>Тип прибора</span>
                    <span className="coefficient-value">{NORMS.factors.radiatorType[item.radiatorType]}</span>
                  </div>
                </div>
                <div className="cell">
                  <div className="hours-value">{fmtHoursMinutes(radiatorHours.hours)}</div>
                </div>
                <div className="cell">
                  <div className="cost-value">{fmtCurrency(radiatorHours.cost)}</div>
                </div>
              </div>
            );
          })}

          {/* ПНР строка */}
          {isCommissioningEnabled && (
            <div className="table-row commissioning-row">
              <div className="cell">
                <strong>ПНР</strong>
                <div className="sub-info">Пусконаладочные работы</div>
              </div>
              <div className="cell">ПНР</div>
              <div className="cell">
                <ul style={{margin:0, paddingLeft:16}}>
                  <li>Системы распределения: {commissioning.systemsCount} шт × 20 мин</li>
                  <li>Отопительные приборы: {commissioning.radiatorsCount} шт × 15 мин</li>
                </ul>
              </div>
              <div className="cell">-</div>
              <div className="cell"><div className="hours-value">{fmtHoursMinutes(commissioning.hours)}</div></div>
              <div className="cell"><div className="cost-value">{fmtCurrency(commissioning.cost)}</div></div>
            </div>
          )}
          
          {/* Итоговая строка */}
          <div className="table-row total-row">
            <div className="cell">
              <strong>ИТОГО</strong>
            </div>
            <div className="cell">Все элементы</div>
            <div className="cell">-</div>
            <div className="cell">-</div>
            <div className="cell">
              <div className="total-hours">{fmtHoursMinutes(tableTotals.hours)}</div>
            </div>
            <div className="cell">
              <div className="total-cost">{fmtCurrency(tableTotals.cost)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* План монтажа */}
      {(() => {
        const totalRadiators = items.length;
        const heavyCount = items.filter(r => r.isHeavy).length;
        const globalCoef = NORMS.factors.wall[project.factors.wall]
          * NORMS.factors.cramped[project.factors.cramped]
          * NORMS.factors.getDistanceCoefficient(project.factors.distance);

        // Нормы времени согласно таблице (в часах)
        const step1PerH = NORMS.radiators.ops.rad_mount_base * 0.3; // 30% от базового монтажа радиатора (0.5 * 0.3 = 0.15 ч/шт)
        const step2PerH = NORMS.radiators.ops.rad_mount_base * 0.4; // 40% от базового монтажа (0.5 * 0.4 = 0.2 ч/шт) 
        const step3PerH = NORMS.radiators.ops.rad_mount_base * 0.5; // 50% от базового монтажа (0.5 * 0.5 = 0.25 ч/шт)
        const step4PerH = NORMS.radiators.ops.rad_mount_base; // Базовый монтаж радиатора (0.5 ч/шт)

        const step1Hours = totalRadiators * step1PerH * globalCoef;
        const step2Hours = totalRadiators * step2PerH * globalCoef;
        const step3Hours = totalRadiators * step3PerH * globalCoef;
        const step4Hours = totalRadiators * step4PerH * globalCoef;

        // Прокладка трубопроводов: суммируем по приборам с учетом способа прокладки
        let pipeHours = 0;
        const layingBreakdown: Record<string, number> = {};
        items.forEach(item => {
          const system = section.systems[0];
          if (!system) return;
          const laying = item.laying === 'inherit' ? system.defaultLaying : item.laying;
          const layingCoef = (NORMS.factors.laying as any)[laying] ?? 1;
          const h = (item.supplyLenM || 0) * NORMS.radiators.ops.pipe_per_m_base * layingCoef;
          pipeHours += h;
          layingBreakdown[laying] = (layingBreakdown[laying] || 0) + (item.supplyLenM || 0);
        });
        pipeHours *= globalCoef;

        const steps = [
          {
            id: 's1',
            title: 'Шаг 1. Разметка, штробление и сверление',
            hours: step2Hours,
            norm: `${Math.round(step2PerH*60)} мин/шт`,
            bullets: [
              'Вскройте упаковку только в местах установки арматуры и креплений, не снимая защиту с основной поверхности отопительного прибора.',
              'Установите воздухоотводчик (кран Маевского) в верхней точке по паспорту.',
              'Накрутите арматуру/заглушки с применением уплотнителями согласно паспорту изделия.',
              'Извлеките крепления отопительного прибора из упаковки и подготовьте их к монтажу.'
            ],
            qc: [
              'Все элементы соответствуют спецификации',
              'Кран Маевского установлен',
              'Момент затяжки соответствует требованиям',
              'Крепления извлечены и проверены на комплектность'
            ],
            tools: ['Нож/ножницы', 'Ключ разводной', 'Уплотнительная лента', 'Паспорт изделия']
          },
          {
            id: 's2',
            title: 'Шаг 2. Разнести все радиаторы по местам',
            hours: step1Hours,
            norm: `${Math.round(step1PerH*60)} мин/шт`,
            bullets: [
              'Откройте спецификацию/план и сверьте маркировку на упаковке отопительного прибора с назначенной комнатой.',
              'Убедитесь, что упаковка целая: без вмятин, порезов и следов влаги.',
              'Подготовьте место размещения: уложите мягкие подкладки, чтобы исключить контакт с грязным или влажным полом.',
              'Перенесите отопительный прибор с помощью тележки или ремней (для тяжёлых моделей).',
              'Поставьте отопительный прибор на позицию, указанную в плане, без вскрытия упаковки.'
            ],
            qc: [
              'Маркировка совпадает с планом',
              'Упаковка без повреждений',
              'Отопительный прибор стоит на подкладках, не соприкасается с грязным/влажным полом'
            ],
            tools: ['Спецификация/план', 'Тележка', 'Ремни', 'Мягкие подкладки'],
            radiators: items.map((item, index) => ({
              id: `step2_${item.id}`,
              name: `R${index + 1}`,
              isHeavy: item.isHeavy || false,
              type: item.radiatorType || 'panel'
            }))
          },
          {
            id: 's3',
            title: 'Шаг 3. Разметить и установить крепления для всех радиаторов',
            hours: step3Hours,
            norm: `${Math.round(step3PerH*60)} мин/шт`,
            bullets: [
              'Сделайте разметку мест крепления по плану и паспортам изделий.',
              'Соблюдайте базовые отступы: низ–пол 100–120 мм, верх–подоконник 80–100 мм, до стены 30–50 мм.',
              'Используйте крепёж под материал стены: бетон/кирпич/газобетон и т.п.'
            ],
            qc: [
              'Точки крепления соответствуют паспортам',
              'Крепления установлены ровно, без перекосов'
            ],
            tools: ['Рулетка', 'Уровень', 'Карандаш', 'Перфоратор', 'Дюбели', 'Шурупы']
          },
          {
            id: 's4',
            title: 'Шаг 4. Навес радиаторов на кронштейны',
            hours: step4Hours,
            norm: `${Math.round(step4PerH*60)} мин/шт`,
            bullets: [
              'Аккуратно навесьте отопительный прибор на установленные кронштейны и проверьте фиксацию.',
              heavyCount > 0 ? `Для тяжёлых моделей (${heavyCount} шт) используйте тележку/стропы` : 'Используйте мягкие подкладки при работе с лицевой поверхностью.'
            ],
            qc: [
              'Радиаторы зафиксированы без люфта',
              'Отступы и уровни соблюдены'
            ],
            tools: heavyCount > 0 ? ['Тележка', 'Стропы', 'Мягкие подкладки', 'Уровень'] : ['Мягкие подкладки', 'Уровень']
          },
          {
            id: 's5',
            title: 'Шаг 5. Прокладка трубопроводов в теплоизоляции с креплением',
            hours: pipeHours,
            norm: `${Math.round(NORMS.radiators.ops.pipe_per_m_base*60)} мин/м × коэф. прокладки`,
            bullets: [
              'Нарежьте и уложите подводящие трубы в изоляции по маршруту, согласованному с проектом.',
              'Фиксируйте перфолентой/клипсами с шагом по нормам и с защитой изоляции в местах прижима.',
              'Стыки изоляции проклейте лентой.'
            ],
            qc: [
              'Крепёж установлен ровно, без перекосов и люфта',
              'Изоляция не повреждена в местах прижима'
            ],
            tools: ['Труборез', 'Ножницы по металлу', 'Перфолента', 'Клипсы', 'Скотч/лента', 'Рулетка'],
            note: Object.keys(layingBreakdown).length
              ? `Длины по способам: ${Object.entries(layingBreakdown).map(([k,v])=>`${k}: ${v} м`).join(', ')}`
              : undefined,
          },
        ];

        return (
          <div className="install-plan">
            <div className="head" style={{marginBottom:12}}>
              <h3 style={{margin:0}}>Процесс монтажа</h3>
            </div>
            {steps.map(step => (
              <div key={step.id} className="plan-step">
                <div className="plan-step-title">
                  <strong>{step.title}</strong>
                  {step.radiators && step.radiators.every(rad => completedRadiators.has(rad.id)) && (
                    <span className="step-complete-icon">✓</span>
                  )}
                </div>
                <div className="plan-footer">
                  <details className="plan-details">
                    <summary>Описание</summary>
                    <div className="plan-body">
                      <div className="plan-links">
                        <button type="button" className="btn btn-sm btn-secondary">Инструкция</button>
                      </div>
                      <div className="plan-section">
                        <div className="plan-subtitle">Действия:</div>
                        <ol className="plan-actions">
                          {step.bullets.map((b, i) => (<li key={i}>{b}</li>))}
                        </ol>
                      </div>
                      <div className="plan-section">
                        <div className="plan-subtitle">Контроль качества:</div>
                        <ol className="plan-qc">
                          {step.qc.map((b, i) => (<li key={i}>{b}</li>))}
                        </ol>
                      </div>
                      {step.radiators && (
                        <div className="plan-section">
                          <div className="plan-subtitle">Список отопительных приборов для размещения:</div>
                          <div className="radiators-list">
                            {step.radiators.map((rad, i) => {
                              const isCompleted = completedRadiators.has(rad.id);
                              return (
                                <div 
                                  key={i} 
                                  className={`radiator-item ${rad.isHeavy ? 'heavy' : ''} ${rad.type} ${isCompleted ? 'completed' : ''}`}
                                  onClick={() => {
                                    if (isCompleted) {
                                      handleRadiatorIncomplete(rad.id);
                                    } else {
                                      handleRadiatorComplete(rad.id);
                                    }
                                  }}
                                  style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                  <div className="radiator-content">
                                    <span className="radiator-name">{rad.name}</span>
                                    <span className="radiator-type">{getRadiatorTypeLabel(rad.type)}</span>
                                    {rad.isHeavy && <span className="heavy-badge">Тяжелый</span>}
                                  </div>
                                  <div className="progress-bar">
                                    <div 
                                      className={`progress-fill ${isCompleted ? 'filled' : ''}`}
                                      style={{ width: isCompleted ? '100%' : '0%' }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {step.note && (
                        <div className="plan-note">{step.note}</div>
                      )}
                      {step.tools && (
                        <div className="plan-section" style={{gridColumn:'1 / -1'}}>
                          <div className="plan-subtitle">Инструменты:</div>
                          <div className="plan-tools">
                            {step.tools.map((t, i) => (<span key={i} className="tool-badge">{t}</span>))}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                  <div className="plan-meta">
                    <span className="norm">Норма времени: {step.norm}</span>
                    <span className="total">Итого: {fmtHoursMinutes(step.hours)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      </>
      )}

      {/* Модальное окно добавления */}
              <Modal isOpen={isModalOpen} onClose={() => {
          setIsModalOpen(false);
          setEditingRadiator(null);
        }} title={editingRadiator ? "Редактировать прибор" : "Добавить прибор"}>
              <AddRadiatorForm
        section={section.systems[0]}
        radiator={editingRadiator}
        prefill={!editingRadiator && items.length > 0 ? items[items.length - 1] : null}
        onAdd={handleAddItem}
        onUpdate={handleUpdateRadiator}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingRadiator(null);
        }}
      />
      </Modal>

      {/* Модальное окно редактирования коллектора */}
      <CollectorEditor
        isOpen={isCollectorModalOpen}
        onClose={() => setIsCollectorModalOpen(false)}
        collector={editingCollector}
        onSave={handleCollectorSave}
        nextCollectorNumber={editingSystemId ? section.systems.find(s => s.id === editingSystemId)?.collectors.length || 0 : 0}
        defaultMaterial={editingSystemId ? (section.systems.find(s => s.id === editingSystemId)?.collectors[0]?.material || 'PEX-AL-PEX') : 'PEX-AL-PEX'}
      />
      <Modal
        isOpen={!!detailsCollector}
        onClose={() => setDetailsCollector(null)}
        title="Детальный расчет"
      >
        {detailsCollector && (() => {
          const { collector } = detailsCollector;
          const layingKey = collector.layingType === 'external' ? 'open' : collector.layingType;
          // Коэффициенты элемента
          const mat = (!collector.connectionType || collector.connectionType === 'manifold')
            ? NORMS.factors.pipeMaterial[collector.material]
            : NORMS.factors.pipeMaterial[collector.teeMainMaterial || collector.material];
          const dia = (!collector.connectionType || collector.connectionType === 'manifold')
            ? NORMS.factors.pipeDiameter[collector.supplyDiameter]
            : NORMS.factors.pipeDiameter[collector.teeMainDiameter || collector.supplyDiameter];
          const lay = (NORMS.factors.laying as any)[layingKey] ?? 1;
          // Глобальные коэффициенты проекта
          const wallCoef = NORMS.factors.wall[project.factors.wall];
          const crampedCoef = NORMS.factors.cramped[project.factors.cramped];
          const distanceCoef = NORMS.factors.getDistanceCoefficient(project.factors.distance);

          const base = NORMS.collectors.ops.base_mount;
          let rows: {label: string, valueHours: number, info?: string}[] = [];

          if (!collector.connectionType || collector.connectionType === 'manifold') {
            // Для коллекторной схемы учитываем базовый монтаж
            rows.push({ label: 'Базовый монтаж', valueHours: base });
            const outputs = (collector.outputs || 0);
            const outputsH = outputs * NORMS.collectors.ops.output_connection;
            const pipesM = (collector.loops || 0);
            const pipesH = pipesM * NORMS.collectors.ops.supply_pipe_per_m;
            rows.push({ label: 'Выходы коллектора', valueHours: outputsH, info: `${outputs} шт` });
            rows.push({ label: 'Подводящие', valueHours: pipesH, info: `${pipesM} м` });
            if (collector.hasPump) rows.push({ label: 'Смесительная группа', valueHours: NORMS.collectors.ops.mixing_group });
            if (collector.hasCabinet) {
              const baseMin = collector.cabinetType === 'built-in' ? 30 : 10;
              const perOutMin = collector.cabinetType === 'built-in' ? 5 : 1;
              const cabH = (baseMin + perOutMin * (collector.outputs || 0)) / 60;
              rows.push({ label: collector.cabinetType === 'built-in' ? 'Шкаф встроенный' : 'Шкаф накладной', valueHours: cabH });
            }
          } else {
            const mainM = collector.teeMainLengthM || 0;
            const mainH = mainM * NORMS.collectors.ops.supply_pipe_per_m;
            const branches = collector.teeBranchesCount || 0;
            const branchesH = branches * (20/60);
            rows.push({ label: 'Магистраль', valueHours: mainH, info: `${mainM} м` });
            rows.push({ label: 'Отводы', valueHours: branchesH, info: `${branches} шт` });
          }

          const subtotal = rows.reduce((s, r) => s + r.valueHours, 0);
          const afterMat = subtotal * mat;
          const afterDia = afterMat * dia;
          const afterLay = afterDia * lay;
          const afterWall = afterLay * wallCoef;
          const afterCramped = afterWall * crampedCoef;
          const finalHours = afterCramped * distanceCoef;
          const avgRate = (project.hourlyRates.expert + project.hourlyRates.master + project.hourlyRates.assistant) / 3;
          const finalCost = finalHours * avgRate;

          return (
            <div className="breakdown-table">
              <div className="bd-header">
                <div>Операция</div>
                <div>Параметры</div>
                <div>Время</div>
              </div>
              <div className="bd-body">
                {rows.map((r, i) => (
                  <div key={i} className="bd-row">
                    <div>{r.label}</div>
                    <div>{r.info || '-'}</div>
                    <div>{fmtHoursMinutes(r.valueHours)}</div>
                  </div>
                ))}
                <div className="bd-subtotal">
                  <div>Итого до коэффициентов</div>
                  <div>-</div>
                  <div>{fmtHoursMinutes(subtotal)}</div>
                </div>
                <div className="bd-coef">
                  <div>× Материал труб</div>
                  <div>{collector.material}</div>
                  <div>×{mat}</div>
                </div>
                <div className="bd-coef">
                  <div>× Диаметр</div>
                  <div>{collector.supplyDiameter} мм</div>
                  <div>×{dia}</div>
                </div>
                <div className="bd-coef">
                  <div>× Прокладка</div>
                  <div>{getLayingTypeLabel(collector.layingType)}</div>
                  <div>×{lay}</div>
                </div>
                <div className="bd-coef">
                  <div>× Стены</div>
                  <div>-</div>
                  <div>×{wallCoef}</div>
                </div>
                <div className="bd-coef">
                  <div>× Стеснённость</div>
                  <div>-</div>
                  <div>×{crampedCoef}</div>
                </div>
                <div className="bd-coef">
                  <div>× Удалённость</div>
                  <div>{project.factors.distance} км</div>
                  <div>×{distanceCoef.toFixed(2)}</div>
                </div>
                <div className="bd-total">
                  <div>ИТОГО трудозатраты</div>
                  <div>-</div>
                  <div>{fmtHoursMinutes(finalHours)}</div>
                </div>
                <div className="bd-total bd-cost">
                  <div>ИТОГО стоимость</div>
                  <div>-</div>
                  <div>{fmtCurrency(finalCost)}</div>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Детальный расчет радиатора */}
      <Modal
        isOpen={!!detailsRadiator}
        onClose={() => setDetailsRadiator(null)}
        title="Детальный расчет"
      >
        {detailsRadiator && (() => {
          const { item, system } = detailsRadiator;
          const laying = item.laying === 'inherit' ? system.defaultLaying : item.laying;
          const layingCoef = (NORMS.factors.laying as any)[laying] ?? 1;

          const rows: {label: string; valueHours: number; info?: string}[] = [];
          // Базовый монтаж
          const baseH = (item.isHeavy ? NORMS.radiators.ops.rad_mount_base * NORMS.radiators.ops.rad_heavy_coef : NORMS.radiators.ops.rad_mount_base);
          rows.push({ label: 'Базовый монтаж', valueHours: baseH, info: item.isHeavy ? `Вес > 20 кг (×${NORMS.radiators.ops.rad_heavy_coef})` : '-' });
          // Воздухоотводчик
          rows.push({ label: 'Воздухоотводчик', valueHours: NORMS.radiators.ops.air_vent_install });
          // Термостатический и балансировочный клапан — только для бокового подключения
          if (item.connection === 'side' && item.thermostatAndBalanceValve) {
            rows.push({ label: 'Термостатический и балансировочный клапан', valueHours: NORMS.radiators.ops.thermostatic_valve_install });
          }
          // Байпас — только для бокового подключения
          if (item.connection === 'side' && item.bypass) {
            rows.push({ label: 'Байпас', valueHours: NORMS.radiators.ops.bypass_add });
          }
          // Опции подключения
          if (item.connection === 'bottom' && item.bottomConnectionUnit) rows.push({ label: 'Узел нижнего подключения', valueHours: NORMS.radiators.ops.bottom_connection_unit });
          if (item.wallConnection) rows.push({ label: 'Подключение из стены', valueHours: NORMS.radiators.ops.wall_connection });
          if (item.chromeTubes) rows.push({ label: 'Хромированные трубки', valueHours: NORMS.radiators.ops.chrome_tubes });
          if ((item.connection === 'bottom' && item.preMountTubes) || (item.connection === 'side' && item.preMountTubesSide)) rows.push({ label: 'Предмонтаж трубок без радиатора', valueHours: NORMS.radiators.ops.pre_mount_tubes });

          // Подводящие трубы (база × длина × коэф прокладки)
          const pipeH = (item.supplyLenM || 0) * NORMS.radiators.ops.pipe_per_m_base * layingCoef;
          rows.push({ label: 'Подводящие', valueHours: pipeH, info: `${item.supplyLenM} м × коэф ${layingCoef}` });

          const subtotal = rows.reduce((s, r) => s + r.valueHours, 0);

          // Коэффициенты
          const wallCoef = NORMS.factors.wall[project.factors.wall];
          const crampedCoef = NORMS.factors.cramped[project.factors.cramped];
          const distanceCoef = NORMS.factors.getDistanceCoefficient(project.factors.distance);
          const materialCoef = NORMS.factors.pipeMaterial[system.defaultPipeMaterial];
          const typeCoef = NORMS.factors.radiatorType[item.radiatorType];

          const afterWall = subtotal * wallCoef;
          const afterCramped = afterWall * crampedCoef;
          const afterDistance = afterCramped * distanceCoef;
          const afterMaterial = afterDistance * materialCoef;
          const finalHours = afterMaterial * typeCoef;
          const avgRate = (project.hourlyRates.expert + project.hourlyRates.master + project.hourlyRates.assistant) / 3;
          const finalCost = finalHours * avgRate;

          return (
            <div className="breakdown-table">
              <div className="bd-header">
                <div>Операция</div>
                <div>Параметры</div>
                <div>Время</div>
              </div>
              <div className="bd-body">
                {rows.map((r, i) => (
                  <div key={i} className="bd-row">
                    <div>{r.label}</div>
                    <div>{r.info || '-'}</div>
                    <div>{fmtHoursMinutes(r.valueHours)}</div>
                  </div>
                ))}
                <div className="bd-subtotal">
                  <div>Итого до коэффициентов</div>
                  <div>-</div>
                  <div>{fmtHoursMinutes(subtotal)}</div>
                </div>
                <div className="bd-coef"><div>× Стены</div><div>-</div><div>×{wallCoef}</div></div>
                <div className="bd-coef"><div>× Стеснённость</div><div>-</div><div>×{crampedCoef}</div></div>
                <div className="bd-coef"><div>× Удалённость</div><div>{project.factors.distance} км</div><div>×{distanceCoef.toFixed(2)}</div></div>
                <div className="bd-coef"><div>× Материал труб</div><div>{system.defaultPipeMaterial}</div><div>×{materialCoef}</div></div>
                <div className="bd-coef"><div>× Тип прибора</div><div>-</div><div>×{typeCoef}</div></div>
                <div className="bd-total"><div>ИТОГО трудозатраты</div><div>-</div><div>{fmtHoursMinutes(finalHours)}</div></div>
                <div className="bd-total bd-cost"><div>ИТОГО стоимость</div><div>-</div><div>{fmtCurrency(finalCost)}</div></div>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default RadiatorSystem;
