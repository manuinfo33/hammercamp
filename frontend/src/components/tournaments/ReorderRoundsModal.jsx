import React, { useState } from 'react';
import { GripVertical, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { Modal } from '../finanzas/common';
import api from '../../api';

export default function ReorderRoundsModal({ rounds = [], onClose, onSuccess, setAlert }) {
  const [items, setItems] = useState(() => [...rounds]);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [touchItemIdx, setTouchItemIdx] = useState(null);

  const moveItem = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= items.length) return;
    setItems(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  // HTML5 Drag handlers for Desktop
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

  // Touch handlers for Mobile
  const handleTouchStart = (e, index) => {
    setTouchItemIdx(index);
  };

  const handleTouchMove = (e) => {
    if (touchItemIdx === null) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const row = element?.closest('[data-round-idx]');
    if (row) {
      const targetIdx = parseInt(row.getAttribute('data-round-idx'), 10);
      if (!isNaN(targetIdx) && targetIdx !== touchItemIdx) {
        moveItem(touchItemIdx, targetIdx);
        setTouchItemIdx(targetIdx);
      }
    }
  };

  const handleTouchEnd = () => {
    setTouchItemIdx(null);
  };

  const handleSave = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      const orderedItems = items.map((item, idx) => ({
        round_ids: item.roundIds || [item.id],
        order: idx + 1
      }));

      await api.post('match-rounds/reorder/', { ordered_items: orderedItems });
      if (setAlert) {
        setAlert({ message: 'Fechas reordenadas exitosamente.', type: 'success' });
      }
      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error al guardar nuevo orden de fechas:', err);
      if (setAlert) {
        setAlert({ message: 'Hubo un error al guardar el orden de las fechas.', type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const formatShortDate = (dateStr) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <Modal title="Ordenar Fechas del Fixture" onClose={onClose} width={480}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#71717a' }}>
          Arrastrá las fechas o usá las flechas para definir el orden en el fixture.
        </p>

        {items.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#a1a1aa', fontSize: 13 }}>
            No hay fechas creadas en este fixture.
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: '55vh',
              overflowY: 'auto',
              paddingRight: 2,
              paddingBottom: 2
            }}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {items.map((r, index) => {
              const isDragging = draggedIdx === index || touchItemIdx === index;
              const shortDate = formatShortDate(r.date);

              return (
                <div
                  key={r.id || `round-${index}`}
                  data-round-idx={index}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={handleDragOver}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 10,
                    border: isDragging ? '1.5px dashed #141413' : '1px solid #e4e4e7',
                    background: isDragging ? '#f4f4f5' : '#ffffff',
                    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                    cursor: 'grab',
                    userSelect: 'none',
                    transition: 'border 0.12s ease, background 0.12s ease',
                    touchAction: 'none'
                  }}
                >
                  {/* Left: Grip Handle + Title + Optional Date */}
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a1a1aa',
                        cursor: 'grab',
                        padding: '4px 2px'
                      }}
                      title="Arrastrar para ordenar"
                    >
                      <GripVertical size={16} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: '#141413',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {r.name}
                      </span>

                      {shortDate && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#71717a',
                            background: '#f4f4f5',
                            padding: '1px 6px',
                            borderRadius: 4
                          }}
                        >
                          {shortDate}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Up / Down Arrows */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, index - 1);
                      }}
                      disabled={index === 0}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid #e4e4e7',
                        background: index === 0 ? '#f4f4f5' : '#ffffff',
                        color: index === 0 ? '#d4d4d8' : '#141413',
                        cursor: index === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all 0.12s ease'
                      }}
                      title="Subir"
                      aria-label="Subir"
                    >
                      <ChevronUp size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveItem(index, index + 1);
                      }}
                      disabled={index === items.length - 1}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        border: '1px solid #e4e4e7',
                        background: index === items.length - 1 ? '#f4f4f5' : '#ffffff',
                        color: index === items.length - 1 ? '#d4d4d8' : '#141413',
                        cursor: index === items.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        transition: 'all 0.12s ease'
                      }}
                      title="Bajar"
                      aria-label="Bajar"
                    >
                      <ChevronDown size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 10,
            marginTop: 4,
            borderTop: '1px solid #e4e4e7',
            paddingTop: 12
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              background: '#ffffff',
              color: '#18181b',
              border: '1px solid #d4d3ce',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || items.length === 0}
            style={{
              height: 36,
              padding: '0 18px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: '#141413',
              color: '#ffffff',
              border: '1px solid #141413',
              cursor: saving || items.length === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              opacity: saving || items.length === 0 ? 0.6 : 1
            }}
          >
            {saving ? 'Guardando...' : (
              <>
                <Check size={15} /> Guardar Orden
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
