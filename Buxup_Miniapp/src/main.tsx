import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import WebApp from '@twa-dev/sdk'

// SOLUCIÓN PRO: Verificamos si la función 'ready' existe antes de llamarla.
// Esto permite probar la app en Chrome sin que la pantalla se quede en blanco.
if (WebApp && typeof WebApp.ready === 'function') {
  WebApp.ready();
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)