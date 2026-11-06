import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useBranding } from '../../context/BrandingContext';
import {
  X,
  Check,
  Crop as CropIcon,
  ZoomIn,
  ZoomOut,
  Monitor,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Menu,
  User
} from 'lucide-react';

/**
 * Proporción exacta del carrusel en la web:
 * El hero banner ocupa w-full y h-[78vh] en desktop (proporción 2.28:1).
 */
const WEB_CAROUSEL_RATIO = 2.28;
const WEB_NEWS_RATIO = 4 / 3;

export function ImageCropPreviewModal({
  isOpen = true,
  file,
  imageUrl,
  initialCropData = null,
  initialTitle = '',
  newsMeta = null,
  isEditing = false,
  onClose,
  onCancel,
  onConfirm,
  uploading = false,
  variant = 'carousel' // 'carousel' (banner 2.28:1) | 'gallery' (galería 1:1) | 'news' (noticia 4:3) | 'logo' (logo de marca, proporcion libre)
}) {
  const handleClose = onClose || onCancel;
  const { brandNameUpper } = useBranding();
  const isLogo = variant === 'logo';
  const isGallery = variant === 'gallery';
  const isNews = variant === 'news';
  const defaultRatio = isGallery ? 1 : isNews ? WEB_NEWS_RATIO : WEB_CAROUSEL_RATIO;
  // Proporcion activa del recuadro (carrusel: 2.28:1; galería: 1:1; logo: se define al cargar la imagen)
  const [ratio, setRatio] = useState(defaultRatio);
  const minW = isLogo ? 48 : 120;
  const minH = isLogo ? 48 / ratio : 60;

  const [title, setTitle] = useState(initialTitle || '');
  const [activeTab, setActiveTab] = useState('crop'); // 'crop' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'desktop' | 'mobile'
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth <= 640 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [imageSrc, setImageSrc] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [croppedDataUrl, setCroppedDataUrl] = useState(null);
  const [loadingImage, setLoadingImage] = useState(true);

  // Referencias para manipulación y persistencia en memoria
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const loadedImageRef = useRef(null);
  const croppedBlobRef = useRef(null);
  const cropRef = useRef(crop);

  useEffect(() => {
    cropRef.current = crop;
  }, [crop]);

  const isDraggingRef = useRef(false);
  const dragActionRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, crop: null });

  // Bloqueo de scroll de la página mientras el modal está abierto
  useEffect(() => {
    if (isOpen === false || (!file && !imageUrl)) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, [isOpen, file, imageUrl]);

  // Cerrar con tecla Escape
  useEffect(() => {
    if (isOpen === false || (!file && !imageUrl)) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !uploading && handleClose) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, file, imageUrl, uploading, handleClose]);

  // Función para generar tanto el DataURL como el Blob recortado de forma robusta
  const generateCropBlob = useCallback((overrideCrop = null) => {
    const c = overrideCrop || cropRef.current;
    const imgSource = loadedImageRef.current || imageRef.current;
    if (!imgSource || !c || !c.width || !c.height) return Promise.resolve(null);

    const canvas = document.createElement('canvas');
    const outW = Math.min(isLogo ? 1024 : 2560, Math.round(c.width));
    const outH = Math.round(outW * (c.height / c.width));
    canvas.width = outW;
    canvas.height = outH;

    const ctx = canvas.getContext('2d');
    if (!ctx) return Promise.resolve(null);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imgSource,
      c.x,
      c.y,
      c.width,
      c.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const dataUrl = canvas.toDataURL(isLogo ? 'image/png' : 'image/jpeg', 0.9);
            setCroppedDataUrl(dataUrl);
            croppedBlobRef.current = blob;
            resolve(blob);
          } else {
            resolve(null);
          }
        },
        isLogo ? 'image/png' : 'image/jpeg',
        0.92
      );
    });
  }, [isLogo]);

  // 1. Cargar archivo original (File) o URL existente (edición no destructiva)
  useEffect(() => {
    let isMounted = true;
    let objectUrlToRevoke = null;

    async function loadSource() {
      try {
        if (!file && !imageUrl) {
          setLoadingImage(false);
          return;
        }
        setLoadingImage(true);
        let src = null;

        if (file) {
          src = URL.createObjectURL(file);
          objectUrlToRevoke = src;
        } else if (imageUrl) {
          try {
            const resp = await fetch(imageUrl);
            const blob = await resp.blob();
            src = URL.createObjectURL(blob);
            objectUrlToRevoke = src;
          } catch {
            src = imageUrl;
          }
        }

        if (!src || !isMounted) return;
        setImageSrc(src);

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!isMounted) return;
          loadedImageRef.current = img;

          const W = img.naturalWidth;
          const H = img.naturalHeight;
          setNaturalSize({ width: W, height: H });

          // Proporcion por defecto: carrusel fijo 2.28:1 / galería 1:1 / noticia 4:3 / logo = proporcion original de la imagen
          let activeRatio = isGallery ? 1 : isNews ? WEB_NEWS_RATIO : WEB_CAROUSEL_RATIO;
          let initialCrop;

          // Restaurar encuadre previo si existe
          if (
            initialCropData &&
            initialCropData.width > 50 &&
            initialCropData.height > 50 &&
            initialCropData.x + initialCropData.width <= W &&
            initialCropData.y + initialCropData.height <= H
          ) {
            initialCrop = {
              x: Math.round(initialCropData.x),
              y: Math.round(initialCropData.y),
              width: Math.round(initialCropData.width),
              height: Math.round(initialCropData.height)
            };
            if (isLogo) activeRatio = initialCrop.width / initialCrop.height;
          } else if (isLogo) {
            // Logo: se parte de la imagen completa, sin recortar nada
            activeRatio = W / H;
            initialCrop = { x: 0, y: 0, width: W, height: H };
          } else {
            // Recuadro predefinido (carrusel 2.28:1 o galería 1:1)
            let initialW, initialH, initialX, initialY;

            if (W / H >= activeRatio) {
              initialH = H;
              initialW = H * activeRatio;
              initialX = (W - initialW) / 2;
              initialY = 0;
            } else {
              initialW = W;
              initialH = W / activeRatio;
              initialX = 0;
              initialY = Math.max(0, (H - initialH) / 2);
            }

            initialCrop = {
              x: Math.round(initialX),
              y: Math.round(initialY),
              width: Math.round(initialW),
              height: Math.round(initialH)
            };
          }

          setRatio(activeRatio);
          cropRef.current = initialCrop;
          setCrop(initialCrop);
          setLoadingImage(false);

          // Generar preview inicial de inmediato
          generateCropBlob(initialCrop);
        };
        img.onerror = () => {
          if (isMounted) setLoadingImage(false);
        };
        img.src = src;
      } catch (err) {
        console.error('Error al cargar imagen en modal:', err);
        if (isMounted) setLoadingImage(false);
      }
    }

    loadSource();

    return () => {
      isMounted = false;
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
    };
  }, [file, imageUrl, isLogo]);

  useEffect(() => {
    if (initialTitle !== undefined) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  const getScale = () => {
    if (!imageRef.current || naturalSize.width === 0) return 1;
    return imageRef.current.clientWidth / naturalSize.width;
  };

  const handleFitFullWidth = () => {
    if (naturalSize.width === 0) return;
    const W = naturalSize.width;
    const H = naturalSize.height;

    let newW = W;
    let newH = W / ratio;
    let newX = 0;
    let newY = (H - newH) / 2;

    if (newH > H) {
      newH = H;
      newW = H * ratio;
      newX = (W - newW) / 2;
      newY = 0;
    }

    const nextCrop = {
      x: Math.max(0, Math.round(newX)),
      y: Math.max(0, Math.round(newY)),
      width: Math.min(W, Math.round(newW)),
      height: Math.min(H, Math.round(newH))
    };
    setCrop(nextCrop);
    generateCropBlob(nextCrop);
  };

  // Cambia la proporción del recuadro (solo logo) manteniendo el centro actual
  const applyRatio = (newRatio) => {
    const W = naturalSize.width;
    const H = naturalSize.height;
    if (!W || !H || !newRatio) return;
    const w = Math.min(W, H * newRatio);
    const h = w / newRatio;
    const prev = cropRef.current;
    const cx = prev.x + prev.width / 2;
    const cy = prev.y + prev.height / 2;
    const next = {
      x: Math.round(Math.max(0, Math.min(cx - w / 2, W - w))),
      y: Math.round(Math.max(0, Math.min(cy - h / 2, H - h))),
      width: Math.round(w),
      height: Math.round(h)
    };
    setRatio(newRatio);
    cropRef.current = next;
    setCrop(next);
    generateCropBlob(next);
  };

  const handleCenter = () => {
    if (naturalSize.width === 0) return;
    setCrop((prev) => {
      const next = {
        ...prev,
        x: Math.max(0, Math.round((naturalSize.width - prev.width) / 2)),
        y: Math.max(0, Math.round((naturalSize.height - prev.height) / 2))
      };
      generateCropBlob(next);
      return next;
    });
  };

  const handleZoom = (factor) => {
    setCrop((prev) => {
      const centerX = prev.x + prev.width / 2;
      const centerY = prev.y + prev.height / 2;

      let newW = prev.width * factor;
      let newH = newW / ratio;

      const maxW = naturalSize.width;
      const maxH = naturalSize.height;

      if (newW > maxW) {
        newW = maxW;
        newH = newW / ratio;
      }
      if (newH > maxH) {
        newH = maxH;
        newW = newH * ratio;
      }

      if (newW < minW || newH < minH) return prev;

      let newX = centerX - newW / 2;
      let newY = centerY - newH / 2;

      newX = Math.max(0, Math.min(newX, maxW - newW));
      newY = Math.max(0, Math.min(newY, maxH - newH));

      const next = {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newW),
        height: Math.round(newH)
      };
      generateCropBlob(next);
      return next;
    });
  };

  const startDrag = (e, action) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    dragActionRef.current = action;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      crop: { ...crop }
    };

    window.addEventListener('mousemove', onDragging);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onDragging, { passive: false });
    window.addEventListener('touchend', stopDrag);
  };

  const onDragging = (e) => {
    if (!isDraggingRef.current) return;
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scale = getScale();
    if (!scale) return;

    const deltaX = (clientX - dragStartRef.current.x) / scale;
    const deltaY = (clientY - dragStartRef.current.y) / scale;
    const start = dragStartRef.current.crop;
    const action = dragActionRef.current;

    setCrop(() => {
      let next = { ...start };

      if (action === 'move') {
        let newX = start.x + deltaX;
        let newY = start.y + deltaY;
        newX = Math.max(0, Math.min(newX, naturalSize.width - start.width));
        newY = Math.max(0, Math.min(newY, naturalSize.height - start.height));
        return { ...start, x: Math.round(newX), y: Math.round(newY) };
      }

      if (action === 'se') {
        let newW = start.width + deltaX;
        let newH = newW / ratio;
        if (start.x + newW > naturalSize.width) {
          newW = naturalSize.width - start.x;
          newH = newW / ratio;
        }
        if (start.y + newH > naturalSize.height) {
          newH = naturalSize.height - start.y;
          newW = newH * ratio;
        }
        if (newW >= minW && newH >= minH) {
          next.width = Math.round(newW);
          next.height = Math.round(newH);
        }
      }

      if (action === 'nw') {
        let newW = start.width - deltaX;
        let newH = newW / ratio;
        let newX = start.x + (start.width - newW);
        let newY = start.y + (start.height - newH);

        if (newX < 0) {
          newX = 0;
          newW = start.x + start.width;
          newH = newW / ratio;
          newY = start.y + (start.height - newH);
        }
        if (newY < 0) {
          newY = 0;
          newH = start.y + start.height;
          newW = newH * ratio;
          newX = start.x + (start.width - newW);
        }

        if (newW >= minW && newH >= minH && newX >= 0 && newY >= 0) {
          next.x = Math.round(newX);
          next.y = Math.round(newY);
          next.width = Math.round(newW);
          next.height = Math.round(newH);
        }
      }

      return next;
    });
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
    dragActionRef.current = null;
    window.removeEventListener('mousemove', onDragging);
    window.removeEventListener('mouseup', stopDrag);
    window.removeEventListener('touchmove', onDragging);
    window.removeEventListener('touchend', stopDrag);
    // Generar preview actualizado al soltar
    generateCropBlob();
  };

  // Guardar y confirmar (funciona desde pestaña Encuadre o Vista Previa)
  const handleConfirm = async () => {
    if (uploading) return;

    let blob = croppedBlobRef.current;
    if (!blob) {
      blob = await generateCropBlob();
    }

    if (!blob) {
      console.error('No se pudo generar el recorte de la imagen');
      return;
    }

    const fileName = isLogo
      ? `${(file?.name || 'logo').replace(/\.[^.]+$/, '')}.png`
      : file?.name || 'carousel_slide.jpg';
    const croppedFile = new File([blob], fileName, {
      type: isLogo ? 'image/png' : 'image/jpeg',
      lastModified: Date.now()
    });

    onConfirm({
      croppedFile,
      originalFile: file || null,
      cropData: { ...crop },
      title
    });
  };

  const scale = getScale();
  const cropLeft = crop.x * scale;
  const cropTop = crop.y * scale;
  const cropW = crop.width * scale;
  const cropH = crop.height * scale;

  if (isOpen === false || (!file && !imageUrl)) {
    return null;
  }

  return createPortal(
    <div
      className="modal-backdrop-custom"
    >
      <div
        className="modal-card-custom"
        style={{
          maxWidth: 900,
          width: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 16,
          overflow: 'hidden',
          background: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera Limpia y Compacta */}
        <div
          className="modal-header-custom"
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            background: '#ffffff',
            flexShrink: 0
          }}
        >
          {/* Título en una sola línea */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(var(--gx-primary-rgb), 0.16)',
                color: 'var(--gx-primary-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CropIcon size={17} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: isMobile ? '14px' : '15px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {isLogo
                ? (isMobile ? 'Logo' : isEditing ? 'Retocar Logo' : 'Encuadre del Logo')
                : isGallery
                ? (isMobile ? 'Galería' : isEditing ? 'Retocar Galería' : 'Encuadre Galería')
                : isNews
                ? (isMobile ? 'Noticia' : isEditing ? 'Retocar Noticia' : 'Encuadre Noticia')
                : isMobile
                ? (isEditing ? 'Retocar' : 'Encuadre')
                : (isEditing ? 'Retocar Encuadre' : 'Encuadre Carrusel')}
            </h3>
          </div>

          {/* Segmented Control: Encuadre / Vista Previa + Botón X */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#f4f4f5',
                padding: '2px',
                borderRadius: '8px',
                border: '1px solid #e4e4e7',
                gap: 2
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('crop')}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  background: activeTab === 'crop' ? '#ffffff' : 'transparent',
                  color: activeTab === 'crop' ? '#18181b' : '#71717a',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'crop' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                Encuadre
              </button>
              <button
                type="button"
                onClick={() => {
                  generateCropBlob();
                  setActiveTab('preview');
                }}
                style={{
                  padding: '4px 9px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  background: activeTab === 'preview' ? '#ffffff' : 'transparent',
                  color: activeTab === 'preview' ? '#18181b' : '#71717a',
                  cursor: 'pointer',
                  boxShadow: activeTab === 'preview' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {isMobile ? 'Vista' : 'Vista Previa'}
              </button>
            </div>

            <button
              type="button"
              className="modal-close-btn"
              onClick={handleClose}
              disabled={uploading}
              aria-label="Cerrar modal"
              style={{ width: 32, height: 32 }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Cuerpo del Modal */}
        <div
          className="modal-body-custom"
          style={{
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto'
          }}
        >
          {isLogo ? (
            /* Selector de proporción del logo */
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginRight: 2 }}>
                Proporción:
              </span>
              {[
                { key: 'original', label: 'Original', value: naturalSize.height ? naturalSize.width / naturalSize.height : 1 },
                { key: 'square', label: 'Cuadrado 1:1', value: 1 },
                { key: 'wide', label: 'Horizontal 3:1', value: 3 }
              ].map((opt) => {
                const active = Math.abs(ratio - opt.value) < 0.02;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => applyRatio(opt.value)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 7,
                      border: '1px solid',
                      borderColor: active ? '#18181b' : '#d4d4d8',
                      background: active ? '#18181b' : '#ffffff',
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          ) : !isNews ? (
          <div style={{ width: '100%', flexShrink: 0 }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                isGallery
                  ? 'Título o descripción de la foto en Galería (opcional)...'
                  : 'Título sobre el banner en la web (opcional)...'
              }
              style={{
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium)',
                background: '#ffffff',
                outline: 'none',
                color: 'var(--text-primary)',
                width: '100%',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--gx-primary)')}
              onBlur={(e) => (e.target.style.borderColor = 'var(--border-medium)')}
            />
          </div>
          ) : null}

          {/* VISTA 1: EDITOR DE ENCUADRE (permanece montado en el DOM con display para no perder referencias) */}
          <div
            style={{
              display: activeTab === 'crop' ? 'flex' : 'none',
              flexDirection: 'column',
              gap: 10
            }}
          >
            {/* Contenedor del Editor de Encuadre */}
            <div
              ref={containerRef}
              style={{
                position: 'relative',
                width: '100%',
                minHeight: isMobile ? '220px' : '260px',
                maxHeight: isMobile ? '340px' : '440px',
                background: isLogo
                  ? 'repeating-conic-gradient(#d9dce1 0% 25%, #eef0f3 0% 50%) 50% / 18px 18px'
                  : '#090a0c',
                borderRadius: '12px',
                border: '1px solid #27272a',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                touchAction: 'none'
              }}
            >
              {/* Badge sutil de proporción web en esquina superior izquierda */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 30,
                  background: 'rgba(18, 18, 20, 0.85)',
                  backdropFilter: 'blur(6px)',
                  color: '#e4e4e7',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span style={{ color: 'var(--gx-primary)' }}>★</span> {isLogo ? 'Logo' : isGallery ? 'Galería 1:1' : isNews ? 'Noticia 4:3' : 'Web 2.28:1'}
              </div>

              {/* Botonera flotante minimalista sobre el canvas */}
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 30,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(18, 18, 20, 0.85)',
                  backdropFilter: 'blur(6px)',
                  padding: '3px 6px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)'
                }}
              >
                <button
                  type="button"
                  onClick={handleCenter}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 6px',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                  title="Centrar recuadro"
                >
                  Centrar
                </button>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>|</span>
                <button
                  type="button"
                  onClick={handleFitFullWidth}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 6px',
                    cursor: 'pointer',
                    borderRadius: 4
                  }}
                  title="Ajustar al 100% del ancho"
                >
                  100%
                </button>
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>|</span>
                <button
                  type="button"
                  onClick={() => handleZoom(1.1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Aumentar tamaño"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => handleZoom(0.9)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    padding: '3px 4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Reducir tamaño"
                >
                  <ZoomOut size={13} />
                </button>
              </div>

              {loadingImage ? (
                <div style={{ color: '#a1a1aa', fontSize: '13px' }}>Cargando imagen...</div>
              ) : imageSrc ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  {/* FOTO ORIGINAL COMPLETA */}
                  <img
                    ref={imageRef}
                    src={imageSrc}
                    crossOrigin="anonymous"
                    alt="Foto original"
                    style={{
                      display: 'block',
                      maxWidth: '100%',
                      maxHeight: isMobile ? '320px' : '400px',
                      objectFit: 'contain'
                    }}
                  />

                  {/* Máscara oscura alrededor del recuadro */}
                  {crop.width > 0 && (
                    <>
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: cropTop,
                          background: 'rgba(0, 0, 0, 0.65)',
                          pointerEvents: 'none'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: cropTop + cropH,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0, 0, 0, 0.65)',
                          pointerEvents: 'none'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: cropTop,
                          left: 0,
                          width: cropLeft,
                          height: cropH,
                          background: 'rgba(0, 0, 0, 0.65)',
                          pointerEvents: 'none'
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: cropTop,
                          left: cropLeft + cropW,
                          right: 0,
                          height: cropH,
                          background: 'rgba(0, 0, 0, 0.65)',
                          pointerEvents: 'none'
                        }}
                      />

                      {/* Recuadro interactivo */}
                      <div
                        style={{
                          position: 'absolute',
                          top: cropTop,
                          left: cropLeft,
                          width: cropW,
                          height: cropH,
                          border: '2px solid var(--gx-primary)',
                          boxShadow: '0 0 0 1px rgba(0,0,0,0.7), inset 0 0 12px rgba(0,0,0,0.15)',
                          cursor: 'move',
                          boxSizing: 'border-box',
                          touchAction: 'none'
                        }}
                        onMouseDown={(e) => startDrag(e, 'move')}
                        onTouchStart={(e) => startDrag(e, 'move')}
                      >
                        {/* Guías de tercios sutiles */}
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gridTemplateRows: '1fr 1fr 1fr',
                            pointerEvents: 'none',
                            opacity: 0.25
                          }}
                        >
                          <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderRight: '1px dashed #ffffff', borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderBottom: '1px dashed #ffffff' }} />
                          <div style={{ borderRight: '1px dashed #ffffff' }} />
                          <div style={{ borderRight: '1px dashed #ffffff' }} />
                          <div />
                        </div>

                        {/* Guía visual del centro que se verá en CELULAR */}
                        {!isLogo && !isGallery && !isNews && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              left: '29%',
                              right: '29%',
                              borderLeft: '1px dashed rgba(var(--gx-primary-rgb), 0.75)',
                              borderRight: '1px dashed rgba(var(--gx-primary-rgb), 0.75)',
                              background: 'rgba(var(--gx-primary-rgb), 0.05)',
                              pointerEvents: 'none',
                              display: 'flex',
                              alignItems: 'flex-end',
                              justifyContent: 'center',
                              paddingBottom: 4
                            }}
                          >
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: 'var(--gx-primary)',
                                background: 'rgba(0, 0, 0, 0.75)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📱 Centro Celular
                            </span>
                          </div>
                        )}

                        {/* Manija Sureste (SE) */}
                        <div
                          style={{
                            position: 'absolute',
                            right: -10,
                            bottom: -10,
                            width: 20,
                            height: 20,
                            background: 'var(--gx-primary)',
                            border: '2px solid #ffffff',
                            borderRadius: '4px',
                            cursor: 'se-resize',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => startDrag(e, 'se')}
                          onTouchStart={(e) => startDrag(e, 'se')}
                        />

                        {/* Manija Noroeste (NW) */}
                        <div
                          style={{
                            position: 'absolute',
                            left: -10,
                            top: -10,
                            width: 20,
                            height: 20,
                            background: 'var(--gx-primary)',
                            border: '2px solid #ffffff',
                            borderRadius: '4px',
                            cursor: 'nw-resize',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.45)',
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => startDrag(e, 'nw')}
                          onTouchStart={(e) => startDrag(e, 'nw')}
                        />
                      </div>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* Guía simple */}
            <p
              style={{
                margin: 0,
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}
            >
              {isLogo ? (
                <>Lo que quede dentro del recuadro es el logo que se verá. Se muestra <strong>completo y sin deformarse</strong>.</>
              ) : isGallery ? (
                <>El recuadro cuadrado (<strong>1:1</strong>) define cómo se verá la foto dentro de la sección <strong>Galerías</strong> en celular y PC.</>
              ) : isNews ? (
                <>El recuadro (<strong>4:3</strong>) define cómo se verá la foto de la noticia en las tarjetas y el detalle de <strong>Noticias</strong> en celular y PC.</>
              ) : (
                <>El recuadro completo define lo que se verá en <strong>PC Web</strong>. Las líneas punteadas muestran el centro visible en <strong>Celular</strong>.</>
              )}
            </p>
          </div>


          {/* VISTA 2 (LOGO): cómo se verá el logo en distintos lugares */}
          {isLogo && (
            <div
              style={{
                display: activeTab === 'preview' ? 'flex' : 'none',
                flexDirection: 'column',
                gap: 12
              }}
            >
              {[
                {
                  label: 'Encabezado de la web y de la app',
                  bg: '#18181b',
                  border: '#27272a',
                  height: 48
                },
                {
                  label: 'Sobre fondo claro (pie de página, tarjetas)',
                  bg: '#ffffff',
                  border: '#e4e4e7',
                  height: 56
                }
              ].map((tile) => (
                <div key={tile.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {tile.label}
                  </span>
                  <div
                    style={{
                      background: tile.bg,
                      border: `1px solid ${tile.border}`,
                      borderRadius: 12,
                      padding: '14px 18px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14
                    }}
                  >
                    {croppedDataUrl && (
                      <img
                        src={croppedDataUrl}
                        alt="Logo"
                        style={{ height: tile.height, width: 'auto', maxWidth: 220, objectFit: 'contain' }}
                      />
                    )}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ height: 8, width: '45%', borderRadius: 4, background: tile.bg === '#ffffff' ? '#e4e4e7' : 'rgba(255,255,255,0.18)' }} />
                      <div style={{ height: 6, width: '28%', borderRadius: 4, background: 'var(--gx-primary)' }} />
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Inicio de sesión e ícono de pestaña
                </span>
                <div
                  style={{
                    background: '#f4f5f7',
                    border: '1px solid #e4e4e7',
                    borderRadius: 12,
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    flexWrap: 'wrap'
                  }}
                >
                  <div
                    style={{
                      width: 96,
                      height: 96,
                      background: '#18181b',
                      borderRadius: 20,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 22px rgba(0,0,0,0.18)'
                    }}
                  >
                    {croppedDataUrl && (
                      <img src={croppedDataUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#ffffff',
                      border: '1px solid #d4d4d8',
                      borderRadius: '10px 10px 0 0',
                      padding: '8px 14px',
                      fontSize: '12px',
                      color: '#3f4249'
                    }}
                  >
                    {croppedDataUrl && (
                      <img src={croppedDataUrl} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                    )}
                    Mi torneo
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: PREVISUALIZACIÓN REAL EN LA WEB */}
          <div
            style={{
              display: activeTab === 'preview' && !isLogo ? 'flex' : 'none',
              flexDirection: 'column',
              gap: 12
            }}
          >
            {/* Selector de dispositivo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid',
                  borderColor: previewDevice === 'mobile' ? '#18181b' : '#d4d4d8',
                  background: previewDevice === 'mobile' ? '#18181b' : '#ffffff',
                  color: previewDevice === 'mobile' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Smartphone size={14} /> Celular
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: '1px solid',
                  borderColor: previewDevice === 'desktop' ? '#18181b' : '#d4d4d8',
                  background: previewDevice === 'desktop' ? '#18181b' : '#ffffff',
                  color: previewDevice === 'desktop' ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Monitor size={14} /> PC Web
              </button>
            </div>

            {/* Mockup del Carrusel o Galería Web */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: '#090a0f',
                borderRadius: '12px',
                padding: previewDevice === 'mobile' ? '16px 8px' : '16px',
                overflow: 'hidden',
                minHeight: '260px'
              }}
            >
              {isGallery ? (
                <div
                  style={{
                    width: previewDevice === 'mobile' ? '260px' : '100%',
                    maxWidth: previewDevice === 'mobile' ? '260px' : '560px',
                    background: '#16171a',
                    borderRadius: previewDevice === 'mobile' ? '18px' : '12px',
                    border: previewDevice === 'mobile' ? '4px solid #27272a' : '1px solid #27272a',
                    padding: previewDevice === 'mobile' ? '14px' : '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 4,
                        height: 16,
                        borderRadius: 4,
                        background: 'var(--gx-primary)'
                      }}
                    />
                    <span
                      style={{
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: previewDevice === 'mobile' ? 13 : 15,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Galerías
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        previewDevice === 'mobile' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                      gap: previewDevice === 'mobile' ? 8 : 10
                    }}
                  >
                    <div
                      style={{
                        aspectRatio: '1 / 1',
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '2px solid var(--gx-primary)',
                        background: '#000'
                      }}
                    >
                      {croppedDataUrl && (
                        <img
                          src={croppedDataUrl}
                          alt="Preview galería"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    {Array.from({ length: previewDevice === 'mobile' ? 3 : 2 }).map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1 / 1',
                          borderRadius: 10,
                          background: '#222429',
                          border: '1px solid rgba(255,255,255,0.08)'
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : isNews ? (
                <div
                  style={{
                    width: previewDevice === 'mobile' ? '265px' : '100%',
                    maxWidth: previewDevice === 'mobile' ? '265px' : '540px',
                    background: '#16171a',
                    borderRadius: previewDevice === 'mobile' ? '18px' : '14px',
                    border: previewDevice === 'mobile' ? '4px solid #27272a' : '1px solid #27272a',
                    padding: previewDevice === 'mobile' ? '12px' : '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        width: 4,
                        height: 16,
                        borderRadius: 4,
                        background: 'var(--gx-primary)'
                      }}
                    />
                    <span
                      style={{
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: previewDevice === 'mobile' ? 12.5 : 14,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}
                    >
                      Últimas Novedades
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: previewDevice === 'mobile' ? 'column' : 'row',
                      background: '#222429',
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.08)'
                    }}
                  >
                    <div
                      style={{
                        width: previewDevice === 'mobile' ? '100%' : '36%',
                        aspectRatio: previewDevice === 'mobile' ? '16 / 10' : '4 / 3',
                        background: '#000',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                    >
                      {croppedDataUrl && (
                        <img
                          src={croppedDataUrl}
                          alt="Preview noticia"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        padding: previewDevice === 'mobile' ? '12px' : '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        gap: 6,
                        flex: 1,
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: 'rgba(var(--gx-primary-rgb), 0.14)',
                            color: 'var(--gx-primary)',
                            border: '1px solid rgba(var(--gx-primary-rgb), 0.35)',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 9.5,
                            fontWeight: 700,
                            textTransform: 'uppercase'
                          }}
                        >
                          {newsMeta?.category || 'Torneo'}
                        </span>
                        <span style={{ color: '#9ca3af', fontSize: 10 }}>
                          {newsMeta?.date || 'Hoy'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: previewDevice === 'mobile' ? 13 : 14.5,
                          lineHeight: 1.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {newsMeta?.title?.trim() || 'Título de la noticia en la web'}
                      </div>
                      <div
                        style={{
                          color: '#9ca3af',
                          fontSize: 11.5,
                          lineHeight: 1.4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {newsMeta?.excerpt?.trim() ||
                          'Así se verá la imagen recortada dentro de la tarjeta de noticias en la web pública.'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : previewDevice === 'mobile' ? (
                /* SIMULADOR DE CELULAR (coincide exactamente con la vista móvil de index.tsx, solo carrusel) */
                <div
                  style={{
                    position: 'relative',
                    width: '270px',
                    borderRadius: '20px',
                    border: '5px solid #27272a',
                    overflow: 'hidden',
                    background: '#000000',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Carrusel móvil con altura exacta 48vh (proporción 440:460 ≈ 0.96:1) */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '440 / 460',
                      background: '#000000',
                      overflow: 'hidden'
                    }}
                  >
                    {croppedDataUrl && (
                      <img
                        src={croppedDataUrl}
                        alt="Preview móvil"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    )}

                    {/* Gradientes exactos de la web */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, rgba(28,29,31,0.4) 0%, rgba(28,29,31,0.25) 50%, rgba(28,29,31,0.95) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to right, rgba(28,29,31,0.65) 0%, transparent 50%, rgba(28,29,31,0.5) 100%)'
                      }}
                    />

                    {/* Título y controles */}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        height: '100%',
                        padding: '0 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          textTransform: 'uppercase',
                          lineHeight: 1.1,
                          textShadow: '0 3px 12px rgba(0,0,0,0.85)',
                          maxWidth: '92%'
                        }}
                      >
                        {title.trim() || brandNameUpper}
                      </h2>
                    </div>

                    {/* Flechas izquierda y derecha */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'rgba(24,24,27,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <ChevronLeft size={14} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: 'rgba(24,24,27,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <ChevronRight size={14} />
                    </div>

                    {/* Puntos de paginación */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 4
                      }}
                    >
                      <div style={{ width: 14, height: 4, borderRadius: 2, background: 'var(--gx-primary)' }} />
                      <div style={{ width: 4, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.45)' }} />
                    </div>
                  </div>
                </div>
              ) : (
                /* SIMULADOR DE PC (proporción exacta 2.28:1 que coincide 1:1 con la imagen subida, solo carrusel) */
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '720px',
                    borderRadius: '12px',
                    border: '1px solid #27272a',
                    overflow: 'hidden',
                    background: '#090a0f',
                    boxShadow: '0 16px 36px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {/* Banner PC con proporción 2.28:1 (muestra el recorte COMPLETO sin zoom) */}
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '2.28 / 1',
                      background: '#000000',
                      overflow: 'hidden'
                    }}
                  >
                    {croppedDataUrl && (
                      <img
                        src={croppedDataUrl}
                        alt="Preview PC"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'center'
                        }}
                      />
                    )}

                    {/* Gradientes exactos de la web */}
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to bottom, rgba(28,29,31,0.4) 0%, rgba(28,29,31,0.25) 50%, rgba(28,29,31,0.95) 100%)'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          'linear-gradient(to right, rgba(28,29,31,0.65) 0%, transparent 50%, rgba(28,29,31,0.5) 100%)'
                      }}
                    />

                    {/* Título en pantalla de PC */}
                    <div
                      style={{
                        position: 'relative',
                        zIndex: 10,
                        height: '100%',
                        padding: '0 24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center'
                      }}
                    >
                      <h2
                        style={{
                          margin: 0,
                          fontFamily: "'Oswald', sans-serif",
                          fontSize: '1.9rem',
                          fontWeight: 800,
                          color: '#ffffff',
                          textTransform: 'uppercase',
                          textShadow: '0 4px 20px rgba(0,0,0,0.85)',
                          maxWidth: '85%'
                        }}
                      >
                        {title.trim() || brandNameUpper}
                      </h2>
                    </div>

                    {/* Flechas izquierda y derecha */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(24,24,27,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <ChevronLeft size={16} />
                    </div>
                    <div
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(24,24,27,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff'
                      }}
                    >
                      <ChevronRight size={16} />
                    </div>

                    {/* Puntos de paginación */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 6
                      }}
                    >
                      <div style={{ width: 18, height: 5, borderRadius: 3, background: 'var(--gx-primary)' }} />
                      <div style={{ width: 5, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.45)' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Aclaración explicativa */}
            <p
              style={{
                margin: 0,
                fontSize: '11.5px',
                color: 'var(--text-muted)',
                textAlign: 'center'
              }}
            >
              {isGallery
                ? previewDevice === 'mobile'
                  ? 'Vista Celular: Grilla de 2 columnas con formato cuadrado 1:1 en la sección Galerías.'
                  : 'Vista PC Web: Grilla de 3 columnas con formato cuadrado 1:1 en la sección Galerías.'
                : isNews
                ? previewDevice === 'mobile'
                  ? 'Vista Celular: Tarjeta vertical de noticia en la sección Novedades.'
                  : 'Vista PC Web: Tarjeta horizontal de noticia con imagen 4:3 en la sección Novedades.'
                : previewDevice === 'mobile'
                ? 'Vista Celular: El carrusel de 48vh enfoca el centro de la imagen manteniendo su presencia vertical.'
                : 'Vista PC Web: Proporción 2.28:1 idéntica al recorte seleccionado, visualizándose el banner completo.'}
            </p>
          </div>
        </div>

        {/* Footer del Modal: SIEMPRE 1 sola fila y funciona desde cualquier pestaña */}
        <div
          className="modal-footer-custom"
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fafafb',
            flexShrink: 0,
            gap: 10
          }}
        >
          <button
            type="button"
            onClick={handleClose}
            disabled={uploading}
            style={{
              height: 36,
              padding: '0 16px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              background: '#ffffff',
              color: '#3f3f46',
              border: '1px solid #d4d4d8',
              cursor: 'pointer',
              flex: '0 0 auto'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={uploading}
            style={{
              height: 36,
              padding: '0 20px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--gx-primary)',
              color: 'var(--gx-on-primary)',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: '0 0 auto'
            }}
          >
            {uploading ? (
              'Guardando...'
            ) : (
              <>
                <Check size={15} /> {isEditing ? 'Guardar' : 'Aplicar'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ImageCropPreviewModal;
