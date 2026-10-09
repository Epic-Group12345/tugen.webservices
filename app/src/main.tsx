import React from 'react';
import { createRoot } from 'react-dom/client';
import './global.css';
import { Landing } from './landing';

createRoot(document.getElementById('root')!).render(<Landing />);
