package com.salaryapp.controller;

import com.salaryapp.model.CustomComponent;
import com.salaryapp.repository.CustomComponentRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = "/api/custom-components", produces = MediaType.APPLICATION_JSON_VALUE)
public class CustomComponentController {

    private final CustomComponentRepository repository;

    public CustomComponentController(CustomComponentRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<CustomComponent>> list() {
        String tenantId = currentTenantId();
        List<CustomComponent> items = repository.findAllByTenantId(tenantId);
        return ResponseEntity.ok(items);
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CustomComponent> create(@RequestBody CustomComponent input) {
        String tenantId = currentTenantId();
        if (input.getLabel() == null || input.getLabel().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        String label = input.getLabel().trim();
        String category = input.getCategory() == null ? "Earnings" : input.getCategory().trim();
        String employeeCategory = input.getEmployeeCategory() == null ? "" : input.getEmployeeCategory().trim();

        boolean exists = repository.existsByTenantIdAndLabelAndCategoryAndEmployeeCategory(
            tenantId,
            label,
            category,
            employeeCategory
        );
        if (exists) {
            return ResponseEntity.status(409).build();
        }

        CustomComponent entity = new CustomComponent();
        entity.setLabel(label);
        entity.setCategory(category);
        entity.setEmployeeCategory(employeeCategory);
        entity.setTenantId(tenantId);

        CustomComponent saved = repository.save(entity);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        String tenantId = currentTenantId();
        Optional<CustomComponent> existing = repository.findByIdAndTenantId(id, tenantId);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
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

