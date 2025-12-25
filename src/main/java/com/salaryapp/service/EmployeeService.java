package com.salaryapp.service;

import com.salaryapp.dto.EmployeeDTO;
import com.salaryapp.model.Employee;
import com.salaryapp.repository.EmployeeRepository;
import com.salaryapp.repository.EmployeeMasterRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {
    
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private EmployeeMasterRepository employeeMasterRepository;

    @jakarta.annotation.PostConstruct
    public void backfillSalaryMonth() {
        try {
            // Only fetch records that need update
            java.util.List<Employee> pending = employeeRepository.findBySalaryMonthIsNull();
            if (pending.isEmpty()) return;
            
            boolean changed = false;
            for (Employee e : pending) {
                if (e.getSalaryDate() != null) {
                    e.setSalaryMonth(java.time.YearMonth.from(e.getSalaryDate()).toString());
                    changed = true;
                }
            }
            if (changed) {
                employeeRepository.saveAll(pending);
            }
        } catch (Exception ignore) {
            // no-op
        }
    }
    
    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Page<EmployeeDTO> getAllEmployees(Pageable pageable) {
        return employeeRepository.findAll(pageable)
                .map(this::convertToDTO);
    }

    public List<EmployeeDTO> getEmployeesByMonth(int year, int month) {
        java.time.LocalDate start = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return employeeRepository.findAllBySalaryDateBetween(start, end).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Page<EmployeeDTO> getEmployeesByMonth(int year, int month, Pageable pageable) {
        java.time.LocalDate start = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return employeeRepository.findAllBySalaryDateBetween(start, end, pageable)
                .map(this::convertToDTO);
    }

    public boolean exists(String employeeId, int year, int month) {
        java.time.LocalDate start = java.time.LocalDate.of(year, month, 1);
        java.time.LocalDate end = start.withDayOfMonth(start.lengthOfMonth());
        return employeeRepository.existsByEmployeeIdAndSalaryDateBetween(employeeId, start, end);
    }
    
    public EmployeeDTO getEmployeeById(Long id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        return convertToDTO(employee);
    }
    
    public EmployeeDTO saveEmployee(EmployeeDTO employeeDTO) {
        Employee employee = convertToEntity(employeeDTO);
        if (employee.getStatus() == null || employee.getStatus().trim().isEmpty()) {
            employee.setStatus("DRAFT");
        }
        // Derive salaryMonth from salaryDate (YYYY-MM)
        if (employee.getSalaryDate() != null) {
            java.time.YearMonth ym = java.time.YearMonth.from(employee.getSalaryDate());
            employee.setSalaryMonth(ym.toString()); // e.g., 2025-11
        }

        // Ensure employeeId is present; if missing, try to resolve by name, else reject
        if (employee.getEmployeeId() == null || employee.getEmployeeId().trim().isEmpty()) {
            String name = employee.getName() != null ? employee.getName().trim() : null;
            if (name != null && !name.isEmpty()) {
                java.util.Optional<com.salaryapp.model.EmployeeMaster> m = employeeMasterRepository.findByName(name);
                if (m.isPresent()) {
                    employee.setEmployeeId(m.get().getEmployeeId());
                }
            }
        }
        if (employee.getEmployeeId() == null || employee.getEmployeeId().trim().isEmpty()) {
            throw new IllegalArgumentException("Please select employee from list to set Employee ID");
        }
        // Prevent duplicate salary entries by employeeId in the same month (with date-range fallback)
        if (employee.getSalaryMonth() != null || employee.getSalaryDate() != null) {
            String empId = employee.getEmployeeId().trim();
            boolean dup = false;
            if (!dup && employee.getSalaryMonth() != null) {
                dup = employeeRepository.existsByEmployeeIdAndSalaryMonth(empId, employee.getSalaryMonth());
            }
            if (!dup && employee.getSalaryDate() != null) {
                java.time.LocalDate d = employee.getSalaryDate();
                java.time.LocalDate start = d.withDayOfMonth(1);
                java.time.LocalDate end = d.withDayOfMonth(d.lengthOfMonth());
                dup = employeeRepository.existsByEmployeeIdAndSalaryDateBetween(empId, start, end);
            }
            if (dup) {
                throw new DataIntegrityViolationException("Salary already exists for this employee in this month");
            }
        }
        normalizeEmployee(employee);
        calculateSalaryComponents(employee);
        
        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDTO(savedEmployee);
    }
    
    public EmployeeDTO updateEmployee(Long id, EmployeeDTO employeeDTO) {
        Employee existingEmployee = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        
        Employee employee = convertToEntity(employeeDTO);
        employee.setId(id);
        if (employee.getStatus() == null || employee.getStatus().trim().isEmpty()) {
            employee.setStatus(existingEmployee.getStatus() == null ? "DRAFT" : existingEmployee.getStatus());
        }
        // Derive salaryMonth from salaryDate (YYYY-MM)
        if (employee.getSalaryDate() != null) {
            java.time.YearMonth ym = java.time.YearMonth.from(employee.getSalaryDate());
            employee.setSalaryMonth(ym.toString());
        }

        // Ensure employeeId present on update
        if (employee.getEmployeeId() == null || employee.getEmployeeId().trim().isEmpty()) {
            String name = employee.getName() != null ? employee.getName().trim() : null;
            if (name != null && !name.isEmpty()) {
                java.util.Optional<com.salaryapp.model.EmployeeMaster> m = employeeMasterRepository.findByName(name);
                if (m.isPresent()) {
                    employee.setEmployeeId(m.get().getEmployeeId());
                }
            }
        }
        if (employee.getEmployeeId() == null || employee.getEmployeeId().trim().isEmpty()) {
            throw new IllegalArgumentException("Please select employee from list to set Employee ID");
        }
        // Prevent duplicate salary entries by employeeId in same month on update (with date-range fallback)
        if (employee.getSalaryMonth() != null || employee.getSalaryDate() != null) {
            String empId = employee.getEmployeeId().trim();
            Employee existingSameMonth = null;
            if (employee.getSalaryMonth() != null) {
                existingSameMonth = employeeRepository.findFirstByEmployeeIdAndSalaryMonth(empId, employee.getSalaryMonth());
            }
            if (existingSameMonth == null && employee.getSalaryDate() != null) {
                java.time.LocalDate d = employee.getSalaryDate();
                java.time.LocalDate start = d.withDayOfMonth(1);
                java.time.LocalDate end = d.withDayOfMonth(d.lengthOfMonth());
                existingSameMonth = employeeRepository.findFirstByEmployeeIdAndSalaryDateBetween(empId, start, end);
            }
            if (existingSameMonth != null && !existingSameMonth.getId().equals(id)) {
                throw new DataIntegrityViolationException("Salary already exists for this employee in this month");
            }
        }
        normalizeEmployee(employee);
        calculateSalaryComponents(employee);
        
        Employee updatedEmployee = employeeRepository.save(employee);
        return convertToDTO(updatedEmployee);
    }
    
    public void deleteEmployee(Long id) {
        employeeRepository.deleteById(id);
    }

    public EmployeeDTO submitForApproval(Long id) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        e.setStatus("SUBMITTED");
        Employee saved = employeeRepository.save(e);
        return convertToDTO(saved);
    }

    public EmployeeDTO approve(Long id) {
        Employee e = employeeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Employee not found with id: " + id));
        e.setStatus("APPROVED");
        Employee saved = employeeRepository.save(e);
        return convertToDTO(saved);
    }
    
    private void calculateSalaryComponents(Employee employee) {
        double basic = safe(employee.getBasicSalary());

        // Keep user-provided HRA; auto-calc only if missing
        if (employee.getHra() == null) {
            employee.setHra(basic > 0 ? basic * 0.3 : 0.0);
        }

        double computedOtherAllowance =
                safe(employee.getDearnessAllowance()) +
                safe(employee.getLeads()) +
                safe(employee.getPerCall()) +
                safe(employee.getAreaAllowance()) +
                safe(employee.getOs()) +
                safe(employee.getRoadshow()) +
                safe(employee.getReview()) +
                safe(employee.getDresscode()) +
                safe(employee.getAttendanceAllowance()) +
                safe(employee.getArrears()) +
                safe(employee.getBonus()) +
                safe(employee.getCustomAllowanceAmount()); // Add custom earnings
        employee.setOtherAllowance(computedOtherAllowance);

        double computedOtherDeduction =
                safe(employee.getAdvance()) +
                safe(employee.getSalesDebits()) +
                safe(employee.getUnderPerformance()) +
                safe(employee.getCustomDeductionAmount()); // Add custom deductions
        employee.setOtherDeduction(computedOtherDeduction);

        double grossSalary = basic
                + safe(employee.getHra())
                + safe(employee.getConveyanceAllowance())
                + safe(employee.getSpecialAllowance())
                + safe(employee.getPerformanceIncentive())
                + safe(employee.getOtherAllowance());
        employee.setGrossSalary(grossSalary);

        double totalDeduction =
                safe(employee.getProfessionalTax())
                + safe(employee.getIncomeTax())
                + safe(employee.getProvidentFund())
                + safe(employee.getLoanDeduction())
                + safe(employee.getOtherDeduction());
        employee.setTotalDeduction(totalDeduction);
        employee.setNetSalary(grossSalary - totalDeduction);
    }

    private void normalizeEmployee(Employee e) {
        e.setBasicSalary(e.getBasicSalary() != null ? e.getBasicSalary() : 0.0);
        e.setHra(e.getHra() != null ? e.getHra() : null); // allow auto-calc if null
        e.setConveyanceAllowance(e.getConveyanceAllowance() != null ? e.getConveyanceAllowance() : 0.0);
        e.setSpecialAllowance(e.getSpecialAllowance() != null ? e.getSpecialAllowance() : 0.0);
        e.setPerformanceIncentive(e.getPerformanceIncentive() != null ? e.getPerformanceIncentive() : 0.0);

        // Defaults for new fields
        e.setDays(e.getDays() != null ? e.getDays() : 0.0);
        e.setDearnessAllowance(e.getDearnessAllowance() != null ? e.getDearnessAllowance() : 0.0);
        e.setLeads(e.getLeads() != null ? e.getLeads() : 0.0);
        e.setPerCall(e.getPerCall() != null ? e.getPerCall() : 0.0);
        e.setAreaAllowance(e.getAreaAllowance() != null ? e.getAreaAllowance() : 0.0);
        e.setOs(e.getOs() != null ? e.getOs() : 0.0);
        e.setRoadshow(e.getRoadshow() != null ? e.getRoadshow() : 0.0);
        e.setReview(e.getReview() != null ? e.getReview() : 0.0);
        e.setDresscode(e.getDresscode() != null ? e.getDresscode() : 0.0);
        e.setAttendanceAllowance(e.getAttendanceAllowance() != null ? e.getAttendanceAllowance() : 0.0);
        e.setArrears(e.getArrears() != null ? e.getArrears() : 0.0);
        e.setBonus(e.getBonus() != null ? e.getBonus() : 0.0);

        e.setProfessionalTax(e.getProfessionalTax() != null ? e.getProfessionalTax() : 0.0);
        e.setIncomeTax(e.getIncomeTax() != null ? e.getIncomeTax() : 0.0);
        e.setProvidentFund(e.getProvidentFund() != null ? e.getProvidentFund() : 0.0);
        e.setLoanDeduction(e.getLoanDeduction() != null ? e.getLoanDeduction() : 0.0);

        e.setSalesDebits(e.getSalesDebits() != null ? e.getSalesDebits() : 0.0);
        e.setUnderPerformance(e.getUnderPerformance() != null ? e.getUnderPerformance() : 0.0);
        e.setAdvance(e.getAdvance() != null ? e.getAdvance() : 0.0);
        
        e.setCustomAllowanceAmount(e.getCustomAllowanceAmount() != null ? e.getCustomAllowanceAmount() : 0.0);
        e.setCustomDeductionAmount(e.getCustomDeductionAmount() != null ? e.getCustomDeductionAmount() : 0.0);
    }
    
    private double safe(Double val) {
        return val != null ? val : 0.0;
    }
    
    private EmployeeDTO convertToDTO(Employee employee) {
        EmployeeDTO employeeDTO = new EmployeeDTO();
        BeanUtils.copyProperties(employee, employeeDTO);
        return employeeDTO;
    }
    
    private Employee convertToEntity(EmployeeDTO employeeDTO) {
        Employee employee = new Employee();
        BeanUtils.copyProperties(employeeDTO, employee);
        return employee;
    }
}
