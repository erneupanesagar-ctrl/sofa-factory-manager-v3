import React from 'react';
import { AppProvider } from './contexts/AppContext';
import MainLayout from './components/Layout/MainLayout';

function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;


