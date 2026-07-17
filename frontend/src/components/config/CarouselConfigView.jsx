import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Trash2, Image as ImageIcon, CheckCircle, XCircle, Upload, X } from 'lucide-react';

const CarouselConfigView = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await api.get('carousel-images/');
      setImages(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar imágenes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!newImage) return;

    const formData = new FormData();
    formData.append('image', newImage);
    if (title) formData.append('title', title);
    formData.append('order', images.length);

    try {
      setUploading(true);
      await api.post('carousel-images/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewImage(null);
      setTitle('');
      document.getElementById('image-upload').value = '';
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`carousel-images/${id}/`, { is_active: !currentStatus });
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar estado.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`carousel-images/${id}/`);
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Cargando imágenes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontFamily: 'Newsreader, Georgia, serif', fontSize: '22px', fontWeight: '400', color: 'var(--text-primary)', margin: 0 }}>Imágenes del Carrusel</h2>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(204, 122, 92, 0.05)', color: '#cc7a5c', fontSize: '13px', border: '1px solid #e5c5bb', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Formulario Agregar Nueva Imagen */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid #e6dfd3', paddingBottom: '32px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '700', color: '#cc7a5c', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={14} /> Agregar Nueva Imagen
        </h3>
        
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={{ borderColor: 'var(--border-subtle)' }} />
          </div>
          
          <div className="input-group" style={{ flex: 1 }}>
            <label>Imagen</label>
            <div style={{
              border: newImage ? '1px solid #e6dfd3' : '2px dashed #c4b9a3',
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
            onClick={() => document.getElementById('image-upload').click()}
            >
              <input 
                type="file" 
                id="image-upload" 
                accept="image/*" 
                style={{ display: 'none' }}
                onChange={(e) => setNewImage(e.target.files[0])} 
                required 
              />
              {newImage ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#cc7a5c', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{newImage.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setNewImage(null); }}
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
            {uploading ? '...' : <><Plus size={18} /> Subir</>}
          </button>
        </form>
      </div>

      {/* Grid de imágenes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {images.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No hay imágenes configuradas.</p>
        ) : (
          images.map((img) => (
            <div key={img.id} style={{ 
              background: '#ffffff', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid #e6dfd3',
              boxShadow: '0 2px 8px rgba(25, 20, 15, 0.03)',
              position: 'relative'
            }}>
              <div style={{ width: '100%', height: '160px', background: '#faf9f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e6dfd3' }}>
                <img src={img.image} alt={img.title || 'Carrusel'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: img.is_active ? 1 : 0.4 }} />
              </div>
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', fontSize: '14px' }}>{img.title || 'Sin Título'}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    onClick={() => toggleActive(img.id, img.is_active)}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      color: img.is_active ? '#2e7d32' : 'var(--text-muted)' 
                    }}
                  >
                    {img.is_active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    <span style={{ fontSize: '13px', fontWeight: img.is_active ? '600' : '400' }}>{img.is_active ? 'Visible' : 'Oculta'}</span>
                  </button>
                  
                  {deletingId === img.id ? (
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', animation: 'fadeIn 0.2s ease' }}>
                      <span style={{ fontSize: '10px', color: '#cc7a5c', fontWeight: 'bold', marginRight: '4px' }}>¿Eliminar?</span>
                      <button 
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(img.id); }} 
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
                    <button 
                      onClick={() => setDeletingId(img.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc7a5c', display: 'flex', alignItems: 'center', padding: '4px' }}
                      title="Eliminar imagen"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CarouselConfigView;
