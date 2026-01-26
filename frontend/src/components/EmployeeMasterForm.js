import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

function EmployeeMasterForm() {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('');
  const [category, setCategory] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [permissionLimit, setPermissionLimit] = useState('');
  const [permittedLeave, setPermittedLeave] = useState('');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    designation: '',
    basicSalary: '',
    joinDate: ''
  });
  const [masters, setMasters] = useState([]); // NEW: existing IDs for uniqueness check
  const [categoryOptions, setCategoryOptions] = useState([]);
  const { id } = useParams();
  const isEdit = Boolean(id);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: (currentYear - 2000 + 1) }, (_, i) => 2000 + i);

  useEffect(() => {
    axios.get('/api/employee-masters')
      .then(res => setMasters(res.data || []))
      .catch(() => setMasters([]));
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('employeeCategories');
      const fromStorage = saved ? JSON.parse(saved) : [];
      const storageList = Array.isArray(fromStorage)
        ? fromStorage.map(x => String(x).trim()).filter(Boolean)
        : [];
      const fromMasters = (masters || [])
        .map(m => (m.category || '').trim())
        .filter(Boolean);
      const combined = Array.from(new Set([...storageList, ...fromMasters]));
      setCategoryOptions(combined);
    } catch {
      const fromMasters = (masters || [])
        .map(m => (m.category || '').trim())
        .filter(Boolean);
      setCategoryOptions(Array.from(new Set(fromMasters)));
    }
  }, [masters]);

  useEffect(() => {
    if (isEdit) {
      axios.get(`/api/employee-masters/${id}`)
        .then(res => {
          const m = res.data || {};
          setName(m.name || '');
          setDesignation(m.designation || '');
          setCategory(m.category || '');
          setBasicSalary(m.basicSalary ?? '');
          setPermissionLimit(m.permissionLimit ?? '');
          setPermittedLeave(m.permittedLeave ?? '');
          setFormData(prev => ({
            ...prev,
            employeeId: m.employeeId || '',
            joinDate: m.joinDate || ''
          }));
        })
        .catch(() => {});
    }
  }, [id, isEdit]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const newId = (formData.employeeId || '').trim();
    if (!newId) {
      setError('Employee ID is required');
      setSaving(false);
      return;
    }
    // Uniqueness check (case-insensitive)
    if (!isEdit) {
      const exists = masters.some(m => String(m.employeeId).trim().toLowerCase() === newId.toLowerCase());
      if (exists) {
        setError('Employee ID must be unique');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        name,
        designation,
        category,
        employeeId: newId,
        basicSalary: basicSalary === '' ? null : parseFloat(basicSalary),
        joinDate: formData.joinDate,
        permissionLimit: permissionLimit === '' ? 0 : parseInt(permissionLimit, 10),
        permittedLeave: permittedLeave === '' ? 0 : parseInt(permittedLeave, 10)
      };
      if (isEdit) {
        await axios.put(`/api/employee-masters/${id}`, payload, { headers: { 'Content-Type': 'application/json' } });
      } else {
        await axios.post('/api/employee-masters', payload, { headers: { 'Content-Type': 'application/json' } });
      }
      navigate('/masters');
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page employee-master">
      <div className="panel">
        <form onSubmit={save}>
          <div className="form-grid">
            <div>
              <div className="form-item">
                <label>Employee Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Name" />
              </div>
              <div className="form-item">
                <label>Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-item">
                <label>Designation</label>
                <input type="text" value={designation} onChange={e => setDesignation(e.target.value)} placeholder="Designation" />
              </div>
              <div className="form-item">
                <label>Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">Select category</option>
                  {categoryOptions.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-item">
                <label>Total Salary</label>
                <input type="number" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="Total" />
              </div>
              <div className="form-item">
                <label>Permission/Late Count</label>
                <input
                  type="number"
                  value={permissionLimit}
                  onChange={e => setPermissionLimit(e.target.value)}
                  placeholder="Permissions per month"
                />
              </div>
              <div className="form-item">
                <label>Permitted Leave</label>
                <input
                  type="number"
                  value={permittedLeave}
                  onChange={e => setPermittedLeave(e.target.value)}
                  placeholder="Leave days per month"
                />
              </div>
              <div className="form-item">
                <label>Date of Joining</label>
                {(() => {
                  const parts = (formData.joinDate || '').split('-');
                  const jy = parts[0] ? parseInt(parts[0], 10) : currentYear;
                  const jm = parts[1] ? parseInt(parts[1], 10) : (now.getMonth() + 1);
                  const jd = parts[2] ? parseInt(parts[2], 10) : now.getDate();
                  const dim = (y, m) => new Date(y, m, 0).getDate(); // m=1-12
                  const maxDay = dim(jy, jm);
                  const safeDay = Math.min(jd, maxDay);
                  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
                  const update = (y, m, d) => {
                    const mClamped = Math.max(1, Math.min(12, m));
                    const dClamped = Math.min(dim(y, mClamped), Math.max(1, d));
                    setFormData(prev => ({
                      ...prev,
                      joinDate: `${String(y)}-${String(mClamped).padStart(2,'0')}-${String(dClamped).padStart(2,'0')}`
                    }));
                  };
                  return (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={safeDay} onChange={(e) => update(jy, jm, parseInt(e.target.value, 10))}>
                        {days.map(d => (
                          <option key={d} value={d}>{String(d).padStart(2,'0')}</option>
                        ))}
                      </select>
                      <select value={jm} onChange={(e) => update(jy, parseInt(e.target.value, 10), safeDay)}>
                        {monthNames.map((n, idx) => (
                          <option key={n} value={idx+1}>{n}</option>
                        ))}
                      </select>
                      <select value={jy} onChange={(e) => update(parseInt(e.target.value, 10), jm, safeDay)}>
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}
              </div>
            </div>
            <div></div>
          </div>
          <div className="btn-container btn-center">
            <button type="submit" disabled={saving} className="btn btn-primary btn-rounded">Save</button>
            <button
              type="button"
              className="btn btn-secondary btn-rounded"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </form>
      </div>
    </div>
  );
}
export default EmployeeMasterForm;
