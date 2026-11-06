import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  Trash2,
  Images,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowUpDown,
  Check,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Crop,
  Eye,
  EyeOff
} from 'lucide-react';
import ImageCropPreviewModal from './ImageCropPreviewModal';

const btnOutline = {
  height: 32,
  padding: '0 12px',
  borderRadius: 8,
  fontSize: 12.5,
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
  height: 32,
  padding: '0 14px',
  borderRadius: 8,
  fontSize: 12.5,
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

const GalleryConfigView = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  // Estados para el Modal de Recorte y Previsualización
  const [pendingCropFile, setPendingCropFile] = useState(null);
  const [editingImageItem, setEditingImageItem] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);

  // Estados para el Modo Reordenar
  const [isReordering, setIsReordering] = useState(false);
  const [reorderedImages, setReorderedImages] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [touchItemIdx, setTouchItemIdx] = useState(null);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await api.get('gallery-images/');
      setImages(res.data);
      setReorderedImages(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar las imágenes de galería.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditingImageItem(null);
    setPendingCropFile(file);
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleStartEdit = (img) => {
    setPendingCropFile(null);
    setEditingImageItem(img);
    setCropModalOpen(true);
  };

  const handleCropConfirm = async ({ croppedFile, originalFile, cropData, title: confirmedTitle }) => {
    const formData = new FormData();
    if (croppedFile) formData.append('image', croppedFile);
    if (originalFile) formData.append('original_image', originalFile);
    if (cropData) formData.append('crop_data', JSON.stringify(cropData));
    if (confirmedTitle !== undefined) formData.append('title', confirmedTitle.trim());

    try {
      setUploading(true);
      setError('');

      if (editingImageItem) {
        await api.patch(`gallery-images/${editingImageItem.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg('Encuadre actualizado.');
      } else {
        formData.append('order', images.length);
        await api.post('gallery-images/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSuccessMsg('Imagen agregada a la galería.');
      }

      setCropModalOpen(false);
      setPendingCropFile(null);
      setEditingImageItem(null);
      setTitle('');
      setTimeout(() => setSuccessMsg(''), 3200);
      await fetchImages();
    } catch (err) {
      console.error(err);
      setError(editingImageItem ? 'Error al actualizar la imagen.' : 'Error al subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`gallery-images/${id}/`, { is_active: !currentStatus });
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al actualizar estado.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`gallery-images/${id}/`);
      fetchImages();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar.');
    } finally {
      setDeletingId(null);
    }
  };

  // --- LÓGICA DE REORDENAMIENTO ---
  const handleStartReorder = () => {
    setIsReordering(true);
    setReorderedImages([...images]);
  };

  const handleCancelReorder = () => {
    setIsReordering(false);
    setReorderedImages([...images]);
    setDraggedIdx(null);
    setTouchItemIdx(null);
  };

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= reorderedImages.length) return;
    setReorderedImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
    moveItem(draggedIdx, index);
    setDraggedIdx(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const handleTouchStart = (e, index) => {
    setTouchItemIdx(index);
  };

  const handleTouchMove = (e) => {
    if (touchItemIdx === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const card = element?.closest('[data-gallery-idx]');
    if (card) {
      const targetIdx = parseInt(card.getAttribute('data-gallery-idx'), 10);
      if (!isNaN(targetIdx) && targetIdx !== touchItemIdx) {
        moveItem(touchItemIdx, targetIdx);
        setTouchItemIdx(targetIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchItemIdx(null);
  };

  const handleSaveOrder = async () => {
    if (reorderedImages.length === 0) return;
    setSavingOrder(true);
    try {
      const orderedIds = reorderedImages.map((img) => img.id);
      await api.post('gallery-images/reorder/', { ordered_ids: orderedIds });
      setSuccessMsg('Orden guardado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsReordering(false);
      await fetchImages();
    } catch (err) {
      console.error('Error al guardar nuevo orden:', err);
      setError('Hubo un error al guardar el orden.');
    } finally {
      setSavingOrder(false);
    }
  };

  if (loading) {
    return <div style={{ color: '#787772', fontSize: 13 }}>Cargando galería…</div>;
  }

  const currentDisplayImages = isReordering ? reorderedImages : images;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
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
         1. TARJETA SUPERIOR: SUBIR NUEVA IMAGEN DE GALERÍA Y CONTROL DE ORDEN
         ==================================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '12px 18px',
            background: '#f6f5f1',
            borderBottom: '1px solid #e5e4df',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#d8b4fe',
                color: '#3b0764',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Images size={13} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13.5, fontWeight: 700, color: '#141413' }}>
              Galería de imágenes
            </strong>
            <span style={{ fontSize: 12, color: '#787772' }}>
              ({images.length})
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isReordering ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelReorder}
                  disabled={savingOrder}
                  style={{ ...btnOutline, height: 30, padding: '0 12px', fontSize: 12 }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrder}
                  disabled={savingOrder}
                  style={{ ...btnDark, height: 30, padding: '0 12px', fontSize: 12 }}
                >
                  <Check size={13} />
                  {savingOrder ? 'Guardando…' : 'Guardar orden'}
                </button>
              </>
            ) : (
              images.length > 1 && (
                <button
                  type="button"
                  onClick={handleStartReorder}
                  style={{ ...btnOutline, height: 30, padding: '0 12px', fontSize: 12 }}
                >
                  <ArrowUpDown size={13} /> Ordenar
                </button>
              )
            )}
          </div>
        </div>

        {isReordering ? (
          <div
            style={{
              padding: '12px 18px',
              background: '#fefce8',
              fontSize: 12.5,
              color: '#713f12',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <span>Arrastrá las tarjetas o usá las flechas para cambiar su posición.</span>
            <strong>#1 aparece primero en la sección Galerías</strong>
          </div>
        ) : (
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div style={{ flex: '1 1 240px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#787772', marginBottom: 5 }}>
                Descripción o título de la foto (opcional)
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Fecha 4 — Torneo Clausura"
                style={{
                  height: 34,
                  padding: '0 10px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  background: '#faf9f6',
                  border: '1px solid #e5e4df',
                  color: '#141413',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <input
              type="file"
              id="gallery-image-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />

            <button
              type="button"
              onClick={() => document.getElementById('gallery-image-upload').click()}
              disabled={uploading}
              style={{ ...btnDark, height: 34, padding: '0 16px' }}
            >
              <Upload size={13.5} />
              {uploading ? 'Subiendo…' : 'Subir y encuadrar imagen'}
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
         2. GRILLA DE TARJETAS DE LA GALERÍA
         ==================================================================== */}
      {currentDisplayImages.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: '28px 20px',
            textAlign: 'center',
            color: '#787772',
            fontSize: 13
          }}
        >
          No hay imágenes cargadas en la galería todavía.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: 14
          }}
          onTouchMove={isReordering ? handleTouchMove : undefined}
          onTouchEnd={isReordering ? handleTouchEnd : undefined}
        >
          {currentDisplayImages.map((img, index) => {
            const isDragging = draggedIdx === index || touchItemIdx === index;

            return (
              <div
                key={img.id}
                data-gallery-idx={index}
                draggable={isReordering}
                onDragStart={isReordering ? (e) => handleDragStart(e, index) : undefined}
                onDragEnter={isReordering ? (e) => handleDragEnter(e, index) : undefined}
                onDragOver={isReordering ? handleDragOver : undefined}
                onDragEnd={isReordering ? handleDragEnd : undefined}
                onTouchStart={isReordering ? (e) => handleTouchStart(e, index) : undefined}
                style={{
                  background: isDragging ? '#fefce8' : '#ffffff',
                  border: isDragging
                    ? '1.5px dashed #141413'
                    : '1px solid #e5e4df',
                  borderRadius: 12,
                  padding: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: isReordering ? 'grab' : 'default',
                  transform: isDragging ? 'scale(1.01)' : 'none',
                  transition: 'transform 0.12s ease, border-color 0.12s ease'
                }}
              >
                {/* Imagen cuadrada 1:1 igual que en la web */}
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: 8,
                    background: '#18181b',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={img.image}
                    alt={img.title || 'Galería'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: img.is_active ? 1 : 0.4,
                      transition: 'opacity 0.2s ease'
                    }}
                  />

                  {/* Número de orden */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: 'rgba(20, 20, 19, 0.82)',
                      color: '#ffffff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {isReordering && <GripVertical size={12} />}#{index + 1}
                  </span>

                  {/* Controles de orden en modo reordenar */}
                  {isReordering && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        display: 'flex',
                        gap: 4
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, index - 1);
                        }}
                        disabled={index === 0}
                        style={{
                          width: 26,
                          height: 26,
                          minWidth: 26,
                          padding: 0,
                          borderRadius: 6,
                          border: 'none',
                          background: 'rgba(20, 20, 19, 0.82)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          opacity: index === 0 ? 0.4 : 1
                        }}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveItem(index, index + 1);
                        }}
                        disabled={index === currentDisplayImages.length - 1}
                        style={{
                          width: 26,
                          height: 26,
                          minWidth: 26,
                          padding: 0,
                          borderRadius: 6,
                          border: 'none',
                          background: 'rgba(20, 20, 19, 0.82)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor:
                            index === currentDisplayImages.length - 1 ? 'not-allowed' : 'pointer',
                          opacity: index === currentDisplayImages.length - 1 ? 0.4 : 1
                        }}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Cuerpo de la tarjeta */}
                <div
                  style={{
                    padding: '10px 10px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                >
                  <strong
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#141413',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={img.title || 'Sin título'}
                  >
                    {img.title || 'Sin título'}
                  </strong>

                  {!isReordering && (
                    <div
                      style={{
                        paddingTop: 8,
                        borderTop: '1px solid #f1f0ec',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 6
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleActive(img.id, img.is_active)}
                        style={{
                          ...btnOutline,
                          height: 28,
                          padding: '0 9px',
                          fontSize: 11.5,
                          color: img.is_active ? '#166534' : '#787772',
                          borderColor: img.is_active ? '#bbf7d0' : '#e5e4df',
                          background: img.is_active ? '#f0fdf4' : '#faf9f6'
                        }}
                      >
                        {img.is_active ? <Eye size={12.5} /> : <EyeOff size={12.5} />}
                        {img.is_active ? 'Visible' : 'Oculta'}
                      </button>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(img)}
                          style={{
                            ...btnOutline,
                            height: 28,
                            padding: '0 10px',
                            fontSize: 11.5
                          }}
                          title="Retocar encuadre o título"
                        >
                          <Crop size={12.5} /> Retocar
                        </button>

                        {deletingId === img.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button
                              type="button"
                              onClick={() => handleDelete(img.id)}
                              style={{
                                ...btnDark,
                                height: 28,
                                padding: '0 8px',
                                fontSize: 11,
                                background: '#dc2626',
                                borderColor: '#dc2626'
                              }}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              style={{
                                ...btnOutline,
                                height: 28,
                                padding: '0 8px',
                                fontSize: 11
                              }}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingId(img.id)}
                            title="Eliminar imagen"
                            style={{
                              width: 28,
                              height: 28,
                              minWidth: 28,
                              padding: 0,
                              borderRadius: 6,
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
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Recorte y Previsualización Web */}
      {cropModalOpen && (pendingCropFile || editingImageItem) && (
        <ImageCropPreviewModal
          variant="gallery"
          file={pendingCropFile}
          imageUrl={
            editingImageItem ? editingImageItem.original_image || editingImageItem.image : null
          }
          initialCropData={editingImageItem?.crop_data || null}
          initialTitle={editingImageItem ? editingImageItem.title || '' : title}
          isEditing={!!editingImageItem}
          uploading={uploading}
          onClose={() => {
            setCropModalOpen(false);
            setPendingCropFile(null);
            setEditingImageItem(null);
          }}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
};

export default GalleryConfigView;

