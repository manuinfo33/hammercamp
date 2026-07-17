import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Image as ImageIcon, Pencil, Trash2, User, Phone, Mail, Calendar, FileText, Upload } from 'lucide-react';

const PlayerFormModal = ({ player, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    first_name: player?.first_name || '',
    last_name: player?.last_name || '',
    dni: player?.dni || '',
    birth_date: player?.birth_date || '',
    email: player?.email || '',
    phone: player?.phone || '',
    photo: null,
    dni_front: null,
    dni_back: null
  });
  const [previews, setPreviews] = useState({
    photo: player?.photo || null,
    dni_front: player?.dni_front || null,
    dni_back: player?.dni_back || null
  });
  const [removedImages, setRemovedImages] = useState({
    photo: false,
    dni_front: false,
    dni_back: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    setError('');

    const data = new FormData();
    data.append('first_name', formData.first_name);
    data.append('last_name', formData.last_name);
    data.append('dni', formData.dni);
    
    if (formData.birth_date) data.append('birth_date', formData.birth_date);
    if (formData.email) data.append('email', formData.email);
    if (formData.phone) data.append('phone', formData.phone);
    
    if (formData.photo instanceof File) {
      data.append('photo', formData.photo);
    } else if (removedImages.photo) {
      data.append('remove_photo', 'true');
    }
    
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
      if (player) {
        response = await api.patch(`players/${player.id}/`, data);
      } else {
        response = await api.post('players/', data);
      }
      onSuccess(response.data);
    } catch (error) {
      console.error("Error saving player:", error);
      if (error.response?.data?.dni) {
        const msg = Array.isArray(error.response.data.dni) ? error.response.data.dni[0] : error.response.data.dni;
        setError(msg);
      } else {
        setError('Hubo un error al guardar el jugador. Por favor, verifica los datos e intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '32px', marginBottom: '24px' }} className="anthropic-theme animate-fade-in">
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sección 1: Datos Personales */}
        <div>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <User size={14} /> Datos Personales
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label>Nombre *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input type="text" required value={formData.first_name} onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); setError(''); }} style={{ paddingLeft: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Apellido *</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input type="text" required value={formData.last_name} onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); setError(''); }} style={{ paddingLeft: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="input-group">
                <label>DNI *</label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input type="text" required value={formData.dni} onChange={(e) => { setFormData({ ...formData, dni: e.target.value }); setError(''); }} style={{ paddingLeft: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
                </div>
              </div>
              <div className="input-group">
                <label>Fecha de Nacimiento</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                  <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} style={{ paddingLeft: '40px', borderColor: 'var(--border-subtle)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Contacto */}
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={14} /> Contacto
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="input-group">
              <label>Celular</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ paddingLeft: '40px', borderColor: 'var(--border-subtle)' }} />
              </div>
            </div>
            <div className="input-group">
              <label>Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ paddingLeft: '40px', borderColor: 'var(--border-subtle)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Documentación y Foto */}
        <div style={{ borderTop: '1px solid #e6dfd3', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ImageIcon size={14} /> Documentación y Foto
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
            {/* Foto Perfil */}
            <div className="input-group">
              <label>Foto de Perfil</label>
              <div style={{ 
                border: previews.photo ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
                borderRadius: '12px', 
                padding: previews.photo ? '12px' : '20px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fcfbfa', 
                minHeight: '150px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                cursor: previews.photo ? 'default' : 'pointer'
              }}
              onClick={() => !previews.photo && document.getElementById('player-photo-input').click()}
              >
                <input 
                  type="file" 
                  id="player-photo-input"
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, 'photo')} 
                />
                
                {previews.photo ? (
                  <>
                    <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '8px', overflow: 'hidden' }}>
                      <img src={previews.photo} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('player-photo-input').click(); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                      >
                        <Pencil size={10} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('photo'); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                      >
                        <Trash2 size={10} /> Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={22} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Foto</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* DNI Frente */}
            <div className="input-group">
              <label>DNI Frente</label>
              <div style={{ 
                border: previews.dni_front ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
                borderRadius: '12px', 
                padding: previews.dni_front ? '12px' : '20px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fcfbfa', 
                minHeight: '150px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                cursor: previews.dni_front ? 'default' : 'pointer'
              }}
              onClick={() => !previews.dni_front && document.getElementById('player-dni-front-input').click()}
              >
                <input 
                  type="file" 
                  id="player-dni-front-input"
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, 'dni_front')} 
                />
                
                {previews.dni_front ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={previews.dni_front} alt="Vista previa DNI frente" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('player-dni-front-input').click(); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                      >
                        <Pencil size={10} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_front'); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                      >
                        <Trash2 size={10} /> Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={22} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Frente</div>
                  </div>
                )}
              </div>
            </div>

            {/* DNI Dorso */}
            <div className="input-group">
              <label>DNI Dorso</label>
              <div style={{ 
                border: previews.dni_back ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
                borderRadius: '12px', 
                padding: previews.dni_back ? '12px' : '20px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fcfbfa', 
                minHeight: '150px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                cursor: previews.dni_back ? 'default' : 'pointer'
              }}
              onClick={() => !previews.dni_back && document.getElementById('player-dni-back-input').click()}
              >
                <input 
                  type="file" 
                  id="player-dni-back-input"
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileChange(e, 'dni_back')} 
                />
                
                {previews.dni_back ? (
                  <>
                    <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={previews.dni_back} alt="Vista previa DNI dorso" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('player-dni-back-input').click(); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                      >
                        <Pencil size={10} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_back'); }}
                        className="secondary"
                        style={{ padding: '4px 8px', height: '26px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                      >
                        <Trash2 size={10} /> Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={22} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Dorso</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.05)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e6dfd3' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '40px' }}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {player ? 'Guardar' : 'Crear'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerFormModal;
