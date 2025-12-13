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
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      const { token, role } = res.data || {};
      localStorage.setItem('token', token || '');
      localStorage.setItem('role', role || '');
      window.dispatchEvent(new Event('storage'));
      navigate('/');
    } catch (err) {
      setError('Invalid credentials');
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