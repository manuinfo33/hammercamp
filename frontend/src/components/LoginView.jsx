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
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      background: 'radial-gradient(ellipse at top right, rgba(212,184,150,0.07) 0%, transparent 55%), radial-gradient(ellipse at bottom left, rgba(160,128,96,0.04) 0%, transparent 55%), #0d0c0b',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Decorative glows */}
      <div style={{ position: 'fixed', top: '15%', right: '8%', width: '280px', height: '280px', background: 'rgba(212,184,150,0.06)', filter: 'blur(90px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '12%', left: '8%', width: '350px', height: '350px', background: 'rgba(160,128,96,0.04)', filter: 'blur(110px)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', zIndex: 1, animation: 'fadeIn 0.6s ease-out' }}>

        {/* Logo + Brand */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '160px', height: '160px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Hammercamp Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(1.1)' }} />
          </div>
        </div>

        {/* Login Card */}
        <div style={{ 
          background: 'rgba(26, 23, 19, 0.92)', 
          border: '1px solid rgba(212, 184, 150, 0.15)', 
          borderRadius: '24px', 
          padding: '32px',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 30px 60px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,184,150,0.08)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#f5ede4', marginBottom: '24px' }}>
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {error && (
              <div style={{ 
                padding: '11px 15px', 
                background: 'rgba(220, 80, 80, 0.1)', 
                border: '1px solid rgba(220, 80, 80, 0.2)', 
                borderRadius: '10px', 
                color: '#e08080', 
                fontSize: '13px',
                animation: 'shake 0.4s ease-in-out'
              }}>
                {error}
              </div>
            )}

            <div className="input-group">
              <label>Usuario</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b5d4e' }} />
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
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#6b5d4e' }} />
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
                marginTop: '6px',
                background: isSubmitting
                  ? 'rgba(212, 184, 150, 0.7)'
                  : 'linear-gradient(135deg, #D4B896 0%, #c4a882 100%)',
                color: '#1a1512',
                fontWeight: '800',
                letterSpacing: '0.5px',
                border: '1px solid rgba(212, 184, 150, 0.3)',
                boxShadow: '0 10px 24px -8px rgba(212, 184, 150, 0.3)'
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

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#3d352c', fontSize: '12px' }}>
          &copy; 2026 Hammercamp Pro. Todos los derechos reservados.
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
