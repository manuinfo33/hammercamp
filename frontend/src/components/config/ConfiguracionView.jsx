import React, { useState } from 'react';
import CarouselConfigView from './CarouselConfigView';
import NewsConfigView from './NewsConfigView';
import PageHeader from '../ui/PageHeader';
import '../../styles/config.css';
import { Settings, Image as ImageIcon, Newspaper } from 'lucide-react';

const ConfiguracionView = () => {
  const [activeTab, setActiveTab] = useState('carousel');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '4px' }} className="anthropic-theme animate-fade-in">
      <PageHeader
        icon={Settings}
        title="Configuración Web Visual"
        subtitle="Administra el carrusel de imágenes y la sección de noticias del sitio web."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Menú Horizontal de Configuración Web Visual */}
        <div className="cf-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('carousel')}
            className={`cf-tab ${activeTab === 'carousel' ? 'active' : ''}`}
          >
            <ImageIcon size={18} />
            Carrusel de Imágenes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`cf-tab ${activeTab === 'news' ? 'active' : ''}`}
          >
            <Newspaper size={18} />
            Noticias
          </button>
        </div>

        {/* Contenido de Configuración Web Visual */}
        <div className="cf-panel">
          {activeTab === 'carousel' && <CarouselConfigView />}
          {activeTab === 'news' && <NewsConfigView />}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionView;

