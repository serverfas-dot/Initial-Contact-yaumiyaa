import { useState, useEffect } from 'react';
import type { FormField } from '../../lib/types';

interface Props {
  sectionId: string;
  field?: FormField | null;
  nextOrder: number;
  onSave: (field: Omit<FormField, 'id' | 'created_at'>) => void;
  onClose: () => void;
}

const defaultField = (sectionId: string, sort_order: number): Omit<FormField, 'id' | 'created_at'> => ({
  section_id: sectionId,
  field_key: '',
  label: '',
  field_type: 'text',
  placeholder: '',
  options: '',
  required: true,
  full_width: false,
  sort_order,
});

export default function AdminFieldModal({ sectionId, field, nextOrder, onSave, onClose }: Props) {
  const [form, setForm] = useState<Omit<FormField, 'id' | 'created_at'>>(
    field
      ? { ...field }
      : defaultField(sectionId, nextOrder)
  );

  useEffect(() => {
    if (field) setForm({ ...field });
    else setForm(defaultField(sectionId, nextOrder));
  }, [field, sectionId, nextOrder]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{field ? 'ފީލްޑް އެޑިޓްކުރޭ' : 'ފީލްޑް އިތުރުކުރޭ'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-row">
            <div className="modal-group">
              <label>ފީލްޑް ލޭބަލް</label>
              <input name="label" value={form.label} onChange={handleChange} required className="input-field" placeholder="ލޭބަލް..." />
            </div>
            <div className="modal-group">
              <label>ފީލްޑް ކީ (field_key)</label>
              <input name="field_key" value={form.field_key} onChange={handleChange} required className="input-field" placeholder="snake_case_key" dir="ltr" />
            </div>
          </div>
          <div className="modal-row">
            <div className="modal-group">
              <label>ފީލްޑް ބާވަތް</label>
              <select name="field_type" value={form.field_type} onChange={handleChange} className="select-field">
                <option value="text">text</option>
                <option value="number">number</option>
                <option value="date">date</option>
                <option value="time">time</option>
                <option value="textarea">textarea</option>
                <option value="select">select</option>
                <option value="signature-select">signature-select</option>
              </select>
            </div>
            <div className="modal-group">
              <label>ތަރުތީބު</label>
              <input name="sort_order" type="number" value={form.sort_order} onChange={handleChange} className="input-field" min={1} />
            </div>
          </div>
          <div className="modal-group">
            <label>ޕްލޭސްހޯލްޑަރ</label>
            <input name="placeholder" value={form.placeholder} onChange={handleChange} className="input-field" placeholder="ޕްލޭސްހޯލްޑަރ ލިޔޭ..." />
          </div>
          {form.field_type === 'select' && (
            <div className="modal-group">
              <label>ހިޔާރަތްތައް (ކޮމާ ވަކިކޮށް)</label>
              <input name="options" value={form.options} onChange={handleChange} className="input-field" placeholder="ހިޔާރަތް1,ހިޔާރަތް2" dir="rtl" />
            </div>
          )}
          <div className="modal-checks">
            <label className="check-label">
              <input type="checkbox" name="required" checked={form.required} onChange={handleChange} />
              ލާޒިމް ފީލްޑް
            </label>
            <label className="check-label">
              <input type="checkbox" name="full_width" checked={form.full_width} onChange={handleChange} />
              ފުރިހަމަ ވިޑްތު
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>ކެންސަލް</button>
            <button type="submit" className="btn-primary">{field ? 'ބަދަލުކުރޭ' : 'އިތުރުކުރޭ'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
