import React from 'react';
import { createRoot } from 'react-dom/client';
import { applyBrandTheme } from './config/BrandConfig';
import { App } from './app/App';
import './styles/main.css';
applyBrandTheme();
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
