import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AddEmployee() {
    // In AddEmployee component: initial state and totals calculation
    const [employee, setEmployee] = useState({
        name: '',
        designation: '',
        department: '',
        role: '',
        salaryDate: '',

        // Inputs (column-wise)
        days: null,
        basicSalary: null,            // Basic
        hra: null,                    // HRA
        dearnessAllowance: null,      // DA (for Basic+HRA+DA)
        conveyanceAllowance: null,    // conveyance
        specialAllowance: null,       // Special allowance
        leads: null,                  // Leads
        performanceIncentive: null,   // salesIncentive
        perCall: null,                // Per-call inc
        areaAllowance: null,          // Area allowance
        os: null,                     // OS
        roadshow: null,               // Roadshow promo
        review: null,                 // Review
        dresscode: null,              // Dresscode
        attendanceAllowance: null,    // Attendance allowance
        arrears: null,                // Arrears
        bonus: null,                  // Bonus

        // Deductions
        professionalTax: null,        // Ess/16
        // removed: incomeTax
        // removed: providentFund
        advance: null,                // advance/17
        loanDeduction: null,          // LOAN/18
        salesDebits: null,            // salesdebits/19
        underPerformance: null,       // underperfomance/20

        // Derived + backend fields
        otherAllowance: null,
        otherDeduction: null,
        grossSalary: null,            // Grosspay
        totalDeduction: null,
        netSalary: null               // net
    });

    const n = (v) => (v == null ? 0 : v);

    const [customBoxes, setCustomBoxes] = useState([]);
    const [customBoxValues, setCustomBoxValues] = useState({});

    useEffect(() => {
        try {
            const saved = localStorage.getItem('customBoxes');
            if (saved) {
                const parsed = JSON.parse(saved);
                const normalized = Array.isArray(parsed) ? parsed.map(x => ({ id: x.id, label: x.label, category: x.category || 'Earnings' })) : [];
                setCustomBoxes(normalized);
            }
        } catch {}
    }, []);

    // Ensure state updates when customBoxes change (e.g. added new one)
    useEffect(() => {
        // If needed, we can force a re-render or check consistency
    }, [customBoxes]);

    const computeDerived = (s, currentBoxes = customBoxValues) => {
        const days = n(s.days);
        const core =
            n(s.basicSalary) +
            n(s.hra) +
            n(s.dearnessAllowance) +
            n(s.specialAllowance);

        // Prorated core per your requirement
        const proratedCore = core * (days / 30);

        // Non‑prorated earnings
        const nonProrated =
            n(s.conveyanceAllowance) +
            n(s.performanceIncentive) +
            n(s.perCall) +
            n(s.attendanceAllowance);

        // Aggregate other allowances
        const extraEarn = (customBoxes || []).filter(cb => cb.category === 'Earnings').reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);
        const otherAllowance =
            n(s.leads) +
            n(s.areaAllowance) +
            n(s.os) +
            n(s.roadshow) +
            n(s.review) +
            n(s.dresscode) +
            n(s.arrears) +
            n(s.bonus) +
            extraEarn;

        const grossSalary = proratedCore + nonProrated + otherAllowance;

        // NEW: ESS as 5% of gross; store in professionalTax
        const professionalTax = grossSalary * 0.05;

        const extraDed = (customBoxes || []).filter(cb => cb.category === 'Deductions').reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);
        const otherDeduction = n(s.advance) + n(s.salesDebits) + n(s.underPerformance) + extraDed;
        const totalDeduction =
            professionalTax + n(s.incomeTax) + n(s.providentFund) + n(s.loanDeduction) + otherDeduction;

        const netSalary = grossSalary - totalDeduction;

        return {
            ...s,
            otherAllowance,
            otherDeduction,
            grossSalary,
            professionalTax,        // ensure the ESS shows under "ESS" on payslip
            totalDeduction,
            netSalary
        };
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const isNumberField = ![
            'name',
            'designation',
            'department',
            'role',
            'salaryDate'
        ].includes(name);

        const updated = {
            ...employee,
            [name]: isNumberField ? (value === '' ? null : parseFloat(value)) : value
        };
        setEmployee(computeDerived(updated));
    };

    const handleCustomBoxChange = (label, value) => {
        const box = customBoxes.find(b => b.label === label);
        const isNumeric = box && (box.category === 'Earnings' || box.category === 'Deductions');
        let val = value;
        if (isNumeric) {
            val = value === '' ? 0 : parseFloat(value);
        }
        const nextValues = { ...customBoxValues, [label]: val };
        setCustomBoxValues(nextValues);
        setEmployee(prev => computeDerived(prev, nextValues));
    };


    // Fetch name/basic master list
    const [masters, setMasters] = useState([]);

    useEffect(() => {
        axios.get('/api/employee-masters')
            .then(res => setMasters(res.data || []))
            .catch(() => setMasters([]));
    }, []);

    const handleMasterSelect = (e) => {
        const selectedEmpId = e.target.value || null;
        const m = masters.find(x => x.employeeId === selectedEmpId);
        const total = m?.basicSalary;
        const shouldSplit = typeof total === 'number' && !Number.isNaN(total) && total > 0;
        const updated = {
            ...employee,
            employeeId: m?.employeeId ?? null,
            name: m?.name ?? '',
            designation: m?.designation ?? employee.designation,
            basicSalary: shouldSplit ? parseFloat((total * 0.40).toFixed(2)) : (m?.basicSalary ?? employee.basicSalary),
            dearnessAllowance: shouldSplit ? parseFloat((total * 0.30).toFixed(2)) : employee.dearnessAllowance,
            hra: shouldSplit ? parseFloat((total * 0.30).toFixed(2)) : employee.hra
        };
        setEmployee(computeDerived(updated));
        setJoinDate(m?.joinDate ?? '');
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null); // toast message state
    const [lastSubmittedKey, setLastSubmittedKey] = useState(null);
    const [lastSubmittedAt, setLastSubmittedAt] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();                   // NEW

    // Helper to compose YYYY-MM-DD (first of month)
    const defaultSalaryDate = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}-01`;
    };

    // Auto-fill salaryDate on load based on URL ?month=YYYY-MM or current month
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const monthParam = params.get('month'); // expects YYYY-MM
        let initialDate = defaultSalaryDate();
        if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
            initialDate = `${monthParam}-01`;
        }
        setEmployee(prev => ({
            ...prev,
            salaryDate: prev.salaryDate || initialDate
        }));
    }, [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        const submitKey = `${String(employee.employeeId || '')}|${String((employee.salaryDate || '').slice(0,7))}`;
        if (lastSubmittedKey && lastSubmittedKey === submitKey && (Date.now() - lastSubmittedAt) < 8000) return;
        setLoading(true);
        setError(null);
        setSuccess(null); // clear any prior toast

        // Validate Days
        if (employee.days == null || employee.days <= 0) {
            setError('Days is required and must be greater than 0');
            setShowErrorModal(true);
            setLoading(false);
            return;
        }

        // Frontend duplicate check: require employeeId and prevent duplicate month (silent within debounce window)
        if (!employee.employeeId || String(employee.employeeId).trim() === '') {
            setError('Please select employee from list');
            setShowErrorModal(true);
            setLoading(false);
            return;
        }
        {
            const ym = (employee.salaryDate || '').slice(0, 7);
            const res = await axios.get('/api/employees');
            const dup = (res.data || []).some((r) =>
                String(r.employeeId || '').trim() === String(employee.employeeId).trim() &&
                String(r.salaryDate || '').slice(0, 7) === ym
            );
            if (dup) {
                if (lastSubmittedKey && lastSubmittedKey === submitKey && (Date.now() - lastSubmittedAt) < 8000) {
                    setLoading(false);
                    return;
                }
                setError('The salary for the same employee name has already been recorded for this month. Kindly verify the Employee ID');
                setShowErrorModal(true);
                setLoading(false);
                return;
            }
        }

        const customFieldsList = customBoxes.map(cb => ({
            label: cb.label,
            category: cb.category,
            value: customBoxValues[cb.label]
        })).filter(x => x.value !== undefined && x.value !== null && x.value !== '' && x.value !== 0);

        const customAllowanceAmount = customFieldsList
            .filter(x => x.category === 'Earnings')
            .reduce((acc, x) => acc + (parseFloat(x.value) || 0), 0);

        const customDeductionAmount = customFieldsList
            .filter(x => x.category === 'Deductions')
            .reduce((acc, x) => acc + (parseFloat(x.value) || 0), 0);

        const dto = {
            name: employee.name,
            designation: employee.designation,
            department: employee.department,
            role: employee.role,
            salaryDate: employee.salaryDate,
            employeeId: employee.employeeId,
            days: employee.days,
            basicSalary: employee.basicSalary,
            hra: employee.hra,
            dearnessAllowance: employee.dearnessAllowance,
            conveyanceAllowance: employee.conveyanceAllowance,
            specialAllowance: employee.specialAllowance,
            leads: employee.leads,
            performanceIncentive: employee.performanceIncentive,
            perCall: employee.perCall,
            areaAllowance: employee.areaAllowance,
            os: employee.os,
            roadshow: employee.roadshow,
            review: employee.review,
            dresscode: employee.dresscode,
            attendanceAllowance: employee.attendanceAllowance,
            arrears: employee.arrears,
            bonus: employee.bonus,
            professionalTax: employee.professionalTax,
            incomeTax: employee.incomeTax,
            providentFund: employee.providentFund,
            advance: employee.advance,
            loanDeduction: employee.loanDeduction,
            salesDebits: employee.salesDebits,
            underPerformance: employee.underPerformance,
            otherAllowance: employee.otherAllowance,
            otherDeduction: employee.otherDeduction,
            grossSalary: employee.grossSalary,
            totalDeduction: employee.totalDeduction,
            netSalary: employee.netSalary,
            customFields: JSON.stringify(customFieldsList),
            customAllowanceAmount,
            customDeductionAmount
        };
        try {
            await axios.post('/api/employees', dto, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
            });
            setSuccess('Saved successfully');
            setTimeout(() => setSuccess(null), 3000);
            setLastSubmittedKey(submitKey);
            setLastSubmittedAt(Date.now());
            // Stay on the current page
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
            setShowErrorModal(true);
        } finally {
            setLoading(false);
        }
    };



    const handleNextEmployee = () => {
        // Clear the form for next entry, keep the current salaryDate
        setCustomBoxValues({});
        setEmployee(prev => computeDerived({
            name: '',
            designation: '',
            department: '',
            role: '',
            salaryDate: prev.salaryDate,
            employeeId: null,

            // Inputs
            days: null,
            basicSalary: null,
            hra: null,
            dearnessAllowance: null,
            conveyanceAllowance: null,
            specialAllowance: null,
            leads: null,
            performanceIncentive: null,
            perCall: null,
            areaAllowance: null,
            os: null,
            roadshow: null,
            review: null,
            dresscode: null,
            attendanceAllowance: null,
            arrears: null,
            bonus: null,

            // Deductions
            professionalTax: null,
            advance: null,
            loanDeduction: null,
            salesDebits: null,
            underPerformance: null
        }));
        setShowAttendance(false);
        setShowSalary(false);
        setShowMoreAllowances(false);
        setShowMoreDeductions(false);
        setShowMoreReadonly(false);
        setShowAttendanceModal(false);
        setJoinDate('');
        setAttendance({ totalLeave: 0, totalPermission: 0, permittedLeave: 0, absentDays: 0 });
        setError(null);
        setShowErrorModal(false);
        setSuccess(null);
    };

    const enterSalary = () => {
        if (!employee.employeeId || String(employee.employeeId).trim() === '') {
            setError('Please select employee from list');
            setShowErrorModal(true);
            return;
        }
        setError(null);
        setShowErrorModal(false);
        setShowSalary(true);
    };

    // Attendance state
    const [joinDate, setJoinDate] = useState('');
    const [attendance, setAttendance] = useState({
        totalLeave: 0,
        totalPermission: 0,
        permittedLeave: 0,
        absentDays: 0,
    });
    const [selectedMonth, setSelectedMonth] = useState('');

    // NEW: staged UI toggles + category
    const [showAttendance, setShowAttendance] = useState(false);
    const [showSalary, setShowSalary] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showMoreAllowances, setShowMoreAllowances] = useState(false);
    const [showMoreDeductions, setShowMoreDeductions] = useState(false);
    const [showMoreReadonly, setShowMoreReadonly] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [activeTab, setActiveTab] = useState('Employee');
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    const currentYear = now.getFullYear();
    const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

    // Tenure-based permitted leave using salary date (if set), else today
    const [overridePermittedLeave, setOverridePermittedLeave] = useState(false);
    const calcPermittedLeave = useCallback((joinDateStr, monthYearStr) => {
        if (!joinDateStr || !monthYearStr) return 0;

        const jd = new Date(joinDateStr);
        const jYear = jd.getFullYear();
        const jMonth = jd.getMonth(); // 0-based

        const [refYearStr, refMonthStr] = monthYearStr.split('-'); // "YYYY-MM"
        const rYear = parseInt(refYearStr, 10);
        const rMonth = parseInt(refMonthStr, 10) - 1; // to 0-based

        const monthsDiff = (rYear - jYear) * 12 + (rMonth - jMonth);
        if (monthsDiff < 12) return 0;   // < 1 year
        const years = Math.floor(monthsDiff / 12);
        if (years === 1) return 1;       // exactly 1 year
        return 2;                        // > 1 year
    }, []);

    // Derive permittedLeave, absentDays, and working days
    useEffect(() => {
        // Use selected salary month (YYYY-MM), or derive from salaryDate
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : null);
        const computedPermitted = calcPermittedLeave(joinDate, monthYear);
        const permitted = overridePermittedLeave ? (attendance.permittedLeave || 0) : computedPermitted;

        const leaveTaken = attendance.totalLeave || 0;
        const usedByLeave = Math.min(leaveTaken, permitted);
        const remainingRights = permitted - usedByLeave;
        const leaveAbsent = Math.max(leaveTaken - permitted, 0);

        const permissionCount = attendance.totalPermission || 0;
        const permissionImpact = permissionCount > 2 ? (permissionCount - 2) * 0.5 : 0;
        const permissionAfterComp = Math.max(permissionImpact - remainingRights, 0);

        const absent = leaveAbsent + permissionAfterComp;
        const workingDays = Math.max(30 - absent, 0);

        setAttendance((prev) => ({
            ...prev,
            permittedLeave: permitted,
            absentDays: absent,
        }));

        setEmployee((prev) => ({
            ...prev,
            days: workingDays,
        }));
    }, [joinDate, selectedMonth, attendance.totalLeave, attendance.totalPermission, overridePermittedLeave, attendance.permittedLeave, calcPermittedLeave]);

    return (
        <div className="page add-salary">
            {/* Success toast, loading, error */}
            {success && (
                <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
                    <div style={{
                        background: '#198754', color: '#fff',
                        padding: '10px 14px', borderRadius: 8,
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}>
                        {success}
                    </div>
                </div>
            )}
            {showErrorModal && (
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
                            maxWidth: 420
                        }}
                    >
                        <div style={{ color: '#dc3545', marginBottom: 12 }}>{error}</div>
                        <div className="btn-container btn-right">
                            <button
                                type="button"
                                className="btn btn-secondary btn-rounded"
                                onClick={() => setShowErrorModal(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="panel" style={!showSalary ? { maxWidth: 700 } : { maxWidth: 1100 }}>
                {loading && <div>Saving...</div>}
                {error && <div style={{ color: 'red' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Header bar */}
                    <div className="header-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                        <h2 className="section-title" style={{ margin: 0 }}>Add Salary Details</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {(() => {
                                const parts = (selectedMonth || `${currentYear}-${String(now.getMonth()+1).padStart(2,'0')}`).split('-');
                                const yy = parseInt(parts[0], 10);
                                const mm = parseInt(parts[1], 10);
                                return (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <select
                                            aria-label="Select Month"
                                            value={mm}
                                            onChange={(e) => {
                                                const m = parseInt(e.target.value, 10);
                                                const y = yy || currentYear;
                                                setSelectedMonth(`${String(y)}-${String(m).padStart(2,'0')}`);
                                            }}
                                        >
                                            {monthNames.map((n, idx) => (
                                                <option key={n} value={idx+1}>{n}</option>
                                            ))}
                                        </select>
                                        <select
                                            aria-label="Select Year"
                                            value={yy}
                                            onChange={(e) => {
                                                const y = parseInt(e.target.value, 10);
                                                const m = mm || (now.getMonth()+1);
                                                setSelectedMonth(`${String(y)}-${String(m).padStart(2,'0')}`);
                                            }}
                                        >
                                            {years.map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })()}
                            <div>
                                <select
                                    aria-label="Select Employee"
                                    value={employee.employeeId ?? ''}
                                    onChange={handleMasterSelect}
                                >
                                    <option value="">Select employee</option>
                                    {masters.map(m => (
                                        <option key={m.id} value={m.employeeId}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <button
                                type="button"
                                className="btn btn-primary btn-rounded"
                                onClick={() => setShowSalary(true)}
                            >
                                Start Salary Entry
                            </button>
                        </div>
                    </div>
                    {showSalary && (
                        <>
                        <div style={{ display: 'flex', gap: 24 }}>
                            <div className="sidebar-nav" style={{ width: 220, borderRight: '1px solid #e5e7eb' }}>
                                {[
                                    { key: 'Employee', label: 'Employee', icon: '👤' },
                                    { key: 'Earnings', label: 'Earnings', icon: '💰' },
                                    { key: 'Deductions', label: 'Deductions', icon: '🧾' },
                                    { key: 'Summary', label: 'Summary', icon: '📊' }
                                ].map(t => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => setActiveTab(t.key)}
                                        className="btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            background: 'transparent',
                                            border: 'none',
                                            padding: '10px 8px',
                                            color: activeTab === t.key ? '#0d6efd' : '#374151',
                                            fontWeight: activeTab === t.key ? 700 : 500,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <span aria-hidden>{t.icon}</span>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                            <div style={{ flex: 1 }}>
                                {activeTab === 'Employee' && (
                                    <div className="form-grid">
                                        <div className="form-item">
                                            <label htmlFor="designation">Designation</label>
                                            <input id="designation" name="designation" type="text" value={employee.designation ?? ''} onChange={handleChange}/>
                                        </div>
                                        <div className="form-item">
                                            <label htmlFor="basicSalary">Basic salary</label>
                                            <input id="basicSalary" name="basicSalary" type="number" value={employee.basicSalary ?? ''} onChange={handleChange}/>
                                        </div>
                                        <div className="form-item">
                                            <label htmlFor="specialAllowance">Special allowance</label>
                                            <input id="specialAllowance" name="specialAllowance" type="number" value={employee.specialAllowance ?? ''} onChange={handleChange}/>
                                        </div>
                                        <div className="form-item">
                                            <label htmlFor="hra">House Rent Allowance</label>
                                            <input id="hra" name="hra" type="number" value={employee.hra ?? ''} onChange={handleChange}/>
                                        </div>
                                        <div className="form-item">
                                            <label htmlFor="dearnessAllowance">Dearness Allowance</label>
                                            <input id="dearnessAllowance" name="dearnessAllowance" type="number" value={employee.dearnessAllowance ?? ''} onChange={handleChange}/>
                                        </div>
                                        {customBoxes.filter(cb => cb.category === 'Employee').map(cb => (
                                            <div key={cb.id} className="form-item">
                                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                                    const next = { ...customBoxValues };
                                                    delete next[cb.label];
                                                    setCustomBoxValues(next);
                                                    setEmployee(prevEmp => computeDerived(prevEmp, next));
                                                }}>(x)</button></label>
                                                <input
                                                    type="text"
                                                    value={(customBoxValues[cb.label] ?? '')}
                                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                                />
                                            </div>
                                        ))}

                                    </div>
                                )}

                                {activeTab === 'Earnings' && (
                                    <div className="form-grid">
                                        <div className="form-item"><label htmlFor="attendanceAllowance">Attendance allowance</label><input id="attendanceAllowance" name="attendanceAllowance" type="number" value={employee.attendanceAllowance ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="areaAllowance">Area allowance</label><input id="areaAllowance" name="areaAllowance" type="number" value={employee.areaAllowance ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="dresscode">Dresscode</label><input id="dresscode" name="dresscode" type="number" value={employee.dresscode ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="os">OS</label><input id="os" name="os" type="number" value={employee.os ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="performanceIncentive">Sales incentive</label><input id="performanceIncentive" name="performanceIncentive" type="number" value={employee.performanceIncentive ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="review">Review</label><input id="review" name="review" type="number" value={employee.review ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="roadshow">Roadshow promo</label><input id="roadshow" name="roadshow" type="number" value={employee.roadshow ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="perCall">Per-call inc</label><input id="perCall" name="perCall" type="number" value={employee.perCall ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="arrears">Arrears</label><input id="arrears" name="arrears" type="number" value={employee.arrears ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="bonus">Bonus</label><input id="bonus" name="bonus" type="number" value={employee.bonus ?? ''} onChange={handleChange}/></div>
                                        {customBoxes.filter(cb => cb.category === 'Earnings').map(cb => (
                                            <div key={cb.id} className="form-item">
                                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                                    const next = { ...customBoxValues };
                                                    delete next[cb.label];
                                                    setCustomBoxValues(next);
                                                    setEmployee(prevEmp => computeDerived(prevEmp, next));
                                                }}>(x)</button></label>
                                                <input
                                                    type="number"
                                                    value={(customBoxValues[cb.label] ?? '')}
                                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                                />
                                            </div>
                                        ))}


                                        <div className="form-item"><label>Other allowance</label><input type="number" readOnly aria-readonly="true" value={employee.otherAllowance?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                    </div>
                                )}

                                {activeTab === 'Deductions' && (
                                    <div className="form-grid">
                                        <div className="form-item"><label htmlFor="advance">Advance</label><input id="advance" name="advance" type="number" value={employee.advance ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="loanDeduction">Loan Deduction</label><input id="loanDeduction" name="loanDeduction" type="number" value={employee.loanDeduction ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="professionalTax">Professional Tax</label><input id="professionalTax" name="professionalTax" type="number" value={employee.professionalTax ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="underPerformance">Under Performance</label><input id="underPerformance" name="underPerformance" type="number" value={employee.underPerformance ?? ''} onChange={handleChange}/></div>
                                        <div className="form-item"><label htmlFor="salesDebits">Sales Debits</label><input id="salesDebits" name="salesDebits" type="number" value={employee.salesDebits ?? ''} onChange={handleChange}/></div>
                                        {customBoxes.filter(cb => cb.category === 'Deductions').map(cb => (
                                            <div key={cb.id} className="form-item">
                                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                                    const next = { ...customBoxValues };
                                                    delete next[cb.label];
                                                    setCustomBoxValues(next);
                                                    setEmployee(prevEmp => computeDerived(prevEmp, next));
                                                }}>(x)</button></label>
                                                <input
                                                    type="number"
                                                    value={(customBoxValues[cb.label] ?? '')}
                                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                                />
                                            </div>
                                        ))}


                                        <div className="form-item"><label>Other deduction</label><input type="number" readOnly aria-readonly="true" value={employee.otherDeduction?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                    </div>
                                )}

                                {activeTab === 'Summary' && (
                                    <div className="form-grid">
                                        <div className="form-item"><label htmlFor="days">Days worked</label><input id="days" name="days" type="number" value={employee.days ?? ''} readOnly aria-readonly="true" style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                        <div className="form-item"><label>Gross salary</label><input type="number" readOnly aria-readonly="true" value={employee.grossSalary?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                        <div className="form-item"><label>Total deductions</label><input type="number" readOnly aria-readonly="true" value={employee.totalDeduction?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                        <div className="form-item"><label>Net salary</label><input type="number" readOnly aria-readonly="true" value={employee.netSalary?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                        <div className="form-item"><label htmlFor="salaryDate">Salary Date</label><input id="salaryDate" name="salaryDate" type="date" value={employee.salaryDate ?? ''} onChange={handleChange}/></div>
                                        
                                        {customBoxes.filter(cb => cb.category === 'Summary').map(cb => (
                                            <div key={cb.id} className="form-item">
                                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                                    const next = { ...customBoxValues };
                                                    delete next[cb.label];
                                                    setCustomBoxValues(next);
                                                    setEmployee(prevEmp => computeDerived(prevEmp, next));
                                                }}>(x)</button></label>
                                                <input
                                                    type="text"
                                                    value={(customBoxValues[cb.label] ?? '')}
                                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                                />
                                            </div>
                                        ))}

                                    </div>
                                )}
                            </div>
                            <div style={{ width: 300 }}>
                                <div className="summary-card" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                                    <div style={{ fontWeight: 700, marginBottom: 8 }}>Attendance Summary</div>
                                    {(!employee.days || employee.days <= 0) ? (
                                        <div style={{ background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: 8, padding: 12, color: '#6b7280' }}>
                                            No Attendance Data
                                            <div style={{ marginTop: 4 }}>Please provide attendance details to calculate live salary values.</div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <div>
                                                <div style={{ color: '#6b7280' }}>Leave</div>
                                                <div style={{ fontWeight: 600 }}>{n(attendance.totalLeave)}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#6b7280' }}>Permission</div>
                                                <div style={{ fontWeight: 600 }}>{n(attendance.totalPermission)}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#6b7280' }}>Permitted</div>
                                                <div style={{ fontWeight: 600 }}>{n(attendance.permittedLeave)}</div>
                                            </div>
                                            <div>
                                                <div style={{ color: '#6b7280' }}>Absent</div>
                                                <div style={{ fontWeight: 600 }}>{n(attendance.absentDays)}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div style={{ marginTop: 12 }}>
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-rounded"
                                            onClick={() => setShowAttendanceModal(true)}
                                        >
                                            Edit Attendance
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        </>
                    )}

                    

                    {showAttendance && !showSalary && (
                        <div className="btn-container btn-center">
                            <button
                                type="button"
                                className="btn btn-primary btn-rounded"
                                onClick={enterSalary}
                            >
                                Enter Salary
                            </button>
                        </div>
                    )}

                    {showSalary && (
                        <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, margin: '16px 0' }}>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                                <div>Gross</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>₹ {n(employee.grossSalary).toLocaleString()}</div>
                            </div>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                                <div>Total deductions</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>₹ {n(employee.totalDeduction).toLocaleString()}</div>
                            </div>
                            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16 }}>
                                <div>Net</div>
                                <div style={{ fontSize: 20, fontWeight: 700 }}>₹ {n(employee.netSalary).toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="btn-container btn-center">
                            <button
                                type="button"
                                disabled={loading}
                                className="btn btn-primary btn-rounded"
                                onClick={handleSubmit}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary btn-rounded"
                                onClick={handleNextEmployee}
                            >
                                Next
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-rounded"
                                onClick={() => navigate(-1)}
                            >
                                Cancel
                            </button>
                        </div>
                        </>
                    )}
                </form>
            </div>

            
            {showAttendanceModal && (
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
                            maxWidth: 800,
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                    >
                        <h3 className="section-title">Attendance</h3>
                        <div className="form-grid">
                            <div className="form-item">
                                <label htmlFor="joinDate">Date of Joining</label>
                                {(() => {
                                    const parts = (joinDate || '').split('-');
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
                                        setJoinDate(`${String(y)}-${String(mClamped).padStart(2,'0')}-${String(dClamped).padStart(2,'0')}`);
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

                            <div className="form-item">
                                <label htmlFor="totalLeave">Total Leave Days</label>
                                <input
                                    id="totalLeave"
                                    type="number"
                                    value={attendance.totalLeave}
                                    onChange={(e) =>
                                        setAttendance(prev => ({
                                            ...prev,
                                            totalLeave: parseFloat(e.target.value || 0),
                                        }))
                                    }
                                />
                            </div>

                            <div className="form-item">
                                <label htmlFor="permissionCount">Permission/Late Count</label>
                                <input
                                    id="permissionCount"
                                    type="number"
                                    value={attendance.totalPermission}
                                    onChange={(e) =>
                                        setAttendance(prev => ({
                                            ...prev,
                                            totalPermission: parseFloat(e.target.value || 0),
                                        }))
                                    }
                                />
                            </div>

                            <div className="form-item">
                                <label>Permitted Leave</label>
                                <input
                                    type="number"
                                    value={attendance.permittedLeave}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value || 0);
                                        setOverridePermittedLeave(true);
                                        setAttendance(prev => ({ ...prev, permittedLeave: val }));
                                    }}
                                />
                            </div>

                            <div className="form-item">
                                <label>Absent Days (auto)</label>
                                <input
                                    type="number"
                                    readOnly
                                    aria-readonly="true"
                                    step="0.5"
                                    value={attendance.absentDays}
                                />
                            </div>

                            <div className="form-item">
                                <label>Working Days (auto)</label>
                                <input
                                    type="number"
                                    readOnly
                                    aria-readonly="true"
                                    step="0.5"
                                    value={employee.days ?? 0}
                                />
                            </div>
                        </div>

                        <div className="btn-container btn-right">
                            <button
                                type="button"
                                className="btn btn-primary btn-rounded"
                                onClick={() => { setShowAttendanceModal(false); setShowAttendance(true); }}
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary btn-rounded"
                                onClick={() => setShowAttendanceModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
