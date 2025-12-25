import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

// In EditEmployee component return JSX
function EditEmployee() {
    const { id } = useParams();

    // In EditEmployee component: initial state
    const [employee, setEmployee] = useState({
        id: null,
        name: '',
        designation: '',
        department: '',
        role: '',
        salaryDate: '',
        employeeId: '',            // NEW: include employeeId in state
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
        incomeTax: null,
        providentFund: null,
        advance: null,
        loanDeduction: null,
        salesDebits: null,
        underPerformance: null,
        // Derived
        otherAllowance: null,
        otherDeduction: null,
        grossSalary: null,
        totalDeduction: null,
        netSalary: null
    });

    const n = (v) => (v == null ? 0 : v);

    const [error, setError] = useState(null);
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

    const computeDerived = useCallback((s, currentBoxes = customBoxValues, boxDefs = customBoxes) => {
        const days = n(s.days);
        const core =
            n(s.basicSalary) +
            n(s.hra) +
            n(s.dearnessAllowance) +
            n(s.specialAllowance);

        const proratedCore = core * (days / 30);

        const nonProrated =
            n(s.conveyanceAllowance) +
            n(s.performanceIncentive) +
            n(s.perCall) +
            n(s.attendanceAllowance);

        const extraEarn = (boxDefs || []).filter(cb => cb.category === 'Earnings').reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);

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

        const extraDed = (boxDefs || []).filter(cb => cb.category === 'Deductions').reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);
        const otherDeduction = n(s.advance) + n(s.salesDebits) + n(s.underPerformance) + extraDed;
        const totalDeduction =
            n(s.professionalTax) + n(s.incomeTax) + n(s.providentFund) + n(s.loanDeduction) + otherDeduction;

        const netSalary = grossSalary - totalDeduction;

        return { ...s, otherAllowance, otherDeduction, grossSalary, totalDeduction, netSalary };
    }, []); // No dependencies now (passed as args)

    const handleCustomBoxChange = (label, value) => {
        const box = customBoxes.find(b => b.label === label);
        const isNumeric = box && (box.category === 'Earnings' || box.category === 'Deductions');
        let val = value;
        if (isNumeric) {
            val = value === '' ? 0 : parseFloat(value);
        }
        const nextValues = { ...customBoxValues, [label]: val };
        setCustomBoxValues(nextValues);
        setEmployee(prev => computeDerived(prev, nextValues, customBoxes));
    };





    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`/api/employees/${id}`);
                const data = res.data;
                
                // Parse custom fields
                let loadedValues = {};
                let loadedBoxes = [];
                // Start with localStorage boxes
                try {
                    const saved = localStorage.getItem('customBoxes');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        loadedBoxes = Array.isArray(parsed) ? parsed.map(x => ({ id: x.id, label: x.label, category: x.category || 'Earnings' })) : [];
                    }
                } catch {}

                if (data.customFields) {
                    try {
                        const parsed = JSON.parse(data.customFields);
                        if (Array.isArray(parsed)) {
                            parsed.forEach(p => {
                                loadedValues[p.label] = p.value;
                            });
                            // Merge missing boxes
                            const existingLabels = new Set(loadedBoxes.map(x => x.label));
                            const newBoxes = parsed.filter(p => !existingLabels.has(p.label)).map(p => ({
                                id: Date.now() + Math.random(),
                                label: p.label,
                                category: p.category
                            }));
                            loadedBoxes = [...loadedBoxes, ...newBoxes];
                        }
                    } catch {}
                }
                
                setCustomBoxes(loadedBoxes);
                setCustomBoxValues(loadedValues);
                setEmployee(computeDerived(data, loadedValues, loadedBoxes));
            } catch (err) {
                setError(err?.response?.data?.message || err.message);
            }
        };
        load();
    }, [id, computeDerived]);

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? (value === '' ? null : parseFloat(value)) : value;
        setEmployee(prev => computeDerived({ ...prev, [name]: val }, customBoxValues, customBoxes));
    };

    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const role = localStorage.getItem('role') || '';
    const submitForApproval = async () => {
        try {
            await axios.post(`/api/employees/${employee.id}/submit`);
            const res = await axios.get(`/api/employees/${employee.id}`);
            setEmployee(computeDerived(res.data));
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        }
    };

    const approve = async () => {
        try {
            await axios.post(`/api/employees/${employee.id}/approve`);
            const res = await axios.get(`/api/employees/${employee.id}`);
            setEmployee(computeDerived(res.data));
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Validate Days
        if (employee.days == null || employee.days <= 0) {
            setError('Days is required and must be greater than 0');
            setSaving(false);
            return;
        }

        // Frontend duplicate check: require employeeId and prevent duplicate month
        try {
            if (!employee.employeeId || String(employee.employeeId).trim() === '') {
                throw new Error('Please select employee from list');
            }
            const ym = (employee.salaryDate || '').slice(0, 7);
            const res = await axios.get('/api/employees');
            const dup = (res.data || []).some((r) =>
                String(r.employeeId || '').trim() === String(employee.employeeId).trim() &&
                String(r.salaryDate || '').slice(0, 7) === ym &&
                r.id !== employee.id
            );
            if (dup) {
                throw new Error('Salary already exists for this employee in this month');
            }
        } catch (preErr) {
            setError(preErr.message);
            setSaving(false);
            return;
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

        const payload = {
            id: employee.id,
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
            await axios.put(`/api/employees/${employee.id}`, payload, {
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
            });
            navigate('/employees');
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="form-container edit-screen">
            <style>{`
                .edit-screen input[type="text"],
                .edit-screen input[type="number"],
                .edit-screen input[type="date"] {
                    height: 48px;
                    min-height: 48px;
                    padding: 10px 12px;
                    line-height: 28px;
                }
            `}</style>
            <form onSubmit={handleSubmit}>
                {/* Two-column layout identical to AddEmployee */}
                <div className="form-grid">
                    {/* Column 1 (same order as AddEmployee) */}
                    <div>
                        <div className="form-item">
                            <label htmlFor="employee-name">Employee Name</label>
                            <input
                                id="employee-name"
                                name="name"
                                type="text"
                                placeholder="Employee Name"
                                value={employee.name ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="designation">Designation</label>
                            <input
                                id="designation"
                                name="designation"
                                type="text"
                                placeholder="Designation"
                                value={employee.designation ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="days">Days</label>
                            <input
                                id="days"
                                name="days"
                                type="number"
                                placeholder="Days"
                                value={employee.days ?? ''}
                                onChange={(e) => setEmployee({ ...employee, days: Number(e.target.value || 0) })}
                                required />
                        </div>

                        <div className="form-item">
                            <label htmlFor="basicSalary">Basic salary</label>
                            <input
                                id="basicSalary"
                                name="basicSalary"
                                type="number"
                                placeholder="Basic salary"
                                value={employee.basicSalary ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="hra">House Rent Allowance</label>
                            <input
                                id="hra"
                                name="hra"
                                type="number"
                                placeholder="House Rent Allowance"
                                value={employee.hra ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="dearnessAllowance">Dearness Allowance</label>
                            <input
                                id="dearnessAllowance"
                                name="dearnessAllowance"
                                type="number"
                                placeholder="Dearness Allowance"
                                value={employee.dearnessAllowance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        {customBoxes.filter(cb => cb.category === 'Employee').map(cb => (
                            <div key={cb.id} className="form-item">
                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                    const next = { ...customBoxValues };
                                    delete next[cb.label];
                                    setCustomBoxValues(next);
                                    setEmployee(prevEmp => computeDerived(prevEmp, next, customBoxes.filter(x => x.id !== cb.id)));
                                }}>(x)</button></label>
                                <input
                                    type="text"
                                    value={(customBoxValues[cb.label] ?? '')}
                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                />
                            </div>
                        ))}


                        <div className="form-item">
                            <label>Basic + HRA + DA (auto)</label>
                            <input
                                type="number"
                                readOnly
                                aria-readonly="true"
                                value={(n(employee.basicSalary) + n(employee.hra) + n(employee.dearnessAllowance)).toFixed(2)}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="conveyanceAllowance">Conveyance allowance</label>
                            <input
                                id="conveyanceAllowance"
                                name="conveyanceAllowance"
                                type="number"
                                placeholder="Conveyance allowance"
                                value={employee.conveyanceAllowance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="specialAllowance">Special allowance</label>
                            <input
                                id="specialAllowance"
                                name="specialAllowance"
                                type="number"
                                placeholder="Special allowance"
                                value={employee.specialAllowance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="leads">Leads</label>
                            <input
                                id="leads"
                                name="leads"
                                type="number"
                                placeholder="Leads"
                                value={employee.leads ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="performanceIncentive">Sales incentive</label>
                            <input
                                id="performanceIncentive"
                                name="performanceIncentive"
                                type="number"
                                placeholder="Sales incentive"
                                value={employee.performanceIncentive ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="perCall">Per-call inc</label>
                            <input
                                id="perCall"
                                name="perCall"
                                type="number"
                                placeholder="Per-call inc"
                                value={employee.perCall ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="areaAllowance">Area allowance</label>
                            <input
                                id="areaAllowance"
                                name="areaAllowance"
                                type="number"
                                placeholder="Area allowance"
                                value={employee.areaAllowance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="os">OS</label>
                            <input
                                id="os"
                                name="os"
                                type="number"
                                placeholder="OS"
                                value={employee.os ?? ''}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Column 2 (same order as AddEmployee) */}
                    <div>
                        <div className="form-item">
                            <label htmlFor="roadshow">Roadshow promo</label>
                            <input
                                id="roadshow"
                                name="roadshow"
                                type="number"
                                placeholder="Roadshow promo"
                                value={employee.roadshow ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="review">Review</label>
                            <input
                                id="review"
                                name="review"
                                type="number"
                                placeholder="Review"
                                value={employee.review ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="dresscode">Dresscode</label>
                            <input
                                id="dresscode"
                                name="dresscode"
                                type="number"
                                placeholder="Dresscode"
                                value={employee.dresscode ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="attendanceAllowance">Attendance allowance</label>
                            <input
                                id="attendanceAllowance"
                                name="attendanceAllowance"
                                type="number"
                                placeholder="Attendance allowance"
                                value={employee.attendanceAllowance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="arrears">Arrears</label>
                            <input
                                id="arrears"
                                name="arrears"
                                type="number"
                                placeholder="Arrears"
                                value={employee.arrears ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="bonus">Bonus</label>
                            <input
                                id="bonus"
                                name="bonus"
                                type="number"
                                placeholder="Bonus"
                                value={employee.bonus ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        {customBoxes.filter(cb => cb.category === 'Earnings').map(cb => (
                            <div key={cb.id} className="form-item">
                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                    const next = { ...customBoxValues };
                                    delete next[cb.label];
                                    setCustomBoxValues(next);
                                    setEmployee(prevEmp => computeDerived(prevEmp, next, customBoxes.filter(x => x.id !== cb.id)));
                                }}>(x)</button></label>
                                <input
                                    type="number"
                                    value={(customBoxValues[cb.label] ?? '')}
                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                />
                            </div>
                        ))}


                        <div className="form-item">
                            <label htmlFor="grossSalary">Grosspay (auto)</label>
                            <input
                                id="grossSalary"
                                type="number"
                                readOnly
                                aria-readonly="true"
                                value={n(employee.grossSalary).toFixed(2)}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="professionalTax">Ess/16</label>
                            <input
                                id="professionalTax"
                                name="professionalTax"
                                type="number"
                                placeholder="Ess/16"
                                value={employee.professionalTax ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="advance">Advance/17</label>
                            <input
                                id="advance"
                                name="advance"
                                type="number"
                                placeholder="Advance/17"
                                value={employee.advance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="loanDeduction">Loan/18</label>
                            <input
                                id="loanDeduction"
                                name="loanDeduction"
                                type="number"
                                placeholder="Loan/18"
                                value={employee.loanDeduction ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="salesDebits">Sales debits/19</label>
                            <input
                                id="salesDebits"
                                name="salesDebits"
                                type="number"
                                placeholder="Sales debits/19"
                                value={employee.salesDebits ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="underPerformance">Underperformance/20</label>
                            <input
                                id="underPerformance"
                                name="underPerformance"
                                type="number"
                                placeholder="Underperformance/20"
                                value={employee.underPerformance ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        {customBoxes.filter(cb => cb.category === 'Deductions').map(cb => (
                            <div key={cb.id} className="form-item">
                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                    const next = { ...customBoxValues };
                                    delete next[cb.label];
                                    setCustomBoxValues(next);
                                    setEmployee(prevEmp => computeDerived(prevEmp, next, customBoxes.filter(x => x.id !== cb.id)));
                                }}>(x)</button></label>
                                <input
                                    type="number"
                                    value={(customBoxValues[cb.label] ?? '')}
                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                />
                            </div>
                        ))}


                        <div className="form-item">
                            <label htmlFor="totalDeduction">Total Deduction (auto)</label>
                            <input
                                id="totalDeduction"
                                type="number"
                                readOnly
                                aria-readonly="true"
                                value={n(employee.totalDeduction).toFixed(2)}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="netSalary">Net (auto)</label>
                            <input
                                id="netSalary"
                                type="number"
                                readOnly
                                aria-readonly="true"
                                value={n(employee.netSalary).toFixed(2)}
                            />
                        </div>

                        <div className="form-item">
                            <label htmlFor="salaryDate">Salary Date</label>
                            <input
                                id="salaryDate"
                                name="salaryDate"
                                type="date"
                                placeholder="YYYY-MM-DD"
                                value={employee.salaryDate ?? ''}
                                onChange={handleChange}
                            />
                        </div>

                        {customBoxes.filter(cb => cb.category === 'Summary').map(cb => (
                            <div key={cb.id} className="form-item">
                                <label>{cb.label} <button type="button" style={{ fontSize: '0.7em', color: 'red', border: 'none', background: 'none' }} onClick={() => {
                                    setCustomBoxes(prev => prev.filter(x => x.id !== cb.id));
                                    const next = { ...customBoxValues };
                                    delete next[cb.label];
                                    setCustomBoxValues(next);
                                    setEmployee(prevEmp => computeDerived(prevEmp, next, customBoxes.filter(x => x.id !== cb.id)));
                                }}>(x)</button></label>
                                <input
                                    type="text"
                                    value={(customBoxValues[cb.label] ?? '')}
                                    onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                />
                            </div>
                        ))}

                    </div>
                </div>

                <div className="btn-container">
                    {!(role === 'EMPLOYEE' && String(employee.status || '').toUpperCase() === 'APPROVED') && (
                        <button type="submit" disabled={saving}>Save Changes</button>
                    )}
                    <button type="button" onClick={() => navigate('/employees')}>Cancel</button>
                    {role === 'EMPLOYEE' && String(employee.status || 'DRAFT').toUpperCase() !== 'APPROVED' && (
                        <button type="button" className="btn btn-outline-primary" onClick={submitForApproval} style={{ marginLeft: 8 }}>Submit for Approval</button>
                    )}
                    {role === 'ADMIN' && String(employee.status || '').toUpperCase() === 'SUBMITTED' && (
                        <button type="button" className="btn btn-success" onClick={approve} style={{ marginLeft: 8 }}>Approve</button>
                    )}
                </div>
            </form>
        </div>
    );
        
}

export default EditEmployee;
