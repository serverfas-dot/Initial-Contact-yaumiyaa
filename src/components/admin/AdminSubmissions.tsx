import { useState, useEffect } from 'react';
import type { FormSection } from '../../lib/types';
import { fetchSubmissions, fetchSubmission, deleteSubmission, type Submission, type SubmissionSummary } from '../../lib/formSchema';
import { generateSubmissionImage, downloadAsPdf } from '../../lib/pdfGenerator';

interface Props {
  sections: FormSection[];
  allowDelete?: boolean;
}

interface PreviewState {
  sub: Submission;
  dataUrl: string | null;
  loading: boolean;
}

export default function AdminSubmissions({ sections, allowDelete = false }: Props) {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<SubmissionSummary | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);

  const [retryIn, setRetryIn] = useState(0);

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    setRetryIn(0);
    try {
      setSubmissions(await fetchSubmissions());
    } catch {
      setLoadError(true);
      setRetryIn(15);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (retryIn <= 0) return;
    const timer = setTimeout(() => {
      setRetryIn((n) => {
        if (n <= 1) {
          load();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryIn]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteSubmission(confirmDelete.id);
    setConfirmDelete(null);
    await load();
  };

  const handleView = async (sub: SubmissionSummary) => {
    setPreview({ sub: sub as Submission, dataUrl: null, loading: true });
    try {
      const fullSubmission = await fetchSubmission(sub.id);
      const dataUrl = await generateSubmissionImage(fullSubmission, sections);
      setPreview({ sub: fullSubmission, dataUrl, loading: false });
    } catch {
      setPreview(null);
    }
  };

  const handleDownload = async () => {
    if (!preview?.dataUrl) return;
    const date = new Date(preview.sub.submitted_at).toISOString().slice(0, 10);
    await downloadAsPdf(preview.dataUrl, `yaumiyya-${date}.pdf`);
  };

  const getFormNumber = (sub: SubmissionSummary) => String(sub.submission_number);

  const formatDate = (value: unknown): string | null => {
    if (typeof value !== 'string' || !value.trim()) return null;
    const dateValue = value.trim().slice(0, 10);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
      ? new Date(`${dateValue}T00:00:00`)
      : new Date(value);
    if (Number.isNaN(date.getTime())) return value.trim();
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getDateField = (sub: SubmissionSummary) => formatDate(sub.submitted_at) || '—';

  const getSubmitTime = (sub: SubmissionSummary) => {
    const d = new Date(sub.submitted_at);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>ހުށަހެޅުންތައް</h2>
        <span className="submission-count" dir="ltr">
          {loading
            ? 'ލޯޑްވަނީ...'
            : submissions.length > 0
              ? `#${submissions[submissions.length - 1].submission_number} – #${submissions[0].submission_number}`
              : '0 ރެކޯޑް'}
        </span>
      </div>
      <div className="admin-card-body">
        {loading && <p className="admin-empty">ލޯޑްވަނީ...</p>}
        {!loading && loadError && (
          <p className="admin-empty" style={{ color: 'var(--error-text)' }}>
            ސިސްޓަމް އާ ގުޅުން ނުލިބުނު. އަލުން ހޯދުމަށް މަސްހޭރި ކުރަނީ...
            {retryIn > 0 && <span dir="ltr"> ({retryIn}s)</span>}
            <br />
            <button className="btn-secondary" onClick={load} style={{ padding: '4px 12px', fontSize: 12, marginTop: 8 }}>
              އަލުން ކުރޭ
            </button>
          </p>
        )}
        {!loading && submissions.length === 0 && (
          <p className="admin-empty">ހުށަހެޅުންތަކެއް ނެތް</p>
        )}
        {!loading && submissions.length > 0 && (
          <div className="submissions-table">
            <div className="submissions-table-head">
              <span>ނަންބަރ</span>
              <span>ތާރީޚް</span>
              <span>ގަޑި</span>
              <span>ހުށަހެޅި ދުވަސް</span>
              <span></span>
            </div>
            {submissions.map((sub) => (
              <div key={sub.id} className="submissions-table-row">
                <span className="sub-name" dir="ltr">
                  <span className="sub-number" dir="ltr">#{sub.submission_number}</span>
                  {getFormNumber(sub)}
                </span>
                <span className="sub-date" dir="ltr">{getDateField(sub)}</span>
                <span className="sub-time" dir="ltr">{getSubmitTime(sub)}</span>
                <span className="sub-submitdate" dir="ltr">
                  {new Date(sub.submitted_at).toLocaleDateString('en-GB')}
                </span>
                <span className="sub-actions">
                  <button
                    className="btn-icon btn-view"
                    onClick={() => handleView(sub)}
                    title="ރިޕޯޓް ބަލާ"
                  >
                    ބަލާ
                  </button>
                  {allowDelete && (
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => setConfirmDelete(sub)}
                    >
                      ފޮހެ
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && (
        <div className="modal-overlay" onClick={() => setPreview(null)}>
          <div className="modal-box pdf-preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>ޔައުމިއްޔާ ރިޕޯޓް</h3>
              <button className="modal-close" onClick={() => setPreview(null)}>✕</button>
            </div>
            <div className="pdf-preview-body">
              {preview.loading && (
                <div className="pdf-preview-loading">
                  <div className="spinner" />
                  <p>ތައްޔާރު ކުރަނީ...</p>
                </div>
              )}
              {!preview.loading && preview.dataUrl && (
                <img
                  src={preview.dataUrl}
                  alt="ޔައުމިއްޔާ"
                  className="pdf-preview-img"
                />
              )}
            </div>
            <div className="pdf-preview-footer">
              <button className="btn-secondary" onClick={() => setPreview(null)}>ބަންދުކުރޭ</button>
              {!preview.loading && preview.dataUrl && (
                <button className="btn-primary" onClick={handleDownload}>
                  ޑައުންލޯޑް ކުރޭ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box modal-box--sm confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>ޔަގީންތަ؟</h3>
            <p>މި ހުށަހެޅުން ފޮހެލާނީތަ؟</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>ކެންސަލް</button>
              <button className="btn-danger" onClick={handleDelete}>ފޮހެލޭ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
