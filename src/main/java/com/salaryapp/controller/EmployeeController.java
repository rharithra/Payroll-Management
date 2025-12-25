package com.salaryapp.controller;

import com.salaryapp.dto.EmployeeDTO;

import com.salaryapp.service.EmployeeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping(value = {"/api/employees", "/employees"}, produces = MediaType.APPLICATION_JSON_VALUE)
public class EmployeeController {
    private static final org.slf4j.Logger log =
            org.slf4j.LoggerFactory.getLogger(EmployeeController.class);

    @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", "UP");
        body.put("time", java.time.Instant.now().toString());
        return ResponseEntity.ok(body);
    }
    public EmployeeController() {
        super();
    }
    
    @Autowired
    private EmployeeService employeeService;
    
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllEmployees(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        if (page != null && size != null) {
            Pageable pageable = PageRequest.of(page, size);
            if (year != null && month != null) {
                return ResponseEntity.ok(employeeService.getEmployeesByMonth(year, month, pageable));
            } else {
                return ResponseEntity.ok(employeeService.getAllEmployees(pageable));
            }
        }

        List<EmployeeDTO> list;
        if (year != null && month != null) {
            list = employeeService.getEmployeesByMonth(year, month);
        } else {
            list = employeeService.getAllEmployees();
        }
        log.info("/api/employees size={}", list != null ? list.size() : 0);
        return ResponseEntity.ok(list);
    }

    @GetMapping(value = "/exists", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Map<String, Boolean>> checkExists(
            @RequestParam String employeeId,
            @RequestParam int year,
            @RequestParam int month
    ) {
        boolean exists = employeeService.exists(employeeId, year, month);
        return ResponseEntity.ok(java.util.Collections.singletonMap("exists", exists));
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeDTO> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeDTO> create(@RequestBody EmployeeDTO employee) {
        EmployeeDTO saved = employeeService.saveEmployee(employee);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .contentType(MediaType.APPLICATION_JSON)
                .body(saved);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeDTO> update(@PathVariable Long id, @RequestBody EmployeeDTO employee) {
        EmployeeDTO existing = employeeService.getEmployeeById(id);
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isEmployee = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
        if (isEmployee && "APPROVED".equalsIgnoreCase(existing.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(existing);
        }
        EmployeeDTO updated = employeeService.updateEmployee(id, employee);
        return ResponseEntity
                .ok()
                .contentType(MediaType.APPLICATION_JSON)
                .body(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isEmployee = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE"));
        EmployeeDTO existing = employeeService.getEmployeeById(id);
        if (isEmployee && existing != null && "APPROVED".equalsIgnoreCase(existing.getStatus())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/{id}/submit", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeDTO> submit(@PathVariable Long id) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean ok = auth != null && (auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_EMPLOYEE") || a.getAuthority().equals("ROLE_ADMIN")));
        if (!ok) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(employeeService.submitForApproval(id));
    }

    @PostMapping(value = "/{id}/approve", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeDTO> approve(@PathVariable Long id) {
        Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (!isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(employeeService.approve(id));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        log.error("/api/employees error", ex);
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getClass().getSimpleName());
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
