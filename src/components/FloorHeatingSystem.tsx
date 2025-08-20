import React from 'react';

const FloorHeatingSystem: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Система напольного отопления</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">🔥</div>
        <h4>Система напольного отопления</h4>
        <p>Компонент для расчета монтажа теплых полов будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Монтаж коллекторов и смесителей</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📏</span>
            <span>Укладка труб теплого пола</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏗️</span>
            <span>Стяжка и отделка</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorHeatingSystem;
