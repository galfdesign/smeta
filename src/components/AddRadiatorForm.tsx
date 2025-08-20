import React, { useState } from 'react';
import { RadiatorItem, SystemBlock, Connection, LayingCore, RadiatorType } from '../types';
import { uid } from '../utils/calculations';

interface AddRadiatorFormProps {
  section: SystemBlock;
  radiator?: RadiatorItem | null;
  prefill?: RadiatorItem | null; // используется только для предзаполнения при добавлении
  onAdd: (item: RadiatorItem) => void;
  onUpdate?: (updatedRadiator: RadiatorItem) => void;
  onCancel: () => void;
}

const AddRadiatorForm: React.FC<AddRadiatorFormProps> = ({ section, radiator, prefill, onAdd, onUpdate, onCancel }) => {
  const source = radiator ?? prefill ?? null;
  const [formData, setFormData] = useState<Omit<RadiatorItem, 'id'>>({
    room: source?.room || '',
    radiatorType: source?.radiatorType || 'panel',
    connection: source?.connection || 'bottom',
    supplyLenM: source?.supplyLenM || 20,
    laying: source?.laying || 'inherit',
    isHeavy: source?.isHeavy ?? false,

    thermostatAndBalanceValve: source?.thermostatAndBalanceValve ?? true,
    bypass: source?.bypass ?? false,
    wallConnection: source?.wallConnection ?? true,
    chromeTubes: source?.chromeTubes ?? false,
    preMountTubes: source?.preMountTubes ?? false,
    preMountTubesSide: source?.preMountTubesSide ?? false,
    bottomConnectionUnit: source?.bottomConnectionUnit ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.radiatorType) return;
    
    if (radiator && onUpdate) {
      // Редактирование существующего радиатора
      const updatedItem: RadiatorItem = {
        ...formData,
        id: radiator.id,
      };
      onUpdate(updatedItem);
    } else {
      // Добавление нового радиатора
      const newItem: RadiatorItem = {
        ...formData,
        id: uid(),
      };
      onAdd(newItem);
    }
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Если выбран внутрипольный конвектор, автоматически устанавливаем боковое подключение
      if (field === 'radiatorType' && value === 'infloor') {
        newData.connection = 'side';
        // Сбрасываем несовместимые опции
        newData.bottomConnectionUnit = false;
        newData.preMountTubes = false;
        newData.thermostatAndBalanceValve = false;
        newData.bypass = false;
        newData.preMountTubesSide = false;
        newData.wallConnection = false;
        newData.chromeTubes = false;
      }

      // Сброс несовместимых опций при смене типа подключения
      if (field === 'connection') {
        if (value === 'side') {
          newData.bottomConnectionUnit = false;
          newData.preMountTubes = false;
        } else if (value === 'bottom') {
          newData.thermostatAndBalanceValve = false;
          newData.bypass = false;
          newData.preMountTubesSide = false;
        }
      }
      
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="add-radiator-form">

      <div className="form-grid">


        <div className="form-group">
          <label className="label">
            <span>Тип радиатора</span>
            <select
              className="input"
              value={formData.radiatorType}
              onChange={(e) => handleChange('radiatorType', e.target.value as RadiatorType)}
              required
            >
              <option value="panel">Панельный</option>
              <option value="sectional">Секционный</option>
              <option value="tubular">Трубчатый</option>
              <option value="infloor">Внутрипольный конвектор</option>
            </select>
          </label>
        </div>

        <div className="form-group">
          <label className="label">
            <span>Подключение</span>
            <select
              className="input"
              value={formData.connection}
              onChange={(e) => handleChange('connection', e.target.value as Connection)}
              disabled={formData.radiatorType === 'infloor'}
            >
              <option value="bottom" disabled={formData.radiatorType === 'infloor'}>Нижнее</option>
              <option value="side">Боковое</option>
            </select>
          </label>
          {formData.radiatorType === 'infloor' && (
            <div className="form-note">
              Для внутрипольного конвектора доступно только боковое подключение
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="label">
            <span>Длина подводящих (м)</span>
            <input
              type="number"
              className="input"
              value={formData.supplyLenM}
              onChange={(e) => handleChange('supplyLenM', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.1"
            />
          </label>
        </div>

        <div className="form-group">
          <label className="label">
            <span>Укладка труб</span>
            <select
              className="input"
              value={formData.laying}
              onChange={(e) => handleChange('laying', e.target.value as LayingCore | 'inherit')}
            >
              <option value="inherit">По умолчанию ({section.defaultLaying === 'floor' ? 'По полу' : section.defaultLaying === 'chase' ? 'В штробе' : section.defaultLaying === 'ceiling' ? 'По потолку' : 'Открыто'})</option>
              <option value="floor">По полу</option>
              <option value="chase">В штробе</option>
              <option value="ceiling">По потолку</option>
              <option value="open">Открыто</option>
            </select>
          </label>
        </div>



        <div className="form-group checkbox-group">
          <h4>Опции</h4>
          <div className="toggle-group">

            
            {/* Опции только для нижнего подключения (скрыты для внутрипольного конвектора) */}
            {formData.radiatorType !== 'infloor' && formData.connection === 'bottom' && (
              <>
                <label className="toggle-option">
                  <span>Узел нижнего подключения</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.bottomConnectionUnit}
                      onChange={(e) => handleChange('bottomConnectionUnit', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Подключение из стены</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.wallConnection}
                      onChange={(e) => handleChange('wallConnection', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Подключение хромированными трубками</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.chromeTubes}
                      onChange={(e) => handleChange('chromeTubes', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Предварительный монтаж трубок подключения без радиатора</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.preMountTubes}
                      onChange={(e) => handleChange('preMountTubes', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </>
            )}
            
            {/* Опции только для бокового подключения */}
            {formData.connection === 'side' && formData.radiatorType !== 'infloor' && (
              <>
                <label className="toggle-option">
                  <span>Термостатический и балансировочный клапан</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.thermostatAndBalanceValve}
                      onChange={(e) => handleChange('thermostatAndBalanceValve', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Байпас</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.bypass}
                      onChange={(e) => handleChange('bypass', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Подключение из стены</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.wallConnection}
                      onChange={(e) => handleChange('wallConnection', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Подключение хромированными трубками</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.chromeTubes}
                      onChange={(e) => handleChange('chromeTubes', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
                
                <label className="toggle-option">
                  <span>Предварительный монтаж трубок подключения без радиатора</span>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={formData.preMountTubesSide}
                      onChange={(e) => handleChange('preMountTubesSide', e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                  </div>
                </label>
              </>
            )}

            {/* Перенесено в самый низ: вес */}
            <label className="toggle-option">
              <span>Вес радиатора более 20 кг</span>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.isHeavy || false}
                  onChange={(e) => handleChange('isHeavy', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>
        <button type="submit" className="btn btn-primary">
          {radiator ? 'Сохранить изменения' : 'Добавить радиатор'}
        </button>
      </div>
    </form>
  );
};

export default AddRadiatorForm;
