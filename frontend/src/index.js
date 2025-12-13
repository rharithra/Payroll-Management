import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import axios from 'axios';

// Ensure API calls hit backend when running on port 3000
if (typeof window !== 'undefined' && window.location && window.location.port === '3000') {
  axios.defaults.baseURL = 'http://localhost:8081';
}

function applyAuth() {
  const token = localStorage.getItem('token') || '';
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

applyAuth();

window.addEventListener('storage', () => applyAuth());

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
  if (status === 401 || status === 403) {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    applyAuth();
    try {
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
    if (typeof window !== 'undefined') {
      window.location.assign('/login');
    }
  }
    return Promise.reject(error);
  }
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
