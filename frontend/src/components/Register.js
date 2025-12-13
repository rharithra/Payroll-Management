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
    try {
      await axios.post('/api/auth/register', { username, password, role });
      setOk(true);
      setTimeout(() => navigate('/login'), 800);
    } catch (err) {
      const code = err?.response?.status;
      if (code === 409) setError('Username already exists');
      else setError('Server error');
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