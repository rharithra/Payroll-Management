package com.salaryapp.repository;

import com.salaryapp.model.EmployeeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeMasterRepository extends JpaRepository<EmployeeMaster, Long> {
    java.util.Optional<EmployeeMaster> findByName(String name);
}
