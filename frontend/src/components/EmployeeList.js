import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const now = new Date();
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  useEffect(() => {
    fetchEmployees();
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/employees?year=${selectedYear}&month=${selectedMonth}`);
      setEmployees(response.data);
      setLoading(false);
    } catch (err) {
      setError('Error fetching employee data');
      setLoading(false);
      console.error('Error fetching employees:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`/api/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  const submitEmployee = async (id) => {
    try {
      await axios.post(`/api/employees/${id}/submit`);
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.message || 'Submit failed');
    }
  };

  const approveEmployee = async (id) => {
    try {
      await axios.post(`/api/employees/${id}/approve`);
      fetchEmployees();
    } catch (err) {
      alert(err?.response?.data?.message || 'Approve failed');
    }
  };

  const bulkSubmit = async () => {
    const role = localStorage.getItem('role') || '';
    if (!(role === 'EMPLOYEE' || role === 'ADMIN')) {
      alert('Login required');
      return;
    }
    const targets = visibleEmployees.filter(e => {
      const s = String(e.status || '').toUpperCase();
      return s !== 'APPROVED' && s !== 'SUBMITTED';
    });
    if (targets.length === 0) {
      alert('No rows eligible to submit');
      return;
    }
    try {
      await Promise.all(targets.map(e => axios.post(`/api/employees/${e.id}/submit`)));
      fetchEmployees();
      alert(`Submitted ${targets.length} row(s)`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Bulk submit failed');
    }
  };

  const bulkApprove = async () => {
    const role = localStorage.getItem('role') || '';
    if (role !== 'ADMIN') {
      alert('Only admin can approve');
      return;
    }
    const targets = visibleEmployees.filter(e => String(e.status || '').toUpperCase() === 'SUBMITTED');
    if (targets.length === 0) {
      alert('No rows eligible to approve');
      return;
    }
    try {
      await Promise.all(targets.map(e => axios.post(`/api/employees/${e.id}/approve`)));
      fetchEmployees();
      alert(`Approved ${targets.length} row(s)`);
    } catch (err) {
      alert(err?.response?.data?.message || 'Bulk approve failed');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;
  if (error) return <div className="alert alert-danger mt-3">{error}</div>;

  // Add CSV download function
  // Helper to determine if a value is meaningful
  const isNonEmpty = (val) => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  // Helper: format date as dd-mm-yyyy
  const formatDate = (s) => {
    if (!s) return '';
    const d = new Date(s);
    if (isNaN(d.getTime())) return s;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // Fixed, comprehensive column set (matches AddEmployee fields)
  const allColumns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Employee Name' },         // NEW: show name separately
    { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' },
    { key: 'role', label: 'Role' },
    { key: 'days', label: 'Days' },
    { key: 'basicSalary', label: 'Basic Salary' },
    { key: 'hra', label: 'HRA' },
    { key: 'dearnessAllowance', label: 'Dearness Allowance' },
    { key: 'conveyanceAllowance', label: 'Conveyance' },
    { key: 'specialAllowance', label: 'Special Allowance' },
    { key: 'leads', label: 'Leads' },
    { key: 'performanceIncentive', label: 'Performance Incentive' },
    { key: 'perCall', label: 'Per-call' },
    { key: 'areaAllowance', label: 'Area Allowance' },
    { key: 'os', label: 'OS' },
    { key: 'roadshow', label: 'Roadshow Promo' },
    { key: 'review', label: 'Review' },
    { key: 'dresscode', label: 'Dresscode' },
    { key: 'attendanceAllowance', label: 'Attendance Allowance' },
    { key: 'arrears', label: 'Arrears' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'otherAllowance', label: 'Other Allowance' },
    { key: 'grossSalary', label: 'Gross Salary' },
    { key: 'professionalTax', label: 'Professional Tax' },
    { key: 'incomeTax', label: 'Income Tax' },
    { key: 'providentFund', label: 'PF' },
    { key: 'advance', label: 'Advance' },
    { key: 'loanDeduction', label: 'Loan Deduction' },
    { key: 'salesDebits', label: 'Sales Debits' },
    { key: 'underPerformance', label: 'Under Performance' },
    { key: 'otherDeduction', label: 'Other Deduction' },
    { key: 'totalDeduction', label: 'Total Deduction' },
    { key: 'netSalary', label: 'Net Salary' },
    { key: 'salaryDate', label: 'Salary Date' },
    { key: 'status', label: 'Status' },
  ];

  // Show ONLY rows with at least one meaningful field across all columns
  const visibleEmployees = (employees || []).filter((e) => {
    // 1. Basic empty check
    const hasData = allColumns.some((col) => isNonEmpty(e[col.key]));
    return hasData;
  });

  // Show ALL columns (even if some cells are blank)
  // Adjust visible columns to remove Income Tax and PF
  const visibleColumns = [
    { key: 'name', label: 'Employee Name' },          // keep name
    //{ key: 'employeeId', label: 'Employee ID' },
    { key: 'designation', label: 'Designation' },
    // Removed: { key: 'department', label: 'Department' },
    // Removed: { key: 'role', label: 'Role' },
    { key: 'days', label: 'Days' },
    { key: 'basicSalary', label: 'Basic Salary' },
    { key: 'hra', label: 'HRA' },
    { key: 'dearnessAllowance', label: 'Dearness Allowance' },
    { key: 'conveyanceAllowance', label: 'Conveyance' },
    { key: 'specialAllowance', label: 'Special Allowance' },
    { key: 'leads', label: 'Leads' },
    { key: 'performanceIncentive', label: 'Performance Incentive' },
    { key: 'perCall', label: 'Per-call' },
    { key: 'areaAllowance', label: 'Area Allowance' },
    { key: 'os', label: 'OS' },
    { key: 'roadshow', label: 'Roadshow Promo' },
    { key: 'review', label: 'Review' },
    { key: 'dresscode', label: 'Dresscode' },
    { key: 'attendanceAllowance', label: 'Attendance Allowance' },
    { key: 'arrears', label: 'Arrears' },
    { key: 'bonus', label: 'Bonus' },
    { key: 'otherAllowance', label: 'Other Allowance' },
    { key: 'grossSalary', label: 'Gross Salary' },
    { key: 'professionalTax', label: 'Professional Tax' },
    { key: 'advance', label: 'Advance' },
    { key: 'loanDeduction', label: 'Loan Deduction' },
    { key: 'salesDebits', label: 'Sales Debits' },
    { key: 'underPerformance', label: 'Under Performance' },
    { key: 'otherDeduction', label: 'Other Deduction' },
    { key: 'totalDeduction', label: 'Total Deduction' },
    { key: 'netSalary', label: 'Net Salary' },
    // removed Salary Date column per request
    { key: 'status', label: 'Status' },
  ];

  // Add number-safe parser (handles strings like "34,000.00")
  const toNumber = (val) => {
    if (val == null) return 0;
    const s = String(val).replace(/,/g, '').trim();
    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
  };
  const formatProfessionalTax = (val) => Math.round(toNumber(val));
  const formatInt = (val) => Math.round(toNumber(val));

  // Compute total Net Salary for the currently visible rows
  const netSalaryTotal = (visibleEmployees || []).reduce(
    (sum, emp) => sum + toNumber(emp.netSalary),
    0
  );

  // CSV download (uses visible rows/columns)
  const downloadCsv = () => {
    const headers = visibleColumns.map(c => c.label);
    const headersFull = [...headers, 'Salary Date'];
    const rows = visibleEmployees.map(e => {
      const base = visibleColumns.map(c => {
        const value =
          c.key === 'salaryDate'
            ? formatDate(e[c.key])
            : c.key === 'employeeId'
              ? (e.employeeId ?? '')
              : c.key === 'professionalTax'
                ? formatProfessionalTax(e[c.key])
                : (c.key === 'netSalary' || c.key === 'totalDeduction')
                  ? formatInt(e[c.key])
                : e[c.key];
        return value;
      });
      base.push(formatDate(e.salaryDate));
      return base;
    });

    // Append total row
    const netColIndex = visibleColumns.findIndex(c => c.key === 'netSalary');
    const totalRow = new Array(visibleColumns.length).fill('');
    totalRow[0] = 'Total Net Salary';
    if (netColIndex >= 0) totalRow[netColIndex] = netSalaryTotal.toFixed(2);
    rows.push(totalRow);

    const csv = [headersFull, ...rows]
      .map(r => r.map(v => `"${(v ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // XLSX download (uses visible rows/columns)
  const downloadXlsx = () => {
    const rows = visibleEmployees.map(e => {
      const obj = {};
      visibleColumns.forEach(c => {
        obj[c.label] = c.key === 'salaryDate'
          ? formatDate(e[c.key])
          : c.key === 'professionalTax'
            ? formatProfessionalTax(e[c.key])
            : (c.key === 'netSalary' || c.key === 'totalDeduction')
              ? formatInt(e[c.key])
            : e[c.key];
      });
      obj['Salary Date'] = formatDate(e.salaryDate);
      return obj;
    });

    // Append total row
    const netCol = visibleColumns.find(c => c.key === 'netSalary');
    const firstColLabel = visibleColumns[0]?.label ?? 'Info';
    const totalRow = {
      [firstColLabel]: 'Total Net Salary',
      ...(netCol ? { [netCol.label]: Number(netSalaryTotal.toFixed(2)) } : {})
    };
    rows.push(totalRow);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `employees_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // In EmployeeList component JSX (near the top actions area)
  return (
    <>
      <div>
        <div className="actions-bar no-print">
          <Link to="/add" className="btn btn-primary btn-rounded">Add Salary Details</Link>
          <button type="button" onClick={downloadXlsx} className="btn btn-secondary btn-rounded">
            Download Excel
          </button>
          <button type="button" onClick={() => window.print()} className="btn btn-outline-secondary btn-rounded">
            Print
          </button>
          
          {/* Month/Year Filter */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
            <select 
                className="form-select" 
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '14px' }}
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
            >
                {monthNames.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select 
                className="form-select" 
                style={{ width: 'auto', display: 'inline-block', padding: '6px 12px', fontSize: '14px' }}
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
            >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          {(() => {
            const role = localStorage.getItem('role') || '';
            return (
              <>
                <button type="button" onClick={bulkSubmit} className="btn btn-outline-primary btn-rounded">
                  Submit
                </button>
                {role === 'ADMIN' && (
                  <button type="button" onClick={bulkApprove} className="btn btn-success btn-rounded" style={{ marginLeft: 8 }}>
                    Approve
                  </button>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div className="table-container">
        <table className="table table-striped table-bordered salary-table">
          <thead className="table-dark">
            <tr>
              <th className="no-print">Actions</th>
              {visibleColumns.map(col => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
              {visibleEmployees.length > 0 ? (
                visibleEmployees.map(employee => (
                  <tr key={employee.id}>
                    <td className="no-print">
                      {(() => {
                        const role = localStorage.getItem('role') || '';
                        const isApproved = String(employee.status || '').toUpperCase() === 'APPROVED';
                        const isSubmitted = String(employee.status || '').toUpperCase() === 'SUBMITTED';
                        const disableActions = role === 'EMPLOYEE' && isApproved;
                        return (
                          <div className="btn-group">
                            <Link
                              to={`/edit/${employee.id}`}
                              className={`btn btn-sm ${disableActions ? 'btn-secondary' : 'btn-warning'} me-1`}
                              aria-disabled={disableActions}
                              onClick={(e) => { if (disableActions) e.preventDefault(); }}
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => !disableActions && handleDelete(employee.id)}
                              className={`btn btn-sm ${disableActions ? 'btn-secondary' : 'btn-danger'}`}
                              disabled={disableActions}
                            >
                              Delete
                            </button>
                          </div>
                        );
                      })()}
                    </td>
                    {visibleColumns.map(col => (
                      <td key={col.key}>
                        {col.key === 'salaryDate'
                          ? formatDate(employee[col.key])
                          : col.key === 'professionalTax'
                            ? formatProfessionalTax(employee[col.key])
                            : (col.key === 'netSalary' || col.key === 'totalDeduction')
                              ? formatInt(employee[col.key])
                            : (employee[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length + 1} className="text-center">No employees found</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="no-print"></td>
              {visibleColumns.map((col) => (
                <td key={col.key}>
                  {col.key === 'netSalary' ? Math.round(netSalaryTotal) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  );
}; // <-- end of component

export default EmployeeList;
