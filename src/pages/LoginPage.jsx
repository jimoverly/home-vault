import { useState } from 'react';
import { api } from '../utils/api';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#151310', border: '1px solid #2A2520',
  borderRadius: 8, color: '#E0D6C8', fontSize: 14, fontFamily: "'DM Sans', sans-serif",
  outline: 'none', boxSizing: 'border-box',
};

export default function LoginPage({ onSuccess, onGoRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) return;
    setError(''); setLoading(true);
    try {
      const result = await api.login({ username: username.trim(), password });
      onSuccess(result);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0C08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 'min(420px, 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #D4A574, #A87B4F)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>🏠</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, color: '#E8DDD0', margin: '0 0 6px', fontWeight: 700 }}>Home Vault</h1>
          <p style={{ color: '#5A5248', fontSize: 14, margin: 0 }}>Secure Inventory & Document Tracker</p>
        </div>
        <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 16, padding: 28 }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 20, color: '#E8DDD0', margin: '0 0 24px' }}>Sign In</h2>
          {error && <div style={{ background: '#3A1818', border: '1px solid #5B2020', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E88', fontSize: 13 }}>🔒 {error}</div>}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Username</label>
            <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <button onClick={handleLogin} disabled={loading} style={{
            width: '100%', padding: '12px 24px', background: '#D4A574', color: '#0F0C08', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            opacity: loading ? 0.5 : 1, marginBottom: 16,
          }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: '#6A6055', fontSize: 13 }}>Don't have an account? </span>
            <button onClick={onGoRegister} style={{ background: 'none', border: 'none', color: '#D4A574', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>Create Account</button>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ color: '#3A342A', fontSize: 12 }}>🔒 bcrypt hashed passwords · JWT httpOnly cookies · Rate limiting · Account lockout</div>
        </div>
      </div>
    </div>
  );
}
