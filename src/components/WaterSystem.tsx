import React from 'react';

const WaterSystem: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Система водоснабжения</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">💧</div>
        <h4>Система водоснабжения</h4>
        <p>Компонент для расчета монтажа труб, смесителей, фильтров будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🚰</span>
            <span>Монтаж смесителей и кранов</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Прокладка труб водоснабжения</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span>Установка фильтров и клапанов</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaterSystem;
