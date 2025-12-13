package com.salaryapp.controller;

import com.salaryapp.model.AppUser;
import com.salaryapp.repository.AppUserRepository;
import com.salaryapp.security.JwtTokenProvider;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping(value = {"/api/auth", "/auth"}, produces = MediaType.APPLICATION_JSON_VALUE)
public class AuthController {
    private final AppUserRepository users;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;

    public AuthController(AppUserRepository users, PasswordEncoder encoder, JwtTokenProvider jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping(value = "/register", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        String username = String.valueOf(body.get("username")).trim();
        String password = String.valueOf(body.get("password"));
        String role = String.valueOf(body.getOrDefault("role", "EMPLOYEE")).toUpperCase();
        if (username.isEmpty() || password.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (users.existsByUsername(username)) {
            return ResponseEntity.status(409).build();
        }
        AppUser u = new AppUser();
        u.setUsername(username);
        u.setPassword(encoder.encode(password));
        u.setRole(role);
        users.save(u);
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        String username = String.valueOf(body.get("username")).trim();
        String password = String.valueOf(body.get("password"));
        Optional<AppUser> found = users.findByUsername(username);
        if (found.isEmpty()) {
            return ResponseEntity.status(401).build();
        }
        AppUser u = found.get();
        if (!encoder.matches(password, u.getPassword())) {
            return ResponseEntity.status(401).build();
        }
        String token = jwt.createToken(u.getUsername(), u.getRole());
        return ResponseEntity.ok(Map.of("token", token, "role", u.getRole()));
    }
}
