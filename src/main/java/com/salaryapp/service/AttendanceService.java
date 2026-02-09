package com.salaryapp.service;

import com.salaryapp.model.AttendanceRecord;
import com.salaryapp.model.GeoFence;
import com.salaryapp.model.EmployeeMaster;
import com.salaryapp.repository.AttendanceRecordRepository;
import com.salaryapp.repository.GeoFenceRepository;
import com.salaryapp.repository.EmployeeMasterRepository;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class AttendanceService {
    private final AttendanceRecordRepository attendanceRepository;
    private final GeoFenceRepository geoFenceRepository;
    private final EmployeeMasterRepository employeeMasterRepository;

    public AttendanceService(
        AttendanceRecordRepository attendanceRepository,
        GeoFenceRepository geoFenceRepository,
        EmployeeMasterRepository employeeMasterRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.geoFenceRepository = geoFenceRepository;
        this.employeeMasterRepository = employeeMasterRepository;
    }

    public Map<String, Object> checkIn(
        String tenantId,
        String employeeId,
        double latitude,
        double longitude,
        LocalDateTime timestamp
    ) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Missing tenant");
        }
        if (employeeId == null || employeeId.isBlank()) {
            throw new IllegalArgumentException("Missing employeeId");
        }
        LocalDateTime now = timestamp != null ? timestamp : LocalDateTime.now();
        LocalDate date = now.toLocalDate();
        String monthKey = String.format("%04d-%02d", date.getYear(), date.getMonthValue());

        Optional<AttendanceRecord> existingOpt =
            attendanceRepository.findByTenantIdAndEmployeeIdAndDate(tenantId, employeeId, date);
        if (existingOpt.isPresent()) {
            AttendanceRecord existing = existingOpt.get();
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", existing.getStatus());
            resp.put("permissionUsed", existing.getPermissionUsed() != null && existing.getPermissionUsed());
            resp.put("lateMinutes", existing.getLateMinutes() != null ? existing.getLateMinutes() : 0);
            Map<String, Object> monthInfo = computeMonthlySummary(tenantId, employeeId, monthKey);
            resp.putAll(monthInfo);
            resp.put("alreadyMarked", true);
            return resp;
        }

        boolean withinFence = isWithinFence(tenantId, latitude, longitude);
        if (!withinFence) {
            throw new IllegalArgumentException("Outside geo-fence");
        }

        LocalTime checkTime = now.toLocalTime();
        LocalTime shiftStart = LocalTime.of(9, 0);
        LocalTime graceEnd = LocalTime.of(9, 15);

        int lateMinutes;
        if (!checkTime.isAfter(graceEnd)) {
            lateMinutes = 0;
        } else {
            lateMinutes = (int) Duration.between(graceEnd, checkTime).toMinutes();
        }

        Optional<EmployeeMaster> masterOpt =
            employeeMasterRepository.findByEmployeeIdAndTenantId(employeeId, tenantId);
        int permissionLimit = 3;
        if (masterOpt.isPresent()) {
            EmployeeMaster m = masterOpt.get();
            if (m.getPermissionLimit() != null && m.getPermissionLimit() > 0) {
                permissionLimit = m.getPermissionLimit();
            }
        }

        Map<String, Object> monthInfoBefore = computeMonthlySummary(tenantId, employeeId, monthKey);
        int permissionsUsed = (int) monthInfoBefore.get("permissionsUsed");

        String status;
        boolean permissionUsed;
        double leaveImpact;

        if (lateMinutes <= 0) {
            status = "PRESENT";
            permissionUsed = false;
            leaveImpact = 0.0;
        } else if (lateMinutes <= 60) {
            if (permissionsUsed < permissionLimit) {
                status = "PRESENT";
                permissionUsed = true;
                leaveImpact = 0.0;
            } else {
                status = "HALF_DAY";
                permissionUsed = false;
                leaveImpact = 0.5;
            }
        } else {
            status = "FULL_DAY_ABSENT";
            permissionUsed = false;
            leaveImpact = 1.0;
        }

        AttendanceRecord record = new AttendanceRecord();
        record.setTenantId(tenantId);
        record.setEmployeeId(employeeId);
        record.setDate(date);
        record.setMonthKey(monthKey);
        record.setCheckInTime(now);
        record.setLatitude(latitude);
        record.setLongitude(longitude);
        record.setWithinFence(true);
        record.setLateMinutes(lateMinutes);
        record.setStatus(status);
        record.setPermissionUsed(permissionUsed);

        attendanceRepository.save(record);

        Map<String, Object> monthInfoAfter = computeMonthlySummary(tenantId, employeeId, monthKey);
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", status);
        resp.put("permissionUsed", permissionUsed);
        resp.put("lateMinutes", lateMinutes);
        resp.putAll(monthInfoAfter);
        resp.put("leaveImpactForDay", leaveImpact);
        resp.put("alreadyMarked", false);
        return resp;
    }

    public Map<String, Object> summary(String tenantId, String employeeId, String monthKey) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Missing tenant");
        }
        if (employeeId == null || employeeId.isBlank()) {
            throw new IllegalArgumentException("Missing employeeId");
        }
        if (monthKey == null || monthKey.isBlank()) {
            LocalDate now = LocalDate.now();
            monthKey = String.format("%04d-%02d", now.getYear(), now.getMonthValue());
        }
        Map<String, Object> result = computeMonthlySummary(tenantId, employeeId, monthKey);

        Optional<EmployeeMaster> masterOpt =
            employeeMasterRepository.findByEmployeeIdAndTenantId(employeeId, tenantId);
        int permissionLimit = 3;
        if (masterOpt.isPresent()) {
            EmployeeMaster m = masterOpt.get();
            if (m.getPermissionLimit() != null && m.getPermissionLimit() > 0) {
                permissionLimit = m.getPermissionLimit();
            }
        }

        result.put("permissionLimit", permissionLimit);
        return result;
    }

    private Map<String, Object> computeMonthlySummary(String tenantId, String employeeId, String monthKey) {
        List<AttendanceRecord> list =
            attendanceRepository.findAllByTenantIdAndEmployeeIdAndMonthKey(tenantId, employeeId, monthKey);
        int permissionsUsed = 0;
        double totalLeave = 0.0;
        for (AttendanceRecord r : list) {
            if (Boolean.TRUE.equals(r.getPermissionUsed())) {
                permissionsUsed++;
            }
            String st = r.getStatus();
            if ("HALF_DAY".equals(st)) {
                totalLeave += 0.5;
            } else if ("FULL_DAY_ABSENT".equals(st)) {
                totalLeave += 1.0;
            }
        }
        Map<String, Object> map = new HashMap<>();
        map.put("permissionsUsed", permissionsUsed);
        map.put("totalLeave", totalLeave);
        map.put("monthKey", monthKey);
        return map;
    }

    private boolean isWithinFence(String tenantId, double lat, double lng) {
        Optional<GeoFence> fenceOpt = geoFenceRepository.findFirstByTenantIdAndActiveTrue(tenantId);
        if (fenceOpt.isEmpty()) {
            return true;
        }
        GeoFence f = fenceOpt.get();
        if (f.getCenterLat() == null || f.getCenterLng() == null || f.getRadiusMeters() == null) {
            return true;
        }
        double distance = haversineMeters(lat, lng, f.getCenterLat(), f.getCenterLng());
        return distance <= f.getRadiusMeters();
    }

    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        double r = 6371000.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                    * Math.cos(Math.toRadians(lat2))
                    * Math.sin(dLon / 2)
                    * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return r * c;
    }
}

