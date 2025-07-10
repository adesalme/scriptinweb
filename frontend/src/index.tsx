import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

const App = () => <div className="text-2xl font-bold text-center mt-10">scriptinweb</div>;

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
} 