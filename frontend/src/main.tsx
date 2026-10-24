import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './app/providers';
import { AppRouter } from './app/router';
import { AuthProvider } from './features/auth/auth-context';
import { Toaster } from './components/ui/sonner';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <AuthProvider>
        <AppRouter />
        <Toaster />
      </AuthProvider>
    </AppProviders>
  </StrictMode>,
);
