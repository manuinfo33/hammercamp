import React, { useState } from 'react';
import CarouselConfigView from './CarouselConfigView';
import NewsConfigView from './NewsConfigView';
import { Settings, Image as ImageIcon, Newspaper } from 'lucide-react';

const ConfiguracionView = () => {
  const [activeTab, setActiveTab] = useState('carousel');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', height: '100%' }} className="anthropic-theme animate-fade-in">
      <div>
        <h1 className="anthropic-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={30} style={{ color: '#cc7a5c' }} />
          Configuración
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Administra las opciones globales y visuales del sistema.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Menú Horizontal de Configuración */}
        <div style={{ display: 'flex', gap: '12px', paddingBottom: '4px', borderBottom: '1px solid #e6dfd3' }}>
          <button
            onClick={() => setActiveTab('carousel')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: activeTab === 'carousel' ? '#eae4d8' : 'transparent',
              color: activeTab === 'carousel' ? '#191919' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: activeTab === 'carousel' ? '#d8cfc0' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeTab === 'carousel' ? '600' : '400',
              fontSize: '13px'
            }}
          >
            <ImageIcon size={16} style={{ color: activeTab === 'carousel' ? '#cc7a5c' : 'var(--text-muted)' }} />
            Carrusel de Imágenes
          </button>
          
          <button
            onClick={() => setActiveTab('news')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 20px',
              background: activeTab === 'news' ? '#eae4d8' : 'transparent',
              color: activeTab === 'news' ? '#191919' : 'var(--text-muted)',
              border: '1px solid',
              borderColor: activeTab === 'news' ? '#d8cfc0' : 'transparent',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontWeight: activeTab === 'news' ? '600' : '400',
              fontSize: '13px'
            }}
          >
            <Newspaper size={16} style={{ color: activeTab === 'news' ? '#cc7a5c' : 'var(--text-muted)' }} />
            Noticias
          </button>
        </div>

        {/* Contenido de Configuración */}
        <div style={{ 
          background: '#ffffff', 
          border: '1px solid #e6dfd3', 
          borderRadius: '12px', 
          padding: '32px', 
          boxShadow: '0 4px 20px rgba(25, 20, 15, 0.06)',
          overflowY: 'auto' 
        }}>
          {activeTab === 'carousel' && <CarouselConfigView />}
          {activeTab === 'news' && <NewsConfigView />}
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionView;
