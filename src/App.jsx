import React from 'react';
import { AppProvider } from './contexts/AppContext';
import MainLayout from './components/Layout/MainLayout';
import ViewRenderer from './components/ViewRenderer';
import { initDefaultAdmin } from './lib/initDefaultAdmin';

function App() {
  // Initialize default admin on first load
  React.useEffect(() => {
    initDefaultAdmin().catch(console.error);
  }, []);

  return (
    <AppProvider>
      <MainLayout>
        <ViewRenderer />
      </MainLayout>
    </AppProvider>
  );
}

export default App;


