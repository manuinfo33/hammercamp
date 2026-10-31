import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  Check,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  User,
  Lock,
  FileText,
  Upload,
} from 'lucide-react';
import '../../styles/data.css';

const btnOutline = {
  height: 34,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 500,
  background: '#ffffff',
  color: '#18181b',
  border: '1px solid #d4d3ce',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const btnDark = {
  height: 34,
  padding: '0 16px',
  borderRadius: 8,
  fontSize: 12.5,
  fontWeight: 600,
  background: '#141413',
  color: '#ffffff',
  border: '1px solid #141413',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  gap: 6,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#52514e',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  fontSize: 13,
  borderRadius: 8,
  background: '#faf9f6',
  border: '1px solid #e5e4df',
  color: '#141413',
  margin: 0,
  boxSizing: 'border-box',
};

const DelegateForm = ({ delegate, onClose, onSuccess }) => {
  const [teams, setTeams] = useState([]);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    dni_back: null,
  });
  const [previews, setPreviews] = useState({
    dni_front: delegate?.dni_front || null,
    dni_back: delegate?.dni_back || null,
  });
  const [removedImages, setRemovedImages] = useState({
    dni_front: false,
    dni_back: false,
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
      const sorted = (response.data || []).sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }),
      );
      setTeams(sorted);
    } catch (err) {
      console.error('Error fetching teams:', err);
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
    } catch (err) {
      console.error('Error saving delegate:', err);
      if (err.response?.data?.dni) {
        const msg = Array.isArray(err.response.data.dni)
          ? err.response.data.dni[0]
          : err.response.data.dni;
        setError(msg);
      } else if (err.response?.data?.username) {
        const msg = Array.isArray(err.response.data.username)
          ? err.response.data.username[0]
          : err.response.data.username;
        setError(msg);
      } else {
        setError('Error al guardar el delegado. Verificá los datos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="anthropic-theme animate-fade-in"
      style={{
        background: '#ffffff',
        border: '1px solid #e5e4df',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          padding: isMobile ? 14 : 20,
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? 16 : 20,
        }}
      >
        {/* Sección 1: Acceso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#dcd8ea',
                color: '#2c2545',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={12.5} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13, fontWeight: 700, color: '#141413' }}>Acceso</strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gap: isMobile ? 12 : 14,
            }}
          >
            <div>
              <label style={labelStyle}>Usuario *</label>
              <input
                type="text"
                required
                autoComplete="off"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setError('');
                }}
                style={{
                  ...inputStyle,
                  borderColor:
                    error && String(error).toLowerCase().includes('usuario')
                      ? '#dc2626'
                      : '#e5e4df',
                }}
              />
            </div>

            <div>
              <label style={labelStyle}>Contraseña {delegate ? '(opcional)' : '*'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required={!delegate}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setError('');
                  }}
                  style={{ ...inputStyle, paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    padding: 4,
                    cursor: 'pointer',
                    color: '#787772',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 0,
                    height: 'auto',
                    boxShadow: 'none',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Datos Personales */}
        <div
          style={{
            borderTop: '1px solid #efeee9',
            paddingTop: isMobile ? 14 : 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#7cb2f4',
                color: '#132a4a',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={12.5} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13, fontWeight: 700, color: '#141413' }}>
              Datos personales
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? 10 : 14,
            }}
          >
            <div>
              <label style={labelStyle}>Nombre *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => {
                  const val = e.target.value.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
                  setFormData({ ...formData, first_name: val });
                  setError('');
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Apellido *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => {
                  const val = e.target.value.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
                  setFormData({ ...formData, last_name: val });
                  setError('');
                }}
                style={inputStyle}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? 10 : 14,
            }}
          >
            <div>
              <label style={labelStyle}>DNI</label>
              <input
                type="text"
                value={formData.dni}
                onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Nacimiento</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <label style={labelStyle}>Equipo</label>
              <select
                value={formData.team}
                onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                style={inputStyle}
              >
                <option value="">Ninguno</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Dirección</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Sección 3: Identificación DNI */}
        <div
          style={{
            borderTop: '1px solid #efeee9',
            paddingTop: isMobile ? 14 : 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#c8ded3',
                color: '#1f3a2e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={12.5} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13, fontWeight: 700, color: '#141413' }}>
              Identificación DNI
            </strong>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: isMobile ? 10 : 14,
            }}
          >
            <div>
              <label style={labelStyle}>DNI Frente</label>
              <div
                style={{
                  border: previews.dni_front ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce',
                  borderRadius: 10,
                  padding: isMobile ? 10 : 14,
                  textAlign: 'center',
                  background: '#faf9f6',
                  minHeight: isMobile ? 104 : 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: previews.dni_front ? 'default' : 'pointer',
                }}
                onClick={() =>
                  !previews.dni_front && document.getElementById('delegate-dni-front-input').click()
                }
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
                    <div
                      style={{
                        width: '100%',
                        maxWidth: isMobile ? 110 : 160,
                        height: isMobile ? 56 : 74,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid #e5e4df',
                        background: '#ffffff',
                      }}
                    >
                      <img
                        src={previews.dni_front}
                        alt="DNI Frente"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('delegate-dni-front-input').click();
                        }}
                        style={{ ...btnOutline, height: 28, padding: '0 8px', fontSize: 11 }}
                      >
                        <Pencil size={11} /> {!isMobile && 'Modificar'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile('dni_front');
                        }}
                        style={{
                          ...btnOutline,
                          height: 28,
                          padding: '0 8px',
                          fontSize: 11,
                          color: '#991b1b',
                          borderColor: '#fecaca',
                        }}
                      >
                        <Trash2 size={11} /> {!isMobile && 'Eliminar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Upload size={17} style={{ color: '#52514e' }} />
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#141413' }}>
                      Subir frente
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label style={labelStyle}>DNI Dorso</label>
              <div
                style={{
                  border: previews.dni_back ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce',
                  borderRadius: 10,
                  padding: isMobile ? 10 : 14,
                  textAlign: 'center',
                  background: '#faf9f6',
                  minHeight: isMobile ? 104 : 120,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: previews.dni_back ? 'default' : 'pointer',
                }}
                onClick={() =>
                  !previews.dni_back && document.getElementById('delegate-dni-back-input').click()
                }
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
                    <div
                      style={{
                        width: '100%',
                        maxWidth: isMobile ? 110 : 160,
                        height: isMobile ? 56 : 74,
                        borderRadius: 6,
                        overflow: 'hidden',
                        border: '1px solid #e5e4df',
                        background: '#ffffff',
                      }}
                    >
                      <img
                        src={previews.dni_back}
                        alt="DNI Dorso"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          document.getElementById('delegate-dni-back-input').click();
                        }}
                        style={{ ...btnOutline, height: 28, padding: '0 8px', fontSize: 11 }}
                      >
                        <Pencil size={11} /> {!isMobile && 'Modificar'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFile('dni_back');
                        }}
                        style={{
                          ...btnOutline,
                          height: 28,
                          padding: '0 8px',
                          fontSize: 11,
                          color: '#991b1b',
                          borderColor: '#fecaca',
                        }}
                      >
                        <Trash2 size={11} /> {!isMobile && 'Eliminar'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Upload size={17} style={{ color: '#52514e' }} />
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#141413' }}>
                      Subir dorso
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#fef2f2',
              color: '#991b1b',
              fontSize: 12.5,
              border: '1px solid #fecaca',
            }}
          >
            {typeof error === 'object' ? Object.values(error).flat().join(', ') : error}
          </div>
        )}

        <div
          style={{
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? '1fr 1fr' : undefined,
            justifyContent: 'flex-end',
            gap: 8,
            paddingTop: 12,
            borderTop: '1px solid #efeee9',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{ ...btnOutline, height: isMobile ? 38 : 34, width: isMobile ? '100%' : 'auto' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...btnDark, height: isMobile ? 38 : 34, width: isMobile ? '100%' : 'auto' }}
          >
            {submitting ? (
              '…'
            ) : (
              <>
                <Check size={14} /> {delegate ? 'Guardar' : 'Crear'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DelegateForm;
