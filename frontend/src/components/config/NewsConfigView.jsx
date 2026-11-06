import React, { useState, useEffect } from 'react';
import api from '../../api';
import { ImageCropPreviewModal } from './ImageCropPreviewModal';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Upload,
  Newspaper,
  Calendar,
  XCircle,
  CheckCircle2,
  Save,
  Pin,
  Crop
} from 'lucide-react';

const btnOutline = {
  height: 36,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 500,
  background: '#ffffff',
  color: '#18181b',
  border: '1px solid #d4d3ce',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  cursor: 'pointer'
};

const btnDark = {
  height: 36,
  padding: '0 16px',
  borderRadius: 8,
  fontSize: 13,
  fontWeight: 600,
  background: '#141413',
  color: '#ffffff',
  border: '1px solid #141413',
  boxShadow: 'none',
  textTransform: 'none',
  letterSpacing: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  cursor: 'pointer'
};

const labelStyle = {
  fontSize: 11.5,
  fontWeight: 600,
  color: '#52514e',
  marginBottom: 6,
  display: 'block'
};

const NewsConfigView = () => {
  const [newsList, setNewsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingPinId, setTogglingPinId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    image: null,
    originalImage: null,
    cropData: null
  });
  const [newImagePreview, setNewImagePreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Estado del modal de recorte para Noticias ('new' | 'edit' | 'quick-retouch')
  const [cropModal, setCropModal] = useState({
    open: false,
    mode: 'new', // 'new' | 'edit' | 'quick'
    file: null,
    imageUrl: null,
    initialCropData: null,
    item: null
  });

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3200);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [newsRes, catRes] = await Promise.all([
        api.get('news/'),
        api.get('categories/')
      ]);
      const sortedNews = [...newsRes.data].sort(
        (a, b) => Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned))
      );
      setNewsList(sortedNews);
      setCategories(catRes.data);
      if (catRes.data.length > 0) {
        setFormData((prev) => ({
          ...prev,
          category: prev.category || catRes.data[0].name
        }));
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar noticias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!formData.image) {
      setNewImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(formData.image);
    setNewImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [formData.image]);

  useEffect(() => {
    if (!editFormData.image) {
      setEditImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(editFormData.image);
    setEditImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [editFormData.image]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const selectedFile = files[0];
      setCropModal({
        open: true,
        mode: 'new',
        file: selectedFile,
        imageUrl: null,
        initialCropData: null,
        item: null
      });
      e.target.value = '';
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (files && files[0]) {
      const selectedFile = files[0];
      setCropModal({
        open: true,
        mode: 'edit',
        file: selectedFile,
        imageUrl: null,
        initialCropData: null,
        item: null
      });
      e.target.value = '';
      return;
    }
    setEditFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleConfirmCrop = async ({ croppedFile, originalFile, cropData }) => {
    if (cropModal.mode === 'new') {
      setFormData((prev) => ({
        ...prev,
        image: croppedFile,
        originalImage: originalFile || prev.originalImage || croppedFile,
        cropData
      }));
      setCropModal({ open: false, mode: 'new', file: null, imageUrl: null, initialCropData: null, item: null });
      return;
    }

    if (cropModal.mode === 'edit') {
      setEditFormData((prev) => ({
        ...prev,
        image: croppedFile,
        originalImage: originalFile || prev.originalImage || null,
        cropData
      }));
      setCropModal({ open: false, mode: 'edit', file: null, imageUrl: null, initialCropData: null, item: null });
      return;
    }

    if (cropModal.mode === 'quick' && cropModal.item) {
      const targetItem = cropModal.item;
      const data = new FormData();
      data.append('image', croppedFile);
      if (cropData) {
        data.append('crop_data', JSON.stringify(cropData));
      }
      try {
        setSavingEdit(true);
        setError('');
        await api.patch(`news/${targetItem.id}/`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setCropModal({ open: false, mode: 'new', file: null, imageUrl: null, initialCropData: null, item: null });
        showToast('Encuadre de noticia actualizado.');
        fetchData();
      } catch (err) {
        console.error(err);
        setError('Error al guardar el recorte de la noticia.');
      } finally {
        setSavingEdit(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      setError('Seleccioná una imagen para la noticia.');
      return;
    }

    const data = new FormData();
    data.append('title', formData.title);
    data.append('excerpt', formData.excerpt);
    data.append('category', formData.category);
    data.append('date', formData.date);
    data.append('image', formData.image);
    if (formData.originalImage) {
      data.append('original_image', formData.originalImage);
    }
    if (formData.cropData) {
      data.append('crop_data', JSON.stringify(formData.cropData));
    }

    try {
      setUploading(true);
      setError('');
      await api.post('news/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({
        title: '',
        excerpt: '',
        category: categories.length > 0 ? categories[0].name : '',
        date: new Date().toISOString().split('T')[0],
        image: null,
        originalImage: null,
        cropData: null
      });
      const fileEl = document.getElementById('news-image-upload');
      if (fileEl) fileEl.value = '';
      showToast('Noticia publicada.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al publicar la noticia.');
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
      image: null,
      originalImage: null,
      cropData: item.crop_data || null
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
    if (editFormData.originalImage) {
      data.append('original_image', editFormData.originalImage);
    }
    if (editFormData.cropData) {
      data.append('crop_data', JSON.stringify(editFormData.cropData));
    }

    try {
      setSavingEdit(true);
      setError('');
      await api.patch(`news/${id}/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setEditingId(null);
      showToast('Noticia actualizada.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar la noticia.');
    } finally {
      setSavingEdit(false);
    }
  };

  const togglePin = async (item) => {
    try {
      setTogglingPinId(item.id);
      setError('');
      const nextPinned = !item.is_pinned;
      await api.patch(`news/${item.id}/`, { is_pinned: nextPinned });
      showToast(nextPinned ? 'Noticia fijada al principio.' : 'Noticia desfijada.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar el estado de fijado.');
    } finally {
      setTogglingPinId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`news/${id}/`);
      showToast('Noticia eliminada.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar la noticia.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div style={{ color: '#787772', fontSize: 13 }}>Cargando noticias…</div>;
  }

  const activeNewsMeta =
    cropModal.mode === 'edit'
      ? editFormData
      : cropModal.mode === 'quick' && cropModal.item
      ? cropModal.item
      : formData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* Modal de Encuadre para Noticias */}
      {cropModal.open && (
        <ImageCropPreviewModal
          isOpen={cropModal.open}
          file={cropModal.file}
          imageUrl={cropModal.imageUrl}
          initialCropData={cropModal.initialCropData}
          newsMeta={activeNewsMeta}
          isEditing={cropModal.mode !== 'new'}
          uploading={savingEdit}
          variant="news"
          onClose={() =>
            setCropModal({
              open: false,
              mode: 'new',
              file: null,
              imageUrl: null,
              initialCropData: null,
              item: null
            })
          }
          onConfirm={handleConfirmCrop}
        />
      )}

      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <XCircle size={15} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: '#ffffff',
            border: '1px solid #d4d3ce',
            color: '#141413',
            fontSize: 13,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          <CheckCircle2 size={15} style={{ color: '#166534', flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ====================================================================
         1. CONSOLA DE REDACCIÓN (NUEVA NOTICIA)
         ==================================================================== */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '10px 14px',
            background: '#f6f5f1',
            borderBottom: '1px solid #e5e4df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'nowrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#f5dd90',
                color: '#4d3d0d',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Newspaper size={13} strokeWidth={2} />
            </span>
            <strong
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: '#141413',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Redactar nueva noticia
            </strong>
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              ...btnDark,
              height: 32,
              padding: '0 12px',
              fontSize: 12,
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
          >
            <Plus size={13} />
            {uploading ? 'Publicando…' : 'Publicar noticia'}
          </button>
        </div>

        <div className="news-form-body">
          {/* Columna izquierda: Portada visual */}
          <div className="news-cover-col">
            <span style={labelStyle}>Imagen de portada</span>
            <input
              type="file"
              name="image"
              id="news-image-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleInputChange}
            />
            <div
              className={`news-cover-box ${newImagePreview ? 'has-preview' : ''}`}
              onClick={() => document.getElementById('news-image-upload').click()}
              style={{
                border: formData.image ? '1px solid #e5e4df' : '1.5px dashed #d4d3ce'
              }}
            >
              {newImagePreview ? (
                <>
                  <img
                    src={newImagePreview}
                    alt="Vista previa"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: 180,
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: 8
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      display: 'flex',
                      gap: 5
                    }}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCropModal({
                          open: true,
                          mode: 'new',
                          file: formData.originalImage || formData.image,
                          imageUrl: null,
                          initialCropData: formData.cropData,
                          item: null
                        });
                      }}
                      style={{
                        ...btnOutline,
                        height: 26,
                        padding: '0 8px',
                        fontSize: 11,
                        background: 'rgba(255,255,255,0.95)'
                      }}
                    >
                      <Crop size={11} /> Retocar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('news-image-upload').click();
                      }}
                      style={{
                        ...btnOutline,
                        height: 26,
                        padding: '0 8px',
                        fontSize: 11,
                        background: 'rgba(255,255,255,0.95)'
                      }}
                    >
                      Cambiar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFormData((prev) => ({
                          ...prev,
                          image: null,
                          originalImage: null,
                          cropData: null
                        }));
                      }}
                      style={{
                        ...btnOutline,
                        height: 26,
                        width: 26,
                        padding: 0,
                        background: 'rgba(255,255,255,0.95)',
                        color: '#dc2626'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="news-drop-icon"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: '#f1f0ec',
                      color: '#52514e',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 6
                    }}
                  >
                    <Upload size={15} />
                  </div>
                  <div className="news-drop-text">
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#141413' }}>
                      Seleccionar imagen
                    </span>
                    <span style={{ fontSize: 11, color: '#787772' }}>
                      Subir y recortar foto (4:3)
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Columna derecha: Datos y Resumen amplio */}
          <div className="news-fields-col">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10
              }}
            >
              <div style={{ flex: '2 1 220px' }}>
                <span style={labelStyle}>Título de la noticia</span>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Arranca una nueva fecha del torneo…"
                  required
                  className="news-input"
                />
              </div>

              <div style={{ flex: '1 1 130px' }}>
                <span style={labelStyle}>Categoría</span>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="news-input"
                  style={{ padding: '0 8px' }}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '1 1 130px' }}>
                <span style={labelStyle}>Fecha</span>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  className="news-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={labelStyle}>Resumen / Desarrollo de la noticia</span>
              <textarea
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                required
                placeholder="Escribí el resumen o cuerpo de la noticia que verán los jugadores y visitantes en la web…"
                className="news-textarea"
              />
            </div>
          </div>
        </div>
      </form>

      {/* ====================================================================
         2. LISTADO DE NOTICIAS PUBLICADAS
         ==================================================================== */}
      {newsList.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '32px 20px',
            textAlign: 'center',
            color: '#787772',
            fontSize: 13.5
          }}
        >
          No hay noticias publicadas todavía.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: 16
          }}
        >
          {newsList.map((item) => {
            const isEditing = editingId === item.id;

            if (isEditing) {
              return (
                <div
                  key={item.id}
                  style={{
                    gridColumn: '1 / -1',
                    background: '#ffffff',
                    border: '1.5px solid #141413',
                    borderRadius: 12,
                    overflow: 'hidden',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Barra superior de edición */}
                  <div
                    style={{
                      padding: '10px 14px',
                      background: '#f6f5f1',
                      borderBottom: '1px solid #e5e4df',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'nowrap',
                      gap: 8
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          background: '#141413',
                          color: '#ffffff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        <Pencil size={12} />
                      </span>
                      <strong
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: '#141413',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        Editando noticia
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        style={{ ...btnOutline, height: 30, padding: '0 10px', fontSize: 11.5 }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={() => saveEdit(item.id)}
                        style={{ ...btnDark, height: 30, padding: '0 12px', fontSize: 11.5 }}
                      >
                        <Save size={12} />
                        {savingEdit ? 'Guardando…' : 'Guardar'}
                      </button>
                    </div>
                  </div>

                  {/* Cuerpo de edición responsivo */}
                  <div className="news-form-body">
                    {/* Imagen actual / nueva */}
                    <div className="news-cover-col">
                      <span style={labelStyle}>Imagen de la noticia</span>
                      <input
                        type="file"
                        name="image"
                        id={`news-image-edit-${item.id}`}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleEditChange}
                      />
                      <div
                        className="news-cover-box has-preview"
                        style={{
                          border: '1px solid #e5e4df',
                          background: '#f6f5f1'
                        }}
                      >
                        <img
                          src={editImagePreview || item.image}
                          alt={editFormData.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            maxHeight: 180,
                            objectFit: 'cover',
                            display: 'block',
                            borderRadius: 8
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            display: 'flex',
                            gap: 5
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setCropModal({
                                open: true,
                                mode: 'edit',
                                file: editFormData.originalImage || editFormData.image || null,
                                imageUrl:
                                  !editFormData.originalImage && !editFormData.image
                                    ? item.original_image || item.image
                                    : null,
                                initialCropData: editFormData.cropData || item.crop_data || null,
                                item
                              })
                            }
                            style={{
                              ...btnOutline,
                              height: 28,
                              padding: '0 9px',
                              fontSize: 11.5,
                              background: 'rgba(255,255,255,0.95)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }}
                          >
                            <Crop size={12} /> Retocar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById(`news-image-edit-${item.id}`).click()
                            }
                            style={{
                              ...btnOutline,
                              height: 28,
                              padding: '0 10px',
                              fontSize: 11.5,
                              background: 'rgba(255,255,255,0.95)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                            }}
                          >
                            <Upload size={12} /> Cambiar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Campos de edición */}
                    <div className="news-fields-col">
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div style={{ flex: '2 1 220px' }}>
                          <span style={labelStyle}>Título</span>
                          <input
                            type="text"
                            name="title"
                            value={editFormData.title}
                            onChange={handleEditChange}
                            className="news-input"
                            style={{
                              background:
                                editFormData.title !== item.title ? '#fefce8' : '#faf9f6'
                            }}
                          />
                        </div>

                        <div style={{ flex: '1 1 130px' }}>
                          <span style={labelStyle}>Categoría</span>
                          <select
                            name="category"
                            value={editFormData.category}
                            onChange={handleEditChange}
                            className="news-input"
                            style={{
                              padding: '0 8px',
                              background:
                                editFormData.category !== item.category ? '#fefce8' : '#faf9f6'
                            }}
                          >
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div style={{ flex: '1 1 130px' }}>
                          <span style={labelStyle}>Fecha</span>
                          <input
                            type="date"
                            name="date"
                            value={editFormData.date}
                            onChange={handleEditChange}
                            className="news-input"
                            style={{
                              background:
                                editFormData.date !== item.date ? '#fefce8' : '#faf9f6'
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={labelStyle}>Resumen / Contenido</span>
                        <textarea
                          name="excerpt"
                          value={editFormData.excerpt}
                          onChange={handleEditChange}
                          rows={3}
                          className="news-textarea"
                          style={{
                            background:
                              editFormData.excerpt !== item.excerpt ? '#fefce8' : '#faf9f6'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  background: '#ffffff',
                  border: item.is_pinned ? '1.5px solid #141413' : '1px solid #e5e4df',
                  borderRadius: 12,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                {/* Banner superior de la noticia */}
                <div
                  style={{
                    width: '100%',
                    height: 175,
                    borderRadius: 8,
                    background: '#f6f5f1',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'rgba(20, 20, 19, 0.84)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 6
                    }}
                  >
                    {item.category}
                  </span>

                  {item.is_pinned && (
                    <span
                      title="Noticia fijada"
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        width: 28,
                        height: 28,
                        background: '#f5dd90',
                        color: '#141413',
                        borderRadius: '50%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
                      }}
                    >
                      <Pin size={13} style={{ fill: '#141413' }} />
                    </span>
                  )}
                </div>

                {/* Cuerpo */}
                <div
                  style={{
                    padding: '14px 12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: 1,
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11.5,
                        color: '#787772',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        marginBottom: 5
                      }}
                    >
                      <Calendar size={12} /> {item.date}
                    </div>
                    <strong
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#141413',
                        display: 'block',
                        lineHeight: 1.35
                      }}
                    >
                      {item.title}
                    </strong>
                    <p
                      style={{
                        margin: '8px 0 0',
                        color: '#52514e',
                        fontSize: 13,
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                    >
                      {item.excerpt}
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid #f1f0ec',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <button
                      type="button"
                      disabled={togglingPinId === item.id}
                      onClick={() => togglePin(item)}
                      style={
                        item.is_pinned
                          ? {
                              ...btnDark,
                              height: 32,
                              padding: '0 12px',
                              fontSize: 12,
                              background: '#f5dd90',
                              color: '#141413',
                              borderColor: '#e5cd7e'
                            }
                          : {
                              ...btnOutline,
                              height: 32,
                              padding: '0 12px',
                              fontSize: 12
                            }
                      }
                    >
                      <Pin
                        size={12.5}
                        style={item.is_pinned ? { fill: '#141413' } : undefined}
                      />
                      {item.is_pinned ? 'Fijada' : 'Fijar'}
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setCropModal({
                            open: true,
                            mode: 'quick',
                            file: null,
                            imageUrl: item.original_image || item.image,
                            initialCropData: item.crop_data || null,
                            item
                          })
                        }
                        title="Retocar encuadre de la foto"
                        style={{ ...btnOutline, height: 32, padding: '0 10px', fontSize: 12 }}
                      >
                        <Crop size={12.5} /> Encuadre
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        style={{ ...btnOutline, height: 32, padding: '0 12px', fontSize: 12 }}
                      >
                        <Pencil size={12.5} /> Editar
                      </button>

                      {deletingId === item.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            style={{
                              ...btnDark,
                              height: 32,
                              padding: '0 10px',
                              fontSize: 12,
                              background: '#dc2626',
                              borderColor: '#dc2626'
                            }}
                          >
                            Sí, borrar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            style={{ ...btnOutline, height: 32, padding: '0 10px', fontSize: 12 }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingId(item.id)}
                          title="Eliminar noticia"
                          style={{
                            width: 32,
                            height: 32,
                            minWidth: 32,
                            padding: 0,
                            borderRadius: 8,
                            background: '#ffffff',
                            color: '#787772',
                            border: '1px solid #e5e4df',
                            boxShadow: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsConfigView;
