import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const rootElement = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


const root = document.getElementById('root');
const rootRender = ReactDOM.createRoot(root); // Use ReactDOM.createRoot para criar o root
rootRender.render(rootElement);