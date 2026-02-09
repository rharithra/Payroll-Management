package com.salaryapp.repository;

import com.salaryapp.model.AttendanceRecord;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    Optional<AttendanceRecord> findByTenantIdAndEmployeeIdAndDate(String tenantId, String employeeId, LocalDate date);
    List<AttendanceRecord> findAllByTenantIdAndEmployeeIdAndMonthKey(String tenantId, String employeeId, String monthKey);
}

