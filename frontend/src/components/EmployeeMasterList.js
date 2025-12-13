import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function EmployeeMasterList() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const res = await axios.get('/api/employee-masters');
        setMasters(res.data || []);
      } catch (err) {
        setError('Failed to load employee master');
      } finally {
        setLoading(false);
      }
    };
    fetchMasters();
  }, []);

  return (
    <>
      <div className="actions-bar">
        <Link to="/masters/add" className="btn btn-primary btn-rounded">Add Employee Master</Link>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}

      <div className="table-container">
        <table className="table table-striped table-bordered salary-table">
          <thead className="table-dark">
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Total Salary</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {masters && masters.length > 0 ? (
              masters.map(m => (
                <tr key={m.id ?? m.employeeId}>
                  <td>{m.employeeId ?? ''}</td>
                  <td>{m.name ?? ''}</td>
                  <td>{m.designation ?? ''}</td>
                  <td>{m.basicSalary ?? ''}</td>
                  <td>{m.joinDate ?? ''}</td>
                  <td className="no-print">
                    <Link to={`/masters/edit/${m.id ?? ''}`} className="btn btn-sm btn-primary" style={{ marginRight: 8 }}>Edit</Link>
                    <button
                      type="button"
                      className="btn btn-sm btn-danger"
                      onClick={async () => {
                        if (!m.id) return;
                        if (!window.confirm('Delete this employee master?')) return;
                        try {
                          await axios.delete(`/api/employee-masters/${m.id}`);
                          setMasters(prev => prev.filter(x => x.id !== m.id));
                        } catch (err) {
                          alert('Delete failed');
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center">No employee masters found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default EmployeeMasterList;
