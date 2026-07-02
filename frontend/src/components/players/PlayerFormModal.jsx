import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Image as ImageIcon } from 'lucide-react';

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, [field]: file });
      setPreviews({ ...previews, [field]: URL.createObjectURL(file) });
      setError('');
    }
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
    
    if (formData.photo instanceof File) data.append('photo', formData.photo);
    if (formData.dni_front instanceof File) data.append('dni_front', formData.dni_front);
    if (formData.dni_back instanceof File) data.append('dni_back', formData.dni_back);

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
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '20px', padding: '24px', marginBottom: '24px' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0, fontWeight: '700', color: 'var(--text-primary)' }}>
            {player ? 'Editar Jugador' : 'Nuevo Jugador'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
            Completa la información del jugador para la base de datos
          </p>
        </div>
        <button onClick={onClose} className="secondary" style={{ minWidth: 'auto', width: '32px', height: '32px', padding: 0 }}><X size={16} /></button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Nombre + Apellido */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre *</label>
            <input type="text" required value={formData.first_name} onChange={(e) => { setFormData({ ...formData, first_name: e.target.value }); setError(''); }} placeholder="Nombre del jugador" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Apellido *</label>
            <input type="text" required value={formData.last_name} onChange={(e) => { setFormData({ ...formData, last_name: e.target.value }); setError(''); }} placeholder="Apellido del jugador" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
        </div>

        {/* DNI + Nacimiento + Email */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DNI *</label>
            <input type="text" required value={formData.dni} onChange={(e) => { setFormData({ ...formData, dni: e.target.value }); setError(''); }} placeholder="DNI del jugador" style={{ height: '40px', borderColor: error ? '#e07070' : 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fecha de Nacimiento</label>
            <input type="date" value={formData.birth_date} onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })} style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Celular</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Ej. 2215551234" style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="ejemplo@email.com" style={{ height: '40px', borderColor: 'var(--border-subtle)' }} />
          </div>
        </div>

        {/* Imágenes */}
        <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '10px', marginBottom: '0', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>Fotos e Identificación</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Foto del Jugador</label>
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', position: 'relative', background: 'var(--brand-beige-subtle)', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'photo')} />
              {previews.photo ? (
                <img src={previews.photo} alt="Vista previa" style={{ height: '56px', borderRadius: '6px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Perfil
                </div>
              )}
            </div>
          </div>
          
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DNI (Frente)</label>
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', position: 'relative', background: 'var(--brand-beige-subtle)', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'dni_front')} />
              {previews.dni_front ? (
                <img src={previews.dni_front} alt="Vista previa" style={{ height: '56px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Frente DNI
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>DNI (Dorso)</label>
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', position: 'relative', background: 'var(--brand-beige-subtle)', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'dni_back')} />
              {previews.dni_back ? (
                <img src={previews.dni_back} alt="Vista previa" style={{ height: '56px', objectFit: 'contain' }} />
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  <ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Dorso DNI
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
            {submitting ? 'Guardando...' : <><Check size={18} /> {player ? 'Guardar' : 'Crear Jugador'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerFormModal;
