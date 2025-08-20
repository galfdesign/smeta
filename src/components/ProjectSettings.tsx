import React, { useState } from 'react';
import { ProjectState } from '../types';
import ProjectSettingsModal from './ProjectSettingsModal';

interface ProjectSettingsProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
}

const ProjectSettings: React.FC<ProjectSettingsProps> = ({ project, setProject }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleSave = (updatedProject: ProjectState) => {
    setProject(updatedProject);
  };

  const getWallTypeLabel = (type: string) => {
    const labels = {
      brick: 'Кирпич',
      aerated_concrete: 'Газобетон',
      concrete: 'Бетон',
      wooden_frame: 'Деревянный каркас',
      glued_beam_frame: 'Клееный брус + деревянный каркас'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getCrampedLabel = (type: string) => {
    const labels = {
      none: 'Нет',
      medium: 'Средняя',
      high: 'Высокая'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getDistanceLabel = (distance: number) => {
    if (distance === 0) return 'Местная (0 км)';
    if (distance <= 50) return `Местная (${distance} км)`;
    if (distance <= 200) return `Региональная (${distance} км)`;
    if (distance <= 500) return `Удаленная (${distance} км)`;
    return `Очень удаленная (${distance} км)`;
  };

  // Функция для расчета коэффициента удаленности
  const getDistanceCoefficient = (distance: number): number => {
    if (distance <= 0) return 1.0;
    return 1.0 + (Math.ceil(distance / 10) * 0.03);
  };

  return (
    <div className="card">
      <div className="head">
        <h3>Настройки проекта</h3>
        <div style={{display:'flex',gap:8}}>
          <button className="btn btn-sm" onClick={() => setIsCollapsed(prev => !prev)} title={isCollapsed ? 'Развернуть' : 'Свернуть'}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isCollapsed ? (
                <path d="M12 5v14m-7-7h14"/>
              ) : (
                <path d="M19 9l-7 7-7-7"/>
              )}
            </svg>
          </button>
          <button className="btn btn-sm" onClick={() => setIsModalOpen(true)} title="Редактировать">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        </div>
      </div>
      
      {!isCollapsed && (
      <div className="settings-overview">
        {/* Название проекта */}
        <div className="setting-overview-item main">
          <div className="setting-label">
            <span className="setting-icon">📋</span>
            <span className="setting-title">Название проекта</span>
          </div>
          <div className="setting-value">{project.title}</div>
        </div>

        {/* Стоимость часа по квалификации */}
        <div className="setting-overview-item">
          <div className="setting-label">
            <span className="setting-icon">💰</span>
            <span className="setting-title">Стоимость часа работы</span>
          </div>
          <div className="rates-overview">
            <div className="rate-overview-item">
              <span className="rate-label">Эксперт:</span>
              <span className="rate-value">{project.hourlyRates.expert} ₽/ч</span>
            </div>
            <div className="rate-overview-item">
              <span className="rate-label">Мастер:</span>
              <span className="rate-value">{project.hourlyRates.master} ₽/ч</span>
            </div>
            <div className="rate-overview-item">
              <span className="rate-label">Помощник:</span>
              <span className="rate-value">{project.hourlyRates.assistant} ₽/ч</span>
            </div>
          </div>
        </div>

        {/* Факторы проекта */}
        <div className="setting-overview-item">
          <div className="setting-label">
            <span className="setting-icon">⚙️</span>
            <span className="setting-title">Факторы проекта</span>
          </div>
          <div className="factors-overview">
            <div className="factor-overview-item">
              <span className="factor-label">Материал стен:</span>
              <span className="factor-value">{getWallTypeLabel(project.factors.wall)}</span>
            </div>
            <div className="factor-overview-item">
              <span className="factor-label">Стесненность:</span>
              <span className="factor-value">{getCrampedLabel(project.factors.cramped)}</span>
            </div>
            <div className="factor-overview-item">
              <span className="factor-label">Удаленность:</span>
              <span className="factor-value">
                {getDistanceLabel(project.factors.distance)} (×{getDistanceCoefficient(project.factors.distance).toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Модальное окно редактирования */}
      <ProjectSettingsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        project={project}
        onSave={handleSave}
      />
    </div>
  );
};

export default ProjectSettings;
