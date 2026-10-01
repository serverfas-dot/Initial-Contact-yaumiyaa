import { useState, useEffect, useCallback, useRef } from 'react';
import type { FormConfig, FormSection, FormField } from '../../lib/types';
import {
  fetchFormConfig,
  updateFormConfig,
  fetchSectionsWithFields,
  createSection,
  updateSection,
  deleteSection,
  createField,
  updateField,
  deleteField,
} from '../../lib/formSchema';
import { exportBackup, downloadBackup, restoreBackup, type BackupData } from '../../lib/backup';
import AdminSectionModal from './AdminSectionModal';
import AdminFieldModal from './AdminFieldModal';
import AdminSignatories from './AdminSignatories';
import AdminSubmissions from './AdminSubmissions';

interface Props {
  onExit: () => void;
  onLogout: () => void;
}

type Tab = 'submissions' | 'form' | 'signatories' | 'backup';

export default function SuperAdminPanel({ onExit, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('submissions');
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [configDirty, setConfigDirty] = useState(false);
  const [backupStatus, setBackupStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sectionModal, setSectionModal] = useState<{ open: boolean; section: FormSection | null }>({ open: false, section: null });
  const [fieldModal, setFieldModal] = useState<{ open: boolean; sectionId: string; field: FormField | null }>({ open: false, sectionId: '', field: null });
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'section' | 'field'; id: string; label: string } | null>(null);

  const [retryIn, setRetryIn] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setRetryIn(0);
    try {
      const [cfg, secs] = await Promise.all([fetchFormConfig(), fetchSectionsWithFields()]);
      setConfig(cfg);
      setSections(secs);
    } catch {
      setLoadError(true);
      setRetryIn(15);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setTimeout(() => {
      setRetryIn((n) => {
        if (n <= 1) { load(); return 0; }
        return n - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryIn, load]);

  const handleConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    setConfig({ ...config, [e.target.name]: e.target.value });
    setConfigDirty(true);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    setSaving(true);
    await updateFormConfig(config.id, {
      title: config.title,
      subtitle: config.subtitle,
      logo_text: config.logo_text,
      submit_label: config.submit_label,
    });
    setSaving(false);
    setConfigDirty(false);
  };

  const handleSaveSection = async (data: { label: string; sort_order: number; style: 'default' | 'signature' }) => {
    if (sectionModal.section) {
      await updateSection(sectionModal.section.id, data);
    } else {
      await createSection(data.label, data.sort_order, data.style);
    }
    setSectionModal({ open: false, section: null });
    await load();
  };

  const handleSaveField = async (fieldData: Omit<FormField, 'id' | 'created_at'>) => {
    if (fieldModal.field) {
      await updateField(fieldModal.field.id, fieldData);
    } else {
      await createField(fieldData);
    }
    setFieldModal({ open: false, sectionId: '', field: null });
    await load();
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'section') await deleteSection(confirmDelete.id);
    else await deleteField(confirmDelete.id);
    setConfirmDelete(null);
    await load();
  };

  const handleExport = async () => {
    setExporting(true);
    setBackupStatus(null);
    try {
      const data = await exportBackup();
      downloadBackup(data);
      setBackupStatus({ type: 'success', msg: 'ބެކަޕް ޑައުންލޯޑް ކުރެވިއްޖެ.' });
    } catch {
      setBackupStatus({ type: 'error', msg: 'ބެކަޕް ޑައުންލޯޑް ނުކުރެވުނު.' });
    }
    setExporting(false);
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setRestoring(true);
      setBackupStatus(null);
      try {
        const parsed: BackupData = JSON.parse(ev.target?.result as string);
        const result = await restoreBackup(parsed);
        if (result.success) {
          setBackupStatus({ type: 'success', msg: 'ރިސްޓޯ ކުރެވިއްޖެ. ޕޭޖް ލޯޑް ކުރަނީ...' });
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setBackupStatus({ type: 'error', msg: `ރިސްޓޯ ނުކުރެވުނު: ${result.error}` });
        }
      } catch {
        setBackupStatus({ type: 'error', msg: 'ފައިލް ރަނގަޅެއް ނޫން.' });
      }
      setRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner" />
        <p>ލޯޑްވަނީ...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-loading">
        <p style={{ color: 'var(--error-text)', textAlign: 'center' }}>
          ސިސްޓަމް އާ ގުޅުން ނުލިބުނު. އަލުން ހޯދުމަށް މަސްހޭރި ކުރަނީ...
          {retryIn > 0 && <span dir="ltr"> ({retryIn}s)</span>}
        </p>
        <button className="btn-primary" onClick={load} style={{ marginTop: 12 }}>އަލުން ލޯޑްކުރޭ</button>
        <button className="btn-secondary" onClick={onExit} style={{ marginTop: 8 }}>ފޯމަށް ދޭ</button>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-topbar admin-topbar--super">
        <div className="admin-topbar-left">
          <div className="admin-logo">★</div>
          <div>
            <h1 className="admin-title">ސުޕަ އެޑްމިން</h1>
            <p className="admin-subtitle">Super Admin Panel</p>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="btn-exit" onClick={onExit}>ފޯމަށް ދޭ ←</button>
          <button className="btn-logout" onClick={onLogout}>ލޮގްއައުޓް</button>
        </div>
      </div>

      <div className="super-tabs">
        {(['submissions', 'form', 'signatories', 'backup'] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            submissions: 'ހުށަހެޅުންތައް',
            form: 'ފޯމް',
            signatories: 'ސިގްނޭޗަރ',
            backup: 'ބެކަޕް',
          };
          return (
            <button
              key={tab}
              className={`super-tab ${activeTab === tab ? 'super-tab--active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      <div className="admin-content">

        {activeTab === 'submissions' && (
          <AdminSubmissions sections={sections} allowDelete={true} />
        )}

        {activeTab === 'form' && (
          <>
            <div className="admin-card">
              <div className="admin-card-header">
                <h2>ފޯމް ހެޑިން</h2>
              </div>
              <div className="admin-card-body">
                {config && (
                  <>
                    <div className="admin-row">
                      <div className="admin-group">
                        <label>ލޯގޯ ލިޔުން</label>
                        <input name="logo_text" value={config.logo_text} onChange={handleConfigChange} className="input-field" />
                      </div>
                      <div className="admin-group">
                        <label>ފޯމް ސުރުޚީ</label>
                        <input name="title" value={config.title} onChange={handleConfigChange} className="input-field" />
                      </div>
                    </div>
                    <div className="admin-row">
                      <div className="admin-group">
                        <label>ސަބް ޓައިޓަލް</label>
                        <input name="subtitle" value={config.subtitle} onChange={handleConfigChange} className="input-field" dir="ltr" />
                      </div>
                      <div className="admin-group">
                        <label>ސަބްމިޓް ބަޓަން ލިޔުން</label>
                        <input name="submit_label" value={config.submit_label} onChange={handleConfigChange} className="input-field" />
                      </div>
                    </div>
                    {configDirty && (
                      <div className="admin-save-row">
                        <button className="btn-primary" onClick={handleSaveConfig} disabled={saving}>
                          {saving ? 'ރައްކާ ކުރަނީ...' : 'ރައްކާ ކުރޭ'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h2>ސެކްޝަންތައް</h2>
                <button className="btn-add" onClick={() => setSectionModal({ open: true, section: null })}>
                  + ސެކްޝަން
                </button>
              </div>
              <div className="admin-card-body">
                {sections.length === 0 && <p className="admin-empty">ސެކްޝަންތަކެއް ނެތް</p>}
                {sections.map((section) => (
                  <div key={section.id} className={`admin-section-block ${section.style === 'signature' ? 'admin-section-block--signature' : ''}`}>
                    <div className="admin-section-header">
                      <div className="admin-section-meta">
                        <span className="admin-section-order">#{section.sort_order}</span>
                        <span className="admin-section-label">{section.label}</span>
                        <span className={`admin-section-badge ${section.style === 'signature' ? 'badge--gold' : 'badge--green'}`}>
                          {section.style === 'signature' ? 'ސިގްނޭޗަރ' : 'ޑިފޯލްޓް'}
                        </span>
                      </div>
                      <div className="admin-section-actions">
                        <button className="btn-icon btn-edit" onClick={() => setSectionModal({ open: true, section })}>ބަދަލުކުރޭ</button>
                        <button className="btn-icon btn-delete" onClick={() => setConfirmDelete({ type: 'section', id: section.id, label: section.label })}>ފޮހެލޭ</button>
                      </div>
                    </div>

                    <div className="admin-fields-table">
                      <div className="fields-table-head">
                        <span>ލޭބަލް</span>
                        <span>ކީ</span>
                        <span>ބާވަތް</span>
                        <span>ފުލް</span>
                        <span>ލާޒިމް</span>
                        <span></span>
                      </div>
                      {(!section.fields || section.fields.length === 0) && (
                        <p className="admin-empty admin-empty--fields">ފީލްޑްތަކެއް ނެތް</p>
                      )}
                      {(section.fields || []).map((field) => (
                        <div key={field.id} className="fields-table-row">
                          <span className="field-label">{field.label}</span>
                          <span className="field-key" dir="ltr">{field.field_key}</span>
                          <span className="field-type field-type-badge">{field.field_type}</span>
                          <span className={`field-bool ${field.full_width ? 'bool-yes' : 'bool-no'}`}>{field.full_width ? '✓' : '—'}</span>
                          <span className={`field-bool ${field.required ? 'bool-yes' : 'bool-no'}`}>{field.required ? '✓' : '—'}</span>
                          <span className="field-actions">
                            <button className="btn-icon btn-edit" onClick={() => setFieldModal({ open: true, sectionId: section.id, field })}>ބަދަލުކުރޭ</button>
                            <button className="btn-icon btn-delete" onClick={() => setConfirmDelete({ type: 'field', id: field.id, label: field.label })}>ފޮހެ</button>
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="admin-add-field-row">
                      <button
                        className="btn-add-field"
                        onClick={() => setFieldModal({ open: true, sectionId: section.id, field: null })}
                      >
                        + ފީލްޑް އިތުރުކުރޭ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === 'signatories' && <AdminSignatories />}

        {activeTab === 'backup' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2>ބެކަޕް އަދި ރިސްޓޯ</h2>
            </div>
            <div className="admin-card-body">
              {backupStatus && (
                <div className={`alert ${backupStatus.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                  {backupStatus.msg}
                </div>
              )}

              <div className="backup-section">
                <div className="backup-block">
                  <div className="backup-block-icon">⬇</div>
                  <div className="backup-block-content">
                    <h3>ބެކަޕް ޑައުންލޯޑް</h3>
                    <p>ހުރިހާ ހުށަހެޅުންތަކާ، ފޯމް ސެޓިންތަކާ، ސިގްނޭޗަރ ތަކެއް JSON ފައިލެއްގެ ގޮތުގައި ޑައުންލޯޑް ކޮށްލޭ.</p>
                    <button
                      className="btn-primary backup-btn"
                      onClick={handleExport}
                      disabled={exporting}
                    >
                      {exporting ? 'ތައްޔާރު ކުރަނީ...' : 'ބެކަޕް ޑައުންލޯޑް ކުރޭ'}
                    </button>
                  </div>
                </div>

                <div className="backup-divider" />

                <div className="backup-block">
                  <div className="backup-block-icon">⬆</div>
                  <div className="backup-block-content">
                    <h3>ބެކަޕް ރިސްޓޯ</h3>
                    <p className="backup-warning">ރިސްޓޯ ކުރުމުން މިހާރު ހުރި ސެކްޝަންތަކާ، ފީލްޑްތަކާ، ސިގްނޭޗަރ ތައް ފޮހެވޭ. ހުށަހެޅުންތައް ދެން ހިމަނެވޭ.</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreFile}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn-danger backup-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={restoring}
                    >
                      {restoring ? 'ރިސްޓޯ ކުރަނީ...' : 'ބެކަޕް ފައިލް ހިޔާރު ކުރޭ'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {sectionModal.open && (
        <AdminSectionModal
          section={sectionModal.section}
          nextOrder={sections.length + 1}
          onSave={handleSaveSection}
          onClose={() => setSectionModal({ open: false, section: null })}
        />
      )}

      {fieldModal.open && (
        <AdminFieldModal
          sectionId={fieldModal.sectionId}
          field={fieldModal.field}
          nextOrder={(sections.find(s => s.id === fieldModal.sectionId)?.fields?.length || 0) + 1}
          onSave={handleSaveField}
          onClose={() => setFieldModal({ open: false, sectionId: '', field: null })}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box modal-box--sm confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>ޔަގީންތަ؟</h3>
            <p>"{confirmDelete.label}" ފޮހެލާނީތަ؟ މި ކަމެއް އަނބުރާ ގެނެވޭ ނުގެންދެ.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>ކެންސަލް</button>
              <button className="btn-danger" onClick={handleConfirmDelete}>ފޮހެލޭ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
