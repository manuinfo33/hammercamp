import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Image as ImageIcon, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';

const DelegateForm = ({ delegate, onClose, onSuccess }) => {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    first_name: delegate?.first_name || '',
    last_name: delegate?.last_name || '',
    dni: delegate?.dni || '',
    address: delegate?.address || '',
    birth_date: delegate?.birth_date || '',
    team: delegate?.team || '',
    username: delegate?.user_username || '',
    password: '',
    dni_front: null,
    dni_back: null
  });
  const [previews, setPreviews] = useState({
    dni_front: delegate?.dni_front || null,
    dni_back: delegate?.dni_back || null
  });
  const [removedImages, setRemovedImages] = useState({
    dni_front: false,
    dni_back: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await api.get('teams/');
      setTeams(response.data);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
      setPreviews({ ...previews, [field]: URL.createObjectURL(file) });
      setRemovedImages({ ...removedImages, [field]: false });
      setError('');
    }
  };

  const handleClearFile = (field) => {
    setFormData({ ...formData, [field]: null });
    setPreviews({ ...previews, [field]: null });
    setRemovedImages({ ...removedImages, [field]: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    if (formData.dni) data.append('dni', formData.dni);
    if (formData.address) data.append('address', formData.address);
    if (formData.birth_date) data.append('birth_date', formData.birth_date);
    if (formData.team) data.append('team', formData.team);
    
    data.append('username', formData.username);
    if (formData.password) data.append('password', formData.password);
    
    if (formData.dni_front instanceof File) {
      data.append('dni_front', formData.dni_front);
    } else if (removedImages.dni_front) {
      data.append('remove_dni_front', 'true');
    }
    
    if (formData.dni_back instanceof File) {
      data.append('dni_back', formData.dni_back);
    } else if (removedImages.dni_back) {
      data.append('remove_dni_back', 'true');
    }

    try {
      let response;
      if (delegate) {
        response = await api.patch(`delegates/${delegate.id}/`, data);
      } else {
        response = await api.post('delegates/', data);
      }
      onSuccess(response.data);
    } catch (error) {
      console.error("Error saving delegate:", error);
      if (error.response?.data?.dni) {
        // Muestra el mensaje específico enviado por el servidor (ej: DNI duplicado)
        const msg = Array.isArray(error.response.data.dni) ? error.response.data.dni[0] : error.response.data.dni;
        setError(msg);
      } else {
        setError('Hubo un error al guardar el delegado. Por favor, verifica los datos e intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '700', color: 'var(--text-primary)' }}>{delegate ? 'Editar Delegado' : 'Nuevo Delegado'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Completa la información del representante del equipo y sus credenciales de acceso a la web.</p>
        </div>
        <button onClick={onClose} className="secondary" style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0 }}><X size={16} /></button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre *</label>
            <input type="text" required value={formData.first_name} onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); setError(''); }} placeholder="Nombre del delegado" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Apellido *</label>
            <input type="text" required value={formData.last_name} onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); setError(''); }} placeholder="Apellido del delegado" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre de Usuario *</label>
            <input type="text" required autoComplete="off" value={formData.username} onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }} placeholder="Ej. juan.delegado" style={{ height: '40px', borderColor: error && error.includes('usuario') ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Contraseña {delegate ? '(Opcional)' : '*'}</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                required={!delegate} 
                autoComplete="new-password" 
                value={formData.password} 
                onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }} 
                placeholder={delegate ? "Dejar vacío para mantener" : "Contraseña de acceso"} 
                style={{ height: '40px', borderColor: 'var(--border-subtle)', width: '100%', paddingRight: '40px' }} 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  padding: '4px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 'auto',
                  height: 'auto'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DNI</label>
            <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} placeholder="Ej. 12345678" style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dirección</label>
            <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Ej. Calle Falsa 123" style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha de Nacimiento</label>
            <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Equipo (Opcional)</label>
            <select value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })} style={{ height: '40px', borderColor: 'var(--border-subtle)' }}>
              <option value="">Ninguno</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '10px', marginBottom: '0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>Documentación</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Foto DNI (Frente)</label>
            <div style={{ 
              border: previews.dni_front ? '1px solid var(--border-subtle)' : '2px dashed var(--border-subtle)', 
              borderRadius: '12px', 
              padding: previews.dni_front ? '16px' : '24px', 
              textAlign: 'center', 
              position: 'relative', 
              background: 'var(--brand-beige-subtle)',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <input 
                type="file" 
                id="delegate-dni-front-input" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'dni_front')} 
              />
              
              {previews.dni_front ? (
                <>
                  <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={previews.dni_front} alt="DNI Frente" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('delegate-dni-front-input').click()}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFile('dni_front')}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#e57373', borderColor: 'rgba(229,115,115,0.2)' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => document.getElementById('delegate-dni-front-input').click()} 
                  style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  <ImageIcon size={22} style={{ display: 'block', margin: '0 auto 6px' }} />
                  Subir Frente
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Foto DNI (Dorso)</label>
            <div style={{ 
              border: previews.dni_back ? '1px solid var(--border-subtle)' : '2px dashed var(--border-subtle)', 
              borderRadius: '12px', 
              padding: previews.dni_back ? '16px' : '24px', 
              textAlign: 'center', 
              position: 'relative', 
              background: 'var(--brand-beige-subtle)',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px'
            }}>
              <input 
                type="file" 
                id="delegate-dni-back-input" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'dni_back')} 
              />
              
              {previews.dni_back ? (
                <>
                  <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={previews.dni_back} alt="DNI Dorso" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={() => document.getElementById('delegate-dni-back-input').click()}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFile('dni_back')}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#e57373', borderColor: 'rgba(229,115,115,0.2)' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => document.getElementById('delegate-dni-back-input').click()} 
                  style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  <ImageIcon size={22} style={{ display: 'block', margin: '0 auto 6px' }} />
                  Subir Dorso
                </div>
              )}
            </div>
          </div>
        </div>
        
        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(220, 60, 60, 0.1)', color: '#e07070', fontSize: '13px', border: '1px solid rgba(220, 60, 60, 0.2)' }}>
            {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '40px' }}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {delegate ? 'Guardar' : 'Crear Delegado'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DelegateForm;
