import { useState } from 'react';
import { api } from '../utils/api';
import { getPasswordStrength } from '../utils/constants';

const inputStyle = {
  width: '100%', padding: '10px 14px', background: '#151310', border: '1px solid #2A2520',
  borderRadius: 8, color: '#E0D6C8', fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box',
};

export default function RegisterPage({ onSuccess, onGoLogin }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleRegister = async () => {
    setError('');
    if (!username.trim() || !displayName.trim() || !password) {
      return setError('All fields are required.');
    }
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirmPw) return setError('Passwords do not match.');
    if (strength.pct < 40) return setError('Password is too weak. Add uppercase, numbers, or symbols.');

    setLoading(true);
    try {
      const result = await api.register({
        username: username.trim(),
        displayName: displayName.trim(),
        password,
      });
      onSuccess(result);
    } catch (err) {
      setError(err.data?.error || err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0F0C08', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: 'min(460px, 100%)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #D4A574, #A87B4F)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 16 }}>🏠</div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, color: '#E8DDD0', margin: '0 0 6px' }}>Create Your Vault</h1>
          <p style={{ color: '#5A5248', fontSize: 13, margin: 0 }}>Set up your secure account</p>
        </div>
        <div style={{ background: '#1A1714', border: '1px solid #2A2520', borderRadius: 16, padding: 28 }}>
          {error && <div style={{ background: '#3A1818', border: '1px solid #5B2020', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#E88', fontSize: 13 }}>⚠️ {error}</div>}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name</label>
            <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="e.g. Jane Smith" />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Username</label>
            <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. jane_smith" />
            <div style={{ fontSize: 11, color: '#6A6055', marginTop: 4 }}>Lowercase letters, numbers, underscores only</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" />
            {password && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, borderRadius: 2, background: '#2A2520' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: strength.color, width: `${strength.pct}%`, transition: 'all 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: strength.color, marginTop: 3, fontWeight: 600 }}>{strength.label}</div>
              </div>
            )}
            <div style={{ fontSize: 11, color: '#6A6055', marginTop: 4 }}>Minimum 8 characters — mix case, numbers, and symbols for best security</div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#A89A88', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Confirm Password</label>
            <input style={inputStyle} type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter password"
              onKeyDown={e => e.key === 'Enter' && handleRegister()} />
            {confirmPw && password !== confirmPw && <div style={{ color: '#C87070', fontSize: 12, marginTop: 4 }}>Passwords do not match</div>}
          </div>

          <button onClick={handleRegister} disabled={loading} style={{
            width: '100%', padding: '12px', background: '#D4A574', color: '#0F0C08', border: 'none',
            borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            opacity: loading ? 0.5 : 1, marginBottom: 16,
          }}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button onClick={onGoLogin} style={{ background: 'none', border: 'none', color: '#6A6055', fontSize: 13, cursor: 'pointer' }}>← Back to Sign In</button>
          </div>
        </div>
      </div>
    </div>
  );
}
