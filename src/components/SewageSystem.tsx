import React from 'react';

const SewageSystem: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Система канализации</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">🚽</div>
        <h4>Система канализации</h4>
        <p>Компонент для расчета монтажа канализационных систем будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🚰</span>
            <span>Монтаж сантехприборов</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Прокладка канализационных труб</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏗️</span>
            <span>Устройство колодцев и септиков</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SewageSystem;
