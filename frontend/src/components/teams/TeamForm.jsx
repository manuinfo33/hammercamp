import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { X, Upload, Check, Image as ImageIcon, UserPlus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeamForm = ({ team, onClose, onSuccess, isModal = false, defaultCategoryId = '' }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [delegates, setDelegates] = useState([]);
  const [customAlert, setCustomAlert] = useState(null); // { title, message }
  
  const [formData, setFormData] = useState({
    name: team?.name || '',
    category: team?.category || defaultCategoryId || '',
    delegate: team?.delegate || '',
    logo: null,
    team_photo: null
  });
  
  const [previews, setPreviews] = useState({
    logo: team?.logo || null,
    team_photo: team?.team_photo || null
  });
  
  const [removedImages, setRemovedImages] = useState({
    logo: false,
    team_photo: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showDelegates, setShowDelegates] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchDelegates(team?.delegate);
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('categories/');
      setCategories(response.data);
      if (!team && defaultCategoryId && !formData.category) {
        setFormData(prev => ({ ...prev, category: defaultCategoryId }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDelegates = async (selectId = null) => {
    try {
      const response = await api.get('delegates/');
      setDelegates(response.data);
      if (selectId) {
        const del = response.data.find(d => d.id === selectId);
        if (del) {
          setSearchTerm(`${del.first_name} ${del.last_name}`);
        }
      }
    } catch (error) {
      console.error("Error fetching delegates:", error);
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
    data.append('name', formData.name);
    data.append('category', formData.category);
    if (formData.delegate) {
      data.append('delegate', formData.delegate);
    } else {
      data.append('delegate', '');
    }
    
    if (formData.logo instanceof File) {
      data.append('logo', formData.logo);
    } else if (removedImages.logo) {
      data.append('remove_logo', 'true');
    }
    
    if (formData.team_photo instanceof File) {
      data.append('team_photo', formData.team_photo);
    } else if (removedImages.team_photo) {
      data.append('remove_team_photo', 'true');
    }

    try {
      let response;
      if (team) {
        response = await api.patch(`teams/${team.id}/`, data);
      } else {
        response = await api.post('teams/', data);
      }
      onSuccess(response.data);
    } catch (error) {
      console.error("Error saving team:", error);
      if (error.response?.data?.category) {
        const catErr = Array.isArray(error.response.data.category) 
          ? error.response.data.category[0] 
          : error.response.data.category;
        setCustomAlert({
          title: 'Atención',
          message: catErr
        });
      } else if (error.response?.data?.name) {
        setError(error.response.data.name[0]);
      } else {
        setError('Hubo un error al guardar el equipo. Por favor, verifica los datos e intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDelegates = delegates.filter(d => 
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
      style={isModal ? {
        background: 'transparent',
        border: 'none',
        padding: '0',
        margin: 0
      } : { 
        background: 'var(--bg-card)', 
        border: '1px solid var(--border-subtle)', 
        borderRadius: '20px', 
        padding: '32px', 
        marginBottom: '24px'
      }} 
      className="anthropic-theme animate-fade-in"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Escudo y Foto del equipo a la arriba */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="input-group">
            <label style={{ fontSize: '13px', color: 'var(--text-secondary, #7f776f)', fontWeight: '500' }}>Escudo</label>
            <div style={{ 
              border: previews.logo ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
              borderRadius: '12px', 
              padding: previews.logo ? '12px' : '16px', 
              textAlign: 'center', 
              position: 'relative', 
              background: '#fcfbfa',
              minHeight: '130px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              cursor: previews.logo ? 'default' : 'pointer'
            }}
            onClick={() => !previews.logo && document.getElementById('logo-file-input').click()}
            >
              <input 
                type="file" 
                id="logo-file-input" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'logo')} 
              />
              
              {previews.logo ? (
                <>
                  <div style={{ position: 'relative', width: '70px', height: '70px' }}>
                    <img src={previews.logo} alt="Escudo del equipo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('logo-file-input').click(); }}
                      className="secondary"
                      style={{ padding: '4px 8px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile('logo'); }}
                      className="secondary"
                      style={{ padding: '4px 8px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={22} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Logo</div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '13px', color: 'var(--text-secondary, #7f776f)', fontWeight: '500' }}>Foto Equipo</label>
            <div style={{ 
              border: previews.team_photo ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
              borderRadius: '12px', 
              padding: previews.team_photo ? '12px' : '16px', 
              textAlign: 'center', 
              position: 'relative', 
              background: '#fcfbfa',
              minHeight: '130px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              cursor: previews.team_photo ? 'default' : 'pointer'
            }}
            onClick={() => !previews.team_photo && document.getElementById('photo-file-input').click()}
            >
              <input 
                type="file" 
                id="photo-file-input" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={(e) => handleFileChange(e, 'team_photo')} 
              />
              
              {previews.team_photo ? (
                <>
                  <div style={{ position: 'relative', width: '100%', height: '70px', borderRadius: '6px', overflow: 'hidden' }}>
                    <img src={previews.team_photo} alt="Foto del equipo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('photo-file-input').click(); }}
                      className="secondary"
                      style={{ padding: '4px 8px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile('team_photo'); }}
                      className="secondary"
                      style={{ padding: '4px 8px', height: '28px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                    >
                      <Trash2 size={12} /> Eliminar
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
        </div>

        {/* Nombre y Categoría */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="input-group">
            <label>Nombre *</label>
            <input type="text" required value={formData.name} onChange={(e) => { const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); setFormData({ ...formData, name: val }); setError(''); }} style={{ borderColor: error ? '#e07070' : 'var(--border-subtle)', height: '42px' }} />
          </div>
          <div className="input-group">
            <label>Categoría *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => {
                const newCatId = e.target.value;
                if (newCatId === 'CREATE_NEW') {
                  navigate('/categorias', { state: { openForm: true } });
                  return;
                }
                if (team?.is_active && String(team.category) !== String(newCatId)) {
                  setCustomAlert({
                    title: 'Atención',
                    message: `El equipo "${team.name}" se encuentra actualmente activo en el torneo "${team.current_tournament || 'un torneo'}". No se puede cambiar de categoría mientras esté participando en el torneo.`
                  });
                  return;
                }
                setFormData({ ...formData, category: newCatId });
              }}
              style={{ borderColor: 'var(--border-subtle)', height: '42px' }}
            >
              <option value="" disabled>Selecciona...</option>
              {categories.length === 0 && (
                <option value="CREATE_NEW" style={{ fontWeight: '600', color: '#cc7a5c' }}>
                  + Crea una Categoría nueva
                </option>
              )}
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Delegado Responsable */}
        <div className="input-group" style={{ position: 'relative' }}>
          <label>Delegado Responsable (Opcional)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Buscar delegado por nombre (Opcional)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDelegates(true);
                  if (e.target.value === '') setFormData({ ...formData, delegate: '' });
                }}
                onFocus={() => setShowDelegates(true)}
                style={{ borderColor: 'var(--border-subtle)', flex: 1, height: '42px' }}
              />
              <button 
                type="button" 
                onClick={() => navigate('/delegados', { state: { openForm: true } })}
                className="secondary icon-only"
                title="Nuevo Delegado"
                style={{ height: '42px', width: '42px' }}
              >
                <UserPlus size={18} />
              </button>
            </div>
          {showDelegates && searchTerm && (
            <div className="delegate-dropdown-list">
              {filteredDelegates.length > 0 ? filteredDelegates.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => {
                    setFormData({ ...formData, delegate: d.id });
                    setSearchTerm(`${d.first_name} ${d.last_name}`);
                    setShowDelegates(false);
                  }}
                  className="delegate-dropdown-item"
                >
                  {d.first_name} {d.last_name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({d.dni})</span>
                </div>
              )) : (
                <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>No se encontraron delegados</div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.05)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e6dfd3' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '40px' }}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {team ? 'Guardar' : 'Crear'}</>}
          </button>
        </div>
      </form>

      {/* Alerta Modal con el diseño estándar */}
      {customAlert && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(8, 7, 6, 0.82)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#fff3cd',
                color: '#856404',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#191919' }}>
                {customAlert.title || 'Atención'}
              </h3>
            </div>
            
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#383530' }}>
              {customAlert.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                style={{
                  background: '#191919',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default TeamForm;
