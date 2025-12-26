package com.salaryapp.controller;

import com.salaryapp.dto.LoginRequest;
import com.salaryapp.dto.RegisterRequest;
import com.salaryapp.model.AppUser;
import com.salaryapp.repository.AppUserRepository;
import com.salaryapp.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "https://harithra.in", allowCredentials = "true")
@RequestMapping(value = {"/api/auth", "/auth"}, produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    @Autowired
    public AuthController(AppUserRepository users, PasswordEncoder encoder, JwtTokenProvider jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping(value = "/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register attempt: username={}", request.getUsername());
        
        if (users.existsByUsername(request.getUsername())) {
            return ResponseEntity.status(409).body(Map.of("error", "Username already exists"));
        }
        AppUser u = new AppUser();
        u.setUsername(request.getUsername());
        u.setPassword(encoder.encode(request.getPassword()));
        u.setRole(request.getRole() != null ? request.getRole().toUpperCase() : "EMPLOYEE");
        users.save(u);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        Optional<AppUser> found = users.findByUsername(request.getUsername());
        if (found.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        AppUser u = found.get();
        if (!encoder.matches(request.getPassword(), u.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return ResponseEntity.ok(Map.of("token", token, "role", u.getRole()));
    }
}
