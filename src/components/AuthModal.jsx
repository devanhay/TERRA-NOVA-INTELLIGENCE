import React, { useState } from 'react';
import { X, KeyRound, User, ChevronRight, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api'; // Fallback base path, dynamically adjusted

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Harap lengkapi username dan password.');
      return;
    }

    setLoading(true);
    // Find active host (using VITE_API_URL env variable with relative path fallback for proxy/vercel)
    const host = import.meta.env.VITE_API_URL || '';
    const endpoint = isRegister ? `${host}/api/auth/register` : `${host}/api/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Terjadi kesalahan sistem.');
      }

      if (isRegister) {
        // Toggle to login mode
        setIsRegister(false);
        setPassword('');
        setErrorMsg('Registrasi berhasil! Silakan masuk dengan akun Anda.');
      } else {
        // Login success
        localStorage.setItem('engineeros_auth_token', data.token);
        localStorage.setItem('engineeros_auth_username', data.user.username);
        onAuthSuccess(data.token, data.user.username);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-modal-backdrop" onClick={onClose} style={{ zIndex: 11000 }}>
      <div 
        className="glass-modal" 
        onClick={e => e.stopPropagation()}
        style={{
          border: '1px solid rgba(168, 85, 247, 0.25)',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.15), 0 32px 80px rgba(0,0,0,0.8)'
        }}
      >
        <div className="glass-modal-header" style={{ marginBottom: 12 }}>
          <span className="glass-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)' }}>
            <KeyRound size={16} />
            {isRegister ? 'Register EngineerOS' : 'Login EngineerOS'}
          </span>
          <button className="glass-modal-close" onClick={onClose}><X size={16}/></button>
        </div>

        <p style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: 16, lineHeight: 1.45 }}>
          {isRegister 
            ? 'Buat akun baru untuk mulai menyinkronkan data proyek & skripsi Anda di cloud database secara otomatis.' 
            : 'Masuk ke akun Anda untuk menyinkronkan data PFD dan simulasi secara realtime lintas perangkat.'
          }
        </p>

        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: errorMsg.includes('berhasil') ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${errorMsg.includes('berhasil') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: '0.72rem',
            color: errorMsg.includes('berhasil') ? '#34d399' : '#f87171',
            marginBottom: 14
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Username</div>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="glass-modal-input" 
                placeholder="Username Anda..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                style={{ marginBottom: 0, paddingLeft: 34 }}
              />
              <User size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#475569' }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.62rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Password</div>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="glass-modal-input" 
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ marginBottom: 0, paddingLeft: 34 }}
              />
              <KeyRound size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#475569' }} />
            </div>
          </div>

          <button 
            type="submit" 
            className="glass-modal-confirm" 
            disabled={loading}
            style={{
              width: '100%',
              padding: '11px',
              marginTop: 6,
              background: isRegister ? 'var(--purple-gradient)' : 'var(--accent-gradient)',
              boxShadow: isRegister ? '0 4px 16px rgba(168, 85, 247, 0.2)' : '0 4px 16px rgba(76, 201, 240, 0.2)'
            }}
          >
            {loading ? 'Menghubungkan...' : (isRegister ? 'Daftar Akun Baru' : 'Masuk Dashboard')}
          </button>
        </form>

        <div style={{ marginTop: 18, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 14, textAlign: 'center' }}>
          <button 
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); }}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            {isRegister ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Daftar gratis'}
          </button>
        </div>
      </div>
    </div>
  );
}
