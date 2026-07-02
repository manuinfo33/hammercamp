import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';

const NewsConfigView = () => {
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    image: null
  });

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [newsRes, catRes] = await Promise.all([
        api.get('news/'),
        api.get('categories/')
      ]);
      setNewsList(newsRes.data);
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setFormData(prev => ({ ...prev, category: catRes.data[0].name }));
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar datos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      setError('Debes seleccionar una imagen.');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('excerpt', formData.excerpt);
    data.append('category', formData.category);
    data.append('date', formData.date);
    data.append('image', formData.image);

    try {
      setUploading(true);
      await api.post('news/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({
        title: '',
        excerpt: '',
        category: categories.length > 0 ? categories[0].name : '',
        date: new Date().toISOString().split('T')[0],
        image: null
      });
      document.getElementById('news-image-upload').value = '';
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al crear noticia.');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditFormData({
      title: item.title,
      excerpt: item.excerpt,
      category: item.category,
      date: item.date,
      image: null
    });
  };

  const saveEdit = async (id) => {
    const data = new FormData();
    data.append('title', editFormData.title);
    data.append('excerpt', editFormData.excerpt);
    data.append('category', editFormData.category);
    data.append('date', editFormData.date);
    if (editFormData.image) {
      data.append('image', editFormData.image);
    }

    try {
      await api.patch(`news/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar noticia.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta noticia?')) return;
    try {
      await api.delete(`news/${id}/`);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar.');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Cargando datos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Gestión de Noticias</h2>
      </div>

      {error && <div style={{ background: 'rgba(220, 80, 80, 0.1)', color: '#e08080', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ background: 'var(--bg-base)', padding: '20px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(212,184,150,0.1)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--brand-beige)' }}>Agregar Nueva Noticia</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Título</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required />
            </div>
            <div className="input-group" style={{ width: '200px' }}>
              <label>Categoría</label>
              <select name="category" value={formData.category} onChange={handleInputChange}>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ width: '150px' }}>
              <label>Fecha</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required />
            </div>
          </div>
          
          <div className="input-group">
            <label>Resumen / Descripción corta</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleInputChange} rows={2} required />
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Imagen</label>
              <input type="file" name="image" id="news-image-upload" accept="image/*" onChange={handleInputChange} required />
            </div>
            <button type="submit" disabled={uploading} className="btn-primary" style={{ padding: '0 24px', height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {uploading ? 'Guardando...' : <><Plus size={18} /> Agregar</>}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {newsList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay noticias publicadas.</p>
        ) : (
          newsList.map((item) => (
            <div key={item.id} style={{ 
              background: 'var(--bg-base)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(212,184,150,0.1)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {editingId === item.id ? (
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px' }} />
                  <select name="category" value={editFormData.category} onChange={handleEditChange} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px' }}>
                    {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                  <input type="date" name="date" value={editFormData.date} onChange={handleEditChange} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px' }} />
                  <textarea name="excerpt" value={editFormData.excerpt} onChange={handleEditChange} rows={3} style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px' }} />
                  <input type="file" name="image" accept="image/*" onChange={handleEditChange} style={{ fontSize: '12px' }} />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => setEditingId(null)} className="btn-secondary" style={{ padding: '6px 12px' }}>Cancelar</button>
                    <button onClick={() => saveEdit(item.id)} className="btn-primary" style={{ padding: '6px 12px' }}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: '100%', height: '160px', background: '#111' }}>
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: 'var(--brand-beige-subtle)', color: 'var(--brand-beige)', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.date}</span>
                    </div>
                    <h4 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '1.1rem' }}>{item.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', flex: 1 }}>{item.excerpt}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }} title="Editar">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }} title="Eliminar">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsConfigView;
