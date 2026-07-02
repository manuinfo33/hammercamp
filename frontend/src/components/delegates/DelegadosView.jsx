import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Search, Contact, Trash2, Edit } from 'lucide-react';
import DelegateForm from './DelegateForm';

const DelegadosView = () => {
  const [delegates, setDelegates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingDelegate, setEditingDelegate] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchDelegates();
  }, [search]);

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
    if (window.confirm('¿Estás seguro de eliminar este delegado?')) {
      setDeletingId(id);
      try {
        await api.delete(`delegates/${id}/`);
        fetchDelegates();
      } catch (error) {
        console.error("Error deleting delegate:", error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '32px', margin: 0 }}>Delegados</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Gestión de delegados y representantes de equipos</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => { setEditingDelegate(null); setShowForm(true); }}
            style={{ 
              height: '42px', padding: '0 20px', fontSize: '14px',
              background: 'linear-gradient(135deg, var(--brand-beige), var(--brand-beige-dim))',
              boxShadow: '0 8px 20px -6px rgba(212,184,150,0.4)',
              border: 'none',
              color: '#1a1512'
            }}
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
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '15px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search 
              size={18} 
              style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} 
            />
            <input 
              type="text" 
              placeholder="Buscar por nombre, apellido o DNI..." 
              style={{ 
                width: '100%', 
                padding: '10px 10px 10px 42px', 
                height: '42px', 
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--input-bg)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--border-subtle)' }}>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Delegado</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>DNI</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Equipo</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Registro</th>
                <th style={{ padding: '16px 20px', fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Cargando...</td></tr>
              ) : delegates.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No hay delegados registrados</td></tr>
              ) : (
                delegates.map((delegate) => (
                  <tr key={delegate.id} style={{ borderBottom: '1px solid var(--border-subtle)' }} className="table-row-hover">
                    <td style={{ padding: '16px 20px' }}>
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
                    <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>{delegate.dni || '-'}</td>
                    <td style={{ padding: '16px 20px' }}><span className="badge">{delegate.team_name}</span></td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(delegate.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        {deletingId === delegate.id ? (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Eliminando...</span>
                        ) : (
                          <>
                            <button onClick={() => { setEditingDelegate(delegate); setShowForm(true); }} className="secondary" style={{ padding: '6px', minWidth: 'auto', height: 'auto', borderRadius: '8px' }}>
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(delegate.id)} className="danger" style={{ padding: '6px', minWidth: 'auto', height: 'auto', borderRadius: '8px' }}>
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
