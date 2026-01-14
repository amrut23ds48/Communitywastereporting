import React, { useState } from 'react';
import { RoleSelection } from './components/RoleSelection';
import { AdminLogin } from './components/AdminLogin';
import { CitizenLogin } from './components/CitizenLogin';
import { CommunityDashboard } from './components/CommunityDashboard';
import { CoordinatorDashboard } from './components/CoordinatorDashboard';
import { AgencyDashboard } from './components/AgencyDashboard';

type Screen =
  | 'role-selection'
  | 'admin-login'
  | 'agency-login'
  | 'citizen-login'
  | 'citizen-dashboard'
  | 'admin-dashboard'
  | 'agency-dashboard';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('role-selection');
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [citizenUserId, setCitizenUserId] = useState<string | null>(null);
  const [agencyUserId, setAgencyUserId] = useState<string | null>(null);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'role-selection':
        return <RoleSelection onSelectRole={(role) => {
          if (role === 'citizen') {
            setCurrentScreen('citizen-login');
          } else if (role === 'agency') {
            setCurrentScreen('agency-login');
          } else {
            setCurrentScreen('admin-login');
          }
        }} />;

      case 'admin-login':
        return <AdminLogin
          onLogin={(userId) => {
            setAdminUserId(userId);
            setCurrentScreen('admin-dashboard');
          }}
          onBack={() => setCurrentScreen('role-selection')}
        />;

      case 'agency-login':
        // Using AdminLogin component with same credentials for now (demo mode)
        return <AdminLogin
          onLogin={(userId) => {
            setAgencyUserId(userId);
            setCurrentScreen('agency-dashboard');
          }}
          onBack={() => setCurrentScreen('role-selection')}
        />;

      case 'citizen-login':
        return <CitizenLogin
          onLogin={(userId) => {
            setCitizenUserId(userId);
            setCurrentScreen('citizen-dashboard');
          }}
          onBack={() => setCurrentScreen('role-selection')}
        />;

      case 'citizen-dashboard':
        return <CommunityDashboard
          userId={citizenUserId!}
          onLogout={() => {
            setCitizenUserId(null);
            setCurrentScreen('role-selection');
          }}
        />;

      case 'admin-dashboard':
        return <CoordinatorDashboard
          userId={adminUserId!}
          onLogout={() => {
            setAdminUserId(null);
            setCurrentScreen('role-selection');
          }}
        />;

      case 'agency-dashboard':
        return <AgencyDashboard
          userId={agencyUserId!}
          onLogout={() => {
            setAgencyUserId(null);
            setCurrentScreen('role-selection');
          }}
        />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {renderScreen()}
    </div>
  );
}

