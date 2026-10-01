import { useState, useEffect } from 'react';
import type { FormSection } from '../../lib/types';

interface Props {
  section?: FormSection | null;
  nextOrder: number;
  onSave: (data: { label: string; sort_order: number; style: 'default' | 'signature' }) => void;
  onClose: () => void;
}

export default function AdminSectionModal({ section, nextOrder, onSave, onClose }: Props) {
  const [label, setLabel] = useState(section?.label || '');
  const [style, setStyle] = useState<'default' | 'signature'>(section?.style || 'default');
  const [sort_order, setSortOrder] = useState(section?.sort_order ?? nextOrder);

  useEffect(() => {
    setLabel(section?.label || '');
    setStyle(section?.style || 'default');
    setSortOrder(section?.sort_order ?? nextOrder);
  }, [section, nextOrder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ label, sort_order, style });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box--sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{section ? 'ސެކްޝަން އެޑިޓްކުރޭ' : 'ސެކްޝަން އިތުރުކުރޭ'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-group">
            <label>ސެކްޝަން ނަން</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} required className="input-field" placeholder="ސެކްޝަން ނަން ލިޔޭ..." />
          </div>
          <div className="modal-row">
            <div className="modal-group">
              <label>ސްޓައިލް</label>
              <select value={style} onChange={(e) => setStyle(e.target.value as 'default' | 'signature')} className="select-field">
                <option value="default">ޑިފޯލްޓް (ފެހި)</option>
                <option value="signature">ސިގްނޭޗަރ (ރަން)</option>
              </select>
            </div>
            <div className="modal-group">
              <label>ތަރުތީބު</label>
              <input type="number" value={sort_order} onChange={(e) => setSortOrder(parseInt(e.target.value))} className="input-field" min={1} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>ކެންސަލް</button>
            <button type="submit" className="btn-primary">{section ? 'ބަދަލުކުރޭ' : 'އިތުރުކުރޭ'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
