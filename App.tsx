
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BusinessProvider } from './context/BusinessContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import MainLayout from './components/layout/MainLayout.tsx';
import Dashboard from './components/Dashboard.tsx';
import CRM from './components/CRM.tsx';
import Finance from './components/Finance.tsx';
import Catalog from './components/Catalog.tsx';
import ChatRoom from './components/ChatRoom.tsx';
import Proposals from './components/Proposals.tsx';
import ProjectDetail from './components/ProjectDetail.tsx';
import Expenses from './components/Expenses.tsx';
import Settings from './components/Settings.tsx';
import Profile from './components/Profile.tsx';
import CalendarView from './components/CalendarView.tsx';
import Reports from './components/Reports.tsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard theme="dark" />} />
        
        {/* CRM */}
        <Route path="clients" element={<CRM />} />
        
        {/* Project Schema */}
        <Route path="projects" element={<Proposals />} />
        <Route path="projects/new" element={<Proposals forceNew />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        
        {/* Finance Schema */}
        <Route path="invoices" element={<Finance />} />
        <Route path="invoices/:id" element={<Finance />} />
        <Route path="lpo" element={<Finance isLpoView />} />
        <Route path="lpo/:id" element={<Finance isLpoView />} />
        
        <Route path="services" element={<Catalog />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="ai-help" element={<ChatRoom />} />
        <Route path="reports" element={<Reports />} />
        
        <Route path="settings" element={<Settings globalLanguage="EN" onLanguageChange={() => {}} />} />
        <Route path="profile" element={<Profile />} />
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <BusinessProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </BusinessProvider>
    </ThemeProvider>
  );
};

export default App;
