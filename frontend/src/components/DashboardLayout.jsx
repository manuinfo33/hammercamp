import React from 'react';
import Sidebar from './Sidebar';
import { HeaderProvider } from '../context/HeaderContext';

const DashboardLayout = ({ children }) => {
  return (
    <HeaderProvider>
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
    </HeaderProvider>
  );
};

export default DashboardLayout;
