package com.salaryapp.dto;

public class EmployeeMasterDTO {
    private String name;
    private Double basicSalary;

    public EmployeeMasterDTO() { }

    public EmployeeMasterDTO(String name, Double basicSalary) {
        this.name = name;
        this.basicSalary = basicSalary;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Double getBasicSalary() { return basicSalary; }
    public void setBasicSalary(Double basicSalary) { this.basicSalary = basicSalary; }
}