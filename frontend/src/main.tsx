import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.js';
import './index.css';

/**
 * Ponto de Entrada da Aplicação React Frontend (Frontend React DOM Rendering Entry Point)
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
