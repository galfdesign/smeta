import React from 'react';

const BoilerSystem: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Котельная</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">⚙️</div>
        <h4>Котельная</h4>
        <p>Компонент для расчета монтажа котельного оборудования будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🔥</span>
            <span>Монтаж котлов и горелок</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Обвязка котельной</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🏗️</span>
            <span>Дымоходы и вентиляция</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoilerSystem;
