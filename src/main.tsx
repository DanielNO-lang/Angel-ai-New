import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ui/ErrorBoundary';
import './index.css';
import './angel-final-overrides.css';
if(typeof window!=='undefined'&&'serviceWorker'in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(err=>console.warn('[Angel AI PWA] Service Worker registration failed:',err));let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!refreshing)refreshing=true})})}
createRoot(document.getElementById('root')!).render(<StrictMode><ErrorBoundary><App/></ErrorBoundary></StrictMode>);
