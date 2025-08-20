import React from 'react';

export type SystemTab = 'floor-heating' | 'radiators' | 'sewage' | 'water' | 'boiler' | 'automation' | 'additional' | 'summary';

interface SystemTabsProps {
  activeTab: SystemTab;
  onTabChange: (tab: SystemTab) => void;
}

const SystemTabs: React.FC<SystemTabsProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'floor-heating', label: 'Напольное отопление' },
    { id: 'radiators', label: 'Радиаторное отопление' },
    { id: 'sewage', label: 'Канализация' },
    { id: 'water', label: 'Водоснабжение' },
    { id: 'boiler', label: 'Котельная' },
    { id: 'automation', label: 'Автоматика' },
    { id: 'additional', label: 'Доп. работы' },
    { id: 'summary', label: 'Итог' },
  ];

  return (
    <div className="system-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'summary' ? 'summary-tab' : ''}`}
          onClick={() => onTabChange(tab.id as SystemTab)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default SystemTabs;
