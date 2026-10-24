import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Image as ImageIcon, Eye, EyeOff, Pencil, Trash2, User, Lock, MapPin, Calendar, Users, FileText, Upload } from 'lucide-react';
import '../../styles/data.css';

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
    <div className="form-container anthropic-theme animate-fade-in">


      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Sección 1: Acceso */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={14} /> Acceso
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
            <div className="input-group">
              <label>Usuario *</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                <input type="text" required autoComplete="off" value={formData.username} onChange={(e) => { setFormData({ ...formData, username: e.target.value }); setError(''); }} style={{ paddingLeft: '40px', height: '42px', borderColor: error && error.includes('usuario') ? '#dc2626' : 'var(--border-subtle)' }} />
              </div>
            </div>
            <div className="input-group">
              <label>Contraseña {delegate ? '(opcional)' : '*'}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required={!delegate} 
                  autoComplete="new-password" 
                  value={formData.password} 
                  onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setError(''); }} 
                  style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)', width: '100%', paddingRight: '40px' }} 
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
        </div>

        {/* Sección 2: Datos Personales */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} /> Datos Personales
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
              <div className="input-group">
                <label>Nombre *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                  <input type="text" required value={formData.first_name} onChange={(e) => { const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); setFormData({ ...formData, first_name: val }); setError(''); }} style={{ paddingLeft: '40px', height: '42px', borderColor: error ? '#dc2626' : 'var(--border-subtle)' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Apellido *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                  <input type="text" required value={formData.last_name} onChange={(e) => { const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); setFormData({ ...formData, last_name: val }); setError(''); }} style={{ paddingLeft: '40px', height: '42px', borderColor: error ? '#dc2626' : 'var(--border-subtle)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '20px' }}>
              <div className="input-group">
                <label>DNI</label>
                <div style={{ position: 'relative' }}>
                  <ImageIcon size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                  <input type="text" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }} />
                </div>
              </div>
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label>Dirección</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
              <div className="input-group">
                <label>Nacimiento</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3' }} />
                  <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Equipo</label>
                <div style={{ position: 'relative' }}>
                  <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9a9aa3', pointerEvents: 'none', zIndex: 10 }} />
                  <select value={formData.team} onChange={(e) => setFormData({ ...formData, team: e.target.value })} style={{ paddingLeft: '40px', height: '42px', borderColor: 'var(--border-subtle)', width: '100%' }}>
                    <option value="">Ninguno</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: DNI */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={14} /> Identificación DNI
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '24px' }}>
            {/* Foto DNI Frente */}
            <div className="input-group">
              <label>DNI Frente</label>
              <div style={{ 
                border: previews.dni_front ? '1px solid var(--border-subtle)' : '2px dashed #c4b9a3', 
                borderRadius: '12px', 
                padding: previews.dni_front ? '16px' : '24px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fafafb',
                minHeight: '130px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                cursor: previews.dni_front ? 'default' : 'pointer'
              }}
              onClick={() => !previews.dni_front && document.getElementById('delegate-dni-front-input').click()}
              >
                <input 
                  type="file" 
                  id="delegate-dni-front-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, 'dni_front')} 
                />
                
                {previews.dni_front ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={previews.dni_front} alt="DNI Frente" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('delegate-dni-front-input').click(); }}
                        className="secondary"
                        style={{ padding: '6px 12px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        <Pencil size={12} /> Modificar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_front'); }}
                        className="secondary"
                        style={{ padding: '6px 12px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={24} style={{ color: 'var(--gx-primary-ink)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Subir Frente</div>
                  </div>
                )}
              </div>
            </div>

            {/* Foto DNI Dorso */}
            <div className="input-group">
              <label>DNI Dorso</label>
              <div style={{ 
                border: previews.dni_back ? '1px solid var(--border-subtle)' : '2px dashed #c4b9a3', 
                borderRadius: '12px', 
                padding: previews.dni_back ? '16px' : '24px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fafafb',
                minHeight: '130px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.2s ease',
                cursor: previews.dni_back ? 'default' : 'pointer'
              }}
              onClick={() => !previews.dni_back && document.getElementById('delegate-dni-back-input').click()}
              >
                <input 
                  type="file" 
                  id="delegate-dni-back-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, 'dni_back')} 
                />
                
                {previews.dni_back ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={previews.dni_back} alt="DNI Dorso" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('delegate-dni-back-input').click(); }}
                        className="secondary"
                        style={{ padding: '6px 12px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        <Pencil size={12} /> Modificar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_back'); }}
                        className="secondary"
                        style={{ padding: '6px 12px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <Trash2 size={12} /> Eliminar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={24} style={{ color: 'var(--gx-primary-ink)', marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>Subir Dorso</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', color: '#dc2626', fontSize: '13px', border: '1px solid #fecaca' }}>
            {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
          </div>
        )}

        <div className="dt-form-actions">
          <button type="button" onClick={onClose} className="secondary">Cancelar</button>
          <button type="submit" disabled={submitting}>
            {submitting ? '...' : <><Check size={18} /> {delegate ? 'Guardar' : 'Crear'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DelegateForm;
