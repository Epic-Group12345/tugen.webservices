import React from 'react';
// Сайт документации — из пакета kit (docs/src в tugen.uikit): страницы пишутся там, рядом с компонентами,
// а здесь он встаёт под шапку сайта. Внутренние адреса — в hash (/docs#/components/button)
import { App } from '@uikit-docs/app';
import { SiteHeader } from './site';

// Шапка сайта не прилипает: прилипает своя шапка документации с поиском разделов и темой
export const Docs: React.FC = () => (
  <>
    <SiteHeader docs />
    <App />
  </>
);
