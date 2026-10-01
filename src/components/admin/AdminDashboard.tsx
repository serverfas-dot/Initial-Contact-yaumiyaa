import { useState, useEffect, useCallback } from 'react';
import { fetchSectionsWithFields } from '../../lib/formSchema';
import type { FormSection } from '../../lib/types';
import AdminSubmissions from './AdminSubmissions';

interface Props {
  onExit: () => void;
  onLogout: () => void;
}

export default function AdminDashboard({ onExit, onLogout }: Props) {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [retryIn, setRetryIn] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    setRetryIn(0);
    try {
      setSections(await fetchSectionsWithFields());
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
        if (n <= 1) {
          load();
          return 0;
        }
        return n - 1;
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [retryIn, load]);

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
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-logo admin-logo--blue">📋</div>
          <div>
            <h1 className="admin-title">ހުށަހެޅުންތަކުގެ ޑޭޝްބޯޑް</h1>
            <p className="admin-subtitle">Submissions Dashboard</p>
          </div>
        </div>
        <div className="admin-topbar-right">
          <button className="btn-exit" onClick={onExit}>ފޯމަށް ދޭ ←</button>
          <button className="btn-logout" onClick={onLogout}>ލޮގްއައުޓް</button>
        </div>
      </div>

      <div className="admin-content">
        <AdminSubmissions sections={sections} allowDelete={false} />
      </div>
    </div>
  );
}
