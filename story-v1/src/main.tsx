import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/metamorphous/400.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/vollkorn/400.css';
import '@fontsource/vollkorn/400-italic.css';
import './styles.css';
import App from './App';

// ?art=1 — the artist's prop gallery (each prop with a reveal slider)
const ART = new URLSearchParams(window.location.search).get('art') === '1';
const galleries = import.meta.glob('./art/Gallery.tsx') as Record<string, () => Promise<{ default: React.ComponentType }>>;
const Gallery = ART && galleries['./art/Gallery.tsx'] ? lazy(galleries['./art/Gallery.tsx']) : null;

// ?island=1 — the pipeline proof: the Blender-built camp island, loaded from the kit
const ISLAND = new URLSearchParams(window.location.search).get('island') === '1';
const IslandProof = ISLAND ? lazy(() => import('./island/IslandProof')) : null;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {IslandProof ? (
      <Suspense fallback={null}>
        <IslandProof />
      </Suspense>
    ) : Gallery ? (
      <Suspense fallback={null}>
        <Gallery />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
