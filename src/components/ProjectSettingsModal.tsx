import React, { useState, useEffect } from 'react';
import { ProjectState, WallType, CrampedType, SkillLevel } from '../types';
import Modal from './Modal';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
  onSave: (project: ProjectState) => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  onSave 
}) => {
  const [formData, setFormData] = useState<ProjectState>(project);
  const [activeTab, setActiveTab] = useState<'general' | 'rates' | 'factors'>('general');

  useEffect(() => {
    setFormData(project);
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleChange = (field: keyof ProjectState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFactorsChange = (field: keyof ProjectState['factors'], value: any) => {
    setFormData(prev => ({
      ...prev,
      factors: { ...prev.factors, [field]: value }
    }));
  };

  const handleHourlyRateChange = (skillLevel: SkillLevel, value: number) => {
    setFormData(prev => ({
      ...prev,
      hourlyRates: { ...prev.hourlyRates, [skillLevel]: value }
    }));
  };

  // Коэффициенты для факторов проекта
  const wallCoefficients = {
    brick: 1.2,
    aerated_concrete: 1.0,
    concrete: 1.3,
    wooden_frame: 1.4,
    glued_beam_frame: 1.3,
  };

  const crampedCoefficients = {
    none: 1.00,
    medium: 1.10,
    high: 1.25,
  };

  // Справочник дистанций не используется напрямую, оставлен для возможного UI

  // Функция для расчета коэффициента удаленности
  const getDistanceCoefficient = (distance: number): number => {
    if (distance <= 0) return 1.0;
    return 1.0 + (Math.ceil(distance / 10) * 0.03);
  };

  const getSummary = () => {
    const wall = wallCoefficients[formData.factors.wall as keyof typeof wallCoefficients] ?? 1;
    const cramped = crampedCoefficients[formData.factors.cramped as keyof typeof crampedCoefficients] ?? 1;
    const distance = getDistanceCoefficient(formData.factors.distance);
    const factorTotal = Number((wall * cramped * distance).toFixed(2));
    const avgRate = Math.round(
      (formData.hourlyRates.expert + formData.hourlyRates.master + formData.hourlyRates.assistant) / 3
    );
    return { wall, cramped, distance, factorTotal, avgRate };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Настройки проекта"
    >
      <form onSubmit={handleSubmit} className="project-settings-form">
        <div className="modal-tabs">
          <button type="button" className={`modal-tab ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>Общее</button>
          <button type="button" className={`modal-tab ${activeTab === 'rates' ? 'active' : ''}`} onClick={() => setActiveTab('rates')}>Тарифы</button>
          <button type="button" className={`modal-tab ${activeTab === 'factors' ? 'active' : ''}`} onClick={() => setActiveTab('factors')}>Факторы</button>
        </div>

        <div className="settings-modal-grid">
          <div className="settings-modal-left">
            {activeTab === 'general' && (
              <div className="form-section">
                <h4>Основная информация</h4>
                <div className="form-group">
                  <label className="label">
                    <span>Название проекта</span>
                    <input
                      type="text"
                      className="input"
                      value={formData.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Введите название проекта"
                      required
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'rates' && (
              <div className="form-section">
                <h4>Стоимость часа работы</h4>
                <div className="rates-form-grid">
                  <div className="rate-form-item">
                    <label className="label">
                      <span>Эксперт</span>
                      <input type="number" className="input" value={formData.hourlyRates.expert} onChange={(e) => handleHourlyRateChange('expert', parseFloat(e.target.value) || 0)} min="0" step="100" placeholder="2000" required />
                    </label>
                  </div>
                  <div className="rate-form-item">
                    <label className="label">
                      <span>Мастер</span>
                      <input type="number" className="input" value={formData.hourlyRates.master} onChange={(e) => handleHourlyRateChange('master', parseFloat(e.target.value) || 0)} min="0" step="100" placeholder="1500" required />
                    </label>
                  </div>
                  <div className="rate-form-item">
                    <label className="label">
                      <span>Помощник</span>
                      <input type="number" className="input" value={formData.hourlyRates.assistant} onChange={(e) => handleHourlyRateChange('assistant', parseFloat(e.target.value) || 0)} min="0" step="100" placeholder="1000" required />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'factors' && (
              <div className="form-section">
                <h4>Факторы проекта</h4>
                <div className="factors-form-grid">
                  <div className="factor-form-item">
                    <label className="label">
                      <span>Материал стен</span>
                      <select className="input" value={formData.factors.wall} onChange={(e) => handleFactorsChange('wall', e.target.value as WallType)}>
                        <option value="brick">Кирпич (×{wallCoefficients.brick})</option>
                        <option value="aerated_concrete">Газобетон (×{wallCoefficients.aerated_concrete})</option>
                        <option value="concrete">Бетон (×{wallCoefficients.concrete})</option>
                        <option value="wooden_frame">Деревянный каркас (×{wallCoefficients.wooden_frame})</option>
                        <option value="glued_beam_frame">Клееный брус + деревянный каркас (×{wallCoefficients.glued_beam_frame})</option>
                      </select>
                    </label>
                  </div>

                  <div className="factor-form-item">
                    <label className="label">
                      <span>Стесненность условий</span>
                      <select className="input" value={formData.factors.cramped} onChange={(e) => handleFactorsChange('cramped', e.target.value as CrampedType)}>
                        <option value="none">Нет (×{crampedCoefficients.none})</option>
                        <option value="medium">Средняя (×{crampedCoefficients.medium})</option>
                        <option value="high">Высокая (×{crampedCoefficients.high})</option>
                      </select>
                    </label>
                  </div>

                  <div className="factor-form-item">
                    <label className="label">
                      <span>Удаленность объекта</span>
                      <div className="distance-input-group">
                        <input type="number" className="input" value={formData.factors.distance} onChange={(e) => handleFactorsChange('distance', parseFloat(e.target.value) || 0)} min="0" step="1" placeholder="0" required />
                        <span className="coefficient-display">×{getDistanceCoefficient(formData.factors.distance).toFixed(2)}</span>
                      </div>
                      <small className="help-text">Каждые 10 км добавляют 0.03 к коэффициенту</small>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="settings-modal-right">
            {(() => {
              const s = getSummary();
              return (
                <div className="summary-card">
                  <h4>Сводка</h4>
                  <div className="summary-metrics">
                    <div className="summary-metric"><span>Стены</span><strong>×{s.wall}</strong></div>
                    <div className="summary-metric"><span>Стесненность</span><strong>×{s.cramped}</strong></div>
                    <div className="summary-metric"><span>Удаленность</span><strong>×{s.distance.toFixed(2)}</strong></div>
                    <div className="summary-metric total"><span>Итоговый коэффициент</span><strong>×{s.factorTotal}</strong></div>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-metrics">
                    <div className="summary-metric"><span>Средняя ставка</span><strong>{s.avgRate} ₽/ч</strong></div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary">Сохранить настройки</button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectSettingsModal;
