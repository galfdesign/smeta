import React, { useState } from 'react';
import Modal from './Modal';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  getCalcTable?: () => { head: string[]; body: string[][]; title?: string } | null;
}

interface ExportSection {
  id: string;
  name: string;
  checked: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, getCalcTable }) => {
  const [exportType, setExportType] = useState<'client' | 'installer'>('client');
  const [sections, setSections] = useState<ExportSection[]>([
    { id: 'project-settings', name: 'Настройки проекта', checked: true },
    { id: 'floor-heating', name: 'Напольное отопление', checked: true },
    { id: 'radiators', name: 'Радиаторное отопление', checked: true },
    { id: 'sewage', name: 'Канализация', checked: true },
    { id: 'water', name: 'Водоснабжение', checked: true },
    { id: 'boiler', name: 'Котельная', checked: true },
    { id: 'automation', name: 'Автоматика', checked: true },
    { id: 'additional', name: 'Дополнительные работы', checked: true },
    { id: 'totals', name: 'Общие итоги', checked: true },
  ]);

  const handleSectionToggle = (sectionId: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, checked: !section.checked }
          : section
      )
    );
  };

  const handleSelectAll = () => {
    setSections(prev => prev.map(section => ({ ...section, checked: true })));
  };

  const handleDeselectAll = () => {
    setSections(prev => prev.map(section => ({ ...section, checked: false })));
  };

  const handleExport = async () => {
    try {
      // 1) Пробуем получить данные из колбэка
      let table = getCalcTable ? getCalcTable() : null;
      let head: string[] = [];
      let body: string[][] = [];

      // 2) Если колбэк не предоставлен или вернул null — парсим DOM
      if (!table) {
        const root = document.querySelector('.calculations-table-container .calculations-table') as HTMLElement | null;
        if (!root) {
          alert('Не найден блок "Детальный расчет". Откройте раздел с таблицей.');
          return;
        }
        const headerCells = Array.from(root.querySelectorAll('.table-header .header-cell')) as HTMLElement[];
        head = headerCells.map(h => h.innerText.trim());
        const rows = Array.from(root.querySelectorAll('.table-row')) as HTMLElement[];
        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('.cell')) as HTMLElement[];
          if (cells.length >= head.length) {
            const rowVals = cells.slice(0, head.length).map(c => c.innerText.replace(/\s+/g, ' ').trim());
            body.push(rowVals);
          }
        });
        if (!body.length) throw new Error('EMPTY_BODY');
      } else {
        head = table.head;
        body = table.body;
      }

      // 2) Подключаем встроенные шрифты pdfmake (Roboto) и пробуем Noto Sans, если доступен
      const vfsData = (pdfFonts as any)?.pdfMake?.vfs || (pdfFonts as any)?.vfs;
      if (vfsData) {
        (pdfMake as any).vfs = vfsData;
      } else {
        console.warn('pdfmake vfs not found, using built-in defaults');
      }

      const tryLoadFontToVfs = async (url: string, vfsName: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return false;
          const buf = await res.arrayBuffer();
          let binary = '';
          const bytes = new Uint8Array(buf);
          const chunk = 0x8000;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
          }
          (pdfMake as any).vfs[vfsName] = btoa(binary);
          return true;
        } catch {
          return false;
        }
      };

      let useNoto = false;
      const notoRegularLoaded = await tryLoadFontToVfs('/fonts/NotoSans-Regular.ttf', 'NotoSans-Regular.ttf');
      const notoBoldLoaded = await tryLoadFontToVfs('/fonts/NotoSans-Bold.ttf', 'NotoSans-Bold.ttf');
      if (notoRegularLoaded) {
        (pdfMake as any).fonts = {
          ...(pdfMake as any).fonts,
          NotoSans: {
            normal: 'NotoSans-Regular.ttf',
            bold: notoBoldLoaded ? 'NotoSans-Bold.ttf' : 'NotoSans-Regular.ttf',
          },
        };
        useNoto = true;
      }

      // 3) Собираем тело таблицы с выравниванием числовых колонок справа (последние 2 колонки)
      const numRightStart = Math.max(0, head.length - 2);
      const tableBody: any[] = [];
      // headerRow
      tableBody.push(head.map((h, idx) => ({ text: h, bold: true, alignment: idx >= numRightStart ? 'right' : 'left' })));
      // data rows
      body.forEach(r => {
        tableBody.push(r.map((val, idx) => ({ text: val, alignment: idx >= numRightStart ? 'right' : 'left' })));
      });

      // 4) Определяем относительные ширины колонок (последние 2 уже узкие под числа)
      const widths = head.map((_, idx) => (idx >= numRightStart ? 'auto' : '*'));

      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [14, 20, 14, 20],
        defaultStyle: { font: useNoto ? 'NotoSans' : undefined, fontSize: 9, color: '#141414' },
        content: [
          { text: 'Радиаторное отопление детальный расчет трудозатрат и стоимости', fontSize: 14, bold: true, margin: [0, 0, 0, 8] },
          {
            table: {
              headerRows: 1,
              widths,
              body: tableBody,
            },
            layout: {
              fillColor: (rowIndex: number, _node: any, _columnIndex: number) => {
                if (rowIndex === 0) return '#E6EBF5'; // header
                return rowIndex % 2 === 0 ? '#F8FAFD' : null; // zebra
              },
              hLineColor: '#DADFE8',
              vLineColor: '#EEF1F6',
              paddingTop: (rowIndex: number) => (rowIndex === 0 ? 6 : 4),
              paddingBottom: (rowIndex: number) => (rowIndex === 0 ? 6 : 4),
              paddingLeft: (_rowIndex: number, _node: any) => 4,
              paddingRight: (_rowIndex: number, _node: any) => 4,
            },
          },
        ],
      };

      if (!(pdfMake as any)?.createPdf) {
        throw new Error('pdfmake is not initialized');
      }
      (pdfMake as any).createPdf(docDefinition).download('detalny-raschet.pdf');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Не удалось сформировать PDF. Попробуйте ещё раз.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Экспорт в PDF">
      <div className="export-modal-content">
        {/* Переключатель типа экспорта */}
        <div className="export-type-selector">
          <h4>Тип документа</h4>
          <div className="type-toggle">
            <label className="toggle-option">
              <input
                type="radio"
                name="exportType"
                value="client"
                checked={exportType === 'client'}
                onChange={(e) => setExportType(e.target.value as 'client' | 'installer')}
              />
              <span className="toggle-label">Для клиента</span>
            </label>
            <label className="toggle-option">
              <input
                type="radio"
                name="exportType"
                value="installer"
                checked={exportType === 'installer'}
                onChange={(e) => setExportType(e.target.value as 'client' | 'installer')}
              />
              <span className="toggle-label">Для монтажника</span>
            </label>
          </div>
        </div>

        {/* Список разделов */}
        <div className="sections-selector">
          <div className="sections-header">
            <h4>Разделы для экспорта</h4>
            <div className="sections-actions">
              <button 
                type="button" 
                className="btn btn-small btn-secondary"
                onClick={handleSelectAll}
              >
                Выбрать все
              </button>
              <button 
                type="button" 
                className="btn btn-small btn-secondary"
                onClick={handleDeselectAll}
              >
                Снять выбор
              </button>
            </div>
          </div>
          
          <div className="sections-list">
            {sections.map(section => (
              <label key={section.id} className="section-checkbox">
                <input
                  type="checkbox"
                  checked={section.checked}
                  onChange={() => handleSectionToggle(section.id)}
                />
                <span className="section-name">{section.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="export-actions">
          <button type="button" className="btn" onClick={onClose}>
            Отмена
          </button>
          <button 
            type="button" 
            className="btn btn-primary"
            onClick={handleExport}
            disabled={!sections.some(section => section.checked)}
          >
            Сохранить PDF
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportModal;
