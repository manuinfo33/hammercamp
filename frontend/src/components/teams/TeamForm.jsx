import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Upload, Check, Image as ImageIcon, UserPlus, Pencil, Trash2 } from 'lucide-react';
import DelegateForm from '../delegates/DelegateForm';

const TeamForm = ({ team, onClose, onSuccess }) => {
  const [categories, setCategories] = useState([]);
  const [delegates, setDelegates] = useState([]);
  const [formData, setFormData] = useState({
    name: team?.name || '',
    category: team?.category || '',
    delegate: team?.delegate || '',
    logo: null,
    team_photo: null
  });
  const [searchTerm, setSearchTerm] = useState(team?.delegate_name || '');
  const [showDelegates, setShowDelegates] = useState(false);
  const [showAddDelegateModal, setShowAddDelegateModal] = useState(false);
  
  const [previews, setPreviews] = useState({
    logo: team?.logo || null,
    team_photo: team?.team_photo || null
  });
  const [removedImages, setRemovedImages] = useState({
    logo: false,
    team_photo: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchDelegates();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('categories/');
      setCategories(response.data);
      if (!team && response.data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: response.data[0].id }));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDelegates = async (newDelegateId = null) => {
    try {
      const response = await api.get('delegates/');
      setDelegates(response.data);
      
      if (newDelegateId) {
        const newDelegate = response.data.find(d => d.id === newDelegateId);
        if (newDelegate) {
          setFormData(prev => ({ ...prev, delegate: newDelegate.id }));
          setSearchTerm(`${newDelegate.first_name} ${newDelegate.last_name}`);
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
    if (formData.delegate) data.append('delegate', formData.delegate);
    
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
      if (team) {
        await api.patch(`teams/${team.id}/`, data);
      } else {
        await api.post('teams/', data);
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving team:", error);
      if (error.response?.data?.name) {
        setError('Ya existe un equipo con ese nombre. Por favor, utiliza otro nombre.');
      } else {
        setError('Hubo un error al guardar el equipo. Por favor, intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDelegates = delegates.filter(d => 
    `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isModal = !!onClose;

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
        padding: '24px',
        marginBottom: '24px'
      }} 
      className="animate-fade-in"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '700', color: 'var(--text-primary)' }}>{team ? 'Editar Equipo' : 'Cargar Equipo'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Ingresa la información básica y fotos</p>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="secondary" 
            style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0 }}
          >
            <X size={16} />
          </button>
        )}
      </div>


      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre</label>
            <input type="text" required value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setError(''); }} placeholder="Ej. Los Halcones FC" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Categoría</label>
            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ height: '40px', borderColor: 'var(--border-subtle)' }}>
              <option value="" disabled>Selecciona...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="input-group" style={{ position: 'relative' }}>
          <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delegado Responsable *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Buscar delegado por nombre..." 
                value={searchTerm}
                required
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDelegates(true);
                  if (e.target.value === '') setFormData({ ...formData, delegate: '' });
                }}
                onFocus={() => setShowDelegates(true)}
                style={{ height: '40px', borderColor: 'var(--border-subtle)', flex: 1 }}
              />
              <button 
                type="button" 
                onClick={() => setShowAddDelegateModal(true)}
                className="secondary"
                title="Nuevo Delegado"
                style={{ height: '40px', width: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <UserPlus size={18} />
              </button>
            </div>
          {showDelegates && searchTerm && (
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, right: 0, 
              background: '#1a1a1a', border: '1px solid var(--border-subtle)', 
              borderRadius: '8px', zIndex: 100, maxHeight: '150px', overflowY: 'auto',
              marginTop: '4px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
            }}>
              {filteredDelegates.length > 0 ? filteredDelegates.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => {
                    setFormData({ ...formData, delegate: d.id });
                    setSearchTerm(`${d.first_name} ${d.last_name}`);
                    setShowDelegates(false);
                  }}
                  style={{ padding: '10px 15px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                  className="table-row-hover"
                >
                  {d.first_name} {d.last_name} <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>({d.dni})</span>
                </div>
              )) : (
                <div style={{ padding: '10px 15px', fontSize: '12px', color: 'var(--text-muted)' }}>No se encontraron delegados</div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Escudo</label>
            <div style={{ 
              border: previews.logo ? '1px solid var(--border-subtle)' : '2px dashed var(--border-subtle)', 
              borderRadius: '12px', 
              padding: previews.logo ? '16px' : '24px', 
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
                      onClick={() => document.getElementById('logo-file-input').click()}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFile('logo')}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#e57373', borderColor: 'rgba(229,115,115,0.2)' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => document.getElementById('logo-file-input').click()} 
                  style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  <ImageIcon size={22} style={{ display: 'block', margin: '0 auto 6px' }} />
                  Subir Logo
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Foto Equipo</label>
            <div style={{ 
              border: previews.team_photo ? '1px solid var(--border-subtle)' : '2px dashed var(--border-subtle)', 
              borderRadius: '12px', 
              padding: previews.team_photo ? '16px' : '24px', 
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
                      onClick={() => document.getElementById('photo-file-input').click()}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <Pencil size={12} /> Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearFile('team_photo')}
                      className="secondary"
                      style={{ padding: '6px 10px', height: '30px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#e57373', borderColor: 'rgba(229,115,115,0.2)' }}
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                  </div>
                </>
              ) : (
                <div 
                  onClick={() => document.getElementById('photo-file-input').click()} 
                  style={{ cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)' }}
                >
                  <Upload size={22} style={{ display: 'block', margin: '0 auto 6px' }} />
                  Subir Foto
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(220, 60, 60, 0.1)', color: '#e07070', fontSize: '13px', border: '1px solid rgba(220, 60, 60, 0.2)' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="secondary" style={{ height: '40px' }}>Cancelar</button>
          <button type="submit" disabled={submitting} style={{ height: '40px' }}>
            {submitting ? '...' : <><Check size={18} /> {team ? 'Guardar' : 'Crear Equipo'}</>}
          </button>
        </div>
      </form>

      {showAddDelegateModal && (
        <div className="premium-modal-overlay" onClick={() => setShowAddDelegateModal(false)}>
          <div
            style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <DelegateForm 
              onClose={() => setShowAddDelegateModal(false)} 
              onSuccess={(newDelegate) => {
                setShowAddDelegateModal(false);
                fetchDelegates(newDelegate?.id);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamForm;
