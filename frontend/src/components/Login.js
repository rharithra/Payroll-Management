import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    try {
      console.log('Sending login request:', { username });
      const res = await axios.post('/api/auth/login', { username, password }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Login response:', res.data);
      
      const { token, role } = res.data || {};
      localStorage.setItem('token', token || '');
      localStorage.setItem('role', role || '');
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      
      if (err?.response?.status === 400) {
        const data = err.response.data;
        if (data?.details) {
           const msg = Object.values(data.details).join(', ');
           setError(msg);
        } else {
           setError(data?.error || 'Invalid request');
        }
      } else if (err?.response?.status === 401) {
        setError('Invalid credentials');
      } else {
        setError('Login failed. Check console.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '24px auto' }}>
      <h3>Login</h3>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" />
        </div>
        <button type="submit" className="btn btn-primary">Login</button>
      </form>
    </div>
  );
}