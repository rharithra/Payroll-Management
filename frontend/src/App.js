import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import EmployeeList from './components/EmployeeList';
import Home from './components/Home';
import AddEmployee from './components/AddEmployee';
import EditEmployee from './components/EditEmployee';
import EmployeeMasterForm from './components/EmployeeMasterForm';
import Payslip from './components/Payslip'; // NEW
import EmployeeMasterList from './components/EmployeeMasterList'; // NEW
import Login from './components/Login';
import Register from './components/Register';

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
            <Link to="/masters">Employee Master</Link>
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
      </div>
    </BrowserRouter>
  );
}

export default App;
export { AddEmployee, EditEmployee };
