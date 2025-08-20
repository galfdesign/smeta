import React from 'react';

const AdditionalWorks: React.FC = () => {
  return (
    <div className="card">
      <div className="head">
        <h3>Дополнительные работы</h3>
        <span className="status">В разработке</span>
      </div>
      <div className="system-placeholder">
        <div className="placeholder-icon">🔧</div>
        <h4>Дополнительные работы</h4>
        <p>Компонент для расчета дополнительных работ будет добавлен в следующей версии</p>
        <div className="placeholder-features">
          <div className="feature-item">
            <span className="feature-icon">🏗️</span>
            <span>Подготовительные работы</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔧</span>
            <span>Пусконаладочные работы</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📋</span>
            <span>Документооборот</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalWorks;
