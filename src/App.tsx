import { useState } from 'react';
import YaumiyyaForm from './components/YaumiyyaForm';
import AdminDashboard from './components/admin/AdminDashboard';
import SuperAdminPanel from './components/admin/SuperAdminPanel';
import AdminLogin from './components/admin/AdminLogin';
import './App.css';

type View = 'form' | 'admin-login' | 'admin' | 'superadmin';

export default function App() {
  const [view, setView] = useState<View>('form');
  const [formKey, setFormKey] = useState(0);

  const handleLogin = (role: 'admin' | 'superadmin') => {
    setView(role === 'superadmin' ? 'superadmin' : 'admin');
  };

  const handleExitAdmin = () => {
    setView('form');
    setFormKey((k) => k + 1);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setView('form');
    setFormKey((k) => k + 1);
  };

  if (view === 'admin-login') {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (view === 'admin') {
    return <AdminDashboard onExit={handleExitAdmin} onLogout={handleLogout} />;
  }

  if (view === 'superadmin') {
    return <SuperAdminPanel onExit={handleExitAdmin} onLogout={handleLogout} />;
  }

  return <YaumiyyaForm key={formKey} onAdminClick={() => setView('admin-login')} />;
}
