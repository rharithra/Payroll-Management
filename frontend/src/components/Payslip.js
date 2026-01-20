import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';

const apiBase =
  (typeof window !== 'undefined' &&
    window.location &&
    window.location.port === '3000'
    ? 'http://localhost:8080'
    : (process.env.REACT_APP_API_URL || ''));

function Payslip() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [params] = useSearchParams();
  const [masters, setMasters] = useState([]);
  const [logoVersion, setLogoVersion] = useState(0);
  const [logoStatus, setLogoStatus] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedMasterEmpId, setSelectedMasterEmpId] = useState('');
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [fieldLabels, setFieldLabels] = useState({});
  const [showLogoInfo, setShowLogoInfo] = useState(false);
  useEffect(() => {
    axios.get('/api/employee-masters')
      .then(res => setMasters(res.data || []))
      .catch(() => setMasters([]));
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!selectedMonth || !selectedMonth.trim()) {
        setEmployees([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const res = await axios.get(`/api/employees?year=${year}&month=${month}`);
        setEmployees(res.data || []);
      } catch (err) {
        setError('Failed to load employees');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [selectedMonth]);

  const monthKey = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) {
        // if already yyyy-mm-dd string, take yyyy-mm
        const s = String(d);
        return s.length >= 7 ? s.substring(0, 7) : '';
      }
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    } catch {
      return '';
    }
  };

  // Initialize month from query like ?month=YYYY-MM
  useEffect(() => {
    const m = params.get('month');
    if (m && /^\d{4}-\d{2}$/.test(m)) setSelectedMonth(m);
  }, [params]);

  // Recompute filtered pay slips when month or employee changes
  useEffect(() => {
    // Gate display until both month and employee are chosen
    const hasMonth = !!(selectedMonth && selectedMonth.trim());
    const hasEmp = !!(selectedMasterEmpId && String(selectedMasterEmpId).trim());

    if (!hasMonth || !hasEmp) {
        setFilteredSlips([]);
        setSelectedId('');
        return;
    }

    const master = masters.find(m => String(m.employeeId).trim().toLowerCase() === String(selectedMasterEmpId).trim().toLowerCase());
    const empId = master?.employeeId?.toString().trim().toLowerCase();
    const month = selectedMonth?.toString().trim();

    let list = employees;
    if (empId) {
        list = list.filter(e => {
            const eid = (e.employeeId ?? '').toString().trim().toLowerCase();
            const nameMatch = (!e.employeeId && master?.name && e?.name && master.name.trim() === e.name.trim());
            return eid === empId || nameMatch;
        });
    }
    if (month) {
        list = list.filter(e => monthKey(e.salaryDate) === month);
    }

    list = list.slice().sort((a, b) => {
        const ad = new Date(a.salaryDate || 0).getTime();
        const bd = new Date(b.salaryDate || 0).getTime();
        return bd - ad;
    });

    setFilteredSlips(list);
    setSelectedId(list.length ? String(list[0].id) : '');
  }, [selectedMonth, selectedMasterEmpId, employees, masters]);

  useEffect(() => {
    const emp = employees.find(e => String(e.id) === String(selectedId));
    setSlip(emp || null);
  }, [selectedId, employees]);

  const formatDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  };

  // Add Month & Year formatter (e.g., Oct-25)
  const formatMonthYear = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const mon = d.toLocaleString('default', { month: 'short' });
    const yr = String(d.getFullYear()).slice(2);
    return `${mon}-${yr}`;
  };

  const handlePrint = () => window.print();

  // add formatter for currency-like numbers
  const fmt = (v) => {
    const n = Number(v ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const roundInt = (v) => Math.round(Number(v ?? 0));

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem('salaryFieldLabels');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setFieldLabels(parsed);
      }
    } catch {}
  }, []);

  const labelFor = (key, fallback) => fieldLabels[key] || fallback;

  const handleDownloadPdf = async () => {
    const el = document.getElementById('print-area');
    if (!el) return;
    
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;
    
    const canvas = await html2canvas(el, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedId || 'employee'}.pdf`);
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setError(null);
      setLogoStatus('');
      await axios.post('/api/logo', formData);
      setLogoVersion(v => v + 1);
      setLogoStatus('Logo uploaded successfully');
    } catch (err) {
      const msg =
        (err.response && err.response.data && err.response.data.error) ||
        'Failed to upload logo';
      setError(msg);
    } finally {
      event.target.value = '';
    }
  };

  if (loading) return <div className="text-center mt-4">Loading...</div>;
  if (error) return <div className="alert alert-danger mt-3">{error}</div>;
  const hasSelections = !!(
    selectedMonth && selectedMonth.trim() &&
    selectedMasterEmpId && String(selectedMasterEmpId).trim()
  );

  return (
    <div className="payslip-page">
      {/* Header + actions */}
      <div className="payslip-header no-print">
        <h2>Salary Slip</h2>
        <div className="payslip-actions">
          <Link to="/employees" className="btn btn-secondary btn-rounded">Back to List</Link>
          <button type="button" className="btn btn-primary btn-rounded" onClick={handlePrint}>Print</button>
          <button
              className="btn btn-outline-secondary no-print"
              onClick={handleDownloadPdf}
          >
              Download PDF
          </button>
          <label className="btn btn-outline-secondary btn-rounded no-print" style={{ marginBottom: 0 }}>
            Upload Logo
            <input
              type="file"
              accept="image/png,image/jpeg"
              style={{ display: 'none' }}
              onChange={handleLogoUpload}
            />
          </label>
        </div>
        {logoStatus && (
          <div className="small text-muted mt-2">
            {logoStatus}
          </div>
        )}
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setShowLogoInfo(prev => !prev)}
            style={{
              width: 26,
              height: 26,
              borderRadius: '999px',
              border: '1px solid #6b7280',
              background: showLogoInfo ? '#0d6efd' : 'transparent',
              color: showLogoInfo ? '#ffffff' : '#374151',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              cursor: 'pointer'
            }}
            aria-label="Show recommended logo size information"
          >
            !
          </button>
          {showLogoInfo && (
            <div
              className="small text-muted"
              style={{
                background: '#f9fafb',
                borderRadius: 8,
                padding: '8px 10px',
                lineHeight: 1.4,
                maxWidth: 420
              }}
            >
              For better fit on the payslip, use a horizontal logo around 80–90 pixels wide and 40–50 pixels high. Sizes close to this, such as 82 × 46 pixels, are also fine.
            </div>
          )}
        </div>
      </div>

      {/* NEW: Month + Employee + Pay Slip selectors */}
      <div className="payslip-selector no-print" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'end' }}>
        <div>
          <label htmlFor="monthSelect">Select Month</label>
          <input
            id="monthSelect"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="employeeMasterSelect">Select Employee</label>
          <select
            id="employeeMasterSelect"
            value={selectedMasterEmpId}
            onChange={(e) => setSelectedMasterEmpId(e.target.value)}
          >
            <option value="">-- Select --</option>
            {masters.map(m => {
              const label = [m.name, m.employeeId].filter(Boolean).join(' - ');
              return (
                <option key={m.employeeId || m.id || label} value={m.employeeId || ''}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Payslip content */}
      {slip ? (
        <div className="payslip-container" id="print-area">
          <div className="payslip-card">
            <div className="classic-header">
              <img
                className="brand-logo"
                src={`${apiBase}/api/logo?v=${logoVersion}`}
                alt="Company logo"
                onError={(e) => {
                    e.target.style.display = 'none';
                    setLogoStatus('No logo found. Please upload a PNG or JPEG logo.');
                }}
              />
              <div className="company-block">
                <div className="company-title">Anjo Aqua World</div>
                <div>219/40 Kamaraj Road, Kumbakonam-612001</div>
                <div>Phone: 81 44 22 77 22</div>
              </div>
            </div>

            <div className="classic-title">Pay Slip</div>

            {/* Employee details grid/table */}
            <table className="payslip-classic">
              <tbody>
                <tr>
                  <th>Employee Name</th><td>{slip.name ?? ''}</td>
                  <th>Employee ID.</th>
                  <td>{
                    slip.employeeId
                      ?? (masters.find(m => m.name === slip.name)?.employeeId ?? '')  // NEW: fallback to master
                  }</td>
                </tr>
                <tr>
                  <th>Designation</th><td>{slip.designation ?? ''}</td>
                  <th>Month & Year</th><td>{formatMonthYear(slip.salaryDate) || '—'}</td>
                </tr>
                <tr>
                  <th>Days Working</th><td>{slip.days ?? ''}</td>
                  <th></th><td></td>
                </tr>
              </tbody>
            </table>
            {(() => {
              const basicHra = (slip.basicSalary ?? 0) + (slip.hra ?? 0);
              return (
                <table className="payslip-classic two-col">
                  <thead>
                    <tr>
                      <th>Earnings</th><th className="right">Amount</th>
                      <th>Deductions</th><th className="right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{labelFor('basicSalary', 'Basic+HRA')}</td>
                      <td className="right">{fmt(basicHra)}</td>
                      <td>{labelFor('professionalTax', 'ESS')}</td>
                      <td className="right">{roundInt(slip.professionalTax)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('conveyanceAllowance', 'Conveyance')}</td>
                      <td className="right">{fmt(slip.conveyanceAllowance)}</td>
                      <td>{labelFor('advance', 'Advance')}</td>
                      <td className="right">{fmt(slip.advance)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('performanceIncentive', 'Sales Incentive')}</td>
                      <td className="right">{fmt(slip.performanceIncentive)}</td>
                      <td>{labelFor('loanDeduction', 'Loan')}</td>
                      <td className="right">{fmt(slip.loanDeduction)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('perCall', 'Per Call Incentive')}</td>
                      <td className="right">{fmt(slip.perCall)}</td>
                      <td>{labelFor('salesDebits', 'Sales Debits')}</td>
                      <td className="right">{fmt(slip.salesDebits)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('attendanceAllowance', 'Attendance Incentive')}</td>
                      <td className="right">{fmt(slip.attendanceAllowance)}</td>
                      <td>{labelFor('underPerformance', 'Underperformance')}</td>
                      <td className="right">{fmt(slip.underPerformance)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('specialAllowance', 'Spl Allowance')}</td>
                      <td className="right">{fmt(slip.specialAllowance)}</td>
                      <td>{labelFor('otherDeduction', 'Others')}</td>
                      <td className="right">{fmt(slip.otherDeduction)}</td>
                    </tr>
                    <tr>
                      <td>{labelFor('otherAllowance', 'Other Allowance')}</td>
                      <td className="right">{fmt(slip.otherAllowance)}</td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr className="bold">
                      <td>Gross Salary</td><td className="right">{fmt(slip.grossSalary)}</td>
                      <td>Total Deductions</td><td className="right">{roundInt(slip.totalDeduction)}</td>
                    </tr>
                    <tr className="bold">
                      <td colSpan="2"></td>
                      <td>Net salary</td><td className="right">{roundInt(slip.netSalary)}</td>
                    </tr>
                  </tbody>
                </table>
              );
            })()}
            {/* Spacer to move signatures down for writing space */}
            <div style={{ height: '48px' }}></div>
            <div className="signature-row">
              <div>Employee Signature</div>
              <div>Manager</div>
            </div>
          </div>
        </div>
      ) : (
        hasSelections ? (
          <div className="alert alert-warning">No data available for selected period</div>
        ) : (
          <div className="payslip-hint">Please select month and employee to view payslip.</div>
        )
      )}
    </div>
  );
}

export default Payslip;
