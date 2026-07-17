import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, Contact, Trash2, Edit, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DelegateForm from './DelegateForm';

const DelegadosView = () => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const location = useLocation();

  useEffect(() => {
    fetchDelegates();
  }, [search]);

  useEffect(() => {
    if (location.state?.openForm) {
      setEditingDelegate(null);
      setShowForm(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchDelegates = async () => {
    setLoading(true);
    try {
      const response = await api.get(`delegates/?search=${search}`);
      setDelegates(response.data);
    } catch (error) {
      console.error("Error fetching delegates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`delegates/${id}/`);
      fetchDelegates();
    } catch (error) {
      console.error("Error deleting delegate:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="anthropic-theme delegates-container animate-fade-in">
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 className="anthropic-title">
            {showForm ? (editingDelegate ? 'Editar Delegado' : 'Nuevo Delegado') : 'Delegados'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            {showForm ? 'Completa los datos del representante y sus credenciales.' : 'Gestión de delegados y representantes de equipos'}
          </p>
        </div>
        {showForm ? (
          <button 
            type="button" 
            onClick={() => setShowForm(false)} 
            className="secondary icon-only" 
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        ) : (
          <button 
            onClick={() => { setEditingDelegate(null); setShowForm(true); }}
            style={{ height: '40px', padding: '0 20px', fontSize: '14px' }}
          >
            <Plus size={18} /> Nuevo Delegado
          </button>
        )}
      </div>

      {showForm && (
        <DelegateForm 
          delegate={editingDelegate} 
          onClose={() => setShowForm(false)} 
          onSuccess={() => {
            setShowForm(false);
            fetchDelegates();
          }} 
        />
      )}

      {/* Content Section — hidden while form is open */}
      {!showForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Toolbar */}
          <div className="search-filter-bar">
            <div style={{ position: 'relative', flex: 1 }}>
              <Search 
                size={18} 
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
              />
              <input 
                type="text" 
                placeholder="Buscar por nombre, apellido o DNI..." 
                style={{ width: '100%', padding: '10px 10px 10px 42px', height: '42px', fontSize: '14px' }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Delegado</th>
                  <th>DNI</th>
                  <th>Equipo</th>
                  <th>Registro</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
                ) : delegates.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay delegados registrados</td></tr>
                ) : (
                  delegates.map((delegate) => (
                    <tr key={delegate.id} className="table-row-hover">
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--brand-beige-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-beige)' }}>
                            <Contact size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>{delegate.first_name} {delegate.last_name}</div>
                            {delegate.address && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{delegate.address}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{delegate.dni || '-'}</td>
                      <td><span className="badge">{delegate.team_name}</span></td>
                      <td>{new Date(delegate.created_at).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                           {deletingId === delegate.id ? (
                             <div style={{ display: 'flex', gap: '4px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                               <span style={{ fontSize: '10px', color: '#cc7a5c', fontWeight: 'bold', marginRight: '4px' }}>¿Eliminar?</span>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(delegate.id); }} 
                                 className="danger" 
                                 style={{ minWidth: 'auto', height: '28px', padding: '0 8px', fontSize: '11px' }}
                               >
                                 Sí
                               </button>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(null); }} 
                                 className="secondary" 
                                 style={{ minWidth: 'auto', height: '28px', padding: '0 8px', fontSize: '11px' }}
                               >
                                 No
                               </button>
                             </div>
                           ) : (
                             <>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingDelegate(delegate); setShowForm(true); }} 
                                 className="secondary icon-only" 
                               >
                                 <Edit size={16} />
                               </button>
                               <button 
                                 type="button"
                                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(delegate.id); }} 
                                 className="danger icon-only" 
                               >
                                 <Trash2 size={16} />
                               </button>
                             </>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DelegadosView;
