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
  const [newEmployeeCategory, setNewEmployeeCategory] = useState('');

  const builtinCatalog = [
    { key: 'basicSalary', label: 'Basic salary', category: 'Employee' },
    { key: 'specialAllowance', label: 'Special allowance', category: 'Employee' },
    { key: 'hra', label: 'House Rent Allowance', category: 'Employee' },
    { key: 'dearnessAllowance', label: 'Dearness Allowance', category: 'Employee' },

    { key: 'attendanceAllowance', label: 'Attendance allowance', category: 'Earnings' },
    { key: 'areaAllowance', label: 'Area allowance', category: 'Earnings' },
    { key: 'dresscode', label: 'Dresscode', category: 'Earnings' },
    { key: 'os', label: 'OS', category: 'Earnings' },
    { key: 'performanceIncentive', label: 'Sales incentive', category: 'Earnings' },
    { key: 'review', label: 'Review', category: 'Earnings' },
    { key: 'roadshow', label: 'Roadshow promo', category: 'Earnings' },
    { key: 'perCall', label: 'Per-call inc', category: 'Earnings' },
    { key: 'arrears', label: 'Arrears', category: 'Earnings' },
    { key: 'bonus', label: 'Bonus', category: 'Earnings' },

    { key: 'advance', label: 'Advance', category: 'Deductions' },
    { key: 'loanDeduction', label: 'Loan Deduction', category: 'Deductions' },
    { key: 'professionalTax', label: 'Professional Tax', category: 'Deductions' },
    { key: 'underPerformance', label: 'Under Performance', category: 'Deductions' },
    { key: 'salesDebits', label: 'Sales Debits', category: 'Deductions' }
  ];

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
        const normalized = Array.isArray(parsed)
          ? parsed.map(x => ({
              id: x.id,
              label: x.label,
              category: x.category || 'Earnings',
              employeeCategory: x.employeeCategory || ''
            }))
          : [];
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
              <th>Category</th>
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
                  <td>{m.category ?? ''}</td>
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
                <td colSpan={7} className="text-center">No employees found</td>
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
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 12,
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}
            >
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
              <select value={newEmployeeCategory} onChange={(e) => setNewEmployeeCategory(e.target.value)}>
                <option value="">All</option>
                {Array.from(
                  new Set(
                    (masters || [])
                      .map(m => (m.category || '').trim())
                      .filter(Boolean)
                  )
                ).map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-rounded"
                onClick={() => {
                  const label = newLabel.trim();
                  if (!label) return;
                  const next = [
                    ...customBoxes,
                    {
                      id: Date.now(),
                      label,
                      category: newCategory,
                      employeeCategory: newEmployeeCategory
                    }
                  ];
                  setCustomBoxes(next);
                  try {
                    localStorage.setItem('customBoxes', JSON.stringify(next));
                  } catch {}
                  setNewLabel('');
                  alert('Field added successfully');
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-rounded"
                style={{ marginLeft: 4, marginRight: 16 }}
                onClick={() => {
                  const label = newLabel.trim();
                  if (!label) return;
                  const match = customBoxes.find(
                    (x) => x.label === label && x.category === newCategory
                  );
                  if (!match) {
                    try {
                      const rawLabels = localStorage.getItem('salaryFieldLabels');
                      const labelOverrides = rawLabels ? JSON.parse(rawLabels) : {};
                      const lower = label.toLowerCase();
                      const builtin = builtinCatalog.find((b) => {
                        if (b.category !== newCategory) return false;
                        const effective =
                          (labelOverrides && labelOverrides[b.key]) || b.label || '';
                        return effective.trim().toLowerCase() === lower;
                      });
                      if (!builtin) {
                        alert('No matching custom component or standard field for this label and tab');
                        return;
                      }
                      if (!window.confirm(`Hide the "${label}" field from this tab?`)) return;
                      let hidden = {};
                      try {
                        const rawHidden = localStorage.getItem('salaryHiddenFields');
                        hidden = rawHidden ? JSON.parse(rawHidden) : {};
                      } catch {
                        hidden = {};
                      }
                      hidden[builtin.key] = true;
                      localStorage.setItem('salaryHiddenFields', JSON.stringify(hidden));
                      alert('Field hidden. It will no longer be shown in Add Salary.');
                      setNewLabel('');
                      return;
                    } catch {
                      alert('Failed to update field visibility');
                      return;
                    }
                  }
                  if (!window.confirm('Delete this custom component?')) return;
                  const next = customBoxes.filter((x) => x.id !== match.id);
                  setCustomBoxes(next);
                  try {
                    localStorage.setItem('customBoxes', JSON.stringify(next));
                  } catch {}
                  setNewLabel('');
                }}
              >
                Delete
              </button>
            </div>
            <div />
          </div>
        </div>
      )}
    </>
  );
}

export default EmployeeMasterList;
