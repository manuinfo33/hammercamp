import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Edit2, Trash2, Award, ShieldAlert, Check, X, UserCheck, UserX, ChevronDown } from 'lucide-react';

const TournamentConfigView = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    football_type: 'Futbol 11',
    category_type: 'sin_restriccion',
    min_age: 40,
    max_underage_allowed: 0,
    min_underage_age: 18,
    allow_birthday_in_year: true,
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const footballTypes = [
    { value: 'Futbol 5', label: 'Fútbol 5' },
    { value: 'Futbol 6', label: 'Fútbol 6' },
    { value: 'Futbol 7', label: 'Fútbol 7' },
    { value: 'Futbol 8', label: 'Fútbol 8' },
    { value: 'Futbol 9', label: 'Fútbol 9' },
    { value: 'Futbol 10', label: 'Fútbol 10' },
    { value: 'Futbol 11', label: 'Fútbol 11' },
    { value: 'Otros', label: 'Otros' },
  ];

  const categoryTypes = [
    { value: 'sin_restriccion', label: 'Sin restricción de edad' },
    { value: 'libre', label: 'Libre (Mayores de 18 años)' },
    { value: 'senior', label: 'Senior' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('categories/');
      setCategories(res.data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    setErrorMsg('');
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || '',
        description: category.description || '',
        football_type: category.football_type || 'Futbol 11',
        category_type: category.category_type === 'veteranos' ? 'senior' : (category.category_type || 'sin_restriccion'),
        min_age: category.min_age || 40,
        max_underage_allowed: category.max_underage_allowed ?? 0,
        min_underage_age: category.min_underage_age || 18,
        allow_birthday_in_year: category.allow_birthday_in_year ?? true,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        football_type: 'Futbol 11',
        category_type: 'sin_restriccion',
        min_age: 40,
        max_underage_allowed: 0,
        min_underage_age: 18,
        allow_birthday_in_year: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setErrorMsg('');
  };

  const handleMinAgeChange = (newMinAge) => {
    const minAgeNum = parseInt(newMinAge, 10);
    // Ajustar min_underage_age si excede minAgeNum - 2
    const maxAllowedMinUnderage = Math.max(18, minAgeNum - 2);
    setFormData((prev) => ({
      ...prev,
      min_age: minAgeNum,
      min_underage_age: Math.min(prev.min_underage_age || 18, maxAllowedMinUnderage),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const isSenior = formData.category_type === 'senior';
      const payload = {
        ...formData,
        min_age: isSenior ? parseInt(formData.min_age, 10) : null,
        max_underage_allowed: isSenior ? parseInt(formData.max_underage_allowed, 10) : 0,
        min_underage_age: isSenior && formData.max_underage_allowed > 0 ? parseInt(formData.min_underage_age, 10) : null,
        allow_birthday_in_year: isSenior ? formData.allow_birthday_in_year : false,
      };

      if (editingCategory) {
        await api.put(`categories/${editingCategory.id}/`, payload);
      } else {
        await api.post('categories/', payload);
      }

      await fetchCategories();
      handleCloseModal();
    } catch (err) {
      console.error('Error al guardar la categoría:', err);
      if (err.response?.data?.name) {
        setErrorMsg('Ya existe una categoría con este nombre.');
      } else {
        setErrorMsg('Error al guardar la categoría. Por favor reintenta.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId, catName) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${catName}"?`)) return;
    try {
      await api.delete(`categories/${catId}/`);
      fetchCategories();
    } catch (err) {
      console.error('Error al eliminar categoría:', err);
      alert('No se pudo eliminar la categoría. Es posible que esté asociada a un equipo o torneo.');
    }
  };

  // Cálculos dinámicos para Senior
  const selectedMinAge = parseInt(formData.min_age || 40, 10);
  const maxUnderageAge = selectedMinAge - 1; // Ej: si 40 -> 39
  const upperLimitForMinUnderage = Math.max(18, selectedMinAge - 2); // Ej: si 40 -> 38

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Cabecera de Sección */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={22} style={{ color: '#cc7a5c' }} />
            Categorías de Torneos
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
            Crea y gestiona las categorías con sus reglas de edad y modalidad de juego.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            backgroundColor: '#cc7a5c',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(204, 122, 92, 0.25)',
            transition: 'all 0.2s ease',
          }}
          className="btn-hover-effect"
        >
          <Plus size={16} />
          Nueva Categoría
        </button>
      </div>

      {/* Lista de Categorías */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando categorías...</div>
      ) : categories.length === 0 ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            background: '#faf8f5',
            borderRadius: '12px',
            border: '1px dashed #d8cfc0',
          }}
        >
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No hay categorías configuradas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '16px' }}>
          {categories.map((cat) => {
            const isSenior = cat.category_type === 'senior' || cat.category_type === 'veteranos';
            const isLibre = cat.category_type === 'libre';

            return (
              <div
                key={cat.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e6dfd3',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  gap: '14px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#191919' }}>{cat.name}</h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#eae4d8',
                        color: '#191919',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat.football_type || 'Futbol 11'}
                    </span>
                  </div>

                  {/* Tipo de categoría badge */}
                  <div style={{ marginTop: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: isSenior ? '#fff3ec' : isLibre ? '#eef7ed' : '#f4f0ea',
                        color: isSenior ? '#cc7a5c' : isLibre ? '#2e7d32' : '#666',
                        border: `1px solid ${isSenior ? '#fcdbc9' : isLibre ? '#c8e6c9' : '#e2dad0'}`,
                      }}
                    >
                      {isSenior
                        ? `Senior (+${cat.min_age || 18})`
                        : isLibre
                        ? 'Libre (Mayores de 18)'
                        : 'Sin restricción de edad'}
                    </span>
                  </div>

                  {/* Detalle de Senior si aplica */}
                  {isSenior && (
                    <div
                      style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#faf8f5',
                        borderRadius: '8px',
                        border: '1px solid #efe9e0',
                        fontSize: '12px',
                        color: '#444',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div>
                        <strong>Menores permitidos:</strong>{' '}
                        {cat.max_underage_allowed > 0
                          ? `${cat.max_underage_allowed} menor(es) ${
                              cat.min_underage_age ? `(de ${cat.min_underage_age} a ${(cat.min_age || 40) - 1} años)` : ''
                            }`
                          : 'Ningún menor (0)'}
                      </div>
                      <div>
                        <strong>¿Cumple {cat.min_age} en el año?:</strong>{' '}
                        {cat.allow_birthday_in_year ? 'Sí (Juega como mayor)' : 'No (Ocupa cupo de menor)'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones */}
                <div
                  style={{
                    display: 'flex',
                    justify: 'flex-end',
                    gap: '8px',
                    paddingTop: '10px',
                    borderTop: '1px solid #f2ede4',
                  }}
                >
                  <button
                    onClick={() => handleOpenModal(cat)}
                    style={{
                      background: 'none',
                      border: '1px solid #d8cfc0',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#444',
                      fontWeight: '500',
                    }}
                  >
                    <Edit2 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    style={{
                      background: 'none',
                      border: '1px solid #f1c5c5',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#c62828',
                      fontWeight: '500',
                    }}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Crear / Editar Categoría */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 12px 36px rgba(0,0,0,0.18)',
              border: '1px solid #e6dfd3',
            }}
            className="animate-fade-in"
          >
            {/* Header del Modal */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e6dfd3',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                background: '#faf8f5',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#191919' }}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {errorMsg && (
                <div
                  style={{
                    backgroundColor: '#fdeded',
                    border: '1px solid #f5c2c2',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#b71c1c',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldAlert size={16} />
                  {errorMsg}
                </div>
              )}

              {/* Nombre de Categoría */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '6px' }}>
                  Nombre de Categoría <span style={{ color: '#c62828' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Senior +40, F7 Femenino, Libre..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d8cfc0',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Tipo de Fútbol */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '6px' }}>
                  Tipo de Fútbol <span style={{ color: '#c62828' }}>*</span>
                </label>
                <select
                  value={formData.football_type}
                  onChange={(e) => setFormData({ ...formData, football_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d8cfc0',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  {footballTypes.map((ft) => (
                    <option key={ft.value} value={ft.value}>
                      {ft.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo de Categoría */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '6px' }}>
                  Tipo de Categoría <span style={{ color: '#c62828' }}>*</span>
                </label>
                <select
                  value={formData.category_type}
                  onChange={(e) => setFormData({ ...formData, category_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d8cfc0',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    boxSizing: 'border-box',
                  }}
                >
                  {categoryTypes.map((ct) => (
                    <option key={ct.value} value={ct.value}>
                      {ct.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* BLOQUE DINÁMICO PASO A PASO PARA SENIOR */}
              {formData.category_type === 'senior' && (
                <div
                  style={{
                    background: '#faf8f5',
                    border: '1px solid #e6dfd3',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                  }}
                  className="animate-fade-in"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #efe9e0', paddingBottom: '10px' }}>
                    <Award size={18} style={{ color: '#cc7a5c' }} />
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#cc7a5c' }}>
                      Configuración de Senior
                    </h4>
                  </div>

                  {/* PREGUNTA 1: ¿Para mayores de qué edad? */}
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ background: '#cc7a5c', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</span>
                      ¿Para mayores de qué edad?
                    </label>
                    <select
                      value={formData.min_age}
                      onChange={(e) => handleMinAgeChange(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d8cfc0',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                        <option key={age} value={age}>
                          Mayores de {age} años
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PREGUNTA 2: Aparece tras definir min_age */}
                  {formData.min_age && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '10px', borderTop: '1px dashed #e6dfd3' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#cc7a5c', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>2</span>
                        ¿Cuántos menores de {formData.min_age} años se permiten?
                      </label>
                      <select
                        value={formData.max_underage_allowed}
                        onChange={(e) => setFormData({ ...formData, max_underage_allowed: parseInt(e.target.value, 10) })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #d8cfc0',
                          fontSize: '14px',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                          boxSizing: 'border-box',
                        }}
                      >
                        <option value={0}>Ningún menor (0)</option>
                        <option value={1}>1 menor</option>
                        <option value={2}>2 menores</option>
                        <option value={3}>3 menores</option>
                        <option value={4}>4 menores</option>
                        <option value={5}>5 menores</option>
                      </select>
                    </div>
                  )}

                  {/* PREGUNTA 3: Solo si seleccionan 1 o más menores */}
                  {formData.min_age && formData.max_underage_allowed > 0 && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #e6dfd3' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ background: '#cc7a5c', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</span>
                        ¿Cuál es el rango de edad permitido para los menores?
                      </label>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: '#ffffff', padding: '12px 14px', borderRadius: '8px', border: '1px solid #d8cfc0' }}>
                        <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>Desde</span>
                        <select
                          value={formData.min_underage_age || 18}
                          onChange={(e) => setFormData({ ...formData, min_underage_age: parseInt(e.target.value, 10) })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #d8cfc0',
                            fontSize: '13px',
                            backgroundColor: '#faf8f5',
                            outline: 'none',
                          }}
                        >
                          {Array.from(
                            { length: Math.max(1, upperLimitForMinUnderage - 18 + 1) },
                            (_, i) => 18 + i
                          ).map((age) => (
                            <option key={age} value={age}>
                              {age} años
                            </option>
                          ))}
                        </select>
                        <span style={{ fontSize: '13px', color: '#555', fontWeight: '500' }}>
                          hasta <strong>{maxUnderageAge} años</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* PREGUNTA 4: Diseño estilizado de botones Sí / No */}
                  {formData.min_age && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px dashed #e6dfd3' }}>
                      <label style={{ fontSize: '13px', fontWeight: '600', color: '#191919', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ background: '#cc7a5c', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0, marginTop: '2px' }}>
                          {formData.max_underage_allowed > 0 ? 4 : 3}
                        </span>
                        ¿Si un jugador tiene {maxUnderageAge} años y cumple los {formData.min_age} años en el transcurso del año, juega en el cupo de los mayores?
                      </label>

                      {/* Botones de Selección Premium (Sí / No) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                        {/* Opción SÍ */}
                        <div
                          onClick={() => setFormData({ ...formData, allow_birthday_in_year: true })}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            border: formData.allow_birthday_in_year ? '2px solid #cc7a5c' : '1px solid #d8cfc0',
                            backgroundColor: formData.allow_birthday_in_year ? '#fff7f3' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            boxShadow: formData.allow_birthday_in_year ? '0 4px 12px rgba(204, 122, 92, 0.15)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: formData.allow_birthday_in_year ? '#cc7a5c' : '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserCheck size={18} /> Sí
                            </span>
                            {formData.allow_birthday_in_year && (
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#cc7a5c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} />
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            Juega como mayor (no ocupa cupo de menor).
                          </span>
                        </div>

                        {/* Opción NO */}
                        <div
                          onClick={() => setFormData({ ...formData, allow_birthday_in_year: false })}
                          style={{
                            padding: '14px',
                            borderRadius: '10px',
                            border: !formData.allow_birthday_in_year ? '2px solid #191919' : '1px solid #d8cfc0',
                            backgroundColor: !formData.allow_birthday_in_year ? '#f5f5f5' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            boxShadow: !formData.allow_birthday_in_year ? '0 4px 12px rgba(0, 0, 0, 0.08)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '700', color: !formData.allow_birthday_in_year ? '#191919' : '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <UserX size={18} /> No
                            </span>
                            {!formData.allow_birthday_in_year && (
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#191919', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={12} />
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                            Ocupa cupo de menor (debe tener los {formData.min_age} años ya cumplidos).
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción del Modal */}
              <div
                style={{
                  display: 'flex',
                  justify: 'flex-end',
                  gap: '12px',
                  marginTop: '10px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e6dfd3',
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={saving}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #d8cfc0',
                    backgroundColor: 'transparent',
                    color: '#444',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#cc7a5c',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(204, 122, 92, 0.25)',
                  }}
                >
                  {saving ? 'Guardando...' : editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentConfigView;
