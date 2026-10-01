import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { fetchFormConfig, fetchSectionsWithFields } from '../lib/formSchema';
import type { FormConfig, FormSection, FormField } from '../lib/types';
import SignatureSelect from './SignatureSelect';

const LOGO_URL = `${import.meta.env.BASE_URL}png.png`;

const HAAZIRU_VI_SECTION_ID = 'a0b26d7d-345e-4d34-92a0-804cbace8bcd';

interface MultiSigEntry {
  name: string;
  sigData: string;
}

interface Props {
  onAdminClick: () => void;
}

export default function YaumiyyaForm({ onAdminClick }: Props) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [signatureData, setSignatureData] = useState<Record<string, string>>({});
  const [multiSigEntries, setMultiSigEntries] = useState<Record<string, MultiSigEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cfg, secs] = await Promise.all([fetchFormConfig(), fetchSectionsWithFields()]);
        setConfig(cfg);
        setSections(secs);
      const initial: Record<string, string | number> = {};
      const initialMultiSig: Record<string, MultiSigEntry[]> = {};
      secs.forEach((s) => (s.fields || []).forEach((f) => {
        if (s.id === HAAZIRU_VI_SECTION_ID && f.field_type === 'signature-select') {
          initialMultiSig[f.field_key] = [{ name: '', sigData: '' }];
        } else {
          initial[f.field_key] = f.field_type === 'number' ? 0 : '';
        }
      }));
      setFormData(initial);
      setMultiSigEntries(initialMultiSig);
      setLoading(false);
      } catch {
        setLoadError(true);
        setLoading(false);
      }
    })();
  }, []);

  const isDhivehi = (text: string) => /[\u0780-\u07BF]/.test(text);

  const getTextDir = (value: string): 'rtl' | 'ltr' => {
    if (!value) return 'rtl';
    return isDhivehi(value) ? 'rtl' : 'ltr';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: FormField) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [field.field_key]: field.field_type === 'number' ? (parseInt(value) || 0) : value,
    }));
  };

  const handleSignatureChange = (fieldKey: string, name: string, sigData: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: name }));
    setSignatureData((prev) => ({ ...prev, [fieldKey]: sigData }));
  };

  const handleMultiSigChange = (fieldKey: string, index: number, name: string, sigData: string) => {
    setMultiSigEntries((prev) => {
      const updated = [...(prev[fieldKey] || [])];
      updated[index] = { name, sigData };
      return { ...prev, [fieldKey]: updated };
    });
  };

  const addMultiSigEntry = (fieldKey: string) => {
    setMultiSigEntries((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] || []), { name: '', sigData: '' }],
    }));
  };

  const removeMultiSigEntry = (fieldKey: string, index: number) => {
    setMultiSigEntries((prev) => {
      const updated = [...(prev[fieldKey] || [])];
      updated.splice(index, 1);
      return { ...prev, [fieldKey]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const allFields = sections.flatMap((s) => s.fields || []);
    const missing = allFields.find(
      (f) => f.required &&
        !multiSigEntries[f.field_key] &&
        (formData[f.field_key] === '' || formData[f.field_key] === null || formData[f.field_key] === undefined)
    );
    if (missing) {
      setError(`"${missing.label}" ފުރިހަމަ ކޮށްލާ.`);
      return;
    }

    const combinedFormData = {
      ...formData,
      ...Object.fromEntries(
        Object.entries(multiSigEntries).map(([key, entries]) => [key, entries.map((e) => e.name)])
      ),
    };
    const combinedSigData = {
      ...signatureData,
      ...Object.fromEntries(
        Object.entries(multiSigEntries).map(([key, entries]) => [key, entries.map((e) => e.sigData)])
      ),
    };

    setSubmitting(true);
    const { error: err } = await supabase.from('submissions').insert([{
      form_data: combinedFormData,
      signature_data: combinedSigData,
    }]);
    if (err) {
      setError('ފޮނުވުމަށް ނުކުޅެދުނު. އަލުން ތަހައްދަލު ކޮށްލާ.');
    } else {
      setSuccess(true);
      const reset: Record<string, string | number> = {};
      const resetMultiSig: Record<string, MultiSigEntry[]> = {};
      sections.forEach((s) => (s.fields || []).forEach((f) => {
        if (s.id === HAAZIRU_VI_SECTION_ID && f.field_type === 'signature-select') {
          resetMultiSig[f.field_key] = [{ name: '', sigData: '' }];
        } else {
          reset[f.field_key] = f.field_type === 'number' ? 0 : '';
        }
      }));
      setFormData(reset);
      setSignatureData({});
      setMultiSigEntries(resetMultiSig);
    }
    setSubmitting(false);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.field_key] ?? '';
    const common = {
      name: field.field_key,
      required: field.required,
    };

    if (field.field_type === 'signature-select') {
      return (
        <div className="sig-select-full">
          <SignatureSelect
            fieldKey={field.field_key}
            label={field.label}
            required={field.required}
            value={value as string}
            onChange={(name, sigData) => handleSignatureChange(field.field_key, name, sigData)}
          />
        </div>
      );
    }

    if (field.field_type === 'select') {
      const opts = field.options.split(',').map((o) => o.trim()).filter(Boolean);
      return (
        <select {...common} value={value as string} onChange={(e) => handleChange(e, field)} className="select-field">
          <option value="">{field.placeholder || 'ހިޔާރުކޮށްލާ...'}</option>
          {opts.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    if (field.field_type === 'textarea') {
      return (
        <textarea
          {...common}
          value={value as string}
          onChange={(e) => handleChange(e, field)}
          placeholder={field.placeholder}
          rows={5}
          className="textarea-field"
          dir={getTextDir(value as string)}
        />
      );
    }

    if (field.field_type === 'date') {
      return (
        <input
          {...common}
          type="date"
          value={value as string}
          onChange={(e) => handleChange(e, field)}
          className="input-field date-field"
          dir="ltr"
        />
      );
    }

    const isLtrField = field.field_type === 'number' || field.field_type === 'time';
    return (
      <input
        {...common}
        type={field.field_type}
        value={value as string}
        onChange={(e) => handleChange(e, field)}
        placeholder={field.placeholder}
        className="input-field"
        min={field.field_type === 'number' ? 0 : undefined}
        dir={isLtrField ? 'ltr' : getTextDir(value as string)}
      />
    );
  };

  const renderMultiSigSection = (section: FormSection) => {
    const fields = (section.fields || []).filter((f) => f.field_type === 'signature-select');
    if (fields.length === 0) return null;
    const field = fields[0];
    const entries = multiSigEntries[field.field_key] || [];

    return (
      <div key={section.id} className="section signature-section">
        <h2 className="section-title">{section.label}</h2>
        <div className="multi-sig-body">
          {entries.map((entry, idx) => (
            <div key={idx} className="multi-sig-row">
              <div className="multi-sig-index">{idx + 1}</div>
              <div className="multi-sig-select">
                <SignatureSelect
                  fieldKey={`${field.field_key}_${idx}`}
                  label={field.label}
                  required={idx === 0 && field.required}
                  value={entry.name}
                  onChange={(name, sigData) => handleMultiSigChange(field.field_key, idx, name, sigData)}
                />
              </div>
              {entries.length > 1 && (
                <button
                  type="button"
                  className="multi-sig-remove"
                  onClick={() => removeMultiSigEntry(field.field_key, idx)}
                  title="ނަގާ"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="multi-sig-add-row">
            <button
              type="button"
              className="multi-sig-add-btn"
              onClick={() => addMultiSigEntry(field.field_key)}
            >
              + އިތުރު މީހަކު އިހުތިޔާރު ކުރައްވާ
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (section: FormSection) => {
    if (section.id === HAAZIRU_VI_SECTION_ID) {
      return renderMultiSigSection(section);
    }

    const fields = section.fields || [];
    const rows: FormField[][] = [];
    let i = 0;
    while (i < fields.length) {
      const f = fields[i];
      if (f.full_width) {
        rows.push([f]);
        i++;
      } else {
        const next = fields[i + 1];
        if (next && !next.full_width) {
          rows.push([f, next]);
          i += 2;
        } else {
          rows.push([f]);
          i++;
        }
      }
    }

    return (
      <div key={section.id} className={`section ${section.style === 'signature' ? 'signature-section' : ''}`}>
        <h2 className="section-title">{section.label}</h2>
        {rows.map((row, ri) => {
          if (row.length === 2) {
            return (
              <div key={ri} className="form-row">
                {row.map((field) => (
                  <div key={field.id} className="form-group">
                    <label>{field.label}</label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            );
          }
          const field = row[0];
          return (
            <div key={ri} className={`form-group ${field.full_width ? 'full-width' : ''}`}>
              {field.field_type !== 'signature-select' && <label>{field.label}</label>}
              {renderField(field)}
            </div>
          );
        })}
      </div>
    );
  };

  if (loadError) {
    return (
      <div className="form-wrapper">
        <div className="form-card">
          <div className="form-header">
            <div className="logo-circle">
              <img src={LOGO_URL} alt="Logo" className="logo-img" />
            </div>
            <h1>{config?.title || 'ޔައުމިއްޔާ ސިސްޓަމް'}</h1>
            <p className="subtitle">{config?.subtitle || 'Meeting Minutes System'}</p>
          </div>
          <div className="alert alert-error" style={{ margin: '20px 32px' }}>
            ސިސްޓަމް ލޯޑްވުމަށް ނުކުޅެދުނު. ޕޭޖް ރިފްރެޝް ކޮށްލާ.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="form-wrapper">
        <div className="admin-loading">
          <div className="spinner" />
          <p>ލޯޑްވަނީ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-wrapper">
      <div className="form-card">
        <div className="form-header">
          <div className="logo-circle">
            <img src={LOGO_URL} alt="Faafu Atoll School" className="logo-img" />
          </div>
          <h1>{config?.title || 'ޔައުމިއްޔާ ސިސްޓަމް'}</h1>
          <p className="subtitle">{config?.subtitle || 'Meeting Minutes System'}</p>
        </div>

        {success && (
          <div className="alert alert-success">ޔައުމިއްޔާ ކާމިޔާބުކަމާއެކު ރައްކާ ކުރެވިއްޖެ</div>
        )}
        {error && (
          <div className="alert alert-error">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="form" noValidate>
          {sections.map((section) => renderSection(section))}
          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'ފޮނުވަނީ...' : (config?.submit_label || 'ޔައުމިއްޔާ ހުށަހަޅާ')}
          </button>
        </form>
      </div>
      <div className="form-footer">
        <button className="admin-link-btn" onClick={onAdminClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          Admin
        </button>
      </div>
    </div>
  );
}
