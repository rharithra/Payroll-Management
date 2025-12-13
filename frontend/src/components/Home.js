import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="d-flex flex-column align-items-center mt-4" style={{ gap: 20 }}>
      <Link to="/add" className="btn btn-primary rounded-pill px-5 py-3">Add Salary Details</Link>
      <Link to="/employees" className="btn btn-secondary rounded-pill px-5 py-3">View Salary Details</Link>
      <Link to="/masters" className="btn btn-info rounded-pill px-5 py-3">Employee Master</Link>
    </div>
  );
}

export default Home;
