import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import ReactDOM from 'react-dom/client';
import MoodPicker from './components/MoodPicker';
import './index.css';
const App = () => (_jsx(_Fragment, { children: _jsx(MoodPicker, {}) }));
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(_jsx(App, {}));
