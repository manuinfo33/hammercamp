import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import api from '../../api';
import { Plus, Edit2, Trash2, Award, X, Check } from 'lucide-react';
import CategoryForm from './CategoryForm';

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
      console.error('Error al eliminar categoría:', err);
      const detail = err.response?.data?.detail;
      if (detail === 'INVALID_PASSWORD' || err.response?.status === 401) {
        setDeleteError('No se pudo eliminar la categoría. Verificá que la contraseña sea correcta');
      } else {
        setDeleteError('No se pudo eliminar la categoría. Verificá que no tenga equipos o torneos asociados');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }} className="anthropic-theme animate-fade-in">
      {/* Header de la vista */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="anthropic-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Award size={30} style={{ color: '#cc7a5c' }} />
            {showForm ? (selectedCategory ? 'Editar Categoría' : 'Nueva Categoría') : 'Categorías'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm
              ? 'Ingresa la información básica, la modalidad de fútbol y las reglas de edad.'
              : 'Administra las categorías y sus reglas de edad para la plataforma.'}
          </p>
        </div>

        {showForm ? (
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
          <button 
            onClick={handleCreateNew}
            style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
          >
            <Plus size={18} /> Nueva Categoría
          </button>
        )}
      </div>

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
                        onClick={() => handleEdit(cat)}
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
                        onClick={() => handleOpenDeleteModal(cat)}
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
          background: 'rgba(0, 0, 0, 0.38)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid #e6dfd3',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#191919', display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              background: '#fff8f8',
              border: '1px solid #f8d7da',
              borderRadius: '8px',
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
                    borderRadius: '8px',
                    border: deleteError ? '1px solid #e07070' : '1px solid #d8cfc0',
                    background: '#ffffff',
                    color: '#191919',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {deleteError && (
                <div style={{ fontSize: '12px', color: '#c62828', fontWeight: '500' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCategoryToDelete(null)}
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
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#191919';
                    e.currentTarget.style.color = '#000000';
                    e.currentTarget.style.background = '#faf8f5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#d8cfc0';
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
                    height: '38px', padding: '0 16px',
                    backgroundColor: '#c62828', color: '#fff', border: 'none',
                    borderRadius: '8px', fontWeight: '600', cursor: deleting ? 'not-allowed' : 'pointer'
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
            background: '#2e7d32',
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
