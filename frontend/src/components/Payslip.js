import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function Payslip() {
  const [employees, setEmployees] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params] = useSearchParams();
  const [masters, setMasters] = useState([]);
  useEffect(() => {
    axios.get('/api/employee-masters')
      .then(res => setMasters(res.data || []))
      .catch(() => setMasters([]));
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get('/api/employees');
        setEmployees(res.data || []);
      } catch (err) {
        setError('Failed to load employees');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // NEW: Month/Employee selectors and filtered pay slip options
  const [selectedMonth, setSelectedMonth] = useState('');      // YYYY-MM
  const [selectedMasterEmpId, setSelectedMasterEmpId] = useState(''); // employeeId from master
  const [filteredSlips, setFilteredSlips] = useState([]);

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

  const handleDownloadPdf = async () => {
      const el = document.getElementById('print-area');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
  
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Payslip_${selectedId || 'employee'}.pdf`);
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
                src={process.env.PUBLIC_URL + '/Logo.PNG'}
                alt="Company logo"
                onError={(e) => {
                    // Fallback: try lowercase, then hide if missing
                    if (e.target.dataset.triedLower !== '1') {
                        e.target.dataset.triedLower = '1';
                        e.target.src = process.env.PUBLIC_URL + '/logo.png';
                    } else {
                        e.target.style.display = 'none';
                    }
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
                    <tr><td>Basic+HRA</td><td className="right">{fmt(basicHra)}</td><td>ESS</td><td className="right">{roundInt(slip.professionalTax)}</td></tr>
                    <tr><td>Conveyance</td><td className="right">{fmt(slip.conveyanceAllowance)}</td><td>Advance</td><td className="right">{fmt(slip.advance)}</td></tr>
                    <tr><td>Sales Incentive</td><td className="right">{fmt(slip.performanceIncentive)}</td><td>Loan</td><td className="right">{fmt(slip.loanDeduction)}</td></tr>
                    <tr><td>Per Call Incentive</td><td className="right">{fmt(slip.perCall)}</td><td>Sales Debits</td><td className="right">{fmt(slip.salesDebits)}</td></tr>
                    <tr><td>Attendance Incentive</td><td className="right">{fmt(slip.attendanceAllowance)}</td><td>Underperformance</td><td className="right">{fmt(slip.underPerformance)}</td></tr>
                    <tr><td>Spl Allowance</td><td className="right">{fmt(slip.specialAllowance)}</td><td>Others</td><td className="right">{fmt(slip.otherDeduction)}</td></tr>
                    <tr><td>Other Allowance</td><td className="right">{fmt(slip.otherAllowance)}</td><td></td><td></td></tr>
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