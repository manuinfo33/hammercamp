import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import {
  X,
  Check,
  Pencil,
  Trash2,
  User,
  FileText,
  Upload,
  AlertTriangle,
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

const PlayerFormModal = ({ player, onClose, onSuccess, inline = false }) => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

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
    dni_back: null,
  });

  const [previews, setPreviews] = useState({
    photo: player?.photo || null,
    dni_front: player?.dni_front || null,
    dni_back: player?.dni_back || null,
  });

  const [removedImages, setRemovedImages] = useState({
    photo: false,
    dni_front: false,
    dni_back: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [existingPlayerFound, setExistingPlayerFound] = useState(null);
  const [showDniConfirmModal, setShowDniConfirmModal] = useState(false);

  const checkExistingDni = async (dniVal) => {
    if (player?.id || !dniVal || dniVal.trim().length < 6) return;
    try {
      const res = await api.get(`players/?search=${dniVal.trim()}`);
      const exactMatch = (res.data || []).find(
        (p) => String(p.dni).trim() === dniVal.trim(),
      );
      if (exactMatch) {
        setExistingPlayerFound(exactMatch);
        setShowDniConfirmModal(true);
      }
    } catch (e) {
      console.error('Error checking DNI:', e);
    }
  };

  const handleUseExistingPlayerData = () => {
    if (!existingPlayerFound) return;
    setFormData((prev) => ({
      ...prev,
      first_name: existingPlayerFound.first_name || '',
      last_name: existingPlayerFound.last_name || '',
      dni: existingPlayerFound.dni || '',
      birth_date: existingPlayerFound.birth_date || '',
      email: existingPlayerFound.email || '',
      phone: existingPlayerFound.phone || '',
    }));
    setPreviews({
      photo: existingPlayerFound.photo || null,
      dni_front: existingPlayerFound.dni_front || null,
      dni_back: existingPlayerFound.dni_back || null,
    });
    setShowDniConfirmModal(false);
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
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.dni?.trim()) {
      setError('Completá los campos obligatorios (*).');
      return;
    }

    setSubmitting(true);

    const data = new FormData();
    data.append('first_name', formData.first_name.trim());
    data.append('last_name', formData.last_name.trim());
    data.append('dni', formData.dni.trim());

    if (formData.birth_date) data.append('birth_date', formData.birth_date);
    if (formData.email) data.append('email', formData.email.trim());
    if (formData.phone) data.append('phone', formData.phone.trim());

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
      } else if (existingPlayerFound && existingPlayerFound.dni === formData.dni.trim()) {
        response = await api.patch(`players/${existingPlayerFound.id}/`, data);
      } else {
        response = await api.post('players/', data);
      }
      onSuccess(response.data);
    } catch (err) {
      console.error('Error saving player:', err);
      if (err.response?.data?.dni) {
        const msg = Array.isArray(err.response.data.dni)
          ? err.response.data.dni[0]
          : err.response.data.dni;
        setError(msg);
        checkExistingDni(formData.dni.trim());
      } else {
        setError('Error al guardar el jugador. Verificá los datos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderUploadBox = (field, label, inputId, actionLabel, isSquare = false) => {
    const hasPreview = Boolean(previews[field]);
    return (
      <div>
        <label style={labelStyle}>{label}</label>
        <div
          style={{
            border: hasPreview ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce',
            borderRadius: 10,
            padding: isMobile ? 10 : 14,
            textAlign: 'center',
            background: '#faf9f6',
            minHeight: isMobile ? 102 : 118,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: hasPreview ? 'default' : 'pointer',
          }}
          onClick={() => !hasPreview && document.getElementById(inputId).click()}
        >
          <input
            type="file"
            id={inputId}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFileChange(e, field)}
          />

          {hasPreview ? (
            <>
              <div
                style={{
                  width: isSquare ? (isMobile ? 54 : 64) : '100%',
                  maxWidth: isSquare ? undefined : isMobile ? 110 : 150,
                  height: isMobile ? 54 : 64,
                  borderRadius: isSquare ? 8 : 6,
                  overflow: 'hidden',
                  border: '1px solid #e5e4df',
                  background: '#ffffff',
                }}
              >
                <img
                  src={previews[field]}
                  alt={label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: isSquare ? 'cover' : 'contain',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById(inputId).click();
                  }}
                  style={{ ...btnOutline, height: 28, padding: '0 8px', fontSize: 11 }}
                >
                  <Pencil size={11} /> {!isMobile && 'Modificar'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearFile(field);
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
            <div
              style={{
                pointerEvents: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Upload size={17} style={{ color: '#52514e' }} />
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#141413' }}>{actionLabel}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const formContent = (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: isMobile ? 14 : 20,
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 16 : 20,
      }}
    >
      {/* Sección 1: Datos personales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
                const textOnly = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                const val = textOnly.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
                setFormData({ ...formData, first_name: val });
                setError('');
              }}
              style={{
                ...inputStyle,
                borderColor: error && !formData.first_name ? '#dc2626' : '#e5e4df',
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>Apellido *</label>
            <input
              type="text"
              required
              value={formData.last_name}
              onChange={(e) => {
                const textOnly = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                const val = textOnly.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
                setFormData({ ...formData, last_name: val });
                setError('');
              }}
              style={{
                ...inputStyle,
                borderColor: error && !formData.last_name ? '#dc2626' : '#e5e4df',
              }}
            />
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: isMobile ? 10 : 14,
          }}
        >
          <div>
            <label style={labelStyle}>DNI *</label>
            <input
              type="text"
              inputMode="numeric"
              required
              value={formData.dni}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, dni: numericOnly });
                setError('');
              }}
              onBlur={() => checkExistingDni(formData.dni)}
              style={{
                ...inputStyle,
                borderColor: error && !formData.dni ? '#dc2626' : '#e5e4df',
              }}
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
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? 10 : 14,
          }}
        >
          <div>
            <label style={labelStyle}>Celular</label>
            <input
              type="tel"
              inputMode="numeric"
              value={formData.phone}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, phone: numericOnly });
              }}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Sección 2: Foto y documentación */}
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
            Foto y documentación
          </strong>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
            gap: isMobile ? 10 : 14,
          }}
        >
          <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            {renderUploadBox('photo', 'Foto de perfil', 'player-photo-input', 'Subir foto', true)}
          </div>
          {renderUploadBox('dni_front', 'DNI Frente', 'player-dni-front-input', 'Subir frente')}
          {renderUploadBox('dni_back', 'DNI Dorso', 'player-dni-back-input', 'Subir dorso')}
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
              <Check size={14} /> {player ? 'Guardar' : 'Crear'}
            </>
          )}
        </button>
      </div>
    </form>
  );

  const duplicateDniModal =
    showDniConfirmModal &&
    existingPlayerFound &&
    createPortal(
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(20, 20, 19, 0.45)',
          zIndex: 100060,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 14,
            maxWidth: 420,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.14)',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '15px 20px',
              borderBottom: '1px solid #efeee9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={16} style={{ color: '#d97706' }} />
              <h3 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: '#141413' }}>
                Jugador ya registrado
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowDniConfirmModal(false)}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 4,
                cursor: 'pointer',
                color: '#787772',
                boxShadow: 'none',
                minWidth: 0,
                height: 'auto',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div style={{ padding: '16px 20px', fontSize: 13, lineHeight: 1.5, color: '#52514e' }}>
            Ya existe un jugador con el DNI ingresado (
            <strong style={{ color: '#141413' }}>
              {existingPlayerFound.last_name}, {existingPlayerFound.first_name}
            </strong>
            ). ¿Querés cargar sus datos o modificar el DNI?
          </div>

          <div
            style={{
              padding: '12px 20px',
              background: '#faf9f6',
              borderTop: '1px solid #efeee9',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowDniConfirmModal(false);
                setFormData((f) => ({ ...f, dni: '' }));
              }}
              style={btnOutline}
            >
              Modificar DNI
            </button>
            <button type="button" onClick={handleUseExistingPlayerData} style={btnDark}>
              Usar datos
            </button>
          </div>
        </div>
      </div>,
      document.body,
    );

  if (inline) {
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
        {formContent}
        {duplicateDniModal}
      </div>
    );
  }

  return (
    <>
      {createPortal(
        <div
          className="anthropic-theme animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 20, 19, 0.45)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? 12 : 20,
            overflowY: 'auto',
          }}
          onClick={onClose}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 14,
              maxWidth: 640,
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.16)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: isMobile ? '14px 16px' : '16px 20px',
                borderBottom: '1px solid #efeee9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#141413' }}>
                {player ? 'Editar jugador' : 'Nuevo jugador'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  cursor: 'pointer',
                  color: '#787772',
                  boxShadow: 'none',
                  minWidth: 0,
                  height: 'auto',
                }}
              >
                <X size={17} />
              </button>
            </div>
            {formContent}
          </div>
        </div>,
        document.body,
      )}
      {duplicateDniModal}
    </>
  );
};

export default PlayerFormModal;
