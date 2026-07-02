import React, { useState } from 'react';
import CarouselConfigView from './CarouselConfigView';
import NewsConfigView from './NewsConfigView';
import { Settings, Image as ImageIcon, Newspaper } from 'lucide-react';

const ConfiguracionView = () => {
  const [activeTab, setActiveTab] = useState('carousel');

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }}>
      <div>
        <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={36} color="var(--brand-beige)" />
          Configuración
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Administra las opciones globales y visuales del sistema.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Menú Horizontal de Configuración */}
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '4px' }}>
          <button
            onClick={() => setActiveTab('carousel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              background: activeTab === 'carousel' ? 'rgba(212, 184, 150, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'carousel' ? 'var(--brand-beige)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === 'carousel' ? 'var(--brand-beige)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeTab === 'carousel' ? '600' : '400',
              boxShadow: activeTab === 'carousel' ? '0 4px 12px rgba(212, 184, 150, 0.15)' : 'none'
            }}
          >
            <ImageIcon size={18} />
            Carrusel de Imágenes
          </button>
          
          <button
            onClick={() => setActiveTab('news')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 24px',
              background: activeTab === 'news' ? 'rgba(212, 184, 150, 0.12)' : 'rgba(255, 255, 255, 0.02)',
              color: activeTab === 'news' ? 'var(--brand-beige)' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: activeTab === 'news' ? 'var(--brand-beige)' : 'rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeTab === 'news' ? '600' : '400',
              boxShadow: activeTab === 'news' ? '0 4px 12px rgba(212, 184, 150, 0.15)' : 'none'
            }}
          >
            <Newspaper size={18} />
            Noticias
          </button>
        </div>

        {/* Contenido de Configuración */}
        <div className="glass-card" style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {activeTab === 'carousel' && <CarouselConfigView />}
          {activeTab === 'news' && <NewsConfigView />}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionView;
