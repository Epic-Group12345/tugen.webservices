import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import { Admin } from './admin';
import { Business, Developers, Publishers } from './audiences';
import { Landing } from './landing';
import { currentPath } from './site';

// Страницы — по адресу; бэкенд отдаёт на любой из них тот же index.html. Скрытая админка роадмапа — /admin.
// UI-kit и документация тянут все примеры kit, поэтому грузятся отдельными кусками, только когда нужны

const UiKit = lazy(() => import('./uikit').then(m => ({ default: m.UiKit })));
const Docs = lazy(() => import('./docs').then(m => ({ default: m.Docs })));

const PAGES: Record<string, React.ComponentType> = {
  '/admin': Admin,
  '/business': Business,
  '/developers': Developers,
  '/publishers': Publishers,
  '/uikit': UiKit,
  '/docs': Docs,
};

const Page = PAGES[currentPath()] ?? Landing;

createRoot(document.getElementById('root')!).render(
  <Suspense fallback={null}>
    <Page />
  </Suspense>,
);
