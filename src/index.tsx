import React from 'react';
import ReactDOM from 'react-dom/client'; // 注意：React 18 使用 ReactDOM.createRoot
import App from './App';
import './index.css';

// React 18 的渲染方式
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);