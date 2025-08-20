import React from 'react';

const AutomationSystem: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Автоматика</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">🎛️</div>
        <h4>Автоматика</h4>
        <p>Компонент для расчета монтажа систем автоматизации будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🎛️</span>
            <span>Монтаж контроллеров и датчиков</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔌</span>
            <span>Электромонтажные работы</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">💻</span>
            <span>Настройка и программирование</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationSystem;
