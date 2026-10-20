import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/Toast';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { HostelsRoomsPage } from './pages/HostelsRoomsPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { VisitorsPage } from './pages/VisitorsPage';
import { StaffWardensPage } from './pages/StaffWardensPage';
import { EmergencyContactsPage } from './pages/EmergencyContactsPage';
import { RelationshipExplorerPage } from './pages/RelationshipExplorerPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="hostels-rooms" element={<HostelsRoomsPage />} />
            <Route path="allocations" element={<AllocationsPage />} />
            <Route path="payments" element={<PaymentsPage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="maintenance" element={<MaintenancePage />} />
            <Route path="visitors" element={<VisitorsPage />} />
            <Route path="staff" element={<StaffWardensPage />} />
            <Route path="emergency-contacts" element={<EmergencyContactsPage />} />
            <Route path="graph-explorer" element={<RelationshipExplorerPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
};

export default App;
