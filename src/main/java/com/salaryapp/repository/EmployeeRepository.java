package com.salaryapp.repository;

import com.salaryapp.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmployeeIdAndSalaryDateBetween(String employeeId, LocalDate start, LocalDate end);
    Employee findFirstByEmployeeIdAndSalaryDateBetween(String employeeId, LocalDate start, LocalDate end);

    boolean existsByEmployeeIdAndSalaryMonth(String employeeId, String salaryMonth);
    Employee findFirstByEmployeeIdAndSalaryMonth(String employeeId, String salaryMonth);

    boolean existsByNameAndSalaryMonth(String name, String salaryMonth);
    Employee findFirstByNameAndSalaryMonth(String name, String salaryMonth);

    boolean existsByNameAndSalaryDateBetween(String name, LocalDate start, LocalDate end);
    Employee findFirstByNameAndSalaryDateBetween(String name, LocalDate start, LocalDate end);
}
