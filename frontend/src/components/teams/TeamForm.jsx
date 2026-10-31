import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../../api';
import {
  X,
  Upload,
  Check,
  UserPlus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import '../../styles/data.css';
import { useNavigate } from 'react-router-dom';

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

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 7px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e',
  border: 'none',
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

const TeamForm = ({ team, onClose, onSuccess, isModal = false, defaultCategoryId = '' }) => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [delegates, setDelegates] = useState([]);
  const [customAlert, setCustomAlert] = useState(null);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    name: team?.name || '',
    category: team?.category || defaultCategoryId || '',
    delegate: team?.delegate || '',
    logo: null,
    team_photo: null,
  });

  const [previews, setPreviews] = useState({
    logo: team?.logo || null,
    team_photo: team?.team_photo || null,
  });

  const [removedImages, setRemovedImages] = useState({
    logo: false,
    team_photo: false,
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
        setFormData((prev) => ({ ...prev, category: defaultCategoryId }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchDelegates = async (selectId = null) => {
    try {
      const response = await api.get('delegates/');
      setDelegates(response.data);
      if (selectId) {
        const del = response.data.find((d) => d.id === selectId);
        if (del) {
          setSearchTerm(`${del.first_name} ${del.last_name}`);
        }
      }
    } catch (err) {
      console.error('Error fetching delegates:', err);
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
    } catch (err) {
      console.error('Error saving team:', err);
      if (err.response?.data?.category) {
        const catErr = Array.isArray(err.response.data.category)
          ? err.response.data.category[0]
          : err.response.data.category;
        setCustomAlert({
          title: 'Atención',
          message: catErr,
        });
      } else if (err.response?.data?.name) {
        setError(err.response.data.name[0]);
      } else {
        setError('Error al guardar el equipo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDelegates = delegates.filter((d) =>
    `${d.first_name} ${d.last_name} ${d.dni || ''}`.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const formContent = (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 14 : 18,
        padding: isModal ? 0 : isMobile ? 14 : 20,
      }}
    >
      {/* Escudo y Foto */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: isMobile ? 10 : 14,
        }}
      >
        <div>
          <label style={labelStyle}>Escudo</label>
          <div
            style={{
              border: previews.logo ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce',
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
              cursor: previews.logo ? 'default' : 'pointer',
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
                <div style={{ width: isMobile ? 52 : 64, height: isMobile ? 52 : 64 }}>
                  <img
                    src={previews.logo}
                    alt="Escudo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('logo-file-input').click();
                    }}
                    style={{ ...btnOutline, height: 28, padding: '0 8px', fontSize: 11 }}
                  >
                    <Pencil size={11} /> {!isMobile && 'Modificar'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile('logo');
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
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#141413' }}>Subir escudo</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Foto equipo</label>
          <div
            style={{
              border: previews.team_photo ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce',
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
              cursor: previews.team_photo ? 'default' : 'pointer',
            }}
            onClick={() =>
              !previews.team_photo && document.getElementById('photo-file-input').click()
            }
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
                <div
                  style={{
                    width: '100%',
                    maxWidth: isMobile ? 110 : 160,
                    height: isMobile ? 52 : 64,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={previews.team_photo}
                    alt="Foto equipo"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById('photo-file-input').click();
                    }}
                    style={{ ...btnOutline, height: 28, padding: '0 8px', fontSize: 11 }}
                  >
                    <Pencil size={11} /> {!isMobile && 'Modificar'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile('team_photo');
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
                <div style={{ fontSize: 11.5, fontWeight: 600, color: '#141413' }}>Subir foto</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nombre y Categoría */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? 12 : 14,
        }}
      >
        <div>
          <label style={labelStyle}>Nombre *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => {
              const val = e.target.value.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
              setFormData({ ...formData, name: val });
              setError('');
            }}
            style={{
              ...inputStyle,
              borderColor: error ? '#dc2626' : '#e5e4df',
            }}
          />
        </div>

        <div>
          <label style={labelStyle}>Categoría *</label>
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
                  message: `El equipo "${team.name}" está activo en el torneo "${team.current_tournament || 'un torneo'}". No se puede cambiar de categoría mientras esté participando.`,
                });
                return;
              }
              setFormData({ ...formData, category: newCatId });
            }}
            style={inputStyle}
          >
            <option value="" disabled>
              Seleccionar…
            </option>
            {categories.length === 0 && (
              <option value="CREATE_NEW" style={{ fontWeight: 600 }}>
                + Crear categoría nueva
              </option>
            )}
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delegado */}
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Delegado responsable (Opcional)</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: 11,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#787772',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Buscar delegado por nombre o DNI…"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDelegates(true);
                if (e.target.value === '') setFormData({ ...formData, delegate: '' });
              }}
              onFocus={() => setShowDelegates(true)}
              style={{
                ...inputStyle,
                paddingLeft: 32,
                paddingRight: searchTerm ? 30 : 12,
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFormData({ ...formData, delegate: '' });
                  setShowDelegates(false);
                }}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                  height: 'auto',
                  minWidth: 0,
                  color: '#787772',
                  cursor: 'pointer',
                  boxShadow: 'none',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate('/delegados', { state: { openForm: true } })}
            style={{ ...btnOutline, height: 38, width: 38, padding: 0, flexShrink: 0 }}
            title="Nuevo delegado"
          >
            <UserPlus size={15} />
          </button>
        </div>

        {showDelegates && searchTerm && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: '#ffffff',
              border: '1px solid #e5e4df',
              borderRadius: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
              maxHeight: 200,
              overflowY: 'auto',
              zIndex: 50,
            }}
          >
            {filteredDelegates.length > 0 ? (
              filteredDelegates.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setFormData({ ...formData, delegate: d.id });
                    setSearchTerm(`${d.first_name} ${d.last_name}`);
                    setShowDelegates(false);
                  }}
                  style={{
                    padding: '9px 14px',
                    fontSize: 13,
                    color: '#141413',
                    borderBottom: '1px solid #f1f0ec',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {d.first_name} {d.last_name}
                  </span>
                  {d.dni && <span style={tagPill}>{d.dni}</span>}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px 14px', fontSize: 12, color: '#787772' }}>
                No se encontraron delegados
              </div>
            )}
          </div>
        )}
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
          {error}
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
              <Check size={14} /> {team ? 'Guardar' : 'Crear'}
            </>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div className="anthropic-theme animate-fade-in">
      {isModal ? (
        formContent
      ) : (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {formContent}
        </div>
      )}

      {customAlert &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(20, 20, 19, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: 20,
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
                    {customAlert.title || 'Atención'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomAlert(null)}
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
                {customAlert.message}
              </div>

              <div
                style={{
                  padding: '12px 20px',
                  background: '#faf9f6',
                  borderTop: '1px solid #efeee9',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <button type="button" onClick={() => setCustomAlert(null)} style={btnDark}>
                  Aceptar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default TeamForm;
