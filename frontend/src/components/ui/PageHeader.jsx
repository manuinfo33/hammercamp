import React from 'react';

/**
 * Encabezado de sección con el estilo de "Mi Equipo":
 * tarjeta blanca, icono en caja tintada, título Oswald en mayúsculas,
 * subtítulo y acciones a la derecha (a ancho completo en celular).
 */
const PageHeader = ({ icon: Icon, title, subtitle, actions, tone = '', children, style }) => (
  <div className="gx-page-header" style={style}>
    <div className="gx-page-header-main">
      {Icon && (
        <div className={`gx-icon-box ${tone}`}>
          <Icon size={24} />
        </div>
      )}
      <div style={{ minWidth: 0 }}>
        <h1 className="gx-page-title">{title}</h1>
        {subtitle && <p className="gx-page-sub">{subtitle}</p>}
        {children}
      </div>
    </div>
    {actions && <div className="gx-page-actions">{actions}</div>}
  </div>
);

export default PageHeader;
