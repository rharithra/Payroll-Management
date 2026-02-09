import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import * as XLSX from 'xlsx';

const defaultFieldLabels = {
    basicSalary: 'Basic salary',
    specialAllowance: 'Special allowance',
    hra: 'House Rent Allowance',
    dearnessAllowance: 'Dearness Allowance',
    attendanceAllowance: 'Attendance allowance',
    areaAllowance: 'Area allowance',
    dresscode: 'Dresscode',
    os: 'OS',
    performanceIncentive: 'Sales incentive',
    review: 'Review',
    roadshow: 'Roadshow promo',
    perCall: 'Per-call inc',
    arrears: 'Arrears',
    bonus: 'Bonus',
    advance: 'Advance',
    loanDeduction: 'Loan Deduction',
    professionalTax: 'Professional Tax',
    underPerformance: 'Under Performance',
    salesDebits: 'Sales Debits'
};

const allowanceFieldKeys = [
    'attendanceAllowance',
    'areaAllowance',
    'dresscode',
    'os',
    'performanceIncentive',
    'review',
    'roadshow',
    'perCall',
    'arrears',
    'bonus'
];

const employeeFieldKeys = [
    'basicSalary',
    'specialAllowance',
    'hra',
    'dearnessAllowance'
];

const deductionFieldKeys = [
    'advance',
    'loanDeduction',
    'professionalTax',
    'underPerformance',
    'salesDebits'
];

const ATTENDANCE_EXCEL_KEY = 'attendanceExcelImported';
const ALLOWANCES_EXCEL_KEY = 'allowancesExcelImported';

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
    const [hiddenFields, setHiddenFields] = useState(() => {
        try {
            const raw = localStorage.getItem('salaryHiddenFields');
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });
    const [salaryDirty, setSalaryDirty] = useState(false);
    const [fieldLabels, setFieldLabels] = useState(defaultFieldLabels);

    const [importedAttendance, setImportedAttendance] = useState(() => {
        try {
            const raw = localStorage.getItem(ATTENDANCE_EXCEL_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            const savedLabels = localStorage.getItem('salaryFieldLabels');
            if (savedLabels) {
                const parsed = JSON.parse(savedLabels);
                if (parsed && typeof parsed === 'object') {
                    setFieldLabels(prev => ({ ...prev, ...parsed }));
                }
            }
        } catch {}
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(ATTENDANCE_EXCEL_KEY, JSON.stringify(importedAttendance));
        } catch {}
    }, [importedAttendance]);

    const [importedAllowances, setImportedAllowances] = useState(() => {
        try {
            const raw = localStorage.getItem(ALLOWANCES_EXCEL_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(ALLOWANCES_EXCEL_KEY, JSON.stringify(importedAllowances));
        } catch {}
    }, [importedAllowances]);

    const [employeeOrder, setEmployeeOrder] = useState(() => {
        try {
            const raw = localStorage.getItem('salaryEmployeeOrder');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const cleaned = employeeFieldKeys.filter((k) => parsed.includes(k));
                    const remaining = employeeFieldKeys.filter((k) => !parsed.includes(k));
                    return [...cleaned, ...remaining];
                }
            }
        } catch {}
        return employeeFieldKeys;
    });

    const [allowanceOrder, setAllowanceOrder] = useState(() => {
        try {
            const raw = localStorage.getItem('salaryAllowanceOrder');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const cleaned = allowanceFieldKeys.filter((k) => parsed.includes(k));
                    const remaining = allowanceFieldKeys.filter((k) => !parsed.includes(k));
                    return [...cleaned, ...remaining];
                }
            }
        } catch {}
        return allowanceFieldKeys;
    });

    const [deductionOrder, setDeductionOrder] = useState(() => {
        try {
            const raw = localStorage.getItem('salaryDeductionOrder');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    const cleaned = deductionFieldKeys.filter((k) => parsed.includes(k));
                    const remaining = deductionFieldKeys.filter((k) => !parsed.includes(k));
                    return [...cleaned, ...remaining];
                }
            }
        } catch {}
        return deductionFieldKeys;
    });

    const [customMenu, setCustomMenu] = useState({
        open: false,
        x: 0,
        y: 0,
        tabCategory: null,
        target: null
    });
    const longPressRef = useRef(null);

    const openCustomMenuAt = (x, y, tabCategory, target) => {
        setCustomMenu({
            open: true,
            x,
            y,
            tabCategory,
            target
        });
    };

    const openCustomMenu = (event, tabCategory, target) => {
        event.preventDefault();
        const x = event.clientX;
        const y = event.clientY;
        openCustomMenuAt(x, y, tabCategory, target);
    };

    const startLongPress = (event, tabCategory, target) => {
        if (event.type === 'mousedown' && event.button !== 0) {
            return;
        }
        const point =
            event.touches && event.touches.length > 0
                ? event.touches[0]
                : event;
        const x = point.clientX;
        const y = point.clientY;
        if (longPressRef.current) {
            clearTimeout(longPressRef.current);
        }
        longPressRef.current = setTimeout(() => {
            openCustomMenuAt(x, y, tabCategory, target);
        }, 600);
    };

    const cancelLongPress = () => {
        if (longPressRef.current) {
            clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
    };

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
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('salaryHiddenFields', JSON.stringify(hiddenFields));
        } catch {}
    }, [hiddenFields]);

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

        const extraEarn = (customBoxes || [])
            .filter(cb =>
                cb.category === 'Earnings' &&
                (!cb.employeeCategory || cb.employeeCategory === category)
            )
            .reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);
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

        const extraDed = (customBoxes || [])
            .filter(cb =>
                cb.category === 'Deductions' &&
                (!cb.employeeCategory || cb.employeeCategory === category)
            )
            .reduce((acc, cb) => acc + n(currentBoxes[cb.label]), 0);
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
        if (isNumberField) {
            setSalaryDirty(true);
        }
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
        if (isNumeric) {
            setSalaryDirty(true);
        }
        setEmployee(prev => computeDerived(prev, nextValues));
    };

    const moveCustomBoxInTab = async (tabCategory, employeeCategoryFilter, boxId, direction) => {
        if (!direction) return;
        const empCategory = employeeCategoryFilter || '';
        const current = [...customBoxes];
        const matches = current
            .map((cb, index) => ({ cb, index }))
            .filter(({ cb }) =>
                cb.category === tabCategory &&
                (!cb.employeeCategory || cb.employeeCategory === empCategory)
            );
        const currentIndexInTab = matches.findIndex(x => x.cb.id === boxId);
        if (currentIndexInTab === -1) return;
        const targetIndexInTab = currentIndexInTab + direction;
        if (targetIndexInTab < 0 || targetIndexInTab >= matches.length) return;
        const fromIndex = matches[currentIndexInTab].index;
        const toIndex = matches[targetIndexInTab].index;
        const [item] = current.splice(fromIndex, 1);
        current.splice(toIndex, 0, item);
        setCustomBoxes(current);
        setCustomMenu(prev => ({ ...prev, open: false }));
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
        }
    };

    const moveBuiltinField = (tabCategory, fieldKey, direction) => {
        if (!direction) return;
        if (tabCategory === 'Employee') {
            setEmployeeOrder(prev => {
                const current = employeeFieldKeys.filter(k => prev.includes(k));
                const idx = current.indexOf(fieldKey);
                if (idx === -1) return prev;
                const target = idx + direction;
                if (target < 0 || target >= current.length) return prev;
                const next = [...current];
                const [item] = next.splice(idx, 1);
                next.splice(target, 0, item);
                try {
                    localStorage.setItem('salaryEmployeeOrder', JSON.stringify(next));
                } catch {}
                return next;
            });
        } else if (tabCategory === 'Earnings') {
            setAllowanceOrder(prev => {
                const current = allowanceFieldKeys.filter(k => prev.includes(k));
                const idx = current.indexOf(fieldKey);
                if (idx === -1) return prev;
                const target = idx + direction;
                if (target < 0 || target >= current.length) return prev;
                const next = [...current];
                const [item] = next.splice(idx, 1);
                next.splice(target, 0, item);
                try {
                    localStorage.setItem('salaryAllowanceOrder', JSON.stringify(next));
                } catch {}
                return next;
            });
        } else if (tabCategory === 'Deductions') {
            setDeductionOrder(prev => {
                const current = deductionFieldKeys.filter(k => prev.includes(k));
                const idx = current.indexOf(fieldKey);
                if (idx === -1) return prev;
                const target = idx + direction;
                if (target < 0 || target >= current.length) return prev;
                const next = [...current];
                const [item] = next.splice(idx, 1);
                next.splice(target, 0, item);
                try {
                    localStorage.setItem('salaryDeductionOrder', JSON.stringify(next));
                } catch {}
                return next;
            });
        }
        setCustomMenu(prev => ({ ...prev, open: false }));
    };

    const updateFieldLabel = useCallback((fieldKey, value) => {
        setFieldLabels(prev => {
            const next = { ...prev, [fieldKey]: value || defaultFieldLabels[fieldKey] || '' };
            try {
                localStorage.setItem('salaryFieldLabels', JSON.stringify(next));
            } catch {}
            return next;
        });
    }, []);

    const hideField = useCallback((fieldKey) => {
        setHiddenFields(prev => ({ ...prev, [fieldKey]: true }));
        setEmployee(prev => {
            const next = { ...prev };
            if (Object.prototype.hasOwnProperty.call(next, fieldKey)) {
                next[fieldKey] = null;
            }
            return computeDerived(next);
        });
    }, [computeDerived]);


    // Fetch name/basic master list
    const [masters, setMasters] = useState([]);
    const [category, setCategory] = useState('');
    const [categoryOptions, setCategoryOptions] = useState([]);
    const visibleCategoryOptions = categoryOptions;

    useEffect(() => {
        axios.get('/api/employee-masters')
            .then(res => setMasters(res.data || []))
            .catch(() => setMasters([]));
    }, []);

    useEffect(() => {
        try {
            const tenantId = (typeof window !== 'undefined' && window.localStorage) ? (localStorage.getItem('tenantId') || '') : '';
            const key = tenantId ? `employeeCategories_${tenantId}` : 'employeeCategories';
            const saved = localStorage.getItem(key);
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

    const currentEmployee = useMemo(() => {
        const key = (employee.employeeId || '').toString().trim().toLowerCase();
        return masters.find(x =>
            (x.employeeId != null ? x.employeeId : '').toString().trim().toLowerCase() === key
        ) || null;
    }, [employee.employeeId, masters]);

    const filteredMastersByCategory = useMemo(() => {
        const cat = (category || '').trim().toLowerCase();
        if (!cat) {
            return [];
        }
        return (masters || []).filter(m => {
            const mCat = (m.category || '').trim().toLowerCase();
            return mCat === cat;
        });
    }, [masters, category]);

    const handleMasterSelect = (e) => {
        const selectedEmpId = e.target.value || null;
        const key = (selectedEmpId || '').toString().trim().toLowerCase();
        const m = masters.find(x =>
            (x.employeeId != null ? x.employeeId : '').toString().trim().toLowerCase() === key
        );
        const totalRaw = m?.basicSalary;
        const total = totalRaw == null ? null : Number(totalRaw);
        const shouldSplit = typeof total === 'number' && !Number.isNaN(total) && total > 0;
        const base = shouldSplit ? total : null;
        const updated = {
            ...employee,
            employeeId: m?.employeeId ?? null,
            name: m?.name ?? '',
            designation: m?.designation ?? employee.designation,
            basicSalary: shouldSplit ? parseFloat((base * 0.40).toFixed(2)) : (m?.basicSalary ?? employee.basicSalary),
            dearnessAllowance: shouldSplit ? parseFloat((base * 0.30).toFixed(2)) : employee.dearnessAllowance,
            hra: shouldSplit ? parseFloat((base * 0.30).toFixed(2)) : employee.hra,
            days: employee.days == null ? 30 : employee.days
        };
        setSalaryDirty(true);
        setEmployee(computeDerived(updated));
        setJoinDate(m?.joinDate ?? '');
        if (m) {
            setCategory(m.category || '');
            setAttendance(prev => ({
                ...prev,
                perMonthPermittedLeave: m.permittedLeave != null ? m.permittedLeave : prev.perMonthPermittedLeave,
                perMonthPermissionLimit: m.permissionLimit != null ? m.permissionLimit : prev.perMonthPermissionLimit,
            }));
        } else {
            setCategory('');
        }
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCategory(value);
        setCustomBoxValues({});
        setEmployee(prev => computeDerived({
            ...prev,
            employeeId: null,
            name: '',
        }));
        setJoinDate('');
        setAttendance(prev => ({
            ...prev,
            totalLeave: 0,
            totalPermission: 0,
            permittedLeave: 0,
            absentDays: 0,
        }));
    };

    const handleDownloadAttendanceTemplate = () => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        const header = ['Employee ID', 'Name', 'Salary Month (YYYY-MM)', 'Total Leave Days', 'Permission/Late Count'];
        const rows = masters.map(m => [
            m.employeeId || '',
            m.name || '',
            monthYear,
            '',
            ''
        ]);
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${monthYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleAttendanceExcelUpload = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                const map = {};
                rows.forEach((row) => {
                    const empId = String(row['Employee ID'] || '').trim();
                    const monthRaw = String(row['Salary Month (YYYY-MM)'] || '').trim();
                    if (!empId || !monthRaw) return;
                    const normalizedMonth = monthRaw.length === 7 ? monthRaw : '';
                    if (!normalizedMonth) return;
                    const leaveVal = parseFloat(row['Total Leave Days'] || 0) || 0;
                    const permVal = parseFloat(row['Permission/Late Count'] || 0) || 0;
                    const key = `${normalizedMonth}|${empId}`;
                    map[key] = {
                        totalLeave: leaveVal,
                        totalPermission: permVal
                    };
                });
                setImportedAttendance(map);
            } catch (err) {
                console.error('Failed to parse attendance Excel', err);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const getAllowanceColumnConfig = () => {
        const builtin = allowanceOrder
            .filter((key) => !hiddenFields[key])
            .map((key) => ({
                type: 'builtin',
                key,
                header: fieldLabels[key] || key
            }));
        const customLabels = Array.from(
            new Set(
                customBoxes
                    .filter((cb) => cb.category === 'Earnings')
                    .map((cb) => cb.label)
                    .filter(Boolean)
            )
        );
        const custom = customLabels.map((label) => ({
            type: 'custom',
            label,
            header: label
        }));
        return [...builtin, ...custom];
    };

    const handleDownloadAllowancesTemplate = () => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`);
        const columns = getAllowanceColumnConfig();
        const header = ['Employee ID', 'Name', 'Salary Month (YYYY-MM)', ...columns.map((c) => c.header)];
        const rows = masters.map((m) => {
            const base = [
                m.employeeId || '',
                m.name || '',
                monthYear
            ];
            const values = columns.map(() => '');
            return [...base, ...values];
        });
        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Allowances');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `allowances-${monthYear}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleAllowancesExcelUpload = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
                const columns = getAllowanceColumnConfig();
                const builtinByHeader = {};
                const customByHeader = {};
                columns.forEach((col) => {
                    const key = (col.header || '').trim().toLowerCase();
                    if (!key) return;
                    if (col.type === 'builtin') {
                        builtinByHeader[key] = col.key;
                    } else if (col.type === 'custom') {
                        customByHeader[key] = col.label;
                    }
                });
                const map = {};
                rows.forEach((row) => {
                    const empId = String(row['Employee ID'] || '').trim();
                    const monthRaw = String(row['Salary Month (YYYY-MM)'] || '').trim();
                    if (!empId || !monthRaw) return;
                    const normalizedMonth = monthRaw.length === 7 ? monthRaw : '';
                    if (!normalizedMonth) return;
                    const key = `${normalizedMonth}|${empId}`;
                    const current = map[key] || { builtin: {}, custom: {} };
                    const builtinValues = { ...current.builtin };
                    const customValues = { ...current.custom };
                    Object.keys(row).forEach((colName) => {
                        const normalized = colName.trim().toLowerCase();
                        if (normalized === 'employee id' || normalized === 'salary month (yyyy-mm)') {
                            return;
                        }
                        const builtinKey = builtinByHeader[normalized];
                        const customLabel = customByHeader[normalized];
                        if (builtinKey) {
                            const val = parseFloat(row[colName] || 0) || 0;
                            builtinValues[builtinKey] = val;
                        } else if (customLabel) {
                            const val = parseFloat(row[colName] || 0) || 0;
                            customValues[customLabel] = val;
                        }
                    });
                    map[key] = {
                        builtin: builtinValues,
                        custom: customValues
                    };
                });
                setImportedAllowances(map);
            } catch (err) {
                console.error('Failed to parse allowances Excel', err);
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsArrayBuffer(file);
    };

    function EditableLabel({ fieldKey, defaultText }) {
        const [editing, setEditing] = useState(false);
        const [draft, setDraft] = useState(fieldLabels[fieldKey] ?? defaultText);

        useEffect(() => {
            setDraft(fieldLabels[fieldKey] ?? defaultText);
        }, [fieldLabels, fieldKey, defaultText]);

        const text = fieldLabels[fieldKey] ?? defaultText;

        if (editing) {
            return (
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                        setEditing(false);
                        const trimmed = draft.trim();
                        updateFieldLabel(fieldKey, trimmed === '' ? defaultText : trimmed);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditing(false);
                            setDraft(text);
                        }
                    }}
                    style={{ width: '100%', font: 'inherit' }}
                />
            );
        }

        return (
            <span
                onClick={() => setEditing(true)}
                style={{ cursor: 'pointer' }}
            >
                {text}
            </span>
        );
    }

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
            const d = new Date(employee.salaryDate || new Date());
            const year = d.getFullYear();
            const month = d.getMonth() + 1;
            try {
                const res = await axios.get(`/api/employees/exists?employeeId=${encodeURIComponent(employee.employeeId)}&year=${year}&month=${month}`);
                if (res.data.exists) {
                    if (lastSubmittedKey && lastSubmittedKey === submitKey && (Date.now() - lastSubmittedAt) < 8000) {
                        setLoading(false);
                        return;
                    }
                    setError('The salary for the same employee name has already been recorded for this month. Kindly verify the Employee ID');
                    setShowErrorModal(true);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error('Duplicate check failed', err);
                // Optionally block or allow if check fails? 
                // Allowing it is safer for UX if API is down, but risk of dupes.
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
        setCategory('');
        setShowAttendance(false);
        setShowSalary(false);
        setShowMoreAllowances(false);
        setShowMoreDeductions(false);
        setShowMoreReadonly(false);
        setShowAttendanceModal(false);
        setJoinDate('');
        setAttendance({
            totalLeave: 0,
            totalPermission: 0,
            permittedLeave: 0,
            absentDays: 0,
            perMonthPermittedLeave: null,
            perMonthPermissionLimit: null
        });
        setError(null);
        setShowErrorModal(false);
        setSuccess(null);
        setSalaryDirty(false);
    };

    const handleReset = () => {
        setCustomBoxValues({});
        setEmployee(prev => computeDerived({
            ...prev,
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
            professionalTax: null,
            advance: null,
            loanDeduction: null,
            salesDebits: null,
            underPerformance: null
        }));
        setSalaryDirty(false);
        setCategory('');
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

    const [joinDate, setJoinDate] = useState('');
    const [attendance, setAttendance] = useState({
        totalLeave: 0,
        totalPermission: 0,
        permittedLeave: 0,
        absentDays: 0,
        perMonthPermittedLeave: null,
        perMonthPermissionLimit: null,
    });
    const [attendanceAutoLoadedKey, setAttendanceAutoLoadedKey] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState('');

    // NEW: staged UI toggles + category
    const [showAttendance, setShowAttendance] = useState(false);
    const [showSalary, setShowSalary] = useState(false);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [showAttendanceRules, setShowAttendanceRules] = useState(false);
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

    useEffect(() => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : null);
        const empId = employee.employeeId;
        if (!monthYear || !empId) return;
        const key = `${monthYear}|${empId}`;
        const rec = importedAttendance[key];
        if (!rec) return;
        setAttendance(prev => ({
            ...prev,
            totalLeave: rec.totalLeave ?? 0,
            totalPermission: rec.totalPermission ?? 0
        }));
    }, [employee.employeeId, employee.salaryDate, selectedMonth, importedAttendance]);

    useEffect(() => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : null);
        const empId = employee.employeeId;
        if (!monthYear || !empId) return;
        const key = `${monthYear}|${empId}`;
        if (attendanceAutoLoadedKey === key) return;
        axios
            .get('/api/mobile/attendance/summary', {
                params: {
                    employeeId: empId,
                    month: monthYear,
                },
            })
            .then((res) => {
                const data = res.data || {};
                setAttendance((prev) => ({
                    ...prev,
                    totalLeave:
                        typeof data.totalLeave === 'number'
                            ? data.totalLeave
                            : prev.totalLeave || 0,
                    totalPermission:
                        typeof data.permissionsUsed === 'number'
                            ? data.permissionsUsed
                            : prev.totalPermission || 0,
                    perMonthPermissionLimit:
                        typeof data.permissionLimit === 'number'
                            ? data.permissionLimit
                            : prev.perMonthPermissionLimit,
                }));
                setAttendanceAutoLoadedKey(key);
            })
            .catch(() => {});
    }, [
        employee.employeeId,
        employee.salaryDate,
        selectedMonth,
        attendanceAutoLoadedKey,
    ]);

    useEffect(() => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : null);
        const computedPermitted = calcPermittedLeave(joinDate, monthYear);
        const basePermitted = computedPermitted;
        const allowedPaidLeaves = attendance.perMonthPermittedLeave != null ? attendance.perMonthPermittedLeave : basePermitted;

        const leaveTaken = attendance.totalLeave || 0;
        const permissionCount = attendance.totalPermission || 0;
        const permissionAllowance = attendance.perMonthPermissionLimit != null ? attendance.perMonthPermissionLimit : 3;
        const leaveAbsent = leaveTaken > allowedPaidLeaves ? (leaveTaken - allowedPaidLeaves) : 0;
        const extraPermissions = Math.max(permissionCount - permissionAllowance, 0);
        const rawPermissionAbsent = extraPermissions * 0.5;
        const permissionAbsent = leaveTaken > 0 ? rawPermissionAbsent : 0;

        const payAffectingAbsent = leaveAbsent + permissionAbsent;
        const workingDays = Math.max(30 - payAffectingAbsent, 0);
        const displayAbsent = leaveTaken + permissionAbsent;

        setAttendance((prev) => ({
            ...prev,
            permittedLeave: allowedPaidLeaves,
            absentDays: displayAbsent,
        }));

        setEmployee((prev) => ({
            ...prev,
            days: workingDays,
        }));
    }, [
        joinDate,
        selectedMonth,
        employee.salaryDate,
        attendance.totalLeave,
        attendance.totalPermission,
        attendance.perMonthPermittedLeave,
        attendance.perMonthPermissionLimit,
        calcPermittedLeave,
    ]);

    useEffect(() => {
        const monthYear = selectedMonth || (employee.salaryDate ? employee.salaryDate.slice(0, 7) : null);
        const empId = employee.employeeId;
        if (!monthYear || !empId) return;
        const key = `${monthYear}|${empId}`;
        const rec = importedAllowances[key];
        if (!rec) return;
        if (rec.builtin && typeof rec.builtin === 'object') {
            setEmployee((prev) => ({
                ...prev,
                ...rec.builtin
            }));
        }
        if (rec.custom && typeof rec.custom === 'object') {
            setCustomBoxValues((prev) => ({
                ...prev,
                ...rec.custom
            }));
        }
    }, [employee.employeeId, employee.salaryDate, selectedMonth, importedAllowances]);

    const hasMenuTarget = customMenu.open && customMenu.tabCategory && customMenu.target;
    let canMoveUp = false;
    let canMoveDown = false;
    if (hasMenuTarget) {
        if (customMenu.target.type === 'custom') {
            const empCategory = category || '';
            const listInTab = customBoxes.filter(cb =>
                cb.category === customMenu.tabCategory &&
                (!cb.employeeCategory || cb.employeeCategory === empCategory)
            );
            const idx = listInTab.findIndex(cb => cb.id === customMenu.target.id);
            if (idx > 0) {
                canMoveUp = true;
            }
            if (idx >= 0 && idx < listInTab.length - 1) {
                canMoveDown = true;
            }
        } else if (customMenu.target.type === 'builtin') {
            let order = [];
            if (customMenu.tabCategory === 'Employee') {
                order = employeeOrder;
            } else if (customMenu.tabCategory === 'Earnings') {
                order = allowanceOrder;
            } else if (customMenu.tabCategory === 'Deductions') {
                order = deductionOrder;
            }
            const idx = order.indexOf(customMenu.target.key);
            if (idx > 0) {
                canMoveUp = true;
            }
            if (idx >= 0 && idx < order.length - 1) {
                canMoveDown = true;
            }
        }
    }

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
                    <div
                        className="header-bar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 16,
                            marginBottom: 16,
                            paddingRight: 8
                        }}
                    >
                        <h2 className="section-title" style={{ margin: 0 }}>Add Salary Details</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
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
                                    aria-label="Select Category"
                                    value={category || ''}
                                    onChange={handleCategoryChange}
                                >
                                    <option value="">Select category</option>
                                    {visibleCategoryOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <select
                                    aria-label="Select Employee"
                                    value={employee.employeeId ?? ''}
                                    onChange={handleMasterSelect}
                                    disabled={!category}
                                >
                                    <option value="">Select employee</option>
                                    {filteredMastersByCategory.map(m => (
                                        <option key={m.id} value={m.employeeId}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div style={{ flexShrink: 0 }}>
                            <button
                                type="button"
                                className="btn btn-primary btn-rounded"
                                onClick={() => setShowSalary(true)}
                                style={{ marginRight: 16 }}
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
                                    { key: 'Employee', label: 'Earnings', icon: '👤' },
                                    { key: 'Earnings', label: 'Allowances', icon: '💰' },
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
                                        {employeeOrder.map((key) => {
                                            if (hiddenFields[key]) return null;
                                            return (
                                                <div key={key} className="form-item">
                                                    <label
                                                        htmlFor={key}
                                                        onContextMenu={(e) => openCustomMenu(e, 'Employee', { type: 'builtin', key })}
                                                        onMouseDown={(e) => startLongPress(e, 'Employee', { type: 'builtin', key })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Employee', { type: 'builtin', key })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        <EditableLabel fieldKey={key} defaultText={defaultFieldLabels[key] || key} />
                                                    </label>
                                                    <input
                                                        id={key}
                                                        name={key}
                                                        type="number"
                                                        value={employee[key] ?? ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {customBoxes
                                            .filter(cb =>
                                                cb.category === 'Employee' &&
                                                (!cb.employeeCategory || cb.employeeCategory === category)
                                            )
                                            .map(cb => (
                                                <div
                                                    key={cb.id}
                                                    className="form-item"
                                                >
                                                    <label
                                                        onContextMenu={(e) => openCustomMenu(e, 'Employee', { type: 'custom', id: cb.id })}
                                                        onMouseDown={(e) => startLongPress(e, 'Employee', { type: 'custom', id: cb.id })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Employee', { type: 'custom', id: cb.id })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        {cb.label}
                                                    </label>
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
                                        {allowanceOrder.map((key) => {
                                            if (hiddenFields[key]) return null;
                                            return (
                                                <div key={key} className="form-item">
                                                    <label
                                                        htmlFor={key}
                                                        onContextMenu={(e) => openCustomMenu(e, 'Earnings', { type: 'builtin', key })}
                                                        onMouseDown={(e) => startLongPress(e, 'Earnings', { type: 'builtin', key })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Earnings', { type: 'builtin', key })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        <EditableLabel fieldKey={key} defaultText={defaultFieldLabels[key] || key} />
                                                    </label>
                                                    <input
                                                        id={key}
                                                        name={key}
                                                        type="number"
                                                        value={employee[key] ?? ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {customBoxes
                                            .filter(cb =>
                                                cb.category === 'Earnings' &&
                                                (!cb.employeeCategory || cb.employeeCategory === category)
                                            )
                                            .map(cb => (
                                                <div
                                                    key={cb.id}
                                                    className="form-item"
                                                >
                                                    <label
                                                        onContextMenu={(e) => openCustomMenu(e, 'Earnings', { type: 'custom', id: cb.id })}
                                                        onMouseDown={(e) => startLongPress(e, 'Earnings', { type: 'custom', id: cb.id })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Earnings', { type: 'custom', id: cb.id })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        {cb.label}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        value={(customBoxValues[cb.label] ?? '')}
                                                        onChange={(e) => handleCustomBoxChange(cb.label, e.target.value)}
                                                    />
                                                </div>
                                            ))}


                                        <div className="form-item"><label>Other allowance</label><input type="number" readOnly aria-readonly="true" value={employee.otherAllowance?.toFixed(2) ?? '0.00'} style={{ background:'#f3f4f6', color:'#6b7280' }}/></div>
                                        <div className="form-item">
                                            <div className="btn-container btn-right">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary btn-sm"
                                                    onClick={handleDownloadAllowancesTemplate}
                                                    disabled={!masters.length}
                                                >
                                                    Download Allowances Excel
                                                </button>
                                                <label className="btn btn-outline-secondary btn-sm" style={{ marginBottom: 0 }}>
                                                    Upload Allowances Excel
                                                    <input
                                                        type="file"
                                                        accept=".xlsx,.xls"
                                                        style={{ display: 'none' }}
                                                        onChange={handleAllowancesExcelUpload}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Deductions' && (
                                    <div className="form-grid">
                                        {deductionOrder.map((key) => {
                                            if (hiddenFields[key]) return null;
                                            return (
                                                <div key={key} className="form-item">
                                                    <label
                                                        htmlFor={key}
                                                        onContextMenu={(e) => openCustomMenu(e, 'Deductions', { type: 'builtin', key })}
                                                        onMouseDown={(e) => startLongPress(e, 'Deductions', { type: 'builtin', key })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Deductions', { type: 'builtin', key })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        <EditableLabel fieldKey={key} defaultText={defaultFieldLabels[key] || key} />
                                                    </label>
                                                    <input
                                                        id={key}
                                                        name={key}
                                                        type="number"
                                                        value={employee[key] ?? ''}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            );
                                        })}
                                        {customBoxes
                                            .filter(cb =>
                                                cb.category === 'Deductions' &&
                                                (!cb.employeeCategory || cb.employeeCategory === category)
                                            )
                                            .map(cb => (
                                                <div
                                                    key={cb.id}
                                                    className="form-item"
                                                >
                                                    <label
                                                        onContextMenu={(e) => openCustomMenu(e, 'Deductions', { type: 'custom', id: cb.id })}
                                                        onMouseDown={(e) => startLongPress(e, 'Deductions', { type: 'custom', id: cb.id })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Deductions', { type: 'custom', id: cb.id })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        {cb.label}
                                                    </label>
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
                                        
                                        {customBoxes
                                            .filter(cb =>
                                                cb.category === 'Summary' &&
                                                (!cb.employeeCategory || cb.employeeCategory === category)
                                            )
                                            .map(cb => (
                                                <div
                                                    key={cb.id}
                                                    className="form-item"
                                                >
                                                    <label
                                                        onContextMenu={(e) => openCustomMenu(e, 'Summary', { type: 'custom', id: cb.id })}
                                                        onMouseDown={(e) => startLongPress(e, 'Summary', { type: 'custom', id: cb.id })}
                                                        onMouseUp={cancelLongPress}
                                                        onMouseLeave={cancelLongPress}
                                                        onTouchStart={(e) => startLongPress(e, 'Summary', { type: 'custom', id: cb.id })}
                                                        onTouchEnd={cancelLongPress}
                                                    >
                                                        {cb.label}
                                                    </label>
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
                                <div className="summary-card" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700 }}>Attendance Summary</div>
                                        <button
                                            type="button"
                                            onClick={() => setShowAttendanceRules(prev => !prev)}
                                            style={{
                                                width: 26,
                                                height: 26,
                                                borderRadius: '999px',
                                                border: '1px solid #6b7280',
                                                background: showAttendanceRules ? '#0d6efd' : 'transparent',
                                                color: showAttendanceRules ? '#ffffff' : '#374151',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: 14,
                                                cursor: 'pointer'
                                            }}
                                            aria-label="Show attendance calculation information"
                                        >
                                            !
                                        </button>
                                    </div>
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
                                            onClick={() => { setShowAttendanceRules(false); setShowAttendanceModal(true); }}
                                        >
                                            Edit Attendance
                                        </button>
                                    </div>
                                    {showAttendanceRules && (
                                        <div
                                            style={{
                                                marginTop: 12,
                                                padding: 12,
                                                background: '#f9fafb',
                                                borderRadius: 8,
                                                fontSize: 13,
                                                color: '#374151',
                                                lineHeight: 1.4
                                            }}
                                        >
                                            <div style={{ fontWeight: 600, marginBottom: 4 }}>How attendance is calculated</div>
                                            <ul style={{ paddingLeft: 18, marginBottom: 0 }}>
                                                <li>One month is treated as 30 days for salary calculation.</li>
                                                <li>Paid leave per month depends on service: less than 1 year – 0 days, 1 year – 1 day, more than 1 year – 2 days.</li>
                                                <li>Leave within the paid limit does not reduce salary.</li>
                                                <li>Leave above the paid limit is treated as absent days and reduces salary.</li>
                                                <li>Permissions/Late entries are allowed up to the monthly limit (default 3) without effect.</li>
                                                <li>Each extra permission above the limit counts as 0.5 day absent.</li>
                                                <li>Total absent days = leave taken + extra permission half‑days.</li>
                                                <li>Working days used for salary = 30 − (unpaid leave + extra permission absent).</li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={handleDownloadAttendanceTemplate}
                                        disabled={!masters.length}
                                    >
                                        Download Attendance Excel
                                    </button>
                                    <label className="btn btn-outline-secondary btn-sm" style={{ marginBottom: 0 }}>
                                        Upload Attendance Excel
                                        <input
                                            type="file"
                                            accept=".xlsx,.xls"
                                            style={{ display: 'none' }}
                                            onChange={handleAttendanceExcelUpload}
                                        />
                                    </label>
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
                                className={`btn btn-rounded ${salaryDirty ? 'btn-primary' : 'btn-outline-secondary'}`}
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
                                onClick={handleReset}
                            >
                                Reset
                            </button>
                        </div>
                        </>
                    )}
                </form>
            </div>

            {customMenu.open && (
                <>
                    <div
                        onClick={() => setCustomMenu(prev => ({ ...prev, open: false }))}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'transparent',
                            zIndex: 1500
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: customMenu.y,
                            left: customMenu.x,
                            transform: 'translate(-50%, 0)',
                            background: '#ffffff',
                            border: '1px solid #d1d5db',
                            borderRadius: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            padding: 4,
                            zIndex: 1501,
                            minWidth: 140
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            disabled={!canMoveUp}
                            onClick={() => {
                                if (!customMenu.target) return;
                                if (customMenu.target.type === 'custom') {
                                    moveCustomBoxInTab(customMenu.tabCategory, category, customMenu.target.id, -1);
                                } else if (customMenu.target.type === 'builtin') {
                                    moveBuiltinField(customMenu.tabCategory, customMenu.target.key, -1);
                                }
                            }}
                            style={{ width: '100%', justifyContent: 'flex-start', marginBottom: 4 }}
                        >
                            Move up
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm btn-light"
                            disabled={!canMoveDown}
                            onClick={() => {
                                if (!customMenu.target) return;
                                if (customMenu.target.type === 'custom') {
                                    moveCustomBoxInTab(customMenu.tabCategory, category, customMenu.target.id, 1);
                                } else if (customMenu.target.type === 'builtin') {
                                    moveBuiltinField(customMenu.tabCategory, customMenu.target.key, 1);
                                }
                            }}
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                        >
                            Move down
                        </button>
                    </div>
                </>
            )}
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
                                <label htmlFor="attendancePermission">Permission/Late Count</label>
                                <input
                                    id="attendancePermission"
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
                                <label>Absent Days</label>
                                <input
                                    type="number"
                                    readOnly
                                    aria-readonly="true"
                                    step="0.5"
                                    value={attendance.absentDays}
                                />
                            </div>

                            <div className="form-item">
                                <label>Working Days</label>
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
