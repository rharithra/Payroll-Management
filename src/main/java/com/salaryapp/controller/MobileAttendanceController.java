package com.salaryapp.controller;

import com.salaryapp.service.AttendanceService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = {"/api/mobile/attendance"}, produces = MediaType.APPLICATION_JSON_VALUE)
public class MobileAttendanceController {
    private final AttendanceService attendanceService;

    public MobileAttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping(value = "/check-in", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> checkIn(@RequestBody CheckInRequest request) {
        String tenantId = currentTenantId();
        LocalDateTime ts = parseTimestamp(request.getTimestamp());
        Map<String, Object> body =
            attendanceService.checkIn(
                tenantId,
                request.getEmployeeId(),
                request.getLatitude(),
                request.getLongitude(),
                ts
            );
        return ResponseEntity.ok(body);
    }

    @GetMapping(value = "/summary")
    public ResponseEntity<Map<String, Object>> summary(
        @RequestParam String employeeId,
        @RequestParam(required = false) String month
    ) {
        String tenantId = currentTenantId();
        String monthKey = month;
        if (monthKey == null || monthKey.isBlank()) {
            LocalDate now = LocalDate.now();
            monthKey = String.format("%04d-%02d", now.getYear(), now.getMonthValue());
        }
        Map<String, Object> body = attendanceService.summary(tenantId, employeeId, monthKey);
        return ResponseEntity.ok(body);
    }

    private String currentTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        Object details = auth.getDetails();
        return details != null ? details.toString() : null;
    }

    private LocalDateTime parseTimestamp(String ts) {
        if (ts == null || ts.isBlank()) {
            return null;
        }
        try {
            return LocalDateTime.parse(ts);
        } catch (Exception ex) {
        }
        try {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
            return LocalDateTime.parse(ts, fmt);
        } catch (Exception ex) {
        }
        return null;
    }

    public static class CheckInRequest {
        private String employeeId;
        private double latitude;
        private double longitude;
        private String timestamp;

        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

        public double getLatitude() { return latitude; }
        public void setLatitude(double latitude) { this.latitude = latitude; }

        public double getLongitude() { return longitude; }
        public void setLongitude(double longitude) { this.longitude = longitude; }

        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    }
}

