package com.salaryapp.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "attendance_records",
    indexes = {
        @Index(name = "idx_attendance_tenant_employee_date", columnList = "tenantId,employeeId,date"),
        @Index(name = "idx_attendance_month", columnList = "monthKey")
    }
)
public class AttendanceRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64)
    private String tenantId;

    @Column(length = 64)
    private String employeeId;

    private LocalDate date;

    private LocalDateTime checkInTime;

    private Double latitude;

    private Double longitude;

    private Boolean withinFence;

    private Integer lateMinutes;

    @Column(length = 32)
    private String status;

    private Boolean permissionUsed;

    @Column(length = 7)
    private String monthKey;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Boolean getWithinFence() { return withinFence; }
    public void setWithinFence(Boolean withinFence) { this.withinFence = withinFence; }

    public Integer getLateMinutes() { return lateMinutes; }
    public void setLateMinutes(Integer lateMinutes) { this.lateMinutes = lateMinutes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Boolean getPermissionUsed() { return permissionUsed; }
    public void setPermissionUsed(Boolean permissionUsed) { this.permissionUsed = permissionUsed; }

    public String getMonthKey() { return monthKey; }
    public void setMonthKey(String monthKey) { this.monthKey = monthKey; }
}

