import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, ChevronRight } from 'lucide-react';

const LoginView = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const success = await login(username, password);
      if (success) navigate('/');
    } catch (err) {
      setError('Credenciales inválidas. Por favor intente de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="anthropic-theme" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: '#f9f6f0',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '420px', zIndex: 1, animation: 'fadeIn 0.6s ease-out' }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '140px', height: '140px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo-superliga.png" alt="La Superliga Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Login Card */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e6dfd3', 
          borderRadius: '16px', 
          padding: '40px',
          boxShadow: '0 12px 40px rgba(25, 20, 15, 0.05)'
        }}>
          <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: '26px', fontWeight: '400', color: '#191919', marginBottom: '24px', textAlign: 'center' }}>
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{ 
                padding: '11px 15px', 
                background: 'rgba(204, 122, 92, 0.05)', 
                border: '1px solid #e5c5bb', 
                borderRadius: '10px', 
                color: '#cc7a5c', 
                fontSize: '13px',
                animation: 'shake 0.4s ease-in-out'
              }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label>Usuario</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7f776f' }} />
                <input 
                  type="text" 
                  placeholder="ej. admin" 
                  style={{ paddingLeft: '42px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#7f776f' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '42px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                height: '46px', 
                fontSize: '14px', 
                marginTop: '10px',
                width: '100%',
                fontWeight: '600'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Iniciando...
                </>
              ) : (
                <>
                  Ingresar
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '12px' }}>
          &copy; 2026 La Superliga Gestión. Todos los derechos reservados.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-5px); }
          75%       { transform: translateX(5px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginView;
