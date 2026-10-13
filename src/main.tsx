import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/tokens.css';
import App from './App';
import { initClientDefenseShield } from './shared/services/client-defense-shield.service';

// Mount Frontline Console & Client-Side Malware Injection Shield (0 Worker requests)
initClientDefenseShield();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
