import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

// Simplified Academic Pages
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { RoomsPage } from './pages/RoomsPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { GraphPage } from './pages/GraphPage';
import { TeamPage } from './pages/TeamPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="allocations" element={<AllocationsPage />} />
          <Route path="graph" element={<GraphPage />} />
          <Route path="team" element={<TeamPage />} />

          {/* Aliases for backwards compatibility */}
          <Route path="hostels-rooms" element={<Navigate to="/rooms" replace />} />
          <Route path="graph-explorer" element={<Navigate to="/graph" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
