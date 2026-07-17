import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Trash2, Edit2, Check, X, Upload, Newspaper, Calendar } from 'lucide-react';

const NewsConfigView = () => {
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
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
    try {
      await api.delete(`news/${id}/`);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando datos...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: '22px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>Gestión de Noticias</h2>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.05)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Formulario Agregar Nueva Noticia */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid #e6dfd3', paddingBottom: '32px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Newspaper size={14} /> Agregar Nueva Noticia
        </h3>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Título</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
            
            <div className="input-group" style={{ width: '220px' }}>
              <label>Categoría</label>
              <select name="category" value={formData.category} onChange={handleInputChange} style={{ borderColor: 'var(--border-subtle)' }}>
                {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
              </select>
            </div>
            
            <div className="input-group" style={{ width: '180px' }}>
              <label>Fecha</label>
              <input type="date" name="date" value={formData.date} onChange={handleInputChange} required style={{ borderColor: 'var(--border-subtle)' }} />
            </div>
          </div>
          
          <div className="input-group">
            <label>Resumen / Descripción corta</label>
            <textarea name="excerpt" value={formData.excerpt} onChange={handleInputChange} rows={2} required style={{ borderColor: 'var(--border-subtle)', borderRadius: '10px', padding: '10px 16px', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' }} />
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1 }}>
              <label>Imagen</label>
              <div style={{
                border: formData.image ? '1px solid #e6dfd3' : '2px dashed #c4b9a3',
                borderRadius: '12px',
                padding: '10px 16px',
                textAlign: 'center',
                background: '#fcfbfa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                height: '42px',
                boxSizing: 'border-box'
              }}
              onClick={() => document.getElementById('news-image-upload').click()}
              >
                <input 
                  type="file" 
                  name="image" 
                  id="news-image-upload" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleInputChange} 
                  required 
                />
                {formData.image ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#cc7a5c', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.image.name}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, image: null })); }}
                      style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={16} style={{ color: '#cc7a5c' }} />
                    <span style={{ fontSize: '13px', color: '#7f776f' }}>Subir Imagen</span>
                  </>
                )}
              </div>
            </div>
            
            <button type="submit" disabled={uploading} style={{ height: '42px', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {uploading ? '...' : <><Plus size={18} /> Agregar</>}
            </button>
          </div>
        </form>
      </div>

      {/* Grid de noticias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {newsList.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay noticias publicadas.</p>
        ) : (
          newsList.map((item) => (
            <div key={item.id} style={{ 
              background: '#ffffff', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid #e6dfd3',
              boxShadow: '0 2px 8px rgba(25, 20, 15, 0.03)',
              display: 'flex',
              flexDirection: 'column'
            }}>
              {editingId === item.id ? (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="input-group">
                    <label>Título</label>
                    <input type="text" name="title" value={editFormData.title} onChange={handleEditChange} style={{ borderColor: 'var(--border-subtle)', height: '38px' }} />
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="input-group">
                      <label>Categoría</label>
                      <select name="category" value={editFormData.category} onChange={handleEditChange} style={{ borderColor: 'var(--border-subtle)', height: '38px', padding: '6px 12px' }}>
                        {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label>Fecha</label>
                      <input type="date" name="date" value={editFormData.date} onChange={handleEditChange} style={{ borderColor: 'var(--border-subtle)', height: '38px' }} />
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label>Resumen</label>
                    <textarea name="excerpt" value={editFormData.excerpt} onChange={handleEditChange} rows={3} style={{ borderColor: 'var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontFamily: 'inherit' }} />
                  </div>
                  
                  <div className="input-group">
                    <label>Imagen</label>
                    <div style={{
                      border: editFormData.image ? '1px solid #e6dfd3' : '1px dashed #c4b9a3',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      background: '#fcfbfa',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      height: '38px',
                      boxSizing: 'border-box'
                    }}
                    onClick={() => document.getElementById(`news-image-edit-${item.id}`).click()}
                    >
                      <input 
                        type="file" 
                        name="image" 
                        id={`news-image-edit-${item.id}`} 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={handleEditChange} 
                      />
                      {editFormData.image ? (
                        <span style={{ fontSize: '12px', color: '#cc7a5c', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{editFormData.image.name}</span>
                      ) : (
                        <>
                          <Upload size={14} style={{ color: '#cc7a5c' }} />
                          <span style={{ fontSize: '12px', color: '#7f776f' }}>Cambiar Imagen</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button onClick={() => setEditingId(null)} className="secondary" style={{ padding: '6px 12px', height: '34px', fontSize: '12px' }}>Cancelar</button>
                    <button onClick={() => saveEdit(item.id)} style={{ padding: '6px 12px', height: '34px', fontSize: '12px' }}>Guardar</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ width: '100%', height: '160px', background: '#faf9f6', borderBottom: '1px solid #e6dfd3' }}>
                    <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', background: '#eae4d8', color: '#191919', border: '1px solid #d8cfc0', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={12} /> {item.date}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '15px' }}>{item.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13px', flex: 1, lineHeight: '1.5' }}>{item.excerpt}</p>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e6dfd3' }}>
                      <button onClick={() => startEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc7a5c', display: 'flex', alignItems: 'center', padding: '4px' }} title="Editar">
                        <Edit2 size={16} />
                      </button>
                      
                      {deletingId === item.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                          <span style={{ fontSize: '10px', color: '#cc7a5c', fontWeight: 'bold', marginRight: '4px' }}>¿Eliminar?</span>
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(item.id); }} 
                            className="danger" 
                            style={{ minWidth: 'auto', height: '24px', padding: '0 6px', fontSize: '10px' }}
                          >
                            Sí
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingId(null); }} 
                            className="secondary" 
                            style={{ minWidth: 'auto', height: '24px', padding: '0 6px', fontSize: '10px' }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setDeletingId(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc7a5c', display: 'flex', alignItems: 'center', padding: '4px' }} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      )}
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
