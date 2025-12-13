package com.salaryapp.dto;

import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EmployeeDTO {
    private Long id;
    private String name;
    private String department;
    private String designation;

    private Double basicSalary;
    private Double hra;
    private Double conveyanceAllowance;
    private Double specialAllowance;
    private Double performanceIncentive;
    private Double otherAllowance;
    private Double grossSalary;

    private Double professionalTax;
    private Double incomeTax;
    private Double providentFund;
    private Double loanDeduction;
    private Double otherDeduction;
    private Double totalDeduction;

    private Double netSalary;
    private LocalDate salaryDate;

    private String employeeId;
    private String role;
    private Double experience;

    // NEW: fields to match UI and entity
    private Double days;
    private Double dearnessAllowance;
    private Double leads;
    private Double perCall;
    private Double areaAllowance;
    private Double os;
    private Double roadshow;
    private Double review;
    private Double dresscode;
    private Double attendanceAllowance;
    private Double arrears;
    private Double bonus;
    private Double salesDebits;
    private Double underPerformance;
    private Double advance;
    private String status;

    public EmployeeDTO() {}

    public EmployeeDTO(Long id, String name, String department, String designation,
                       Double basicSalary, Double hra, Double conveyanceAllowance,
                       Double specialAllowance, Double performanceIncentive, Double otherAllowance,
                       Double grossSalary, Double professionalTax, Double incomeTax,
                       Double providentFund, Double loanDeduction, Double otherDeduction,
                       Double totalDeduction, Double netSalary, LocalDate salaryDate,
                       String employeeId, String role, Double experience) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.designation = designation;
        this.basicSalary = basicSalary;
        this.hra = hra;
        this.conveyanceAllowance = conveyanceAllowance;
        this.specialAllowance = specialAllowance;
        this.performanceIncentive = performanceIncentive;
        this.otherAllowance = otherAllowance;
        this.grossSalary = grossSalary;
        this.professionalTax = professionalTax;
        this.incomeTax = incomeTax;
        this.providentFund = providentFund;
        this.loanDeduction = loanDeduction;
        this.otherDeduction = otherDeduction;
        this.totalDeduction = totalDeduction;
        this.netSalary = netSalary;
        this.salaryDate = salaryDate;
        this.employeeId = employeeId;
        this.role = role;
        this.experience = experience;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public Double getBasicSalary() { return basicSalary; }
    public void setBasicSalary(Double basicSalary) { this.basicSalary = basicSalary; }

    public Double getHra() { return hra; }
    public void setHra(Double hra) { this.hra = hra; }

    public Double getConveyanceAllowance() { return conveyanceAllowance; }
    public void setConveyanceAllowance(Double conveyanceAllowance) { this.conveyanceAllowance = conveyanceAllowance; }

    public Double getSpecialAllowance() { return specialAllowance; }
    public void setSpecialAllowance(Double specialAllowance) { this.specialAllowance = specialAllowance; }

    public Double getPerformanceIncentive() { return performanceIncentive; }
    public void setPerformanceIncentive(Double performanceIncentive) { this.performanceIncentive = performanceIncentive; }

    public Double getOtherAllowance() { return otherAllowance; }
    public void setOtherAllowance(Double otherAllowance) { this.otherAllowance = otherAllowance; }

    public Double getGrossSalary() { return grossSalary; }
    public void setGrossSalary(Double grossSalary) { this.grossSalary = grossSalary; }

    public Double getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(Double professionalTax) { this.professionalTax = professionalTax; }

    public Double getIncomeTax() { return incomeTax; }
    public void setIncomeTax(Double incomeTax) { this.incomeTax = incomeTax; }

    public Double getProvidentFund() { return providentFund; }
    public void setProvidentFund(Double providentFund) { this.providentFund = providentFund; }

    public Double getLoanDeduction() { return loanDeduction; }
    public void setLoanDeduction(Double loanDeduction) { this.loanDeduction = loanDeduction; }

    public Double getOtherDeduction() { return otherDeduction; }
    public void setOtherDeduction(Double otherDeduction) { this.otherDeduction = otherDeduction; }

    public Double getTotalDeduction() { return totalDeduction; }
    public void setTotalDeduction(Double totalDeduction) { this.totalDeduction = totalDeduction; }

    public Double getNetSalary() { return netSalary; }
    public void setNetSalary(Double netSalary) { this.netSalary = netSalary; }

    public LocalDate getSalaryDate() { return salaryDate; }
    public void setSalaryDate(LocalDate salaryDate) { this.salaryDate = salaryDate; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Double getExperience() { return experience; }
    public void setExperience(Double experience) { this.experience = experience; }

    // NEW: getters/setters for added fields
    public Double getDays() { return days; }
    public void setDays(Double days) { this.days = days; }

    public Double getDearnessAllowance() { return dearnessAllowance; }
    public void setDearnessAllowance(Double dearnessAllowance) { this.dearnessAllowance = dearnessAllowance; }

    public Double getLeads() { return leads; }
    public void setLeads(Double leads) { this.leads = leads; }

    public Double getPerCall() { return perCall; }
    public void setPerCall(Double perCall) { this.perCall = perCall; }

    public Double getAreaAllowance() { return areaAllowance; }
    public void setAreaAllowance(Double areaAllowance) { this.areaAllowance = areaAllowance; }

    public Double getOs() { return os; }
    public void setOs(Double os) { this.os = os; }

    public Double getRoadshow() { return roadshow; }
    public void setRoadshow(Double roadshow) { this.roadshow = roadshow; }

    public Double getReview() { return review; }
    public void setReview(Double review) { this.review = review; }

    public Double getDresscode() { return dresscode; }
    public void setDresscode(Double dresscode) { this.dresscode = dresscode; }

    public Double getAttendanceAllowance() { return attendanceAllowance; }
    public void setAttendanceAllowance(Double attendanceAllowance) { this.attendanceAllowance = attendanceAllowance; }

    public Double getArrears() { return arrears; }
    public void setArrears(Double arrears) { this.arrears = arrears; }

    public Double getBonus() { return bonus; }
    public void setBonus(Double bonus) { this.bonus = bonus; }

    public Double getSalesDebits() { return salesDebits; }
    public void setSalesDebits(Double salesDebits) { this.salesDebits = salesDebits; }

    public Double getUnderPerformance() { return underPerformance; }
    public void setUnderPerformance(Double underPerformance) { this.underPerformance = underPerformance; }

    public Double getAdvance() { return advance; }
    public void setAdvance(Double advance) { this.advance = advance; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}