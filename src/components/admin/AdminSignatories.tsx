import { useState, useEffect, useRef } from 'react';
import type { Signatory } from '../../lib/types';
import { fetchSignatories, createSignatory, updateSignatory, deleteSignatory } from '../../lib/formSchema';

export default function AdminSignatories() {
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modal, setModal] = useState<{ open: boolean; signatory: Signatory | null }>({ open: false, signatory: null });
  const [confirmDelete, setConfirmDelete] = useState<Signatory | null>(null);
  const [saveError, setSaveError] = useState('');

  const load = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setSignatories(await fetchSignatories());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (name: string, signatureData: string) => {
    setSaveError('');
    let error: string | null = null;

    if (modal.signatory) {
      const res = await updateSignatory(modal.signatory.id, { name, signature_data: signatureData });
      error = res.error;
    } else {
      const res = await createSignatory(name, signatureData, signatories.length + 1);
      error = res.error;
    }

    if (error) {
      setSaveError(error);
      return;
    }

    setModal({ open: false, signatory: null });
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteSignatory(confirmDelete.id);
    setConfirmDelete(null);
    await load();
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h2>ސިގްނޭޗަރ ލިސްޓް</h2>
        <button className="btn-add" onClick={() => { setSaveError(''); setModal({ open: true, signatory: null }); }}>
          + ސިގްނޭޗަރ
        </button>
      </div>
      <div className="admin-card-body">
        {loading && <p className="admin-empty">ލޯޑްވަނީ...</p>}
        {!loading && loadError && (
          <p className="admin-empty" style={{ color: 'var(--error-text)' }}>
            ލޯޑްވުމަށް ނުކުޅެދުނު.{' '}
            <button className="btn-secondary" onClick={load} style={{ padding: '4px 12px', fontSize: 12 }}>
              އަލުން ކުރޭ
            </button>
          </p>
        )}
        {!loading && signatories.length === 0 && (
          <p className="admin-empty">ސިގްނޭޗަރ ތަކެއް ނެތް. ފަސްޓް ސިގްނޭޗަރ ލާ!</p>
        )}
        <div className="signatories-grid">
          {signatories.map((sig) => (
            <div key={sig.id} className="signatory-card">
              <div className="signatory-sig-area">
                {sig.signature_data ? (
                  <img src={sig.signature_data} alt={sig.name} className="signatory-sig-img" />
                ) : (
                  <span className="signatory-sig-empty">ސިގްނޭޗަރ ނެތް</span>
                )}
              </div>
              <div className="signatory-name">{sig.name}</div>
              <div className="signatory-actions">
                <button className="btn-icon btn-edit" onClick={() => { setSaveError(''); setModal({ open: true, signatory: sig }); }}>ބަދަލުކުރޭ</button>
                <button className="btn-icon btn-delete" onClick={() => setConfirmDelete(sig)}>ފޮހެ</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {modal.open && (
        <SignatoryModal
          signatory={modal.signatory}
          saveError={saveError}
          onSave={handleSave}
          onClose={() => { setSaveError(''); setModal({ open: false, signatory: null }); }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-box modal-box--sm confirm-box" onClick={(e) => e.stopPropagation()}>
            <h3>ޔަގީންތަ؟</h3>
            <p>"{confirmDelete.name}" ފޮހެލާނީތަ؟</p>
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

interface ModalProps {
  signatory: Signatory | null;
  saveError: string;
  onSave: (name: string, signatureData: string) => void;
  onClose: () => void;
}

function SignatoryModal({ signatory, saveError, onSave, onClose }: ModalProps) {
  const [name, setName] = useState(signatory?.name || '');
  const [signatureData, setSignatureData] = useState(signatory?.signature_data || '');
  const [tab, setTab] = useState<'upload' | 'draw'>('upload');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab === 'draw') {
      setTimeout(() => initCanvas(), 50);
    }
  }, [tab]);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawing.current = true;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveFromCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSignatureData(canvas.toDataURL('image/png'));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400;
        const maxH = 200;
        let w = img.width;
        let h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > maxH) { w = Math.round(w * maxH / h); h = maxH; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        setSignatureData(canvas.toDataURL('image/png'));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    let finalSig = signatureData;
    if (tab === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) finalSig = canvas.toDataURL('image/png');
    }
    setSaving(true);
    await onSave(name.trim(), finalSig);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{signatory ? 'ސިގްނޭޗަރ ބަދަލުކުރޭ' : 'ސިގްނޭޗަރ އިތުރުކުރޭ'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {saveError && (
            <div className="alert alert-error" style={{ marginBottom: 16 }}>{saveError}</div>
          )}
          <div className="admin-group" style={{ marginBottom: 16 }}>
            <label>ނަން</label>
            <input
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ފުރިހަމަ ނަން"
              dir="rtl"
            />
          </div>

          <div className="admin-group">
            <label>ސިގްނޭޗަރ</label>
            <div className="sig-tabs">
              <button
                className={`sig-tab ${tab === 'upload' ? 'sig-tab--active' : ''}`}
                onClick={() => setTab('upload')}
                type="button"
              >
                ފޮޓޯ އަޕްލޯޑް
              </button>
              <button
                className={`sig-tab ${tab === 'draw' ? 'sig-tab--active' : ''}`}
                onClick={() => setTab('draw')}
                type="button"
              >
                ލިޔެ ރަސްމީ ކުރޭ
              </button>
            </div>

            {tab === 'upload' && (
              <div className="sig-upload-area">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="sig-file-label"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {signatureData ? 'ފޮޓޯ ބަދަލު ކޮށްލާ' : 'ފޮޓޯ ހިޔާރުކޮށްލާ'}
                </button>
                {signatureData && (
                  <div className="sig-preview-box">
                    <img src={signatureData} alt="signature preview" className="sig-preview-img" />
                    <button type="button" className="sig-clear-btn" onClick={() => setSignatureData('')}>✕ ފޮހެ</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'draw' && (
              <div className="sig-draw-area">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  className="sig-canvas"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
                <div className="sig-draw-actions">
                  <button type="button" className="btn-secondary" onClick={clearCanvas}>ފޮހެ</button>
                  <button type="button" className="btn-primary" onClick={saveFromCanvas}>ރައްކާ ކޮށްލޭ</button>
                </div>
                {signatureData && tab === 'draw' && (
                  <div className="sig-preview-box" style={{ marginTop: 8 }}>
                    <img src={signatureData} alt="saved" className="sig-preview-img" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="modal-actions" style={{ padding: '0 24px 24px' }}>
          <button className="btn-secondary" onClick={onClose}>ކެންސަލް</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? 'ރައްކާ ކުރަނީ...' : 'ރައްކާ ކުރޭ'}
          </button>
        </div>
      </div>
    </div>
  );
}
