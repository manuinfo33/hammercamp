import React, { useState } from 'react';
import CarouselConfigView from './CarouselConfigView';
import GalleryConfigView from './GalleryConfigView';
import NewsConfigView from './NewsConfigView';
import BrandConfigView from './BrandConfigView';
import PageHeader from '../ui/PageHeader';
import '../../styles/config.css';
import { Settings, Image as ImageIcon, Images, Newspaper, Palette } from 'lucide-react';

const NAV_ITEMS = [
  {
    id: 'brand',
    label: 'Identidad y Marca',
    mobileLabel: 'Marca',
    desc: 'Logo, color y nosotros',
    icon: Palette
  },
  {
    id: 'carousel',
    label: 'Carrusel de Imágenes',
    mobileLabel: 'Carrusel',
    desc: 'Banners de portada',
    icon: ImageIcon
  },
  {
    id: 'gallery',
    label: 'Galerías',
    mobileLabel: 'Galerías',
    desc: 'Álbum fotográfico',
    icon: Images
  },
  {
    id: 'news',
    label: 'Noticias',
    mobileLabel: 'Noticias',
    desc: 'Artículos y novedades',
    icon: Newspaper
  }
];

const ConfiguracionView = () => {
  const [activeTab, setActiveTab] = useState('brand');

  return (
    <div
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
      className="anthropic-theme animate-fade-in"
    >
      <div className="cf-desktop-header">
        <PageHeader
          icon={Settings}
          title="Configuración Web Visual"
          subtitle="Administra la identidad de marca, carrusel de imágenes, galerías y noticias de la plataforma."
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Navegación moderna de módulos (Tarjetas interactivas en PC / Dock compacto de 4 columnas en Celular) */}
        <nav className="cwv-nav" aria-label="Secciones de Configuración Web Visual">
          {NAV_ITEMS.map(({ id, label, mobileLabel, desc, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`cwv-nav-btn ${isActive ? 'active' : ''}`}
              >
                <span className="cwv-nav-icon">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} />
                </span>
                <span className="cwv-nav-text">
                  <span className="cwv-nav-title-desktop">{label}</span>
                  <span className="cwv-nav-title-mobile">{mobileLabel}</span>
                  <span className="cwv-nav-desc">{desc}</span>
                </span>
              </button>
            );
          })}
        </nav>

        {/* Contenido de Configuración Web Visual */}
        {activeTab === 'brand' && <BrandConfigView />}
        {activeTab === 'carousel' && <CarouselConfigView />}
        {activeTab === 'gallery' && <GalleryConfigView />}
        {activeTab === 'news' && <NewsConfigView />}
      </div>
    </div>
  );
};

export default ConfiguracionView;
