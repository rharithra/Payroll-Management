package com.salaryapp.repository;

import com.salaryapp.model.CustomComponent;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CustomComponentRepository extends JpaRepository<CustomComponent, Long> {
    List<CustomComponent> findAllByTenantId(String tenantId);

    List<CustomComponent> findAllByTenantIdOrderByDisplayOrderAscIdAsc(String tenantId);

    Optional<CustomComponent> findByIdAndTenantId(Long id, String tenantId);

    boolean existsByTenantIdAndLabelAndCategoryAndEmployeeCategory(
        String tenantId,
        String label,
        String category,
        String employeeCategory
    );
}
