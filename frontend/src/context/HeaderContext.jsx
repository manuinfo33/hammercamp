import React, { createContext, useContext, useState, useEffect } from 'react';

// Permite que una vista (p. ej. detalle de torneo) reemplace el saludo/logo del header.
const HeaderContext = createContext({ headerInfo: null, setHeaderInfo: () => {} });

export const HeaderProvider = ({ children }) => {
  const [headerInfo, setHeaderInfo] = useState(null);
  return (
    <HeaderContext.Provider value={{ headerInfo, setHeaderInfo }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderInfo = () => useContext(HeaderContext);

// Hook: fija el contexto del header mientras la vista está montada
export const useHeaderContext = (info) => {
  const { setHeaderInfo } = useContext(HeaderContext);
  const title = info?.title || '';
  const subtitle = info?.subtitle || '';
  useEffect(() => {
    if (!title) return undefined;
    setHeaderInfo({ title, subtitle });
    return () => setHeaderInfo(null);
  }, [title, subtitle, setHeaderInfo]);
};
