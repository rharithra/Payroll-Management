package com.salaryapp.repository;

import com.salaryapp.model.GeoFence;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GeoFenceRepository extends JpaRepository<GeoFence, Long> {
    Optional<GeoFence> findFirstByTenantIdAndActiveTrue(String tenantId);
}

