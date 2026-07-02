import React, { useState, useEffect } from 'react';
import api from '../../api';
import { X, Check, Image as ImageIcon } from 'lucide-react';

const DelegateForm = ({ delegate, onClose, onSuccess }) => {
  const [teams, setTeams] = useState([]);
  const [formData, setFormData] = useState({
    first_name: delegate?.first_name || '',
    last_name: delegate?.last_name || '',
    dni: delegate?.dni || '',
    address: delegate?.address || '',
    birth_date: delegate?.birth_date || '',
    team: delegate?.team || '',
    dni_front: null,
    dni_back: null
  });
  const [previews, setPreviews] = useState({
    dni_front: delegate?.dni_front || null,
    dni_back: delegate?.dni_back || null
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setError('');
    }
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
    
    if (formData.dni_front instanceof File) data.append('dni_front', formData.dni_front);
    if (formData.dni_back instanceof File) data.append('dni_back', formData.dni_back);

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
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Completa la información del representante del equipo</p>
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
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', position: 'relative', background: 'var(--brand-beige-subtle)' }}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'dni_front')} />
              {previews.dni_front ? <img src={previews.dni_front} alt="" style={{ height: '40px', objectFit: 'contain' }} /> : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Subir Frente</div>}
            </div>
          </div>
          <div className="input-group">
            <label style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Foto DNI (Dorso)</label>
            <div style={{ border: '2px dashed var(--border-subtle)', borderRadius: '12px', padding: '12px', textAlign: 'center', position: 'relative', background: 'var(--brand-beige-subtle)' }}>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileChange(e, 'dni_back')} />
              {previews.dni_back ? <img src={previews.dni_back} alt="" style={{ height: '40px', objectFit: 'contain' }} /> : <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}><ImageIcon size={18} style={{ display: 'block', margin: '0 auto 4px' }} /> Subir Dorso</div>}
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
            {submitting ? '...' : <><Check size={18} /> {delegate ? 'Guardar' : 'Crear Delegado'}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DelegateForm;
