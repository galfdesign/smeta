import React, { useState, useEffect } from 'react';
import { CollectorConfig, PipeMaterial, CollectorSupplyDiameter, ConnectionType } from '../types';
import Modal from './Modal';

interface CollectorEditorProps {
  isOpen: boolean;
  onClose: () => void;
  collector: CollectorConfig | null;
  onSave: (collector: CollectorConfig) => void;
  nextCollectorNumber: number;
  defaultMaterial: PipeMaterial;
}

const CollectorEditor: React.FC<CollectorEditorProps> = ({ 
  isOpen, 
  onClose, 
  collector, 
  onSave, 
  nextCollectorNumber,
  defaultMaterial
}) => {
  const [formData, setFormData] = useState<CollectorConfig>({
    id: '',
    name: 'KR1',
    connectionType: 'manifold',
    loops: 20,
    outputs: 8,
    layingType: 'floor',
    hasPump: false,
    hasCabinet: false,
    material: 'PEX-AL-PEX',
    supplyDiameter: '25',
  });

  useEffect(() => {
    if (collector) {
      setFormData(collector);
    } else {
      // Это новый коллектор, генерируем название
      const nextNumber = nextCollectorNumber; // Будет обновлено через props
      setFormData({
        id: '',
        name: `KR${nextNumber}`,
        connectionType: 'manifold',
        loops: 20,
        outputs: 8,
        layingType: 'floor',
        hasPump: false,
        hasCabinet: false,
        material: (defaultMaterial || 'PEX-AL-PEX') as PipeMaterial,
        supplyDiameter: '25',
      });
    }
  }, [collector, nextCollectorNumber, defaultMaterial]);

  // Сброс типа шкафа при отключении шкафа
  useEffect(() => {
    if (!formData.hasCabinet) {
      setFormData(prev => ({ ...prev, cabinetType: undefined }));
    } else if (!formData.cabinetType) {
      setFormData(prev => ({ ...prev, cabinetType: 'built-in' }));
    }
  }, [formData.hasCabinet, formData.cabinetType]);

  // При выборе тройниковой схемы отключаем опции
  useEffect(() => {
    if (formData.connectionType === 'tee') {
      setFormData(prev => ({
        ...prev,
        hasPump: false,
        hasCabinet: false,
        cabinetType: undefined,
        teeMainLengthM: prev.teeMainLengthM === undefined ? 20 : prev.teeMainLengthM,
        teeMainDiameter: (prev.teeMainDiameter || '20') as CollectorSupplyDiameter,
        teeMainMaterial: prev.teeMainMaterial || (defaultMaterial || 'PEX-AL-PEX'),
        teeBranchesCount: prev.teeBranchesCount === undefined ? 8 : prev.teeBranchesCount,
      }));
    }
  }, [formData.connectionType, defaultMaterial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    const collectorToSave = {
      ...formData,
      id: collector?.id || `collector_${Date.now()}`,
    };
    
    onSave(collectorToSave);
    onClose();
  };

  const handleChange = (field: keyof CollectorConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Настройки распределения">
      <form onSubmit={handleSubmit} className="collector-editor-form">
        <div className="form-grid">
          <div className="form-group">
            <label className="label">
              <span>Тип распределения</span>
              <select
                className="input"
                value={formData.connectionType || 'manifold'}
                onChange={(e) => handleChange('connectionType', e.target.value as ConnectionType)}
              >
                <option value="manifold">Коллекторное</option>
                <option value="tee">Тройниковое</option>
              </select>
            </label>
          </div>
          {/* Поле названия скрыто: имя генерируется автоматически и не редактируется */}

          {(!formData.connectionType || formData.connectionType === 'manifold') && (
          <div className="form-group">
            <label className="label">
              <span>Длина подводящих коллектора (м)</span>
              <input
                type="number"
                className="input"
                value={formData.loops}
                onChange={(e) => handleChange('loops', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.5"
                placeholder="20"
                required
              />
            </label>
          </div>
          )}

          {(!formData.connectionType || formData.connectionType === 'manifold') && (
          <div className="form-group">
            <label className="label">
              <span>Количество выходов коллектора</span>
              <input
                type="number"
                className="input"
                value={formData.outputs}
                onChange={(e) => handleChange('outputs', parseInt(e.target.value) || 1)}
                min="1"
                max="24"
                step="1"
                placeholder="8"
                required
              />
            </label>
          </div>
          )}

          <div className="form-group">
            <label className="label">
              <span>Способ прокладки</span>
              <select
                className="input"
                value={formData.layingType}
                onChange={(e) => handleChange('layingType', e.target.value as 'chase' | 'external' | 'ceiling' | 'floor')}
              >
                <option value="chase">В штробе</option>
                <option value="external">Наружная</option>
                <option value="ceiling">По потолку</option>
                <option value="floor">По полу</option>
              </select>
            </label>
          </div>

          {formData.connectionType !== 'tee' && (
            <div className="form-group">
              <label className="label">
                <span>Материал подводящих</span>
                <select
                  className="input"
                  value={formData.material}
                  onChange={(e) => handleChange('material', e.target.value as PipeMaterial)}
                >
                  <option value="PEX">PEX</option>
                  <option value="PEX-AL-PEX">PEX-AL-PEX</option>
                  <option value="PP">PP</option>
                  <option value="Cu">Медь</option>
                  <option value="Steel">Нержавеющая сталь</option>
                </select>
              </label>
            </div>
          )}

          {(!formData.connectionType || formData.connectionType === 'manifold') && (
          <div className="form-group">
            <label className="label">
              <span>Диаметр труб подводящих</span>
              <select
                className="input"
                value={formData.supplyDiameter}
                onChange={(e) => handleChange('supplyDiameter', e.target.value as CollectorSupplyDiameter)}
              >
                <option value="16">16 мм</option>
                <option value="20">20 мм</option>
                <option value="25">25 мм</option>
                <option value="32">32 мм</option>
              </select>
            </label>
          </div>
          )}

          {formData.connectionType === 'tee' && (
            <>
              <div className="form-group">
                <label className="label">
                  <span>Длина магистрали (м)</span>
                  <input
                    type="number"
                    className="input"
                    value={formData.teeMainLengthM || 0}
                    onChange={(e) => handleChange('teeMainLengthM', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                    placeholder="30"
                  />
                </label>
              </div>
              <div className="form-group">
                <label className="label">
                  <span>Материал магистрали</span>
                  <select
                    className="input"
                    value={formData.teeMainMaterial || 'PEX-AL-PEX'}
                    onChange={(e) => handleChange('teeMainMaterial', e.target.value as PipeMaterial)}
                  >
                    <option value="PEX">PEX</option>
                    <option value="PEX-AL-PEX">PEX-AL-PEX</option>
                    <option value="PP">PP</option>
                    <option value="Cu">Медь</option>
                    <option value="Steel">Нержавеющая сталь</option>
                  </select>
                </label>
              </div>
              <div className="form-group">
                <label className="label">
                  <span>Диаметр магистрали</span>
                  <select
                    className="input"
                    value={formData.teeMainDiameter || '25'}
                    onChange={(e) => handleChange('teeMainDiameter', e.target.value as CollectorSupplyDiameter)}
                  >
                    <option value="16">16 мм</option>
                    <option value="20">20 мм</option>
                    <option value="25">25 мм</option>
                    <option value="32">32 мм</option>
                  </select>
                </label>
              </div>
              <div className="form-group">
                <label className="label">
                  <span>Количество отводов</span>
                  <input
                    type="number"
                    className="input"
                    value={formData.teeBranchesCount || 0}
                    onChange={(e) => handleChange('teeBranchesCount', parseInt(e.target.value) || 0)}
                    min="0"
                    step="1"
                    placeholder="6"
                  />
                </label>
              </div>
            </>
          )}
        </div>

        {(!formData.connectionType || formData.connectionType === 'manifold') && (
          <div className="form-group">
            <h4>Опции</h4>
            <div className="toggle-group">
              <label className="toggle-option">
                <span>Насосная группа на коллекторе</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.hasPump}
                    onChange={(e) => handleChange('hasPump', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
              
              <label className="toggle-option">
                <span>Коллекторный шкаф</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.hasCabinet}
                    onChange={(e) => handleChange('hasCabinet', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
              
              {formData.hasCabinet && (
                <div className="cabinet-type-selector">
                  <label className="label">
                    <span>Тип шкафа</span>
                    <select
                      className="input"
                      value={formData.cabinetType || 'built-in'}
                      onChange={(e) => handleChange('cabinetType', e.target.value as 'built-in' | 'surface-mounted')}
                    >
                      <option value="built-in">Встроенный</option>
                      <option value="surface-mounted">Накладной</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button type="submit" className="btn btn-primary">
            {collector ? 'Сохранить изменения' : 'Создать распределение'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CollectorEditor;
