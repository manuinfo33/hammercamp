import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { 
  X, Check, Image as ImageIcon, Pencil, Trash2, User, Phone, Mail, 
  Calendar, FileText, Upload, ArrowLeft, UserPlus 
} from 'lucide-react';

const PlayerFormModal = ({ player, onClose, onSuccess }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const formFieldsJSX = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sección 1: Datos Personales */}
      <div>
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <User size={13} /> Datos Personales
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Nombre & Apellido */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '10px' : '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Nombre *</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Lionel"
                  value={formData.first_name} 
                  onChange={(e) => { 
                    const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); 
                    setFormData({ ...formData, first_name: val }); 
                    setError(''); 
                  }} 
                  style={{ 
                    paddingLeft: '36px', 
                    height: '40px',
                    borderColor: error ? '#e07070' : 'var(--border-subtle)',
                    fontSize: '13px'
                  }} 
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Apellido *</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: Messi"
                  value={formData.last_name} 
                  onChange={(e) => { 
                    const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); 
                    setFormData({ ...formData, last_name: val }); 
                    setError(''); 
                  }} 
                  style={{ 
                    paddingLeft: '36px', 
                    height: '40px',
                    borderColor: error ? '#e07070' : 'var(--border-subtle)',
                    fontSize: '13px'
                  }} 
                />
              </div>
            </div>
          </div>

          {/* DNI & Fecha de Nacimiento */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '10px' : '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>DNI *</label>
              <div style={{ position: 'relative' }}>
                <FileText size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input 
                  type="text" 
                  required 
                  placeholder="Ej: 35123456"
                  value={formData.dni} 
                  onChange={(e) => { setFormData({ ...formData, dni: e.target.value }); setError(''); }} 
                  style={{ 
                    paddingLeft: '36px', 
                    height: '40px',
                    borderColor: error ? '#e07070' : 'var(--border-subtle)',
                    fontSize: '13px'
                  }} 
                />
              </div>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Nacimiento</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
                <input 
                  type="date" 
                  value={formData.birth_date} 
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} 
                  onClick={(e) => {
                    try { e.target.showPicker(); } catch(err) {}
                  }}
                  style={{ 
                    paddingLeft: '36px', 
                    height: '40px',
                    borderColor: 'var(--border-subtle)',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Contacto */}
      <div style={{ borderTop: '1px solid #eae4d8', paddingTop: '16px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Phone size={13} /> Contacto
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '10px' : '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Celular</label>
            <div style={{ position: 'relative' }}>
              <Phone size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
              <input 
                type="text" 
                placeholder="Ej: 11 1234-5678"
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                style={{ paddingLeft: '36px', height: '40px', borderColor: 'var(--border-subtle)', fontSize: '13px' }} 
              />
            </div>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
              <input 
                type="email" 
                placeholder="jugador@email.com"
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                style={{ paddingLeft: '36px', height: '40px', borderColor: 'var(--border-subtle)', fontSize: '13px' }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 3: Documentación y Foto */}
      <div style={{ borderTop: '1px solid #eae4d8', paddingTop: '16px' }}>
        <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={13} /> Documentación y Foto
        </h3>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', 
          gap: '12px' 
        }}>
          {/* Foto Perfil */}
          <div className="input-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>Foto de Perfil</label>
            <div style={{ 
              border: previews.photo ? '1px solid #d8cfc0' : '2px dashed #c4b9a3', 
              borderRadius: '10px', 
              padding: '10px', 
              textAlign: 'center', 
              position: 'relative', 
              background: '#fcfbfa', 
              minHeight: isMobile ? '100px' : '130px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '6px',
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
                  <div style={{ position: 'relative', width: '70px', height: '70px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={previews.photo} alt="Vista previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('player-photo-input').click(); }}
                      className="secondary"
                      style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                    >
                      <Pencil size={10} /> Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile('photo'); }}
                      className="secondary"
                      style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                    >
                      <Trash2 size={10} /> Borrar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={20} style={{ color: '#cc7a5c', marginBottom: '2px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Foto</div>
                </div>
              )}
            </div>
          </div>
          
          {/* DNI Frente y Dorso (2 columns in mobile or next 2 columns in desktop) */}
          <div style={{ 
            display: isMobile ? 'grid' : 'contents', 
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'none', 
            gap: isMobile ? '10px' : '0' 
          }}>
            {/* DNI Frente */}
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>DNI Frente</label>
              <div style={{ 
                border: previews.dni_front ? '1px solid #d8cfc0' : '2px dashed #c4b9a3', 
                borderRadius: '10px', 
                padding: '10px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fcfbfa', 
                minHeight: isMobile ? '100px' : '130px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px',
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
                    <div style={{ position: 'relative', width: '100%', height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={previews.dni_front} alt="Vista previa DNI frente" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('player-dni-front-input').click(); }}
                        className="secondary"
                        style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                      >
                        <Pencil size={10} /> Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_front'); }}
                        className="secondary"
                        style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                      >
                        <Trash2 size={10} /> Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={20} style={{ color: '#cc7a5c', marginBottom: '2px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Frente</div>
                  </div>
                )}
              </div>
            </div>

            {/* DNI Dorso */}
            <div className="input-group" style={{ margin: 0 }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>DNI Dorso</label>
              <div style={{ 
                border: previews.dni_back ? '1px solid #d8cfc0' : '2px dashed #c4b9a3', 
                borderRadius: '10px', 
                padding: '10px', 
                textAlign: 'center', 
                position: 'relative', 
                background: '#fcfbfa', 
                minHeight: isMobile ? '100px' : '130px', 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '6px',
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
                    <div style={{ position: 'relative', width: '100%', height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
                      <img src={previews.dni_back} alt="Vista previa DNI dorso" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('player-dni-back-input').click(); }}
                        className="secondary"
                        style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
                      >
                        <Pencil size={10} /> Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearFile('dni_back'); }}
                        className="secondary"
                        style={{ padding: '3px 8px', height: '24px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                      >
                        <Trash2 size={10} /> Borrar
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none' }}>
                    <Upload size={20} style={{ color: '#cc7a5c', marginBottom: '2px' }} />
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Dorso</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(204, 122, 92, 0.08)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb', fontWeight: '500' }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'flex-end', 
        gap: '10px', 
        paddingTop: '16px', 
        borderTop: '1px solid #eae4d8',
        marginTop: '6px'
      }}>
        <button 
          type="button" 
          onClick={onClose} 
          className="secondary" 
          style={{ 
            height: '42px', 
            borderRadius: isMobile ? '21px' : '10px',
            fontSize: '13px',
            fontWeight: '600'
          }}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          disabled={submitting} 
          style={{ 
            height: isMobile ? '46px' : '42px', 
            borderRadius: isMobile ? '23px' : '10px',
            background: isMobile ? '#038c4c' : '#191919',
            color: '#ffffff',
            border: 'none',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isMobile ? '0 2px 8px rgba(3,140,76,0.3)' : 'none',
            cursor: 'pointer'
          }}
        >
          {submitting ? 'Guardando...' : (
            <>
              <Check size={16} /> 
              {player ? 'Guardar Cambios' : 'Crear Jugador'}
            </>
          )}
        </button>
      </div>
    </form>
  );

  // DESKTOP MODAL OVERLAY
  if (!isMobile) {
    return createPortal(
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.45)',
          backdropFilter: 'blur(4px)',
          zIndex: 10005,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflowY: 'auto'
        }}
        className="animate-fade-in"
        onClick={onClose}
      >
        <div 
          style={{
            background: '#ffffff',
            border: '1px solid #e6dfd3',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px 32px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
            position: 'relative'
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eae4d8', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(204, 122, 92, 0.12)',
                border: '1px solid rgba(204, 122, 92, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserPlus size={18} color="#cc7a5c" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#191919' }}>
                  {player ? 'Editar Jugador' : 'Nuevo Jugador'}
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#7f776f' }}>
                  Completá la información del jugador para el catálogo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#7f776f',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>

          {formFieldsJSX}
        </div>
      </div>,
      document.body
    );
  }

  // MOBILE FULLSCREEN OVERLAY
  return createPortal(
    <div 
      className="anthropic-theme animate-fade-in" 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10005,
        background: '#fcfbfa',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Mobile Header Bar */}
      <div style={{
        height: '56px',
        background: '#fdfcfb',
        borderBottom: '1px solid #eae4d8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        color: '#383530',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#cc7a5c', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <ArrowLeft size={20} />
        </button>
        <span style={{ fontWeight: '800', fontSize: '1.05rem', color: '#383530' }}>
          {player ? 'Editar Jugador' : 'Nuevo Jugador'}
        </span>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#7f776f', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ padding: '16px', flex: 1, paddingBottom: '40px' }}>
        {formFieldsJSX}
      </div>
    </div>,
    document.body
  );
};

export default PlayerFormModal;
