package com.salaryapp.controller;

import com.salaryapp.model.EmployeeMaster;
import com.salaryapp.repository.EmployeeMasterRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value = {"/api/master", "/master", "/api/employee-masters"}, produces = MediaType.APPLICATION_JSON_VALUE)
public class EmployeeMasterController {

    private final EmployeeMasterRepository repo;

    public EmployeeMasterController(EmployeeMasterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeMaster>> list() {
        String tenantId = currentTenantId();
        return ResponseEntity.ok(repo.findAllByTenantId(tenantId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeMaster> get(@PathVariable Long id) {
        String tenantId = currentTenantId();
        Optional<EmployeeMaster> found = repo.findByIdAndTenantId(id, tenantId);
        return found.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeMaster> create(@RequestBody EmployeeMaster master) {
        if (master.getName() == null || master.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (master.getEmployeeId() == null || master.getEmployeeId().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        master.setEmployeeId(master.getEmployeeId().trim());

        if (master.getBasicSalary() == null) {
            master.setBasicSalary(0.0);
        }
        master.setTenantId(currentTenantId());
        EmployeeMaster saved = repo.save(master);
        return ResponseEntity.ok(saved);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeMaster> update(@PathVariable Long id, @RequestBody EmployeeMaster master) {
        String tenantId = currentTenantId();
        Optional<EmployeeMaster> existing = repo.findByIdAndTenantId(id, tenantId);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        if (master.getEmployeeId() == null || master.getEmployeeId().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        master.setId(id);
        master.setEmployeeId(master.getEmployeeId().trim());
        if (master.getBasicSalary() == null) {
            master.setBasicSalary(0.0);
        }
        master.setTenantId(tenantId);
        EmployeeMaster saved = repo.save(master);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        String tenantId = currentTenantId();
        Optional<EmployeeMaster> existing = repo.findByIdAndTenantId(id, tenantId);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private String currentTenantId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        Object details = auth.getDetails();
        return details != null ? details.toString() : null;
    }
}
