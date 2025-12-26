import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('EMPLOYEE');
  const [error, setError] = React.useState('');
  const [ok, setOk] = React.useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setOk(false);

    if (!username || !username.trim() || !password) {
      setError('Username and password are required');
      return;
    }

    try {
      console.log('Sending register request:', { username, password, role });
      const res = await axios.post('/api/auth/register', { username, password, role }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Register response:', res.data);
      setOk(true);
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      console.error('Register error:', err);
      console.error('Error response:', err.response);
      
      const code = err?.response?.status;
      if (code === 409) {
        setError('Username already exists');
      } else if (err?.response?.data?.details) {
        // Handle validation errors from backend
        const details = err.response.data.details;
        const msg = Object.values(details).join(', ');
        setError(msg || 'Validation failed');
      } else if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Registration failed. Check console for details.');
      }
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: '24px auto' }}>
      <h3>Register</h3>
      {error ? <div className="alert alert-danger">{error}</div> : null}
      {ok ? <div className="alert alert-success">Registered</div> : null}
      <form onSubmit={submit}>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" />
        </div>
        <div className="mb-3">
          <label className="form-label">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Register</button>
      </form>
    </div>
  );
}