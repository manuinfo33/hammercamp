import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Upload, Check, Image as ImageIcon, UserPlus, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TeamForm = ({ team, onClose, onSuccess, isModal = false }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [delegates, setDelegates] = useState([]);
  
  const [formData, setFormData] = useState({
    name: team?.name || '',
    category: team?.category || '',
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
    if (!formData.delegate) {
      setError('Debes asignar un delegado responsable al equipo.');
      return;
    }
    setSubmitting(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('category', formData.category);
    data.append('delegate', formData.delegate);
    
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
      if (error.response?.data?.name) {
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
        padding: '24px',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label>Nombre</label>
            <input type="text" required value={formData.name} onChange={(e) => { const val = e.target.value.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); setFormData({ ...formData, name: val }); setError(''); }} style={{ borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label>Categoría</label>
            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ borderColor: 'var(--border-subtle)' }}>
              <option value="" disabled>Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group" style={{ position: 'relative' }}>
          <label>Delegado Responsable *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Buscar delegado por nombre"
                value={searchTerm}
                required
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDelegates(true);
                  if (e.target.value === '') setFormData({ ...formData, delegate: '' });
                }}
                onFocus={() => setShowDelegates(true)}
                style={{ borderColor: 'var(--border-subtle)', flex: 1 }}
              />
              <button 
                type="button" 
                onClick={() => navigate('/delegados', { state: { openForm: true } })}
                className="secondary icon-only"
                title="Nuevo Delegado"
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label>Escudo</label>
            <div style={{ 
              border: previews.logo ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
              borderRadius: '12px', 
              padding: previews.logo ? '16px' : '24px', 
              textAlign: 'center', 
              position: 'relative', 
              background: '#fcfbfa',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
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
                  <div style={{ position: 'relative', width: '90px', height: '90px' }}>
                    <img src={previews.logo} alt="Escudo del equipo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('logo-file-input').click(); }}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile('logo'); }}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={24} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Logo</div>
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label>Foto Equipo</label>
            <div style={{ 
              border: previews.team_photo ? '1px solid #e6dfd3' : '2px dashed #c4b9a3', 
              borderRadius: '12px', 
              padding: previews.team_photo ? '16px' : '24px', 
              textAlign: 'center', 
              position: 'relative', 
              background: '#fcfbfa',
              minHeight: '160px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
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
                  <div style={{ position: 'relative', width: '100%', height: '90px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img src={previews.team_photo} alt="Foto del equipo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', zIndex: 10 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); document.getElementById('photo-file-input').click(); }}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearFile('team_photo'); }}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#cc7a5c', borderColor: '#e5c5bb' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ pointerEvents: 'none' }}>
                  <Upload size={24} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>Subir Foto</div>
                </div>
              )}
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
            {submitting ? '...' : <><Check size={18} /> {team ? 'Guardar' : 'Crear'}</>}
          </button>
        </div>
      </form>

    </div>
  );
};

export default TeamForm;
