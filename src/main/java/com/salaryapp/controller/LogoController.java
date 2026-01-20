package com.salaryapp.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/logo")
public class LogoController {

    private Path configDir() {
        return Paths.get("Config");
    }

    private Path[] candidatePaths() {
        Path dir = configDir();
        return new Path[]{
                dir.resolve("logo.png"),
                dir.resolve("logo.jpg"),
                dir.resolve("logo.jpeg"),
                dir.resolve("Logo.PNG")
        };
    }

    @GetMapping
    public ResponseEntity<byte[]> getLogo() throws IOException {
        for (Path p : candidatePaths()) {
            if (Files.exists(p)) {
                String ct = Files.probeContentType(p);
                if (ct == null) {
                    String name = p.getFileName().toString().toLowerCase();
                    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
                        ct = MediaType.IMAGE_JPEG_VALUE;
                    } else {
                        ct = MediaType.IMAGE_PNG_VALUE;
                    }
                }
                byte[] bytes = Files.readAllBytes(p);
                return ResponseEntity
                        .ok()
                        .contentType(MediaType.parseMediaType(ct))
                        .body(bytes);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadLogo(@RequestParam("file") MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty file"));
        }

        String originalName = file.getOriginalFilename();
        String lowerName = originalName != null ? originalName.toLowerCase() : "";
        String contentType = file.getContentType() != null ? file.getContentType() : "";

        boolean isPng = contentType.equals(MediaType.IMAGE_PNG_VALUE) || lowerName.endsWith(".png");
        boolean isJpg = contentType.equals(MediaType.IMAGE_JPEG_VALUE) || lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");

        if (!isPng && !isJpg) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only PNG or JPEG images are allowed"));
        }

        Path dir = configDir();
        Files.createDirectories(dir);

        for (Path existing : candidatePaths()) {
            try {
                Files.deleteIfExists(existing);
            } catch (IOException ignored) {
            }
        }

        Path target = dir.resolve(isPng ? "logo.png" : "logo.jpg");
        file.transferTo(target);

        Map<String, Object> body = new HashMap<>();
        body.put("ok", true);
        body.put("path", target.toAbsolutePath().toString());
        return ResponseEntity.ok(body);
    }
}

