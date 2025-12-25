import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import axios from 'axios';

// Eager load critical components
import Home from './components/Home';
import Login from './components/Login';

// Lazy load other components for performance
const EmployeeList = lazy(() => import('./components/EmployeeList'));
const AddEmployee = lazy(() => import('./components/AddEmployee'));
const EditEmployee = lazy(() => import('./components/EditEmployee'));
const EmployeeMasterForm = lazy(() => import('./components/EmployeeMasterForm'));
const Payslip = lazy(() => import('./components/Payslip'));
const EmployeeMasterList = lazy(() => import('./components/EmployeeMasterList'));
const Register = lazy(() => import('./components/Register'));

// Set base URL for API requests
// In production (Hostinger), this should be the Render Backend URL.
// In development, it falls back to localhost or relative path if configured.
if (process.env.REACT_APP_API_URL) {
  axios.defaults.baseURL = process.env.REACT_APP_API_URL;
}

function App() {
  const [role, setRole] = React.useState(localStorage.getItem('role') || '');
  const [authed, setAuthed] = React.useState(!!localStorage.getItem('token'));
  React.useEffect(() => {
    const h = () => {
      setRole(localStorage.getItem('role') || '');
      setAuthed(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', h);
    return () => window.removeEventListener('storage', h);
  }, []);

  const RequireAuth = ({ children }) => {
    return authed ? children : <Navigate to="/login" replace />;
  };
  return (
    <BrowserRouter>
      {/* Title bar: use className instead of inline styles */}
      <nav className="top-nav">
        <Link to="/">Home</Link>
        {authed && (
          <>
            <Link to="/add">Add Salary Details</Link>
            <Link to="/employees">View Salary Details</Link>
            <Link to="/masters">Employee List</Link>
            <Link to="/payslip">Payslip</Link>
          </>
        )}
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!authed && <Link to="/login" className="btn btn-sm btn-success">Login</Link>}
          {!authed && <Link to="/register" className="btn btn-sm btn-outline-primary">Register</Link>}
          <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('role'); window.dispatchEvent(new Event('storage')); }} className="btn btn-sm btn-outline-secondary">Logout</button>
          <span style={{ marginLeft: 8 }}>Role: {role || 'Guest'}</span>
        </span>
      </nav>

      <div style={{ padding: 12 }}>
        <Suspense fallback={<div className="text-center mt-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
        <Routes>
          <Route path="/" element={authed ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/add" element={<RequireAuth><AddEmployee /></RequireAuth>} />
          <Route path="/edit/:id" element={<RequireAuth><EditEmployee /></RequireAuth>} />
          <Route path="/employees" element={<RequireAuth><EmployeeList /></RequireAuth>} />
          <Route path="/masters" element={<RequireAuth><EmployeeMasterList /></RequireAuth>} />
          <Route path="/masters/add" element={<RequireAuth><EmployeeMasterForm /></RequireAuth>} />
          <Route path="/masters/edit/:id" element={<RequireAuth><EmployeeMasterForm /></RequireAuth>} />
          <Route path="/payslip" element={<RequireAuth><Payslip /></RequireAuth>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
export { AddEmployee, EditEmployee };
