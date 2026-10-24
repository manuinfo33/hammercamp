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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
              {categories.map((cat) => {
                const isSenior = cat.category_type === 'senior' || cat.category_type === 'veteranos';
                const isLibre = cat.category_type === 'libre';

                return (
                  <div
                    key={cat.id}
                    style={{
                      background: '#ffffff',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: 'var(--gx-shadow-sm)',
                      transition: 'border-color 0.2s ease',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)', textTransform: 'uppercase' }}>{cat.name}</h3>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--gx-primary-soft)',
                            color: '#8a6508',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {cat.football_type || 'Futbol 11'}
                        </span>
                      </div>

                      {/* Tipo de categoría badge en verde unificado */}
                      <div style={{ marginTop: '8px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#eef7ed',
                            color: '#2e7d32',
                            border: '1px solid #c8e6c9',
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
                            background: '#fafafb',
                            borderRadius: '12px',
                            border: '1px solid #ececef',
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
                        justifyContent: 'flex-end',
                        gap: '8px',
                        paddingTop: '12px',
                        borderTop: '1px solid #f0f0f2',
                      }}
                    >
                      <button
                        onClick={() => handleEdit(cat)}
                        style={{
                          background: '#ffffff',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '10px',
                          padding: '8px 14px',
                          minHeight: '38px',
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
                        onClick={() => handleOpenDeleteModal(cat)}
                        style={{
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '10px',
                          padding: '8px 14px',
                          minHeight: '38px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          color: '#dc2626',
                          fontWeight: '600',
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
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
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
              <strong>Advertencia de seguridad:</strong> Al eliminar esta categoría, los Equipos y Torneos asociados continuarán existiendo en la base de datos, pero con Categoria: Sin Asignar. Para confirmar esta acción, ingresá la contraseña del usuario actual.
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
