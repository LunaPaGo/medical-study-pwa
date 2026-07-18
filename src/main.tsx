import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { queryClient } from './services/queryClient';
import { router } from './routes/router';
import { initializeInterfaceDensity } from './features/theme/interfaceDensity';
import { initializeThemePreference } from './features/theme/theme';
import './styles/global.css';

console.info('APP_BOOT_START');

initializeThemePreference();
initializeInterfaceDensity();

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (registration) {
      console.info('SERVICE_WORKER_READY');
    }
  },
  onNeedRefresh() {
    console.info('SERVICE_WORKER_UPDATE_READY');
    window.location.reload();
  },
  onOfflineReady() {
    console.info('SERVICE_WORKER_OFFLINE_READY');
  },
  onRegisterError(error) {
    console.error('SERVICE_WORKER_ERROR', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
