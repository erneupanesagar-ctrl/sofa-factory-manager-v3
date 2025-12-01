// Main App component with routing and authentication
import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import MainLayout from './components/Layout/MainLayout';
import SetupWizard from './components/Auth/SetupWizard';
import LoginScreen from './components/Auth/LoginScreen';
import Dashboard from './components/Dashboard/Dashboard';
import OrdersPage from './pages/Orders/OrdersPage';
import auth from './lib/auth';
import './App.css';

// Main app content component
function AppContent() {
  const { state } = useApp();
  const { user, isLoading } = state;

  // Show loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-amber-500 rounded"></div>
          </div>
          <p className="text-gray-600">Loading Sofa Factory Manager...</p>
        </div>
      </div>
    );
  }

  // Check if this is first time setup
  const isFirstTimeSetup = async () => {
    return await auth.isFirstTimeSetup();
  };

  // Show setup wizard for first time
  React.useEffect(() => {
    const checkSetup = async () => {
      if (!user && await isFirstTimeSetup()) {
        // Will be handled by the component rendering logic
      }
    };
    checkSetup();
  }, [user]);

  // No user and first time setup
  if (!user) {
    return <FirstTimeSetupOrLogin />;
  }

  // User is authenticated, show main app
  return (
    <MainLayout>
      <AppRouter />
    </MainLayout>
  );
}

// Component to handle first time setup or login
function FirstTimeSetupOrLogin() {
  const [isFirstTime, setIsFirstTime] = React.useState(null);

  React.useEffect(() => {
    const checkFirstTime = async () => {
      const firstTime = await auth.isFirstTimeSetup();
      setIsFirstTime(firstTime);
    };
    checkFirstTime();
  }, []);

  if (isFirstTime === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <div className="w-8 h-8 bg-amber-500 rounded"></div>
          </div>
          <p className="text-gray-600">Initializing...</p>
        </div>
      </div>
    );
  }

  return isFirstTime ? <SetupWizard /> : <LoginScreen />;
}

// App router component
function AppRouter() {
  const { state } = useApp();
  const { currentView } = state;

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      
      case 'raw-materials':
        return <div className="p-8 text-center text-gray-500">Raw Materials module coming soon...</div>;
      
      case 'finished-products':
        return <div className="p-8 text-center text-gray-500">Finished Products module coming soon...</div>;
      
      case 'suppliers':
        return <div className="p-8 text-center text-gray-500">Suppliers module coming soon...</div>;
      
      case 'customers':
        return <div className="p-8 text-center text-gray-500">Customers module coming soon...</div>;
      
      case 'labour':
        return <div className="p-8 text-center text-gray-500">Labour Management module coming soon...</div>;
      
      case 'orders':
        return <OrdersPage />;
      
      case 'sales':
        return <div className="p-8 text-center text-gray-500">Sales module coming soon...</div>;
      
      case 'purchases':
        return <div className="p-8 text-center text-gray-500">Purchases module coming soon...</div>;
      
      case 'financials':
        return <div className="p-8 text-center text-gray-500">Financials module coming soon...</div>;
      
      case 'cleaning':
        return <div className="p-8 text-center text-gray-500">Cleaning Services module coming soon...</div>;
      
      case 'reports':
        return <div className="p-8 text-center text-gray-500">Reports module coming soon...</div>;
      
      case 'settings':
        return <div className="p-8 text-center text-gray-500">Settings module coming soon...</div>;
      
      default:
        return <Dashboard />;
    }
  };

  return renderView();
}

// Main App component
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;

