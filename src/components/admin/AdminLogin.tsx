import { useState } from 'react';
import { authenticateAdmin } from '../../lib/supabase';

interface Props {
  onLogin: (role: 'admin' | 'superadmin') => void;
}

export default function AdminLogin({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const role = await authenticateAdmin(username.trim(), password);
      if (!role) {
        setError('ޔޫޒަރ ނޭމް ނުވަތަ ޕާސްވޯޑް ގޯސް');
        return;
      }
      sessionStorage.setItem('admin_auth', role);
      onLogin(role);
    } catch {
      setError('ޔޫޒަރ ނޭމް ނުވަތަ ޕާސްވޯޑް ގޯސް');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-circle login-logo-circle">
            <img src={`${import.meta.env.BASE_URL}png.png`} alt="Faafu Atoll School" className="logo-img" />
          </div>
          <h1>އެޑްމިން ޕެނަލް</h1>
          <p className="subtitle">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="login-group">
            <label>ޔޫޒަރ ނޭމް</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="username"
              dir="ltr"
              required
              autoFocus
            />
          </div>

          <div className="login-group">
            <label>ޕާސްވޯޑް</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              dir="ltr"
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'ވެރިފައިކުރަނީ...' : 'ލޮގިން ވޭ'}
          </button>
        </form>
      </div>
    </div>
  );
}
