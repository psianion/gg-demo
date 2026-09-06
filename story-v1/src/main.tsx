import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// self-hosted: no CDN request, no render-blocking third-party origin
// Metamorphous ships weight 400 only — no italic face exists, so every caption and
// control now runs upright.
import '@fontsource/metamorphous/400.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
