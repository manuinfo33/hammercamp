import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Plus, Trash2, Image as ImageIcon, CheckCircle, XCircle } from 'lucide-react';

const CarouselConfigView = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newImage, setNewImage] = useState(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

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
    // Asignar orden por defecto basado en la cantidad de imágenes
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
    if (!window.confirm('¿Seguro que deseas eliminar esta imagen?')) return;
    try {
      await api.delete(`carousel-images/${id}/`);
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar.');
    }
  };

  if (loading) return <div style={{ color: 'var(--text-muted)' }}>Cargando imágenes...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Imágenes del Carrusel</h2>
      </div>

      {error && <div style={{ background: 'rgba(220, 80, 80, 0.1)', color: '#e08080', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>{error}</div>}

      <div style={{ background: 'var(--bg-base)', padding: '20px', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(212,184,150,0.1)' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: 'var(--brand-beige)' }}>Agregar Nueva Imagen</h3>
        <form onSubmit={handleUpload} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Título (opcional)</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Torneo Verano 2026" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Imagen</label>
            <input type="file" id="image-upload" accept="image/*" onChange={(e) => setNewImage(e.target.files[0])} required />
          </div>
          <button type="submit" disabled={uploading} className="btn-primary" style={{ padding: '0 24px', height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {uploading ? 'Subiendo...' : <><Plus size={18} /> Subir</>}
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {images.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay imágenes configuradas.</p>
        ) : (
          images.map((img) => (
            <div key={img.id} style={{ 
              background: 'var(--bg-base)', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(212,184,150,0.1)',
              position: 'relative'
            }}>
              <div style={{ width: '100%', height: '160px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={img.image} alt={img.title || 'Carrusel'} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: img.is_active ? 1 : 0.4 }} />
              </div>
              <div style={{ padding: '16px' }}>
                <h4 style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{img.title || 'Sin Título'}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <button 
                    onClick={() => toggleActive(img.id, img.is_active)}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                      color: img.is_active ? '#4ade80' : 'var(--text-muted)' 
                    }}
                  >
                    {img.is_active ? <CheckCircle size={18} /> : <XCircle size={18} />}
                    <span style={{ fontSize: '13px' }}>{img.is_active ? 'Visible' : 'Oculta'}</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(img.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
                    title="Eliminar imagen"
                  >
                    <Trash2 size={18} />
                  </button>
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
