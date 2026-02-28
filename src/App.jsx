import { useState, useEffect } from 'react';
import { api } from './utils/api';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardApp from './pages/DashboardApp';

export default function App() {
  const [authState, setAuthState] = useState('loading');
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.getMe()
      .then((u) => { setUser(u); setAuthState('authenticated'); })
      .catch(() => setAuthState('login'));
  }, []);

  const handleLoginSuccess = (result) => {
    setUser(result.user);
    setAuthState('authenticated');
  };

  const handleRegisterSuccess = (result) => {
    setUser(result.user);
    setAuthState('authenticated');
  };

  const handleLogout = async () => {
    await api.logout().catch(() => {});
    setUser(null);
    setAuthState('login');
  };

  if (authState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0F0C08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4A574', fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22 }}>🔐 Loading...</div>
      </div>
    );
  }

  if (authState === 'login') {
    return <LoginPage onSuccess={handleLoginSuccess} onGoRegister={() => setAuthState('register')} />;
  }

  if (authState === 'register') {
    return <RegisterPage onSuccess={handleRegisterSuccess} onGoLogin={() => setAuthState('login')} />;
  }

  if (authState === 'authenticated' && user) {
    return <DashboardApp user={user} onLogout={handleLogout} onUserUpdate={setUser} />;
  }

  return null;
}
