import React, { useState, useEffect, useRef } from 'react';
import api from '../../api';
import {
  Palette,
  Upload,
  Crop,
  RotateCcw,
  Check,
  CheckCircle2,
  XCircle,
  Type,
  MapPin,
  Phone,
  Mail,
  Save,
  FileText
} from 'lucide-react';
import ImageCropPreviewModal from './ImageCropPreviewModal';
import { useBranding } from '../../context/BrandingContext';
import {
  BRAND_PRESETS,
  DEFAULT_PRIMARY,
  DEFAULT_NAME,
  normalizeHex,
  deriveTheme,
  applyPrimaryColor
} from '../../lib/branding';

/* Estilos base idénticos a ConfigPagosView.jsx */
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

const tagPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 500,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#f1f0ec',
  color: '#52514e'
};

const tagBlue = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 6,
  background: '#dbeafe',
  color: '#1d4ed8'
};

const BrandConfigView = () => {
  const { settings, primaryColor, logoSrc, hasCustomLogo, brandName, updateLocalSettings } = useBranding();

  const [draftName, setDraftName] = useState(brandName || DEFAULT_NAME);
  const [savingName, setSavingName] = useState(false);

  const [draftColor, setDraftColor] = useState(primaryColor || DEFAULT_PRIMARY);
  const [hexInput, setHexInput] = useState((primaryColor || DEFAULT_PRIMARY).toUpperCase());
  const [savingColor, setSavingColor] = useState(false);

  const [contact, setContact] = useState({
    contact_address: '',
    contact_phone: '',
    contact_email: ''
  });
  const [savingContact, setSavingContact] = useState(false);

  const defaultAboutText = `${brandName || DEFAULT_NAME} es un complejo deportivo dedicado al fútbol amateur desde 2008. Organizamos torneos en distintas categorías y abrimos las puertas a equipos de toda la región.\n\nContamos con canchas de césped sintético de última generación, iluminación profesional, vestuarios, buffet y estacionamiento propio.\n\nNuestra pasión es el juego: que cada jugador, sin importar la edad o el nivel, tenga la mejor experiencia dentro y fuera de la cancha.`;
  const [aboutDescription, setAboutDescription] = useState(defaultAboutText);
  const [savingAbout, setSavingAbout] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal de encuadre del logo
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [pendingLogoFile, setPendingLogoFile] = useState(null);
  const [isEditingExistingLogo, setIsEditingExistingLogo] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setDraftName(brandName || DEFAULT_NAME);
  }, [brandName]);

  useEffect(() => {
    if (primaryColor) {
      setDraftColor(primaryColor);
      setHexInput(primaryColor.toUpperCase());
    }
  }, [primaryColor]);

  useEffect(() => {
    if (settings) {
      setContact({
        contact_address: settings.contact_address ?? '',
        contact_phone: settings.contact_phone ?? '',
        contact_email: settings.contact_email ?? ''
      });
      setAboutDescription(
        (settings.about_description ?? '').trim() || defaultAboutText
      );
    }
  }, [settings]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3200);
  };

  // --- Nombre ---
  const nameChanged = draftName.trim() !== (brandName || DEFAULT_NAME).trim();

  const handleSaveName = async () => {
    const clean = draftName.trim();
    if (!clean) {
      setError('El nombre no puede estar vacío.');
      return;
    }
    try {
      setSavingName(true);
      setError('');
      const res = await api.patch('site-settings/', { name: clean });
      updateLocalSettings(res.data);
      showToast(`Nombre actualizado a "${clean}".`);
    } catch {
      setError('No se pudo guardar el nombre.');
    } finally {
      setSavingName(false);
    }
  };

  // --- Color ---
  const colorChanged = normalizeHex(draftColor) !== normalizeHex(primaryColor);
  const previewTheme = deriveTheme(draftColor);

  const handleSelectColor = (hex) => {
    const clean = normalizeHex(hex);
    if (!clean) return;
    setDraftColor(clean);
    setHexInput(clean.toUpperCase());
    applyPrimaryColor(clean);
  };

  const handleHexInputChange = (e) => {
    let val = e.target.value;
    if (!val.startsWith('#')) val = '#' + val.replace(/#/g, '');
    setHexInput(val.toUpperCase());
    if (/^#[0-9A-Fa-f]{6}$/.test(val.trim())) {
      const clean = normalizeHex(val);
      setDraftColor(clean);
      applyPrimaryColor(clean);
    }
  };

  const handleSaveColor = async (colorToSave = draftColor) => {
    const clean = normalizeHex(colorToSave);
    try {
      setSavingColor(true);
      setError('');
      const res = await api.patch('site-settings/', { primary_color: clean });
      updateLocalSettings(res.data);
      setDraftColor(clean);
      setHexInput(clean.toUpperCase());
      showToast('Color de identidad actualizado.');
    } catch {
      setError('No se pudo guardar el color.');
    } finally {
      setSavingColor(false);
    }
  };

  const handleResetDefaultColor = async () => {
    handleSelectColor(DEFAULT_PRIMARY);
    await handleSaveColor(DEFAULT_PRIMARY);
  };

  // --- Logo ---
  const handleLogoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsEditingExistingLogo(false);
    setPendingLogoFile(file);
    setCropModalOpen(true);
    e.target.value = '';
  };

  const handleRetouchLogo = () => {
    if (!hasCustomLogo) return;
    setPendingLogoFile(null);
    setIsEditingExistingLogo(true);
    setCropModalOpen(true);
  };

  const handleLogoCropConfirm = async ({ croppedFile, originalFile, cropData }) => {
    const formData = new FormData();
    if (croppedFile) formData.append('logo', croppedFile);
    if (originalFile) formData.append('logo_original', originalFile);
    if (cropData) formData.append('logo_crop_data', JSON.stringify(cropData));

    try {
      setUploadingLogo(true);
      setError('');
      const res = await api.patch('site-settings/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateLocalSettings(res.data);
      setCropModalOpen(false);
      setPendingLogoFile(null);
      setIsEditingExistingLogo(false);
      showToast(isEditingExistingLogo ? 'Encuadre actualizado.' : 'Logo actualizado.');
    } catch {
      setError('Error al guardar el logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRestoreDefaultLogo = async () => {
    try {
      setUploadingLogo(true);
      setError('');
      const res = await api.patch('site-settings/', { remove_logo: true });
      updateLocalSettings(res.data);
      showToast('Logo por defecto restaurado.');
    } catch {
      setError('No se pudo restaurar el logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // --- Contacto ---
  const contactChanged =
    !!settings &&
    ['contact_address', 'contact_phone', 'contact_email'].some(
      (k) => (contact[k] || '').trim() !== (settings[k] ?? '').trim()
    );

  const handleSaveContact = async () => {
    try {
      setSavingContact(true);
      setError('');
      const res = await api.patch('site-settings/', {
        contact_address: contact.contact_address.trim(),
        contact_phone: contact.contact_phone.trim(),
        contact_email: contact.contact_email.trim()
      });
      updateLocalSettings(res.data);
      showToast('Datos de contacto guardados.');
    } catch {
      setError('No se pudieron guardar los datos de contacto.');
    } finally {
      setSavingContact(false);
    }
  };

  // --- Descripción de la empresa (Nosotros) ---
  const savedAboutText = ((settings?.about_description ?? '').trim() || defaultAboutText).trim();
  const aboutChanged = aboutDescription.trim() !== savedAboutText;

  const handleSaveAbout = async () => {
    try {
      setSavingAbout(true);
      setError('');
      const res = await api.patch('site-settings/', {
        about_description: aboutDescription.trim()
      });
      updateLocalSettings(res.data);
      showToast('Descripción de la empresa guardada.');
    } catch {
      setError('No se pudo guardar la descripción de la empresa.');
    } finally {
      setSavingAbout(false);
    }
  };

  const logoModalOpen =
    cropModalOpen &&
    (pendingLogoFile || (isEditingExistingLogo && (settings?.logo_original || settings?.logo)));

  // Separación visual del nombre para la vista previa de cabecera (ej: "LA" + "SUPERLIGA")
  const previewWords = (draftName || DEFAULT_NAME).trim().split(/\s+/);
  const previewLead = previewWords.length > 1 ? previewWords.slice(0, -1).join(' ') : '';
  const previewAccent = previewWords[previewWords.length - 1] || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
      {/* Notificaciones estilo ConfigPagosView */}
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
         1. GRILLA DE 3 TARJETAS DE MARCA (ESTILO ARANCELES DE CONFIGPAGOSVIEW)
         ==================================================================== */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(265px, 1fr))',
          gap: 14,
          alignItems: 'stretch'
        }}
      >
        {/* TARJETA 1: NOMBRE DE LA PLATAFORMA */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Banner superior con vista en vivo de cómo queda en la cabecera */}
          <div
            style={{
              height: 82,
              borderRadius: 8,
              background: '#eeece6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 14px',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                background: '#18181b',
                color: '#ffffff',
                padding: '7px 14px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                maxWidth: '100%',
                boxShadow: '0 2px 6px rgba(0,0,0,0.12)'
              }}
            >
              <img
                src={logoSrc}
                alt=""
                style={{ width: 22, height: 22, objectFit: 'contain', flexShrink: 0 }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 13.5,
                  fontWeight: 800,
                  letterSpacing: '0.03em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {previewLead ? `${previewLead} ` : ''}
                <span style={{ color: draftColor }}>{previewAccent}</span>
              </span>
            </div>
          </div>

          {/* Cuerpo */}
          <div
            style={{
              padding: '12px 10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <strong style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>
                  Nombre de la plataforma
                </strong>
              </div>

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #f1f0ec'
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 600, color: '#787772', marginBottom: 4 }}>
                  Nombre visible en web y gestión
                </div>
                <input
                  type="text"
                  maxLength={60}
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameChanged) handleSaveName();
                  }}
                  placeholder="Ej: La Superliga"
                  style={{
                    height: 34,
                    padding: '0 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: nameChanged ? '#fefce8' : '#faf9f6',
                    border: nameChanged ? '1px solid #141413' : '1px solid #e5e4df',
                    color: '#141413',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!nameChanged || savingName || !draftName.trim()}
              onClick={handleSaveName}
              style={{
                ...(nameChanged ? btnDark : btnOutline),
                height: 32,
                width: '100%',
                opacity: !nameChanged && !savingName ? 0.55 : 1
              }}
            >
              <Save size={13} />
              {savingName ? 'Guardando…' : nameChanged ? 'Guardar nombre' : 'Nombre guardado'}
            </button>
          </div>
        </div>

        {/* TARJETA 2: ESCUDO / LOGO DE LA EMPRESA */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Banner superior con vista en fondo oscuro y claro */}
          <div
            style={{
              height: 82,
              borderRadius: 8,
              background: '#18181b',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              overflow: 'hidden',
              border: '1px solid #e5e4df'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                background: '#18181b'
              }}
              title="Vista sobre fondo oscuro"
            >
              <img
                src={logoSrc}
                alt="Logo oscuro"
                style={{ maxHeight: 54, maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 10,
                background: '#f6f5f1',
                borderLeft: '1px solid #e5e4df'
              }}
              title="Vista sobre fondo claro"
            >
              <img
                src={logoSrc}
                alt="Logo claro"
                style={{ maxHeight: 54, maxWidth: '100%', objectFit: 'contain' }}
              />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoFileSelect}
            style={{ display: 'none' }}
          />

          {/* Cuerpo */}
          <div
            style={{
              padding: '12px 10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <strong style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>
                  Escudo / Logo
                </strong>
              </div>

              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #f1f0ec',
                  fontSize: 12,
                  color: '#787772'
                }}
              >
                Visible en cabecera, login y pestaña
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                style={{ ...btnDark, height: 32, flex: 1 }}
                disabled={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={13} />
                {uploadingLogo ? 'Subiendo…' : hasCustomLogo ? 'Cambiar' : 'Subir logo'}
              </button>

              {hasCustomLogo && (
                <>
                  <button
                    type="button"
                    style={{ ...btnOutline, height: 32, padding: '0 10px' }}
                    disabled={uploadingLogo}
                    onClick={handleRetouchLogo}
                    title="Retocar encuadre"
                  >
                    <Crop size={13} /> Retocar
                  </button>
                  <button
                    type="button"
                    style={{ ...btnOutline, height: 32, width: 32, padding: 0, minWidth: 32 }}
                    disabled={uploadingLogo}
                    onClick={handleRestoreDefaultLogo}
                    title="Restaurar logo por defecto"
                  >
                    <RotateCcw size={13} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* TARJETA 3: COLOR PRINCIPAL */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e5e4df',
            borderRadius: 12,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {/* Banner superior pintado con el color elegido */}
          <div
            style={{
              height: 82,
              borderRadius: 8,
              background: draftColor,
              color: previewTheme.onPrimary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              transition: 'background 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Palette size={22} strokeWidth={1.8} />
              <span style={{ fontSize: 13, fontWeight: 700 }}>Identidad visual</span>
            </div>

            <label
              title="Elegir cualquier tono"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(20, 20, 19, 0.82)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11.5,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                margin: 0
              }}
            >
              <input
                type="color"
                value={draftColor}
                onChange={(e) => handleSelectColor(e.target.value)}
                style={{
                  width: 14,
                  height: 14,
                  padding: 0,
                  border: 'none',
                  borderRadius: '50%',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              />
              {hexInput}
            </label>
          </div>

          {/* Cuerpo */}
          <div
            style={{
              padding: '12px 10px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              flex: 1,
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <strong style={{ fontSize: 14, fontWeight: 700, color: '#141413' }}>
                  Color de marca
                </strong>
                {normalizeHex(draftColor) !== DEFAULT_PRIMARY && (
                  <button
                    type="button"
                    onClick={handleResetDefaultColor}
                    disabled={savingColor}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                      height: 'auto',
                      minWidth: 0,
                      fontSize: 11.5,
                      fontWeight: 500,
                      color: '#6b6a65',
                      textDecoration: 'underline',
                      textUnderlineOffset: 3,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      textTransform: 'none',
                      letterSpacing: 0
                    }}
                  >
                    Volver al original
                  </button>
                )}
              </div>

              {/* Paleta rápida de 10 tonos */}
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: '1px solid #f1f0ec',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(10, 1fr)',
                  gap: 5
                }}
              >
                {BRAND_PRESETS.map((preset) => {
                  const hexVal = preset.value || preset.hex;
                  const active = normalizeHex(draftColor) === normalizeHex(hexVal);
                  return (
                    <button
                      key={hexVal}
                      type="button"
                      onClick={() => handleSelectColor(hexVal)}
                      title={preset.name}
                      style={{
                        height: 26,
                        minWidth: 0,
                        padding: 0,
                        borderRadius: 6,
                        background: hexVal,
                        border: active ? '2px solid #141413' : '1px solid rgba(0,0,0,0.12)',
                        boxShadow: active ? '0 0 0 2px rgba(20,20,19,0.15)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {active && (
                        <Check
                          size={12}
                          strokeWidth={3}
                          style={{ color: deriveTheme(hexVal).onPrimary }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={!colorChanged || savingColor}
              onClick={() => handleSaveColor(draftColor)}
              style={{
                ...(colorChanged ? btnDark : btnOutline),
                height: 32,
                width: '100%',
                opacity: !colorChanged && !savingColor ? 0.55 : 1
              }}
            >
              <Save size={13} />
              {savingColor ? 'Guardando…' : colorChanged ? 'Guardar color' : 'Color guardado'}
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================================
         2. SECCIÓN DE CONTACTO (ESTILO TABLA / TARJETA CONSOLA DE FINANZAS)
         ==================================================================== */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e4df',
          borderRadius: 12,
          overflow: 'hidden'
        }}
      >
        {/* Cabecera estilo grupo de ConfigPagosView */}
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
                background: '#c8ded3',
                color: '#1f3a2e',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Phone size={13} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13.5, fontWeight: 700, color: '#141413' }}>
              Datos de contacto
            </strong>
            <span style={{ fontSize: 12, color: '#787772' }}>
              · Pie de página y sección Contacto
            </span>
          </div>

          <button
            type="button"
            disabled={!contactChanged || savingContact}
            onClick={handleSaveContact}
            style={{
              ...(contactChanged ? btnDark : btnOutline),
              height: 30,
              padding: '0 12px',
              fontSize: 12,
              opacity: !contactChanged && !savingContact ? 0.55 : 1
            }}
          >
            <Save size={12.5} />
            {savingContact ? 'Guardando…' : contactChanged ? 'Guardar cambios' : 'Guardado'}
          </button>
        </div>

        {/* 3 campos en fila en PC, apilados en celular */}
        <div
          style={{
            padding: '16px 18px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12
          }}
        >
          {[
            {
              key: 'contact_address',
              label: 'Dirección',
              icon: MapPin,
              placeholder: 'Av. del Deporte 3600, La Plata',
              type: 'text',
              max: 200
            },
            {
              key: 'contact_phone',
              label: 'Celular / WhatsApp',
              icon: Phone,
              placeholder: '+54 221 555-1736',
              type: 'tel',
              max: 40
            },
            {
              key: 'contact_email',
              label: 'Email',
              icon: Mail,
              placeholder: 'info@lasuperliga.com.ar',
              type: 'email',
              max: 120
            }
          ].map(({ key, label, icon: Icon, placeholder, type, max }) => {
            const isDirty =
              !!settings && (contact[key] || '').trim() !== (settings[key] ?? '').trim();

            return (
              <div key={key}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#787772',
                    marginBottom: 5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Icon size={12} /> {label}
                </div>
                <input
                  type={type}
                  maxLength={max}
                  value={contact[key]}
                  placeholder={placeholder}
                  onChange={(e) => setContact((c) => ({ ...c, [key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && contactChanged) handleSaveContact();
                  }}
                  style={{
                    height: 34,
                    padding: '0 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    background: isDirty ? '#fefce8' : '#faf9f6',
                    border: isDirty ? '1px solid #141413' : '1px solid #e5e4df',
                    color: '#141413',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
         3. DESCRIPCIÓN DE LA EMPRESA (SECCIÓN "NOSOTROS" DE LA WEB VISUAL)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: '#f5dd90',
                color: '#4d3d0d',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={13} strokeWidth={2} />
            </span>
            <strong style={{ fontSize: 13.5, fontWeight: 700, color: '#141413' }}>
              Descripción de la empresa
            </strong>
            <span style={{ fontSize: 12, color: '#787772' }}>
              · Se modifica en la sección "Nosotros" de la web visual
            </span>
          </div>

          <button
            type="button"
            disabled={!aboutChanged || savingAbout}
            onClick={handleSaveAbout}
            style={{
              ...(aboutChanged ? btnDark : btnOutline),
              height: 30,
              padding: '0 12px',
              fontSize: 12,
              opacity: !aboutChanged && !savingAbout ? 0.55 : 1
            }}
          >
            <Save size={12.5} />
            {savingAbout ? 'Guardando…' : aboutChanged ? 'Guardar cambios' : 'Guardado'}
          </button>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <textarea
            rows={5}
            value={aboutDescription}
            onChange={(e) => setAboutDescription(e.target.value)}
            placeholder="Escribí la historia, instalaciones y descripción del complejo…"
            style={{
              width: '100%',
              minHeight: 115,
              padding: '10px 12px',
              fontSize: 13.5,
              fontWeight: 500,
              lineHeight: 1.55,
              borderRadius: 8,
              background: aboutChanged ? '#fefce8' : '#faf9f6',
              border: aboutChanged ? '1px solid #141413' : '1px solid #e5e4df',
              color: '#141413',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Modal de Encuadre del Logo */}
      {logoModalOpen && (
        <ImageCropPreviewModal
          isOpen={cropModalOpen}
          variant="logo"
          file={pendingLogoFile}
          imageUrl={isEditingExistingLogo ? settings?.logo_original || settings?.logo : null}
          initialCropData={isEditingExistingLogo ? settings?.logo_crop_data : null}
          isEditing={isEditingExistingLogo}
          uploading={uploadingLogo}
          onClose={() => {
            setCropModalOpen(false);
            setPendingLogoFile(null);
            setIsEditingExistingLogo(false);
          }}
          onConfirm={handleLogoCropConfirm}
        />
      )}
    </div>
  );
};

export default BrandConfigView;
