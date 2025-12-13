import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Salary Management System</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav">
              <li className="nav-item">
                <>
                  {/* Ensure routes and names match the app */}
                  <Link className="nav-link" to="/employees">View Salary Details</Link>
                  <Link className="nav-link" to="/add">Add Salary Details</Link>
                </>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}

export default Header;