import React, { useState } from 'react';
import api from '../../api';
import { Award, ShieldAlert, Check, X, UserCheck, UserX } from 'lucide-react';

const CategoryForm = ({ category, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
    football_type: category?.football_type || 'Futbol 11',
    category_type: category?.category_type === 'veteranos' ? 'senior' : (category?.category_type || 'sin_restriccion'),
    min_age: category?.min_age !== null && category?.min_age !== undefined ? category.min_age : '',
    max_underage_allowed: category?.max_underage_allowed !== null && category?.max_underage_allowed !== undefined ? category.max_underage_allowed : '',
    min_underage_age: category?.min_underage_age || 18,
    allow_birthday_in_year: category?.allow_birthday_in_year ?? null,
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

  const handleCategoryTypeChange = (e) => {
    const newCatType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category_type: newCatType,
      min_age: newCatType === 'senior' ? prev.min_age : '',
      max_underage_allowed: newCatType === 'senior' ? prev.max_underage_allowed : '',
      allow_birthday_in_year: newCatType === 'senior' ? prev.allow_birthday_in_year : null,
    }));
  };

  const handleMinAgeChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setFormData((prev) => ({
        ...prev,
        min_age: '',
        max_underage_allowed: '',
        min_underage_age: 18,
        allow_birthday_in_year: null,
      }));
      return;
    }
    const minAgeNum = parseInt(val, 10);
    const maxAllowedMinUnderage = Math.max(18, minAgeNum - 2);
    setFormData((prev) => ({
      ...prev,
      min_age: minAgeNum,
      min_underage_age: Math.min(prev.min_underage_age || 18, maxAllowedMinUnderage),
    }));
  };

  const handleMaxUnderageChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setFormData((prev) => ({
        ...prev,
        max_underage_allowed: '',
        allow_birthday_in_year: null,
      }));
      return;
    }
    const num = parseInt(val, 10);
    setFormData((prev) => ({
      ...prev,
      max_underage_allowed: num,
      allow_birthday_in_year: prev.allow_birthday_in_year !== null ? prev.allow_birthday_in_year : true,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('El nombre de la categoría es obligatorio.');
      return;
    }

    const isSenior = formData.category_type === 'senior';
    if (isSenior) {
      if (formData.min_age === '' || formData.min_age === null) {
        setErrorMsg('Debes responder la primera pregunta: ¿Para mayores de qué edad?');
        return;
      }
      if (formData.max_underage_allowed === '' || formData.max_underage_allowed === null) {
        setErrorMsg('Debes responder la cantidad de menores permitidos.');
        return;
      }
      if (formData.allow_birthday_in_year === null) {
        setErrorMsg('Debes responder la última pregunta de cumpleaños.');
        return;
      }
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const payload = {
        ...formData,
        min_age: isSenior ? parseInt(formData.min_age, 10) : null,
        max_underage_allowed: isSenior ? parseInt(formData.max_underage_allowed, 10) : 0,
        min_underage_age: isSenior && formData.max_underage_allowed > 0 ? parseInt(formData.min_underage_age, 10) : null,
        allow_birthday_in_year: isSenior ? Boolean(formData.allow_birthday_in_year) : false,
      };

      if (category?.id) {
        await api.put(`categories/${category.id}/`, payload);
      } else {
        await api.post('categories/', payload);
      }

      onSuccess();
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

  // Cálculos dinámicos para Senior
  const selectedMinAge = formData.min_age !== '' && formData.min_age !== null ? parseInt(formData.min_age, 10) : null;
  const maxUnderageAge = selectedMinAge ? selectedMinAge - 1 : 0;
  const upperLimitForMinUnderage = selectedMinAge ? Math.max(18, selectedMinAge - 2) : 18;

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e6dfd3',
        borderRadius: '14px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(25, 20, 15, 0.06)',
      }}
      className="animate-fade-in"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {errorMsg && (
          <div
            style={{
              backgroundColor: '#fdeded',
              border: '1px solid #f5c2c2',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#b71c1c',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldAlert size={18} />
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Nombre de Categoría */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '8px' }}>
              Nombre de Categoría <span style={{ color: '#c62828' }}>*</span>
            </label>
            <input
              type="text"
              placeholder="Ej: Senior +40, F7 Femenino, Libre..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '8px' }}>
              Tipo de Fútbol <span style={{ color: '#c62828' }}>*</span>
            </label>
            <select
              value={formData.football_type}
              onChange={(e) => setFormData({ ...formData, football_type: e.target.value })}
              style={{
                width: '100%',
                padding: '12px 14px',
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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#191919', marginBottom: '8px' }}>
              Tipo de Categoría <span style={{ color: '#c62828' }}>*</span>
            </label>
            <select
              value={formData.category_type}
              onChange={handleCategoryTypeChange}
              style={{
                width: '100%',
                padding: '12px 14px',
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
        </div>

        {/* BLOQUE DINÁMICO SECUENCIAL PARA SENIOR */}
        {formData.category_type === 'senior' && (
          <div
            style={{
              background: '#faf8f5',
              border: '1px solid #e6dfd3',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
            className="animate-fade-in"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #efe9e0', paddingBottom: '12px' }}>
              <Award size={20} style={{ color: '#cc7a5c' }} />
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#cc7a5c' }}>
                Configuración de Categoría Senior
              </h4>
            </div>

            {/* PREGUNTA 1: ¿Para mayores de qué edad? */}
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ background: '#cc7a5c', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>1</span>
                ¿Para mayores de qué edad?
              </label>
              <select
                value={formData.min_age}
                onChange={handleMinAgeChange}
                style={{
                  maxWidth: '400px',
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1px solid #d8cfc0',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                }}
              >
                <option value="">Seleccionar edad...</option>
                {Array.from({ length: 48 }, (_, i) => i + 18).map((age) => (
                  <option key={age} value={age}>
                    Mayores de {age} años
                  </option>
                ))}
              </select>
            </div>

            {/* PREGUNTA 2: Aparece ÚNICAMENTE tras responder la Pregunta 1 */}
            {selectedMinAge !== null && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '16px', borderTop: '1px dashed #e6dfd3' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#cc7a5c', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>2</span>
                  ¿Cuántos menores de {selectedMinAge} años se permiten?
                </label>
                <select
                  value={formData.max_underage_allowed}
                  onChange={handleMaxUnderageChange}
                  style={{
                    maxWidth: '400px',
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #d8cfc0',
                    fontSize: '14px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <option value="">Seleccionar cantidad de menores...</option>
                  <option value={0}>Ningún menor (0)</option>
                  <option value={1}>1 menor</option>
                  <option value={2}>2 menores</option>
                  <option value={3}>3 menores</option>
                  <option value={4}>4 menores</option>
                  <option value={5}>5 menores</option>
                </select>
              </div>
            )}

            {/* PREGUNTA 3: Solo si seleccionaron 1 o más menores en la Pregunta 2 */}
            {selectedMinAge !== null && formData.max_underage_allowed !== '' && formData.max_underage_allowed > 0 && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px dashed #e6dfd3' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ background: '#cc7a5c', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>3</span>
                  ¿Cuál es el rango de edad permitido para los menores?
                </label>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', background: '#ffffff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #d8cfc0', maxWidth: '480px' }}>
                  <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>Desde</span>
                  <select
                    value={formData.min_underage_age || 18}
                    onChange={(e) => setFormData({ ...formData, min_underage_age: parseInt(e.target.value, 10) })}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #d8cfc0',
                      fontSize: '14px',
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
                  <span style={{ fontSize: '14px', color: '#555', fontWeight: '500' }}>
                    hasta <strong>{maxUnderageAge} años</strong>
                  </span>
                </div>
              </div>
            )}

            {/* PREGUNTA 4: Aparece tras responder la Pregunta 2 (o Pregunta 3 si aplica) */}
            {selectedMinAge !== null && formData.max_underage_allowed !== '' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '16px', borderTop: '1px dashed #e6dfd3' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#191919', lineHeight: '1.4', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ background: '#cc7a5c', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0, marginTop: '2px' }}>
                    {formData.max_underage_allowed > 0 ? 4 : 3}
                  </span>
                  ¿Si un jugador tiene {maxUnderageAge} años y cumple los {selectedMinAge} años en el transcurso del año, juega en el cupo de los mayores?
                </label>

                {/* Botones de Selección Premium (Sí / No) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '6px', maxWidth: '600px' }}>
                  {/* Opción SÍ */}
                  <div
                    onClick={() => setFormData({ ...formData, allow_birthday_in_year: true })}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: formData.allow_birthday_in_year === true ? '2px solid #cc7a5c' : '1px solid #d8cfc0',
                      backgroundColor: formData.allow_birthday_in_year === true ? '#fff7f3' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: formData.allow_birthday_in_year === true ? '0 4px 14px rgba(204, 122, 92, 0.18)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: formData.allow_birthday_in_year === true ? '#cc7a5c' : '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserCheck size={20} /> Sí
                      </span>
                      {formData.allow_birthday_in_year === true && (
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#cc7a5c', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      Juega como mayor (no ocupa cupo de menor).
                    </span>
                  </div>

                  {/* Opción NO */}
                  <div
                    onClick={() => setFormData({ ...formData, allow_birthday_in_year: false })}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      border: formData.allow_birthday_in_year === false ? '2px solid #191919' : '1px solid #d8cfc0',
                      backgroundColor: formData.allow_birthday_in_year === false ? '#f5f5f5' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      boxShadow: formData.allow_birthday_in_year === false ? '0 4px 14px rgba(0, 0, 0, 0.08)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: formData.allow_birthday_in_year === false ? '#191919' : '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserX size={20} /> No
                      </span>
                      {formData.allow_birthday_in_year === false && (
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#191919', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={14} />
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      Ocupa cupo de menor (debe tener los {selectedMinAge} años ya cumplidos).
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botones de acción del Formulario */}
        <div
          style={{
            display: 'flex',
            justify: 'flex-end',
            gap: '14px',
            marginTop: '10px',
            paddingTop: '20px',
            borderTop: '1px solid #e6dfd3',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '12px 22px',
              borderRadius: '8px',
              border: '1px solid #d8cfc0',
              backgroundColor: 'transparent',
              color: '#444',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#cc7a5c',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(204, 122, 92, 0.25)',
            }}
          >
            {saving ? 'Guardando...' : category?.id ? 'Guardar Cambios' : 'Crear Categoría'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CategoryForm;
