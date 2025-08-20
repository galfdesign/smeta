import React, { useState, useMemo } from 'react';
import ProjectSettings from './components/ProjectSettings';
import SystemTabs, { SystemTab } from './components/SystemTabs';
import FloorHeatingSystem from './components/FloorHeatingSystem';
import RadiatorSystem from './components/RadiatorSystem';
import SewageSystem from './components/SewageSystem';
import WaterSystem from './components/WaterSystem';
import BoilerSystem from './components/BoilerSystem';
import AutomationSystem from './components/AutomationSystem';
import AdditionalWorks from './components/AdditionalWorks';
import ExportModal from './components/ExportModal';
import { calcRadiatorHours } from './utils/calculations';
import Modal from './components/Modal';
import { 
  ProjectState, 
  RadiatorSection, 
  RadiatorItem
} from './types';
import { fmtCurrency, fmtHoursMinutes } from './utils/calculations';
import './App.css';

const App: React.FC = () => {
  // Состояние активной вкладки
  const [activeTab, setActiveTab] = useState<SystemTab>('radiators');
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Состояние проекта
  const [project, setProject] = useState<ProjectState>({
    title: "Коттедж - Инженерные системы",
    hourlyRates: { expert: 2000, master: 1500, assistant: 1000 },
    factors: { wall: "brick", cramped: "none", distance: 0 },
  });

  // Состояние системы радиаторов
  const [radiatorSection, setRadiatorSection] = useState<RadiatorSection>({
    systems: [
      {
        id: "system_1",
        name: "Система 1",
        scheme: "manifold",
        defaultLaying: "floor",
        defaultPipeMaterial: "PEX-AL-PEX",
        defaultDiameter: "16",
        collectors: [
          {
            id: "collector_1",
            name: "KR1",
            loops: 20,
            outputs: 8,
            layingType: "floor",
            hasPump: false,
            hasCabinet: false,
            material: "PEX-AL-PEX",
            supplyDiameter: "25" as const,
          },
        ],
      },
    ],
  });

  const [radiatorItems, setRadiatorItems] = useState<RadiatorItem[]>([
    {
      id: "1",
      room: "Гостиная",
              radiatorType: "panel",
      connection: "bottom",
              supplyLenM: 20,
      laying: "inherit",
      
              thermostatAndBalanceValve: true,
        bypass: false,
        wallConnection: true,
        chromeTubes: false,
        preMountTubes: false,
        preMountTubesSide: false,
        bottomConnectionUnit: true,
    },
  ]);

  // Состояние водоснабжения скрыто; переменные удалены для чистой сборки

  // Общие итоги
  const totals = useMemo(() => {
    // Здесь будут расчеты для всех систем
    // Пока возвращаем заглушку
    return {
      hours: 0,
      cost: 0,
    };
  }, [radiatorItems, project]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const onPrint = () => {
    setIsExportModalOpen(true);
  };

  // Функция для отображения активной системы
  const renderActiveSystem = () => {
    switch (activeTab) {
      case 'floor-heating':
        return <FloorHeatingSystem />;
      case 'radiators':
        return (
          <RadiatorSystem
            section={radiatorSection}
            setSection={setRadiatorSection}
            items={radiatorItems}
            setItems={setRadiatorItems}
            project={project}
            onExport={onPrint}
          />
        );
      case 'sewage':
        return <SewageSystem />;
      case 'water':
        return <WaterSystem />;
      case 'boiler':
        return <BoilerSystem />;
      case 'automation':
        return <AutomationSystem />;
      case 'additional':
        return <AdditionalWorks />;
      case 'summary':
        return (
          <div className="card summary-card">
            <div className="head">
              <h3>Сводка по проекту</h3>
            </div>
            <div className="summary-content">
              <div className="summary-section">
                <h4>Настройки проекта</h4>
                <div className="summary-item">
                  <span>Название:</span>
                  <span>{project.title}</span>
                </div>
                <div className="summary-item">
                  <span>Материал стен:</span>
                  <span>{project.factors.wall}</span>
                </div>
                <div className="summary-item">
                  <span>Стесненность:</span>
                  <span>{project.factors.cramped}</span>
                </div>
                <div className="summary-item">
                  <span>Удаленность:</span>
                  <span>{project.factors.distance} км</span>
                </div>
              </div>
              
              <div className="summary-section">
                <h4>Стоимость часа работы</h4>
                <div className="summary-item">
                  <span>Эксперт:</span>
                  <span>{project.hourlyRates.expert} ₽/ч</span>
                </div>
                <div className="summary-item">
                  <span>Мастер:</span>
                  <span>{project.hourlyRates.master} ₽/ч</span>
                </div>
                <div className="summary-item">
                  <span>Помощник:</span>
                  <span>{project.hourlyRates.assistant} ₽/ч</span>
                </div>
              </div>
              
              <div className="summary-section">
                <h4>Общие итоги</h4>
                <div className="summary-item total">
                  <span>Общие трудозатраты:</span>
                  <span className="total-value">{fmtHoursMinutes(totals.hours)}</span>
                </div>
                <div className="summary-item total">
                  <span>Общая стоимость:</span>
                  <span className="total-value">{fmtCurrency(totals.cost)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <FloorHeatingSystem />;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <p>Расчет трудозатрат и стоимости монтажа</p>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => setIsImportOpen(true)}>
              Загрузить данные проекта
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {/* Настройки проекта */}
        <ProjectSettings project={project} setProject={setProject} />

        {/* Система вкладок */}
        <SystemTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Активная система */}
        {renderActiveSystem()}
      </main>

      <footer className="app-footer">
        <p>
          Совет: калибруйте нормы в файле <code>src/data/norms.ts</code> по своим хронометражам. 
          Для чистого PDF добавьте отдельный шаблон печати (CSS @media print).
        </p>
      </footer>

      <ExportModal 
        isOpen={isExportModalOpen} 
        onClose={() => setIsExportModalOpen(false)}
        getCalcTable={() => {
          try {
            // Формируем данные таблицы как на экране: Коллекторы, Радиаторы, ИТОГО
            const head = ['Элемент','Тип','Параметры','Коэфф. элемента','Трудозатраты','Стоимость'];
            const body: string[][] = [];

            // Коллекторы
            radiatorSection.systems.forEach((system) => {
              system.collectors.forEach((collector, collectorIndex) => {
                // Имитация логики из RadiatorSystem (параметры)
                // Параметры
                const params: string[] = [];
                if (!collector.connectionType || collector.connectionType === 'manifold') {
                  params.push('Базовый монтаж: 30 мин');
                  params.push(`Выходы (${collector.outputs || 0} шт): ${(collector.outputs || 0) * 15} мин`);
                  params.push(`Подводящие (${collector.loops || 0} м): ${(collector.loops || 0) * 5} мин`);
                  if (collector.hasPump) params.push('Смесительная группа: 60 мин');
                  if (collector.hasCabinet) {
                    const baseMin = collector.cabinetType === 'built-in' ? 30 : 10;
                    const perOutMin = collector.cabinetType === 'built-in' ? 5 : 1;
                    params.push(`Шкаф ${collector.cabinetType === 'built-in' ? 'встроенный' : 'накладной'}: ${baseMin} + ${perOutMin}×${collector.outputs || 0} мин`);
                  }
                } else {
                  params.push(`Магистраль (${collector.teeMainLengthM || 0} м): ${(collector.teeMainLengthM || 0) * 5} мин`);
                  params.push(`Отводы (${collector.teeBranchesCount || 0} шт): ${(collector.teeBranchesCount || 0) * 20} мин`);
                }

                // Коэффициенты
                const coefParts: string[] = [];
                if (!collector.connectionType || collector.connectionType === 'manifold') {
                  coefParts.push(`Материал: ${collector.material}`);
                  coefParts.push(`Диаметр: ${collector.supplyDiameter} мм`);
                } else {
                  coefParts.push(`Материал: ${collector.teeMainMaterial || collector.material}`);
                  coefParts.push(`Диаметр: ${collector.teeMainDiameter || collector.supplyDiameter} мм`);
                }
                coefParts.push(`Прокладка: ${collector.layingType}`);

                // Итоги часов/стоимости — вычислим напрямую, как в карточке
                const calc = (function(){
                  // Вытаскиваем локальную копию функции из RadiatorSystem.tsx было бы сложнее, поэтому посчитаем грубо
                  // Здесь идёт ускорённый путь: используем те же формулы, что и в карточках (см. RadiatorSystem.calculateCollectorHours)
                  // Чтобы не дублировать код, воспользуемся DOM как ориентир, если невозможно — поставим пусто.
                  const row = document.querySelectorAll('.collector-row')[collectorIndex] as HTMLElement | undefined;
                  const hoursText = row?.querySelector('.hours-value')?.textContent?.trim();
                  const costText = row?.querySelector('.cost-value')?.textContent?.trim();
                  return { hoursText: hoursText || '', costText: costText || '' };
                })();

                body.push([
                  (!collector.connectionType || collector.connectionType === 'manifold') ? `Коллектор ${collectorIndex + 1}` : `Тройниковая TR${collectorIndex + 1}`,
                  (!collector.connectionType || collector.connectionType === 'manifold') ? 'Коллекторная система' : 'Тройниковая система',
                  params.join('\n'),
                  coefParts.join('\n'),
                  calc.hoursText,
                  calc.costText,
                ]);
              });
            });

            // Радиаторы
            radiatorItems.forEach((item, idx) => {
              const params: string[] = [];
              params.push(`Базовый монтаж${item.isHeavy ? ' (вес > 20 кг)' : ''}: ${item.isHeavy ? 45 : 30} мин`);
              params.push('Воздухоотводчик: 5 мин');
              if (item.connection === 'side') {
                if (item.thermostatAndBalanceValve) params.push('Термостат+баланс: 18 мин');
                if (item.bypass) params.push('Байпас: 30 мин');
                if (item.preMountTubesSide) params.push('Предмонтаж: 60 мин');
              } else {
                if (item.bottomConnectionUnit) params.push('Узел нижнего подключения: 10 мин');
                if (item.preMountTubes) params.push('Предмонтаж: 60 мин');
              }
              if (item.wallConnection) params.push('Из стены: 20 мин');
              if (item.chromeTubes) params.push('Хромированные трубки: 20 мин');
              params.push(`Подводящие (${item.supplyLenM} м): ${Math.round((item.supplyLenM || 0) * 5)} мин`);

              const coefParts: string[] = [];
              const system = radiatorSection.systems[0];
              if (system) {
                coefParts.push(`Материал труб: ${system.defaultPipeMaterial}`);
                const lay = item.laying === 'inherit' ? system.defaultLaying : item.laying;
                coefParts.push(`Прокладка: ${lay}`);
              }
              coefParts.push(`Тип прибора: ${item.radiatorType}`);

              // Часы/стоимость считаем напрямую функцией calcRadiatorHours
              let hours = '';
              let cost = '';
              if (system) {
                const { hours: h, cost: c } = calcRadiatorHours(item, system, project);
                hours = `${Math.round(h * 60) >= 60 ? `${Math.floor(Math.round(h*60)/60)} ч ${Math.round(h*60)%60} мин` : `${Math.round(h*60)} мин`}`;
                cost = `${Math.round(c)} ₽`;
              }

              body.push([
                `R${idx + 1}`,
                'Отопительный прибор',
                params.join('\n'),
                coefParts.join('\n'),
                hours,
                cost,
              ]);
            });

            // ПНР для PDF (если присутствует на экране — возьмем значения из DOM)
            const pnRow = document.querySelector('.commissioning-row') as HTMLElement | null;
            if (pnRow) {
              const hoursPn = pnRow.querySelector('.hours-value')?.textContent?.trim() || '';
              const costPn = pnRow.querySelector('.cost-value')?.textContent?.trim() || '';
              body.push(['ПНР','ПНР','Системы × 20 мин; Приборы × 15 мин','-', hoursPn, costPn]);
            }

            // Итоги из DOM (учитывают ПНР)
            const totalHours = (document.querySelector('.total-hours') as HTMLElement | null)?.textContent?.trim() || '';
            const totalCost = (document.querySelector('.total-cost') as HTMLElement | null)?.textContent?.trim() || '';
            body.push(['ИТОГО','Все элементы','-','-', totalHours, totalCost]);

            return { head, body, title: 'Радиаторное отопление детальный расчет трудозатрат и стоимости' };
          } catch {
            return null;
          }
        }}
      />

      {/* Модалка загрузки данных проекта */}
      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Загрузка данных проекта">
        <div className="export-modal-content">
          <p style={{color:'#94a3b8', marginBottom:12}}>Функция в разработке</p>
          <div className="form-actions">
            <button className="btn" onClick={() => setIsImportOpen(false)}>Закрыть</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
