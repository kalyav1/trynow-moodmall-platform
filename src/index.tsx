import React from 'react';
import ReactDOM from 'react-dom/client';
import MoodPicker from './components/MoodPicker';
import './index.css';

const App = () => (
  <>
    <div className="header-bar">
      TryNow MoodMall Platform
    </div>
    <MoodPicker />
  </>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />); 