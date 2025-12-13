package com.salaryapp.controller;

import com.salaryapp.model.EmployeeMaster;
import com.salaryapp.repository.EmployeeMasterRepository;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping(value = "/api/employee-masters", produces = MediaType.APPLICATION_JSON_VALUE)
public class EmployeeMasterController {

    private final EmployeeMasterRepository repo;

    public EmployeeMasterController(EmployeeMasterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<List<EmployeeMaster>> list() {
        return ResponseEntity.ok(repo.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeMaster> get(@PathVariable Long id) {
        Optional<EmployeeMaster> found = repo.findById(id);
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
        EmployeeMaster saved = repo.save(master);
        return ResponseEntity.ok(saved);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<EmployeeMaster> update(@PathVariable Long id, @RequestBody EmployeeMaster master) {
        Optional<EmployeeMaster> existing = repo.findById(id);
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
        EmployeeMaster saved = repo.save(master);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}