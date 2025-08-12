import React from 'react';
import ReactDOM from 'react-dom/client';
import MoodPicker from './components/MoodPicker';
import './index.css';
import './i18n';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MoodPicker />
  </React.StrictMode>
);
