package com.salaryapp.repository;

import com.salaryapp.model.EmployeeMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmployeeMasterRepository extends JpaRepository<EmployeeMaster, Long> {
    java.util.Optional<EmployeeMaster> findByName(String name);
    java.util.Optional<EmployeeMaster> findByNameAndTenantId(String name, String tenantId);
    java.util.List<EmployeeMaster> findAllByTenantId(String tenantId);
    java.util.Optional<EmployeeMaster> findByIdAndTenantId(Long id, String tenantId);
}
