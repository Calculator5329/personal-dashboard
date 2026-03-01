import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './styles/theme.css';
import './index.css';
import App from './App.tsx';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
  console.error(
    'Missing VITE_GOOGLE_CLIENT_ID environment variable. Create a .env file with your Google OAuth client ID.'
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId || ''}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>
);
