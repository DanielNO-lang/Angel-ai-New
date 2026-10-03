import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ui/ErrorBoundary';
import './index.css';
import './final-ui-overrides.css';

// PWA Service Worker Registration (Unified lifecycle with update detection)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[Angel AI PWA] New version available.');
                window.dispatchEvent(new CustomEvent('angel-pwa-update-ready'));
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('[Angel AI PWA] Service Worker registration failed:', err);
      });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        console.log('[Angel AI PWA] Controller changed, updating active page.');
      }
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
