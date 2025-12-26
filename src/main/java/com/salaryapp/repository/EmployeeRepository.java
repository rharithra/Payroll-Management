package com.salaryapp.repository;

import com.salaryapp.model.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    boolean existsByEmployeeIdAndSalaryDateBetween(String employeeId, LocalDate start, LocalDate end);
    com.salaryapp.model.Employee findFirstByEmployeeIdAndSalaryDateBetween(String employeeId, LocalDate start, LocalDate end);

    boolean existsByEmployeeIdAndSalaryMonth(String employeeId, String salaryMonth);
    com.salaryapp.model.Employee findFirstByEmployeeIdAndSalaryMonth(String employeeId, String salaryMonth);

    boolean existsByNameAndSalaryMonth(String name, String salaryMonth);
    com.salaryapp.model.Employee findFirstByNameAndSalaryMonth(String name, String salaryMonth);

    boolean existsByNameAndSalaryDateBetween(String name, LocalDate start, LocalDate end);
    com.salaryapp.model.Employee findFirstByNameAndSalaryDateBetween(String name, LocalDate start, LocalDate end);

    java.util.List<com.salaryapp.model.Employee> findAllBySalaryDateBetween(LocalDate start, LocalDate end);
    Page<com.salaryapp.model.Employee> findAllBySalaryDateBetween(LocalDate start, LocalDate end, Pageable pageable);
    
    java.util.List<com.salaryapp.model.Employee> findBySalaryMonthIsNull();
}
