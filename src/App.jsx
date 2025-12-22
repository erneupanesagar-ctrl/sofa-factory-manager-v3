import React from 'react';
import { AppProvider } from './contexts/AppContext';
import MainLayout from './components/Layout/MainLayout';
import ViewRenderer from './components/ViewRenderer';

function App() {
  return (
    <AppProvider>
      <MainLayout>
        <ViewRenderer />
      </MainLayout>
    </AppProvider>
  );
}

export default App;


