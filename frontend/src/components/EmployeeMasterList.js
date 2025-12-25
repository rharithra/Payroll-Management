import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function EmployeeMasterList() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customBoxes, setCustomBoxes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Earnings');

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

  useEffect(() => {
    try {
      const saved = localStorage.getItem('customBoxes');
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = Array.isArray(parsed) ? parsed.map(x => ({ id: x.id, label: x.label, category: x.category || 'Earnings' })) : [];
        setCustomBoxes(normalized);
      }
      setIsLoaded(true);
    } catch {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('customBoxes', JSON.stringify(customBoxes));
    } catch {}
  }, [customBoxes, isLoaded]);

  return (
    <>
      <div className="actions-bar">
        <Link to="/masters/add" className="btn btn-primary btn-rounded">Add Employee</Link>
        <button
          type="button"
          className="btn btn-outline-primary btn-rounded"
          style={{ marginLeft: 8 }}
          onClick={() => setShowCustomModal(true)}
        >
          Custom Components
        </button>
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
                        if (!window.confirm('Delete this employee?')) return;
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
                <td colSpan={6} className="text-center">No employees found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {showCustomModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: 16,
              width: '90%',
              maxWidth: 560
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 18 }}>Custom Components</div>
              <button type="button" className="btn btn-secondary btn-rounded" onClick={() => setShowCustomModal(false)}>Close</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                placeholder="Label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{ flex: 1 }}
              />
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                <option value="Employee">Earnings</option>
                <option value="Earnings">Allowances</option>
                <option value="Deductions">Deductions</option>
                <option value="Summary">Summary</option>
              </select>
              <button
                type="button"
                className="btn btn-primary btn-rounded"
                onClick={() => {
                  const label = newLabel.trim();
                  if (!label) return;
                  const next = [...customBoxes, { id: Date.now(), label, category: newCategory }];
                  setCustomBoxes(next);
                  setNewLabel('');
                }}
              >
                Add
              </button>
            </div>
            <div>
              {/* Custom components list hidden as per request */}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmployeeMasterList;
