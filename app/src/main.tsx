import React from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import { Admin } from './admin';
import { Landing } from './landing';

// Скрытая админка роадмапа — по адресу /admin; бэкенд отдаёт на него тот же index.html
const isAdmin = window.location.pathname.replace(/\/+$/, '') === '/admin';

createRoot(document.getElementById('root')!).render(
  isAdmin ? <Admin /> : <Landing />,
);
