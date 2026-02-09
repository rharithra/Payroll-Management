import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function EmployeeMasterList() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [customBoxes, setCustomBoxes] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('Earnings');
  const [newEmployeeCategory, setNewEmployeeCategory] = useState('');
  const [storedCategories, setStoredCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

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
      const tenantId = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('tenantId') || '') : '';
      const key = tenantId ? `employeeCategories_${tenantId}` : 'employeeCategories';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setStoredCategories(parsed.map(x => String(x).trim()).filter(Boolean));
        }
      }
    } catch {}
  }, []);

  const allCategories = Array.from(
    new Set([
      ...storedCategories,
      ...(masters || []).map(m => (m.category || '').trim()).filter(Boolean)
    ])
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await axios.get('/api/custom-components');
        const data = Array.isArray(res.data) ? res.data : [];
        if (!cancelled) {
          const normalized = data.map(x => ({
            id: x.id,
            label: x.label,
            category: x.category || 'Earnings',
            employeeCategory: x.employeeCategory || ''
          }));
          setCustomBoxes(normalized);
        }
      } catch {
        try {
          const tenantId = (typeof window !== 'undefined' && window.localStorage)
            ? (localStorage.getItem('tenantId') || '')
            : '';
          const key = tenantId ? `customBoxes_${tenantId}` : 'customBoxes';
          const saved = localStorage.getItem(key);
          if (saved && !cancelled) {
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
        } catch {}
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      const tenantId = (typeof window !== 'undefined' && window.localStorage)
        ? (localStorage.getItem('tenantId') || '')
        : '';
      const key = tenantId ? `customBoxes_${tenantId}` : 'customBoxes';
      localStorage.setItem(key, JSON.stringify(customBoxes));
    } catch {}
  }, [customBoxes, isLoaded]);

  const moveCustomBox = async (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= customBoxes.length) return;
    const current = [...customBoxes];
    const item = current[fromIndex];
    current.splice(fromIndex, 1);
    current.splice(toIndex, 0, item);
    setCustomBoxes(current);
    try {
      const ids = current.map(x => x.id).filter(Boolean);
      if (ids.length > 0) {
        await axios.put('/api/custom-components/reorder', ids);
      }
    } catch {
      try {
        const res = await axios.get('/api/custom-components');
        const data = Array.isArray(res.data) ? res.data : [];
        const normalized = data.map(x => ({
          id: x.id,
          label: x.label,
          category: x.category || 'Earnings',
          employeeCategory: x.employeeCategory || ''
        }));
        setCustomBoxes(normalized);
      } catch {}
      alert('Failed to update order');
    }
  };

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
        <button
          type="button"
          className="btn btn-outline-secondary btn-rounded"
          style={{ marginLeft: 8 }}
          onClick={() => setShowCategoryModal(true)}
        >
          Add Category
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
                {allCategories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary btn-rounded"
                onClick={async () => {
                  const label = newLabel.trim();
                  if (!label) return;
                  const exists = customBoxes.some(
                    (x) =>
                      x.label === label &&
                      x.category === newCategory &&
                      x.employeeCategory === newEmployeeCategory
                  );
                  if (exists) {
                    alert('This custom component already exists for the selected tab and category');
                    return;
                  }
                  try {
                    const res = await axios.post('/api/custom-components', {
                      label,
                      category: newCategory,
                      employeeCategory: newEmployeeCategory
                    });
                    const saved = res.data;
                    const next = [
                      ...customBoxes,
                      {
                        id: saved.id,
                        label: saved.label,
                        category: saved.category || newCategory,
                        employeeCategory: saved.employeeCategory || newEmployeeCategory
                      }
                    ];
                    setCustomBoxes(next);
                    setNewLabel('');
                    alert('Field added successfully');
                  } catch (err) {
                    if (err && err.response && err.response.status === 409) {
                      alert('This custom component already exists for the selected tab and category');
                    } else {
                      alert('Failed to add custom component');
                    }
                  }
                }}
              >
                Add
              </button>
              <button
                type="button"
                className="btn btn-outline-danger btn-rounded"
                style={{ marginLeft: 4, marginRight: 16 }}
                onClick={async () => {
                  const label = newLabel.trim();
                  if (!label) return;
                  const match = customBoxes.find(
                    (x) =>
                      x.label === label &&
                      x.category === newCategory &&
                      (newEmployeeCategory ? x.employeeCategory === newEmployeeCategory : !x.employeeCategory)
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
                  try {
                    await axios.delete(`/api/custom-components/${match.id}`);
                    const next = customBoxes.filter((x) => x.id !== match.id);
                    setCustomBoxes(next);
                    setNewLabel('');
                  } catch {
                    alert('Failed to delete custom component');
                  }
                }}
              >
                Delete
              </button>
            </div>
            {customBoxes.length > 0 && (
              <div
                style={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  borderTop: '1px solid #eee',
                  paddingTop: 8,
                  marginTop: 8
                }}
              >
                {customBoxes.map((box, index) => (
                  <div
                    key={box.id || `${box.label}-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '4px 0',
                      borderBottom: '1px dashed #f0f0f0',
                      fontSize: 13
                    }}
                  >
                    <div>
                      <div>{box.label}</div>
                      <div style={{ opacity: 0.7 }}>
                        {box.category} {box.employeeCategory ? `· ${box.employeeCategory}` : ''}
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ marginRight: 4 }}
                        disabled={index === 0}
                        onClick={() => moveCustomBox(index, index - 1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={index === customBoxes.length - 1}
                        onClick={() => moveCustomBox(index, index + 1)}
                      >
                        ↓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {showCategoryModal && (
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
              width: '95%',
              maxWidth: 560
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18 }}>Categories</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-rounded"
                  onClick={() => {
                    const name = window.prompt('Category name');
                    if (!name) return;
                    const trimmed = name.trim();
                    if (!trimmed) return;
                    const lower = trimmed.toLowerCase();
                    const exists = storedCategories.some((c) => c.toLowerCase() === lower);
                    if (exists) {
                      alert('Category already exists');
                      return;
                    }
                    const updated = [...storedCategories, trimmed];
                    setStoredCategories(updated);
                    try {
                      const tenantId = (typeof window !== 'undefined' && window.localStorage)
                        ? (localStorage.getItem('tenantId') || '')
                        : '';
                      const key = tenantId ? `employeeCategories_${tenantId}` : 'employeeCategories';
                      localStorage.setItem(key, JSON.stringify(updated));
                    } catch {}
                    setSelectedCategory(trimmed);
                  }}
                >
                  +
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm btn-rounded"
                  disabled={!selectedCategory}
                  onClick={() => {
                    if (!selectedCategory) return;
                    if (!window.confirm(`Delete category "${selectedCategory}"?`)) return;
                    const updated = storedCategories.filter(
                      (c) => c.toLowerCase() !== selectedCategory.toLowerCase()
                    );
                    setStoredCategories(updated);
                    setSelectedCategory('');
                    try {
                      const tenantId =
                        (typeof window !== 'undefined' && window.localStorage)
                          ? (localStorage.getItem('tenantId') || '')
                          : '';
                      const key = tenantId
                        ? `employeeCategories_${tenantId}`
                        : 'employeeCategories';
                      localStorage.setItem(key, JSON.stringify(updated));
                    } catch {}
                  }}
                >
                  Delete
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-rounded"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              style={{
                maxHeight: 260,
                overflowY: 'auto',
                borderTop: '1px solid #eee',
                paddingTop: 8,
                marginTop: 8
              }}
            >
              {storedCategories.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.7 }}>No categories yet</div>
              ) : (
                storedCategories.map((category) => {
                  const isSelected =
                    selectedCategory &&
                    selectedCategory.toLowerCase() === category.toLowerCase();
                  return (
                  <div
                    key={category}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px 0',
                      borderBottom: '1px dashed #f0f0f0',
                      fontSize: 13,
                      cursor: 'pointer',
                      backgroundColor: isSelected ? '#eef2ff' : 'transparent'
                    }}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div>{category}</div>
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmployeeMasterList;
