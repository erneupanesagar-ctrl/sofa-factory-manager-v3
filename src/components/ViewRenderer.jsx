// ViewRenderer component - renders the appropriate view based on currentView state
import React from 'react';
import { useApp } from '../contexts/AppContext';
import LoginScreen from './Auth/LoginScreen';
import SetupWizard from './Auth/SetupWizard';
import Dashboard from './Dashboard/Dashboard';

// Placeholder component for features under development
function PlaceholderView({ title, description }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{description}</p>
        <div className="inline-flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Feature in Development
        </div>
      </div>
    </div>
  );
}

export default function ViewRenderer() {
  const { state, auth, actions } = useApp();
  const { isAuthenticated, isLoading, currentView, company, user } = state;
  const [isFirstTime, setIsFirstTime] = React.useState(null);

  // Check if this is first-time setup
  React.useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const firstTime = await auth.isFirstTimeSetup();
        setIsFirstTime(firstTime);
      } catch (error) {
        console.error('Error checking first time setup:', error);
        setIsFirstTime(false);
      }
    };
    if (auth) {
      checkFirstTime();
    }
  }, [auth]);

  // Show loading state
  if (isLoading || isFirstTime === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show setup wizard for first-time setup (no users exist)
  if (isFirstTime) {
    return <SetupWizard />;
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Show setup wizard if authenticated but no company profile
  if (!company) {
    return <SetupWizard />;
  }

  // Render view based on currentView
  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
      
    case 'inventory':
      return <PlaceholderView 
        title="Inventory Management" 
        description="Manage your raw materials and finished products inventory"
      />;
      
    case 'raw-materials':
      return <PlaceholderView 
        title="Raw Materials" 
        description="Track and manage raw materials stock levels"
      />;
      
    case 'finished-products':
      return <PlaceholderView 
        title="Finished Products" 
        description="View and manage finished sofa products"
      />;
      
    case 'suppliers':
      return <PlaceholderView 
        title="Suppliers" 
        description="Manage your supplier relationships and contacts"
      />;
      
    case 'customers':
      return <PlaceholderView 
        title="Customers" 
        description="View and manage customer information"
      />;
      
    case 'labour':
      return <PlaceholderView 
        title="Labour Management" 
        description="Track labour attendance, payments, and performance"
      />;
      
    case 'sales':
      return <PlaceholderView 
        title="Sales" 
        description="Manage sales orders and transactions"
      />;
      
    case 'purchases':
      return <PlaceholderView 
        title="Purchases" 
        description="Track purchase orders and expenses"
      />;
      
    case 'financials':
      return <PlaceholderView 
        title="Financial Reports" 
        description="View comprehensive financial analytics and reports"
      />;
      
    case 'cleaning':
      return <PlaceholderView 
        title="Cleaning Services" 
        description="Schedule and track cleaning service appointments"
      />;
      
    case 'orders':
      return <PlaceholderView 
        title="Orders" 
        description="Manage customer orders and order fulfillment"
      />;
      
    case 'settings':
      return <PlaceholderView 
        title="Settings" 
        description="Configure application settings and preferences"
      />;
      
    default:
      return <Dashboard />;
  }
}
