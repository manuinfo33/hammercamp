import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import { 
  X, Check, Image as ImageIcon, Pencil, Trash2, User, Phone, Mail, 
  Calendar, FileText, Upload, ArrowLeft, UserPlus, Camera, Image,
  AlertTriangle, ChevronLeft, ChevronRight
} from 'lucide-react';

// Selector de fecha inteligente con desplegable que calcula posición arriba/abajo
const BirthDatePicker = ({ value, onChange, isMobile }) => {
  const [open, setOpen] = useState(false);
  const [positionUp, setPositionUp] = useState(false);
  const containerRef = useRef(null);

  // Inicializar año y mes para visualización
  const parseDate = (val) => {
    if (!val) {
      const now = new Date();
      return { year: 2000, month: 0, day: null };
    }
    const parts = val.split('-');
    if (parts.length === 3) {
      return { 
        year: parseInt(parts[0], 10), 
        month: parseInt(parts[1], 10) - 1, 
        day: parseInt(parts[2], 10) 
      };
    }
    return { year: 2000, month: 0, day: null };
  };

  const initial = parseDate(value);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  useEffect(() => {
    if (value) {
      const p = parseDate(value);
      setViewYear(p.year);
      setViewMonth(p.month);
    }
  }, [value]);

  // Al abrir, medir espacio en pantalla para decidir si abre arriba o abajo
  const handleToggle = () => {
    if (!open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const footerOffset = isMobile ? 120 : 60;
      const spaceBelow = viewportHeight - rect.bottom - footerOffset;
      const spaceAbove = rect.top - (isMobile ? 60 : 20);
      // El calendario mide aprox 280px de alto. Si abajo no entra bien y arriba hay más lugar, abre hacia arriba
      if (spaceBelow < 280 && spaceAbove > spaceBelow) {
        setPositionUp(true);
      } else {
        setPositionUp(false);
      }
    }
    setOpen(!open);
  };

  // Cerrar al clickear afuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Días del mes
  const monthsNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 es domingo

  const handleSelectDay = (day) => {
    const mStr = String(viewMonth + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    onChange(`${viewYear}-${mStr}-${dStr}`);
    setOpen(false);
  };

  const currentSelected = parseDate(value);

  // Formato dd/mm/aaaa para display
  const displayFormatted = value ? (() => {
    const parts = value.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return value;
  })() : '';

  const yearsOptions = [];
  for (let y = 2020; y >= 1940; y--) {
    yearsOptions.push(y);
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Botón o recuadro del input */}
      <div 
        onClick={handleToggle}
        style={{
          width: '100%',
          height: '46px',
          background: '#ffffff',
          border: '1px solid #d8cfc0',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '10px',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <Calendar size={16} color="#a69b8c" style={{ flexShrink: 0 }} />
        <span style={{ 
          fontSize: '14px', 
          color: displayFormatted ? '#191919' : '#a69b8c',
          fontWeight: displayFormatted ? '500' : '400',
          userSelect: 'none'
        }}>
          {displayFormatted || 'Fecha de nacimiento'}
        </span>
      </div>

      {/* Popover del calendario desplegable con posición inteligente */}
      {open && (
        <div 
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            ...(positionUp 
              ? { bottom: 'calc(100% + 6px)' } 
              : { top: 'calc(100% + 6px)' }
            ),
            left: isMobile ? 0 : 'auto',
            right: 0,
            width: isMobile ? '100%' : '290px',
            minWidth: '260px',
            maxWidth: '320px',
            background: '#ffffff',
            border: '1px solid #d8cfc0',
            borderRadius: '14px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.22)',
            zIndex: 10025,
            padding: '14px',
            boxSizing: 'border-box',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Header con selectores de mes y año */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) {
                  setViewMonth(11);
                  setViewYear(y => Math.max(1940, y - 1));
                } else {
                  setViewMonth(m => m - 1);
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                maxWidth: '32px',
                maxHeight: '32px',
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                border: '1px solid #e0d8cc',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f4ef'; e.currentTarget.style.borderColor = '#cc7a5c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e0d8cc'; }}
            >
              <ChevronLeft size={16} color="#332f2b" />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                style={{
                  height: '32px',
                  padding: '0 8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#191919',
                  background: '#fcfbfa',
                  border: '1px solid #d8cfc0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: 'auto'
                }}
              >
                {monthsNames.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                style={{
                  height: '32px',
                  padding: '0 8px',
                  fontSize: '12.5px',
                  fontWeight: '600',
                  color: '#191919',
                  background: '#fcfbfa',
                  border: '1px solid #d8cfc0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  width: 'auto'
                }}
              >
                {yearsOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) {
                  setViewMonth(0);
                  setViewYear(y => Math.min(2020, y + 1));
                } else {
                  setViewMonth(m => m + 1);
                }
              }}
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                minHeight: '32px',
                maxWidth: '32px',
                maxHeight: '32px',
                aspectRatio: '1 / 1',
                borderRadius: '50%',
                border: '1px solid #e0d8cc',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f4ef'; e.currentTarget.style.borderColor = '#cc7a5c'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#e0d8cc'; }}
            >
              <ChevronRight size={16} color="#332f2b" />
            </button>
          </div>

          {/* Días de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '6px' }}>
            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
              <span key={d} style={{ fontSize: '11px', fontWeight: '700', color: '#9c9284' }}>{d}</span>
            ))}
          </div>

          {/* Grilla de días */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = currentSelected.year === viewYear && currentSelected.month === viewMonth && currentSelected.day === dayNum;
              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: isSelected ? '700' : '500',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: isSelected ? '#191919' : 'transparent',
                    color: isSelected ? '#ffffff' : '#262422',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f2ede4'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>

          {value && (
            <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eae4d8', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setOpen(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#cc7a5c',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: '2px 4px'
                }}
              >
                Limpiar fecha
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const PlayerFormModal = ({ player, onClose, onSuccess }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activePhotoMenu, setActivePhotoMenu] = useState(null); // 'photo' | 'dni_front' | 'dni_back' | null
  const [customConfirm, setCustomConfirm] = useState(null);
  const [confirmExiting, setConfirmExiting] = useState(false);
  const photoMenuRef = useRef(null);

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
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [existingPlayerFound, setExistingPlayerFound] = useState(null);
  const [showDniConfirmModal, setShowDniConfirmModal] = useState(false);

  const checkExistingDni = async (dniVal) => {
    if (player?.id || !dniVal || dniVal.trim().length < 6) return;
    try {
      const res = await api.get(`players/?search=${dniVal.trim()}`);
      const exactMatch = res.data.find(p => String(p.dni).trim() === dniVal.trim());
      if (exactMatch) {
        setExistingPlayerFound(exactMatch);
        setShowDniConfirmModal(true);
      }
    } catch (e) {
      console.error("Error checking DNI:", e);
    }
  };

  const handleUseExistingPlayerData = () => {
    if (!existingPlayerFound) return;
    setFormData(prev => ({
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
      dni_back: existingPlayerFound.dni_back || null
    });
    setShowDniConfirmModal(false);
  };

  const triggerCloseConfirm = (confirmed) => {
    setConfirmExiting(true);
    setTimeout(() => {
      if (confirmed && customConfirm?.onConfirm) {
        customConfirm.onConfirm();
      } else if (!confirmed && customConfirm?.onCancel) {
        customConfirm.onCancel();
      }
      setCustomConfirm(null);
      setConfirmExiting(false);
    }, 200);
  };

  const handleDeletePlayer = () => {
    if (!player?.id) {
      // Si aún no se creó en BD, borrar resetea el formulario y cierra
      setCustomConfirm({
        title: 'Atención',
        message: '¿Seguro que desea borrar el jugador/a?',
        confirmText: 'Ok',
        cancelText: 'Cancelar',
        onConfirm: () => {
          onClose();
        }
      });
      return;
    }

    setCustomConfirm({
      title: 'Atención',
      message: '¿Seguro que desea borrar el jugador/a?',
      confirmText: 'Ok',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await api.delete(`players/${player.id}/`);
          onSuccess && onSuccess(null);
          onClose();
        } catch (err) {
          console.error("Error al borrar jugador:", err);
          setError("No se pudo eliminar el jugador. Intente nuevamente.");
        } finally {
          setDeleting(false);
        }
      }
    });
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

    // Validación manual de campos obligatorios requeridos
    if (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.dni?.trim()) {
      setError('Por favor completá los campos obligatorios (*)');
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
    } catch (error) {
      console.error("Error saving player:", error);
      if (error.response?.data?.dni) {
        const msg = Array.isArray(error.response.data.dni) ? error.response.data.dni[0] : error.response.data.dni;
        setError(msg);
        checkExistingDni(formData.dni.trim());
      } else {
        setError('Hubo un error al guardar el jugador. Por favor, verifica los datos e intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Cerrar el menú contextual al hacer click afuera
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (photoMenuRef.current && !photoMenuRef.current.contains(e.target)) {
        setActivePhotoMenu(null);
      }
    };
    if (activePhotoMenu) {
      document.addEventListener('mousedown', handleGlobalClick);
      document.addEventListener('touchstart', handleGlobalClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick);
      document.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [activePhotoMenu]);

  // Disparar input de archivo para galería o cámara
  const triggerImagePicker = (field, useCamera = false) => {
    setActivePhotoMenu(null);
    const inputId = useCamera ? `picker-camera-${field}` : `picker-gallery-${field}`;
    const el = document.getElementById(inputId);
    if (el) el.click();
  };

  const renderImageUploadBox = (field, label, inputId, defaultText) => {
    const hasPreview = !!previews[field];

    return (
      <div className="input-group" style={{ margin: 0 }}>
        <label style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f', marginBottom: '4px' }}>{label}</label>
        <div style={{ 
          border: hasPreview ? '1px solid #d8cfc0' : '2px dashed #c4b9a3', 
          borderRadius: '10px', 
          padding: '10px', 
          textAlign: 'center', 
          position: 'relative', 
          background: '#ffffff', 
          minHeight: '130px', 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '8px',
          cursor: hasPreview ? 'default' : 'pointer'
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%' }}>
              <div style={{ 
                position: 'relative', 
                width: field === 'photo' ? '70px' : '90px', 
                height: '70px', 
                borderRadius: '8px', 
                overflow: 'hidden',
                background: '#f4efe6',
                border: '1px solid #e6dfd3',
                flexShrink: 0
              }}>
                <img 
                  src={previews[field]} 
                  alt={label} 
                  style={{ width: '100%', height: '100%', objectFit: field === 'photo' ? 'cover' : 'contain' }} 
                />
              </div>

              {/* Botones SOLO ICONO (Pencil y Trash) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
                <button
                  type="button"
                  title="Cambiar foto"
                  onClick={(e) => { e.stopPropagation(); document.getElementById(inputId).click(); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #d8cfc0',
                    background: '#ffffff',
                    color: '#383530',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f4efe6'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  type="button"
                  title="Borrar foto"
                  onClick={(e) => { e.stopPropagation(); handleClearFile(field); }}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1px solid #e5c5bb',
                    background: '#ffffff',
                    color: '#cc7a5c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fcf0ed'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ pointerEvents: 'none' }}>
              <Upload size={22} style={{ color: '#cc7a5c', marginBottom: '4px' }} />
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#191919' }}>{defaultText}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper para imágenes circulares en Mobile (estilo foto perfil y documentación de la referencia)
  const renderMobileCircleUpload = (field, size = 110, isAvatar = false) => {
    const hasPreview = !!previews[field];
    const isMenuOpen = activePhotoMenu === field;

    const handleCircleOrPencilClick = (e) => {
      e.stopPropagation();
      setActivePhotoMenu(prev => prev === field ? null : field);
    };

    const btnDim = size > 90 ? 34 : 28;
    const iconDim = size > 90 ? 14 : 12;

    return (
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, margin: '0 auto', flexShrink: 0 }}>
        {/* Hidden file input for Galería (sin capture) */}
        <input 
          type="file" 
          id={`picker-gallery-${field}`}
          accept="image/*" 
          style={{ display: 'none' }} 
          onChange={(e) => handleFileChange(e, field)} 
        />

        {/* Hidden file input for Cámara (con capture="environment") */}
        <input 
          type="file" 
          id={`picker-camera-${field}`}
          accept="image/*" 
          capture="environment"
          style={{ display: 'none' }} 
          onChange={(e) => handleFileChange(e, field)} 
        />
        
        {/* Círculo contenedor - pulsar abre el menú */}
        <div 
          onClick={handleCircleOrPencilClick}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            backgroundColor: '#e3dfd7',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: hasPreview ? '2px solid #ffffff' : '2px dashed #c4b9a3',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'relative'
          }}
        >
          {hasPreview ? (
            <img 
              src={previews[field]} 
              alt={field} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : isAvatar ? (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8275' }}>
              <User size={size * 0.58} strokeWidth={1.5} />
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8275' }}>
              <ImageIcon size={size * 0.45} strokeWidth={1.5} />
            </div>
          )}
        </div>

        {/* Botón flotante del lápiz - 100% REDONDO con box-sizing y dimensiones fijas */}
        <div
          role="button"
          tabIndex={0}
          title="Opciones de foto"
          onClick={handleCircleOrPencilClick}
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${btnDim}px`,
            height: `${btnDim}px`,
            minWidth: `${btnDim}px`,
            maxWidth: `${btnDim}px`,
            minHeight: `${btnDim}px`,
            maxHeight: `${btnDim}px`,
            borderRadius: '50%',
            background: '#191919',
            color: '#ffffff',
            boxShadow: '0 0 0 2.5px #ffffff, 0 3px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            zIndex: 10,
            boxSizing: 'border-box'
          }}
        >
          <Pencil size={iconDim} />
        </div>

        {/* Menú desplegable flotante estilo "3 puntitos" - opciones al extremo izquierdo */}
        {isMenuOpen && (
          <div 
            ref={photoMenuRef}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: `${size + 8}px`,
              left: field === 'photo' ? '0' : 'auto',
              right: field === 'photo' ? 'auto' : '0',
              zIndex: 10020,
              background: '#ffffff',
              border: '1px solid #d8cfc0',
              borderRadius: '14px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.22)',
              minWidth: '180px',
              padding: '6px 0',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {/* Opción 1: Galería */}
            <button
              type="button"
              onClick={() => triggerImagePicker(field, false)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                color: '#262422',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f4ee'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Image size={17} color="#cc7a5c" style={{ flexShrink: 0 }} />
              <span style={{ textAlign: 'left' }}>Galería</span>
            </button>

            {/* Opción 2: Cámara */}
            <button
              type="button"
              onClick={() => triggerImagePicker(field, true)}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                color: '#262422',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f4ee'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <Camera size={17} color="#cc7a5c" style={{ flexShrink: 0 }} />
              <span style={{ textAlign: 'left' }}>Cámara</span>
            </button>

            {/* Opción 3: Borrar (solo si hay foto cargada o preview) */}
            {hasPreview && (
              <>
                <div style={{ height: '1px', background: '#eae4d8', margin: '4px 0' }} />
                <button
                  type="button"
                  onClick={() => {
                    handleClearFile(field);
                    setActivePhotoMenu(null);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '12px',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <Trash2 size={17} color="#dc2626" style={{ flexShrink: 0 }} />
                  <span style={{ textAlign: 'left' }}>Borrar</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const formFieldsJSX = (
    <form id="player-form-element" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
      
      {/* Sección 1: Documentación y Foto (Primer método de carga) */}
      <div>
        {!isMobile && (
          <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={13} /> Documentación y Foto
          </h3>
        )}
        
        {isMobile ? (
          /* Diseño Mobile estilo captura de referencia: Foto de perfil grande a la izquierda, Documentación a la derecha */
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '16px', 
            padding: '14px 8px 18px',
            alignItems: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #eae4d8',
            marginBottom: '4px',
            position: 'relative'
          }}>
            {/* Foto del jugador */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f' }}>Foto del jugador/a</span>
              {renderMobileCircleUpload('photo', 110, true)}
            </div>

            {/* Documentación (Frente y Dorso apilados) */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#7f776f' }}>Documentación</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderMobileCircleUpload('dni_front', 58, false)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {renderMobileCircleUpload('dni_back', 58, false)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr', 
            gap: '12px' 
          }}>
            {renderImageUploadBox('photo', 'Foto de Perfil', 'player-photo-input', 'Subir Foto')}
            {renderImageUploadBox('dni_front', 'DNI Frente', 'player-dni-front-input', 'Subir Frente')}
            {renderImageUploadBox('dni_back', 'DNI Dorso', 'player-dni-back-input', 'Subir Dorso')}
          </div>
        )}
      </div>

      {/* Sección 2: Datos Personales (En Mobile sin título y en una sola columna) */}
      <div style={{ borderTop: isMobile ? 'none' : '1px solid #eae4d8', paddingTop: isMobile ? '0px' : '16px' }}>
        {!isMobile && (
          <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={13} /> Datos Personales
          </h3>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Nombre & Apellido: en móvil uno abajo del otro (1fr), en desktop 1fr 1fr */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px' }}>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
              <input 
                type="text" 
                placeholder="Nombre *"
                value={formData.first_name} 
                onChange={(e) => { 
                  // Formato texto: solo letras, acentos y espacios
                  const textOnly = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                  const val = textOnly.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); 
                  setFormData({ ...formData, first_name: val }); 
                  setError(''); 
                }} 
                style={{ 
                  paddingLeft: '38px', 
                  height: '46px',
                  borderColor: error && !formData.first_name ? '#e07070' : '#d8cfc0',
                  background: '#ffffff',
                  color: '#191919',
                  fontSize: '14px',
                  borderRadius: '8px'
                }} 
              />
            </div>

            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
              <input 
                type="text" 
                placeholder="Apellido *"
                value={formData.last_name} 
                onChange={(e) => { 
                  // Formato texto: solo letras, acentos y espacios
                  const textOnly = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
                  const val = textOnly.replace(/(^\w|\s\w)/g, m => m.toUpperCase()); 
                  setFormData({ ...formData, last_name: val }); 
                  setError(''); 
                }} 
                style={{ 
                  paddingLeft: '38px', 
                  height: '46px',
                  borderColor: error && !formData.last_name ? '#e07070' : '#d8cfc0',
                  background: '#ffffff',
                  color: '#191919',
                  fontSize: '14px',
                  borderRadius: '8px'
                }} 
              />
            </div>
          </div>

          {/* DNI & Fecha de Nacimiento: en móvil uno abajo del otro (1fr), en desktop 1fr 1fr */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px' }}>
            <div style={{ position: 'relative' }}>
              <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="DNI *"
                value={formData.dni} 
                onChange={(e) => { 
                  const numericOnly = e.target.value.replace(/\D/g, '');
                  setFormData({ ...formData, dni: numericOnly }); 
                  setError(''); 
                }} 
                onBlur={() => checkExistingDni(formData.dni)}
                style={{ 
                  paddingLeft: '38px', 
                  height: '46px',
                  borderColor: error && !formData.dni ? '#e07070' : '#d8cfc0',
                  background: '#ffffff',
                  color: '#191919',
                  fontSize: '14px',
                  borderRadius: '8px'
                }} 
              />
            </div>

            <BirthDatePicker 
              value={formData.birth_date} 
              onChange={(val) => setFormData({ ...formData, birth_date: val })} 
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* Sección 3: Contacto (En Mobile sin título y en una sola columna) */}
      <div style={{ borderTop: isMobile ? 'none' : '1px solid #eae4d8', paddingTop: isMobile ? '0px' : '16px' }}>
        {!isMobile && (
          <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} /> Contacto
          </h3>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '12px' : '16px' }}>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
            <input 
              type="tel"
              inputMode="numeric" 
              placeholder="Celular"
              value={formData.phone} 
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, phone: numericOnly });
              }} 
              style={{ 
                paddingLeft: '38px', 
                height: '46px', 
                borderColor: '#d8cfc0',
                background: '#ffffff',
                color: '#191919',
                fontSize: '14px',
                borderRadius: '8px'
              }} 
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a69b8c' }} />
            <input 
              type="email" 
              placeholder="Email"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              style={{ 
                paddingLeft: '38px', 
                height: '46px', 
                borderColor: '#d8cfc0',
                background: '#ffffff',
                color: '#191919',
                fontSize: '14px',
                borderRadius: '8px'
              }} 
            />
          </div>
        </div>
      </div>

      {/* Error debajo del recuadro del formulario, en color rojo y sin negrita */}
      {error && (
        <div style={{ 
          color: '#dc2626', 
          fontSize: '13px', 
          fontWeight: '400', 
          marginTop: '2px',
          textAlign: 'left'
        }}>
          {error}
        </div>
      )}

      {/* En Desktop mantenemos los botones en el form, en móvil van fijos abajo */}
      {!isMobile && (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row',
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
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              background: '#ffffff',
              border: '1px solid #d8cfc0',
              color: '#4b5563'
            }}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={submitting} 
            style={{ 
              height: '42px', 
              borderRadius: '10px',
              background: '#191919',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Guardando...' : (
              <>
                <Check size={16} /> 
                {player ? 'Guardar Cambios' : 'Guardar'}
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );

  // Botones fijos inferiores estilo "Editar equipo" (Guardar verde / Borrar rojo)
  const fixedFooterActionButtons = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      <button 
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          width: '100%',
          height: '44px',
          background: '#4cd964',
          color: '#ffffff',
          border: 'none',
          borderRadius: '22px',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(76,217,100,0.3)',
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#3fc456'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#4cd964'; }}
      >
        {submitting ? "GUARDANDO..." : "GUARDAR"}
      </button>
      
      <button 
        type="button"
        onClick={handleDeletePlayer}
        disabled={deleting}
        style={{
          width: '100%',
          height: '44px',
          background: '#ff3b30',
          color: '#ffffff',
          border: 'none',
          borderRadius: '22px',
          fontSize: '14px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(255,59,48,0.3)',
          transition: 'background 0.15s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#e0352b'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#ff3b30'; }}
      >
        {deleting ? "BORRANDO..." : "BORRAR"}
      </button>
    </div>
  );

  // Cuadro de confirmación CustomConfirm (Alerta Atención con Ok / Cancelar)
  const confirmModalJSX = customConfirm && createPortal(
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 100020,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      className="animate-fade-in"
      onClick={() => triggerCloseConfirm(false)}
    >
      <div 
        style={{
          background: '#ffffff',
          border: '1px solid #e6dfd3',
          borderRadius: '16px',
          maxWidth: '420px',
          width: '100%',
          padding: '24px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: '#fff3cd',
              border: '1px solid #ffeeba',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={18} color="#856404" />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#191919' }}>
              {customConfirm.title || 'Atención'}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => triggerCloseConfirm(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '14px', color: '#383530', margin: 0, lineHeight: '1.5', fontWeight: '500' }}>
          {customConfirm.message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => triggerCloseConfirm(false)}
            style={{
              height: '38px',
              padding: '0 16px',
              background: '#ffffff',
              border: '1px solid #d8cfc0',
              borderRadius: '8px',
              color: '#191919',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            {customConfirm.cancelText || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => triggerCloseConfirm(true)}
            style={{
              height: '38px',
              padding: '0 20px',
              background: '#191919',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#333333'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#191919'; }}
          >
            {customConfirm.confirmText || 'Ok'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );

  // DESKTOP MODAL OVERLAY
  if (!isMobile) {
    return (
      <>
        {createPortal(
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(8, 7, 6, 0.82)',
              zIndex: 10005,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              overflowY: 'auto'
            }}
            className="animate-fade-in anthropic-theme"
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
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#191919' }}>
                    {player ? 'Editar Jugador' : 'Nuevo Jugador'}
                  </h3>
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
        )}
        {confirmModalJSX}
      </>
    );
  }

  // MOBILE FULLSCREEN OVERLAY (Con footer fijo idéntico a Editar Equipo)
  return (
    <>
      {createPortal(
        <div 
          className="anthropic-theme animate-fade-in" 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10005,
            background: '#fcfbfa',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Mobile Header Bar fijo */}
          <div style={{
            height: '56px',
            background: '#fdfcfb',
            borderBottom: '1px solid #eae4d8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            color: '#383530',
            flexShrink: 0,
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

          {/* Área de formulario scrolleable libremente */}
          <div style={{ 
            padding: '16px 16px 24px', 
            flex: 1, 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            {formFieldsJSX}
          </div>

          {/* Footer fijo inferior en la pantalla con botones GUARDAR y BORRAR */}
          <div style={{
            background: '#fdfcfb',
            borderTop: '1px solid #eae4d8',
            padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
            flexShrink: 0,
            zIndex: 100,
            boxShadow: '0 -4px 16px rgba(25, 20, 15, 0.05)'
          }}>
            {fixedFooterActionButtons}
          </div>
        </div>,
        document.body
      )}
      {confirmModalJSX}
      {showDniConfirmModal && existingPlayerFound && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 100060,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowDniConfirmModal(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '430px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(255, 179, 0, 0.15)',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <AlertTriangle size={28} />
            </div>

            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#191919' }}>
              Atención: Jugador/a ya existente
            </h3>

            <p style={{ margin: 0, fontSize: '14px', color: '#444444', lineHeight: '1.5' }}>
              Ya existe un jugador con el DNI ingresado (<strong>{existingPlayerFound.last_name}, {existingPlayerFound.first_name}</strong>).
              <br /><br />
              ¿Desea usar los datos de este jugador/a? De lo contrario modificar el DNI.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleUseExistingPlayerData}
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: '#038c4c',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Usar datos de este jugador/a
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDniConfirmModal(false);
                  setFormData(f => ({ ...f, dni: '' }));
                }}
                style={{
                  padding: '10px 16px',
                  borderRadius: '10px',
                  background: '#f2f0eb',
                  color: '#333333',
                  fontWeight: '600',
                  fontSize: '13px',
                  border: '1px solid #d8cfc0',
                  cursor: 'pointer'
                }}
              >
                Modificar DNI
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default PlayerFormModal;
