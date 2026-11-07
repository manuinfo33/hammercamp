import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api';
import { Plus, Edit2, Trash2, Award, X, Check } from 'lucide-react';
import CategoryForm from './CategoryForm';
import PageHeader from '../ui/PageHeader';

const CategoriasView = () => {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    fetchCategories();
    if (location.state?.openForm) {
      setShowForm(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get('categories/');
      const sorted = res.data.sort((a, b) => a.id - b.id);
      setCategories(sorted);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedCategory(null);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleOpenDeleteModal = (category) => {
    setCategoryToDelete(category);
    setConfirmPassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    if (!confirmPassword) {
      setDeleteError('Por favor ingresá tu contraseña.');
      return;
    }
    try {
      setDeleting(true);
      setDeleteError('');
      await api.delete(`categories/${categoryToDelete.id}/`, {
        headers: { 'X-Password': confirmPassword },
        data: { password: confirmPassword },
        params: { password: confirmPassword }
      });
      setCategoryToDelete(null);
      setConfirmPassword('');
      fetchCategories();
      setToastMessage('Categoría eliminada con éxito');
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const message = err.response?.data?.message;
      if (detail === 'CATEGORY_HAS_TEAMS' && message) {
        setDeleteError(message);
      } else if (detail === 'INVALID_PASSWORD' || err.response?.status === 401) {
        setDeleteError('No se pudo eliminar la categoría. Verificá que la contraseña sea correcta');
      } else {
        setDeleteError(message || 'No se pudo eliminar la categoría. Verificá que no tenga equipos o torneos asociados');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0', height: '100%' }} className="anthropic-theme animate-fade-in">
      {/* Header de la vista */}
      <PageHeader
        icon={Award}
        title={showForm ? (selectedCategory ? 'Editar Categoría' : 'Nueva Categoría') : 'Categorías'}
        subtitle={showForm
          ? 'Ingresa la información básica, la modalidad de fútbol y las reglas de edad.'
          : 'Administra las categorías y sus reglas de edad para la plataforma.'}
        actions={showForm ? (
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="secondary icon-only"
            style={{ width: '36px', height: '36px' }}
            title="Volver a Categorías"
          >
            <X size={18} />
          </button>
        ) : (
          <button onClick={handleCreateNew}>
            <Plus size={18} /> Nueva Categoría
          </button>
        )}
      />

      {/* Vista de Formulario In-Page */}
      {showForm ? (
        <CategoryForm
          category={selectedCategory}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            const isNew = !selectedCategory;
            setShowForm(false);
            fetchCategories();
            if (isNew) {
              setToastMessage('Categoría creada con éxito');
              setShowToast(true);
              setTimeout(() => {
                setShowToast(false);
              }, 3000);
            }
          }}
        />
      ) : (
        /* Lista de Categorías */
        <>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando categorías...</div>
          ) : categories.length === 0 ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px dashed var(--border-medium)',
              }}
            >
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>No hay categorías configuradas aún.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 310px), 1fr))', gap: '20px' }}>
              <style>{`
                .sl-mgmt-cat-card {
                  background: #ffffff;
                  border: 1px solid #e6e4dd;
                  border-radius: 18px;
                  overflow: hidden;
                  display: flex;
                  flex-direction: column;
                  justify-content: space-between;
                  box-shadow: 0 2px 10px rgba(20, 20, 19, 0.04);
                  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                              box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1),
                              border-color 0.24s ease;
                }
                .sl-mgmt-cat-card:hover {
                  border-color: #c9c6bc;
                  transform: translateY(-3px);
                  box-shadow: 0 14px 28px rgba(20, 20, 19, 0.08);
                }
              `}</style>
              {categories.map((cat, idx) => {
                const isSenior = cat.category_type === 'senior' || cat.category_type === 'veteranos';
                const isLibre = cat.category_type === 'libre';
                const accentColors = ['#132a4a', '#133829', '#3f1420', '#261b47', '#1b1d24', '#0f333e', '#3c1f14', '#1e293b'];
                const accent = accentColors[idx % accentColors.length];

                return (
                  <div key={cat.id} className="sl-mgmt-cat-card">
                    {/* Barra superior sutil de acento (sin imagen, exclusiva de torneos) */}
                    <div style={{ height: '5px', background: accent, width: '100%' }} />

                    <div
                      style={{
                        padding: '18px 20px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flex: 1,
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Fila superior: Píldora de modalidad + Regla de edad */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '7px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              background: '#f5f4f0',
                              border: '1px solid #e8e6df',
                            }}
                          >
                            <span
                              style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: accent,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#575652',
                                lineHeight: 1,
                              }}
                            >
                              {cat.football_type || 'Fútbol 11'}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: '700',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              backgroundColor: isSenior ? '#f6eed6' : '#eef7ed',
                              color: isSenior ? '#6b4c08' : '#2e7d32',
                              border: isSenior ? '1px solid #e6d5a7' : '1px solid #c8e6c9',
                              lineHeight: 1,
                            }}
                          >
                            {isSenior
                              ? `Senior (+${cat.min_age || 18})`
                              : isLibre
                              ? 'Libre (+18 años)'
                              : 'Sin límite de edad'}
                          </span>
                        </div>

                        {/* Título de la Categoría */}
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '19px',
                            fontWeight: '800',
                            color: '#141413',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.25,
                          }}
                        >
                          {cat.name}
                        </h3>

                        {/* Bloque estructurado de reglas de la categoría */}
                        {isSenior ? (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '10px',
                              padding: '10px 12px',
                              background: '#f8f7f4',
                              borderRadius: '12px',
                              border: '1px solid #edece6',
                            }}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                                Cupo menores
                              </span>
                              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#141413' }}>
                                {cat.max_underage_allowed > 0
                                  ? `${cat.max_underage_allowed} ${cat.min_underage_age ? `(${cat.min_underage_age} a ${(cat.min_age || 40) - 1} años)` : 'permitidos'}`
                                  : 'Sin menores (0)'}
                              </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid #e6e4dd', paddingLeft: '10px' }}>
                              <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                                Cumple {cat.min_age} en el año
                              </span>
                              <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#141413' }}>
                                {cat.allow_birthday_in_year ? 'Juega como mayor' : 'Ocupa cupo menor'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              padding: '10px 12px',
                              background: '#f8f7f4',
                              borderRadius: '12px',
                              border: '1px solid #edece6',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#787772' }}>
                              Regla de inscripción
                            </span>
                            <span style={{ fontSize: '12.5px', fontWeight: '700', color: '#141413' }}>
                              {isLibre ? 'Mayores de 18 años' : 'Edad libre'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Pie de tarjeta con acciones */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          paddingTop: '12px',
                          borderTop: '1px solid #f0efe9',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEdit(cat)}
                          style={{
                            flex: 1,
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '10px',
                            fontSize: '12.5px',
                            fontWeight: '600',
                            background: '#f8f7f4',
                            color: '#141413',
                            border: '1px solid #e5e4df',
                            boxShadow: 'none',
                            textTransform: 'none',
                            letterSpacing: 0,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <Edit2 size={13} /> Editar categoría
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteModal(cat)}
                          className="secondary icon-only"
                          title="Eliminar categoría"
                          style={{
                            width: '34px',
                            height: '34px',
                            minWidth: '34px',
                            padding: 0,
                            borderRadius: '10px',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#dc2626',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Cartel Interno de Confirmación con Clave via React Portal */}
      {categoryToDelete && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.55)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle)',
            borderRadius: '18px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Eliminar Categoría {categoryToDelete.name}
              </h3>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: '4px', display: 'flex', alignItems: 'center' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#444', margin: 0, lineHeight: '1.5' }}>
              ¿Estás seguro que quieres eliminar la categoría <strong>"{categoryToDelete.name}"</strong>?
            </p>

            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '12px',
              padding: '12px',
              fontSize: '12px',
              color: '#721c24',
              lineHeight: '1.4'
            }}>
              <strong>Advertencia de seguridad:</strong> Al eliminar esta categoría, los Equipos asociados continuarán existiendo en el sistema pero pasarán a figurar con <strong>Categoría: Sin Asignar</strong>. (No se puede eliminar si hay un torneo con equipos cargados de esta categoría). Para confirmar esta acción, ingresá tu contraseña de usuario.
            </div>

            <form onSubmit={handleConfirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="input-group">
                <label style={{ fontSize: '12px', fontWeight: '600', color: '#191919', marginBottom: '6px', display: 'block' }}>Contraseña de Usuario *</label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Ingresá tu contraseña de usuario..."
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setDeleteError(''); }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    height: '42px',
                    borderRadius: '12px',
                    border: deleteError ? '1px solid #dc2626' : '1px solid var(--border-subtle)',
                    background: '#f1f2f4',
                    color: 'var(--text-primary)',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {deleteError && (
                <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
                  style={{
                    height: '42px',
                    padding: '0 18px',
                    background: '#ffffff',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '12px',
                    color: '#191919',
                    fontWeight: '600',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#191919';
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.background = '#f4f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d4d4d8';
                    e.currentTarget.style.color = '#191919';
                    e.currentTarget.style.background = '#ffffff';
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={deleting || !confirmPassword}
                  style={{
                    height: '42px', padding: '0 18px',
                    backgroundColor: '#dc2626', color: '#fff', border: 'none',
                    borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '12px', cursor: deleting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notificación centro inferior de la pantalla */}
      {showToast && createPortal(
        <div className="toast-pill-container">
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Check size={14} color="#ffffff" strokeWidth={3} />
          </div>
          <span style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#f5ede4',
            whiteSpace: 'nowrap'
          }}>
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a8957e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px',
              marginLeft: '4px'
            }}
          >
            <X size={14} />
          </button>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategoriasView;
